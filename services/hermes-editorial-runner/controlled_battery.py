"""Executor auditável da bateria Fase 8: um POST, depois somente GET."""

from __future__ import annotations

import argparse
import hashlib
import hmac
import json
import sys
import time
import urllib.error
import urllib.request
import uuid
from dataclasses import dataclass
from typing import Callable

import config
import schemas

MAX_INPUT_BYTES = 256 * 1024
MAX_RESPONSE_BYTES = 256 * 1024
TERMINAL = {"succeeded", "failed", "timed_out", "rejected", "cancelled"}
ACTIVE = {"queued", "running"}

EXIT_SUCCEEDED = 0
EXIT_TERMINAL_FAILURE = 20
EXIT_TRANSPORT = 21
EXIT_HTTP = 22
EXIT_INVALID = 23
EXIT_UNKNOWN_STATE = 24
EXIT_TIMEOUT = 25
EXIT_CONFIG = 26


class ExecutorError(RuntimeError):
    def __init__(self, message: str, code: int):
        super().__init__(message)
        self.code = code


@dataclass
class HttpResult:
    status: int
    body: dict


class SinglePostExecutor:
    def __init__(self, base_url: str, timeout_seconds: float, poll_interval_seconds: float,
                 opener: Callable = urllib.request.urlopen):
        self.base_url = base_url.rstrip("/")
        self.timeout_seconds = timeout_seconds
        self.poll_interval_seconds = poll_interval_seconds
        self.opener = opener
        self.post_count = 0
        self.get_count = 0
        self.initial_status = None
        self.terminal_status = None
        self.started = time.monotonic()

    @staticmethod
    def _parse_response(response, expected_job_id: str | None = None) -> HttpResult:
        content_type = response.headers.get("Content-Type", "")
        if not content_type.lower().startswith("application/json"):
            raise ExecutorError("invalid_content_type", EXIT_HTTP)
        raw = response.read(MAX_RESPONSE_BYTES + 1)
        if len(raw) > MAX_RESPONSE_BYTES:
            raise ExecutorError("response_too_large", EXIT_HTTP)
        try:
            body = json.loads(raw.decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError):
            raise ExecutorError("invalid_response_json", EXIT_INVALID) from None
        if not isinstance(body, dict):
            raise ExecutorError("invalid_response_shape", EXIT_INVALID)
        job_id = body.get("jobId")
        state = body.get("state")
        if expected_job_id is not None and job_id != expected_job_id:
            raise ExecutorError("job_id_mismatch", EXIT_INVALID)
        if not isinstance(state, str) or state not in (ACTIVE | TERMINAL):
            raise ExecutorError("unknown_state", EXIT_UNKNOWN_STATE)
        if not isinstance(job_id, str) or not job_id:
            raise ExecutorError("missing_job_id", EXIT_INVALID)
        return HttpResult(response.status, body)

    def _request(self, method: str, path: str, body: bytes | None = None) -> HttpResult:
        headers = {"Accept": "application/json"}
        if body is not None:
            headers["Content-Type"] = "application/json"
        request = urllib.request.Request(self.base_url + path, data=body, method=method, headers=headers)
        try:
            response = self.opener(request, timeout=self.timeout_seconds)
            return self._parse_response(response)
        except urllib.error.HTTPError as exc:
            try:
                return self._parse_response(exc)
            except ExecutorError:
                raise ExecutorError("http_error", EXIT_HTTP) from None
        except (urllib.error.URLError, TimeoutError, OSError):
            raise ExecutorError("transport_error", EXIT_TRANSPORT) from None

    def post_once(self, body: bytes) -> HttpResult:
        if self.post_count != 0:
            raise ExecutorError("second_post_blocked", EXIT_CONFIG)
        self.post_count = 1
        return self._request("POST", "/v1/jobs", body)

    def poll(self, job_id: str, initial: HttpResult) -> HttpResult:
        current = initial
        if current.body["state"] in TERMINAL:
            return current
        deadline = self.started + self.timeout_seconds
        while current.body["state"] in ACTIVE:
            if time.monotonic() >= deadline:
                raise ExecutorError("timeout_unreconciled", EXIT_TIMEOUT)
            time.sleep(self.poll_interval_seconds)
            self.get_count += 1
            current = self._request("GET", "/v1/jobs/" + job_id)
            if current.body.get("jobId") != job_id:
                raise ExecutorError("job_id_mismatch", EXIT_INVALID)
        return current

    def execute(self, body: bytes) -> tuple[dict, int]:
        initial = self.post_once(body)
        self.initial_status = initial.body["state"]
        terminal = self.poll(initial.body["jobId"], initial)
        self.terminal_status = terminal.body["state"]
        summary = {
            "jobId": terminal.body["jobId"][:12],
            "initialStatus": initial.body["state"],
            "terminalStatus": terminal.body["state"],
            "httpPostCount": self.post_count,
            "httpGetCount": self.get_count,
            "elapsedMilliseconds": int((time.monotonic() - self.started) * 1000),
            "pollingPerformed": self.get_count > 0,
            "transportRecoveryCount": 0,
            "schemaValid": True,
        }
        return summary, EXIT_SUCCEEDED if terminal.body["state"] == "succeeded" else EXIT_TERMINAL_FAILURE

    def error_summary(self, code: int) -> dict:
        return {
            "jobId": None,
            "initialStatus": self.initial_status,
            "terminalStatus": self.terminal_status,
            "httpPostCount": self.post_count,
            "httpGetCount": self.get_count,
            "elapsedMilliseconds": int((time.monotonic() - self.started) * 1000),
            "pollingPerformed": self.get_count > 0,
            "transportRecoveryCount": 0,
            "exitCode": code,
        }


