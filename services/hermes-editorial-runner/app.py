"""Servidor HTTP interno do runner editorial.

Endpoints:
- GET  /health          — status + executionEnabled (sem HMAC).
- POST /v1/validate     — valida a requisição (HMAC), sem executar Hermes.
- POST /v1/jobs         — cria job (HMAC); 503 execution_disabled nesta fase.
- GET  /v1/jobs/{jobId} — estado seguro do job (HMAC).

Nenhum segredo é exposto em log ou resposta; o corpo integral nunca é logado.
"""

import json
import logging
import queue
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

import config
import hmac_auth
import hermline
import schemas
import policy
from state import JobStore
from nonce_store import NonceStore

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
)
logger = logging.getLogger("hermes-editorial-runner")

_nonce_store = NonceStore()
_job_queue: "queue.Queue[str] | None" = queue.Queue(maxsize=10)
_job_store: dict[str, dict] = {}
_persistent_store: JobStore | None = None
_store_lock = __import__("threading").Lock()


def _get_persistent_store() -> JobStore:
    global _persistent_store
    with _store_lock:
        if _persistent_store is None:
            _persistent_store = JobStore()
        return _persistent_store


def _safe_job_state(job_id: str) -> dict | None:
    state = _job_store.get(job_id)
    if state is not None:
        return state
    try:
        job = _get_persistent_store().get_by_id(job_id)
    except OSError:
        return None
    return _get_persistent_store().public(job) if job else None