def _read_stdin() -> bytes:
    raw = sys.stdin.buffer.read(MAX_INPUT_BYTES + 1)
    if len(raw) > MAX_INPUT_BYTES:
        raise ExecutorError("input_too_large", EXIT_INVALID)
    try:
        text = raw.decode("utf-8")
        value, end = json.JSONDecoder().raw_decode(text)
    except (UnicodeDecodeError, json.JSONDecodeError):
        raise ExecutorError("invalid_input_json", EXIT_INVALID) from None
    if text[end:].strip() or not isinstance(value, dict):
        raise ExecutorError("input_trailing_content", EXIT_INVALID)
    errors = schemas.validate_request(value)
    if errors:
        raise ExecutorError("input_schema_invalid", EXIT_INVALID)
    return raw


def _signing_client(base_url: str, secret_file: str):
    secret = open(secret_file, "rb").read().strip()

    def opener(request, timeout):
        timestamp, nonce = str(int(time.time())), uuid.uuid4().hex
        body = request.data or b""
        signature = hmac.new(secret, timestamp.encode() + b"." + nonce.encode() + b"." + body, hashlib.sha256).hexdigest()
        request.headers.update({"X-CV-Timestamp": timestamp, "X-CV-Nonce": nonce, "X-CV-Signature": signature})
        return urllib.request.urlopen(request, timeout=timeout)

    return opener


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--execute", action="store_true")
    parser.add_argument("--confirm", default="")
    parser.add_argument("--base-url", default="http://cv-hermes-editorial-runner:8100")
    parser.add_argument("--timeout-seconds", type=float, default=300.0)
    parser.add_argument("--poll-interval-seconds", type=float, default=2.0)
    args = parser.parse_args(argv)
    if args.execute and args.dry_run or not args.execute and not args.dry_run:
        print(json.dumps({"error": "choose_one_mode"}))
        return EXIT_CONFIG
    if args.execute and args.confirm != "SINGLE_POST_AUTHORIZED":
        print(json.dumps({"error": "confirmation_required"}))
        return EXIT_CONFIG
    if args.timeout_seconds <= 0 or args.poll_interval_seconds <= 0:
        print(json.dumps({"error": "invalid_timing"}))
        return EXIT_CONFIG
    executor = None
    try:
        body = _read_stdin()
        if args.dry_run:
            print(json.dumps({"schemaValid": True, "httpPostCount": 0, "httpGetCount": 0}))
            return EXIT_SUCCEEDED
        executor = SinglePostExecutor(args.base_url, args.timeout_seconds, args.poll_interval_seconds,
                                      _signing_client(args.base_url, config.HMAC_SECRET_FILE))
        summary, code = executor.execute(body)
        print(json.dumps(summary, ensure_ascii=False))
        return code
    except ExecutorError as exc:
        summary = executor.error_summary(exc.code) if executor else {
            "jobId": None, "initialStatus": None, "terminalStatus": None,
            "httpPostCount": 0, "httpGetCount": 0, "elapsedMilliseconds": 0,
            "pollingPerformed": False, "transportRecoveryCount": 0,
            "exitCode": exc.code,
        }
        print(json.dumps(summary))
        return exc.code
    except OSError:
        print(json.dumps({"error": "configuration_error"}))
        return EXIT_CONFIG


if __name__ == "__main__":
    raise SystemExit(main())