class Handler(BaseHTTPRequestHandler):
    server_version = "hermes-editorial-runner"
    protocol_version = "HTTP/1.1"

    # ------------------------------------------------------------------ util
    def log_message(self, fmt: str, *args) -> None:
        logger.info("http " + (fmt % args))

    def _send_json(self, status: int, obj: dict) -> None:
        data = json.dumps(obj).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def _read_body(self) -> bytes | None:
        raw = self.headers.get("Content-Length", "0")
        try:
            length = int(raw)
        except ValueError:
            length = 0
        if length > config.BODY_MAX_BYTES:
            return None
        return self.rfile.read(length)

    def _authenticate(self, body: bytes) -> tuple[int | None, dict | None]:
        timestamp = self.headers.get("X-CV-Timestamp", "")
        nonce = self.headers.get("X-CV-Nonce", "")
        signature = self.headers.get("X-CV-Signature", "")

        secret = config.load_hmac_secret()
        if not hmac_auth.verify_signature(secret, timestamp, nonce, body, signature):
            return 401, {"error": "invalid_signature"}

        try:
            ts = int(timestamp)
        except ValueError:
            return 401, {"error": "invalid_timestamp"}
        if abs(time.time() - ts) > config.TIMESTAMP_TOLERANCE_SECONDS:
            return 401, {"error": "timestamp_expired"}

        if not _nonce_store.check_and_add(nonce):
            return 409, {"error": "nonce_replayed"}

        return None, None

    def _correlation_id(self, data: dict) -> str:
        cid = data.get("correlationId")
        return cid if isinstance(cid, str) else "-"

    # ------------------------------------------------------------- handlers
    def do_GET(self) -> None:
        if self.path == "/health":
            self._send_json(
                200,
                {
                    "status": "ok",
                    "executionEnabled": config.execution_enabled(),
                },
            )
            return

        if self.path.startswith("/v1/jobs/"):
            job_id = self.path[len("/v1/jobs/"):]
            status, err = self._authenticate(b"")
            if err is not None:
                self._send_json(status, err)
                return
            state = _safe_job_state(job_id)
            if state is None:
                self._send_json(404, {"error": "job_not_found"})
                return
            self._send_json(200, state)
            return

        self._send_json(404, {"error": "not_found"})

    def do_POST(self) -> None:
        body = self._read_body()
        if body is None:
            self._send_json(413, {"error": "body_too_large"})
            self.close_connection = True
            return

        status, err = self._authenticate(body)
        if err is not None:
            self._send_json(status, err)
            return

        try:
            data = json.loads(body)
        except (json.JSONDecodeError, UnicodeDecodeError):
            self._send_json(400, {"error": "invalid_json"})
            return

        cid = self._correlation_id(data)

        if self.path == "/v1/validate":
            self._handle_validate(data, cid)
            return

        if self.path == "/v1/jobs":
            self._handle_create_job(data, cid)
            return

        self._send_json(404, {"error": "not_found"})

    def _handle_validate(self, data: dict, cid: str) -> None:
        errors = schemas.validate_request(data)
        if errors:
            logger.info("validate correlationId=%s rejected_errors=%d", cid, len(errors))
            self._send_json(
                422,
                {
                    "error": "validation_failed",
                    "details": [e.message for e in errors][:5],
                },
            )
            return
        decision, reasons = policy.classify_request(data)
        if decision != "accepted":
            self._send_json(422, {"error": "topic_rejected", "status": "rejected", "reasons": reasons, "correlationId": cid})
            return
        try:
            data["seedSources"] = policy.canonical_seed_sources(data)
        except ValueError as exc:
            self._send_json(422, {"error": str(exc), "correlationId": cid})
            return
        logger.info("validate correlationId=%s ok", cid)
        self._send_json(200, {"valid": True, "correlationId": cid})

    def _handle_create_job(self, data: dict, cid: str) -> None:
        errors = schemas.validate_request(data)
        if errors:
            logger.info("job correlationId=%s rejected_errors=%d", cid, len(errors))
            self._send_json(
                422,
                {
                    "error": "validation_failed",
                    "details": [e.message for e in errors][:5],
                },
            )
            return

        decision, reasons = policy.classify_request(data)
        if decision != "accepted":
            logger.info("job correlationId=%s rejected reasons=%s", cid, ",".join(reasons))
            self._send_json(422, {"error": "topic_rejected", "status": "rejected", "reasons": reasons, "correlationId": cid})
            return
        try:
            data["seedSources"] = policy.canonical_seed_sources(data)
        except ValueError as exc:
            self._send_json(422, {"error": str(exc), "correlationId": cid})
            return

        if not config.execution_enabled():
            logger.info("job correlationId=%s execution_disabled", cid)
            self._send_json(503, {"error": "execution_disabled"})
            return

        fingerprint = policy.topic_fingerprint(data["topic"], data["primaryPillar"])
        store = _get_persistent_store()
        semantic_match = store.get_by_fingerprint(fingerprint)
        if semantic_match and semantic_match["idempotency_key"] != data["idempotencyKey"]:
            self._send_json(409, {"error": "semantic_duplicate_review", "status": "rejected", "correlationId": cid})
            return
        job, created = store.create_or_get(data, fingerprint)
        if not created:
            self._send_json(200, {**store.public(job), "idempotentReplay": True})
            return
        try:
            store.reserve_battery_job()
        except RuntimeError as exc:
            code = str(exc)
            store.update(job["id"], "rejected", error_code=code)
            self._send_json(429, {"error": code, "jobId": job["id"]})
            return
        store.update(job["id"], "running")
        try:
            result = hermline.run_hermes(data)
            cost = store.record_battery_usage(result["usage"])
            result["usage"].update(cost)
            store.update(job["id"], "succeeded", result=result["dossier"], usage=result["usage"])
            self._send_json(202, {"jobId": job["id"], "correlationId": cid, "state": "succeeded"})
        except TimeoutError:
            store.update(job["id"], "timed_out", error_code="timeout")
            self._send_json(504, {"error": "job_timed_out", "jobId": job["id"]})
        except Exception as exc:  # sanitized, no exception text
            safe_codes = {
                "output_too_large",
                "invalid_dossier_json",
                "invalid_dossier_schema",
                "usage_file_missing_or_invalid",
                "usage_provider_model_mismatch",
                "hermes_nonzero_exit",
                "execution_disabled",
                "deepseek_credential_unavailable",
                "battery_job_limit_reached",
                "budget_guardrail_reached",
            }
            code = str(exc) if str(exc) in safe_codes else "job_failed"
            store.update(job["id"], "failed", error_code=code)
            self._send_json(502, {"error": code, "jobId": job["id"]})


def main() -> None:
    config.validate_limits()
    server = ThreadingHTTPServer(
        (config.LISTEN_HOST, config.LISTEN_PORT), Handler
    )
    server.daemon_threads = True
    logger.info("runner listening on %s:%s", config.LISTEN_HOST, config.LISTEN_PORT)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
