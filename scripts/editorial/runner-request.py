#!/usr/bin/env python3
"""Cliente do runner editorial (executa DENTRO do container do runner).

Lê a requisição JSON da stdin, assina com HMAC e faz POST em /v1/jobs.
Em sucesso (202), extrai o dossiê (result_json) do SQLite de estado e o imprime
na stdout. Em erro, imprime o erro e sai com código não-zero.

Uso (a partir do host):
  cat request.json | docker exec -i cv-hermes-editorial-runner \
    /opt/hermes/.venv/bin/python - < runner-request.py
"""
import hashlib
import hmac
import json
import os
import sqlite3
import sys
import time
import urllib.request
import uuid

RUNNER_URL = os.environ.get("RUNNER_URL", "http://127.0.0.1:8100")
HMAC_SECRET_FILE = "/run/secrets/hmac-secret"
STATE_DB = os.environ.get("STATE_DB", "/state/jobs.sqlite3")
TIMEOUT = int(os.environ.get("REQUEST_TIMEOUT", "330"))


def main() -> int:
    raw = os.environ.get("REQUEST_BODY")
    body = raw.encode("utf-8") if raw is not None else sys.stdin.buffer.read()
    try:
        data = json.loads(body)
    except (json.JSONDecodeError, UnicodeDecodeError):
        print(json.dumps({"error": "invalid_json"}))
        return 2

    try:
        with open(HMAC_SECRET_FILE, "rb") as fh:
            secret = fh.read().strip()
    except OSError:
        print(json.dumps({"error": "hmac_secret_unavailable"}))
        return 2

    timestamp = str(int(time.time()))
    nonce = uuid.uuid4().hex
    canonical = f"{timestamp}.{nonce}.".encode() + body
    signature = hmac.new(secret, canonical, hashlib.sha256).hexdigest()

    req = urllib.request.Request(
        RUNNER_URL + "/v1/jobs",
        data=body,
        method="POST",
        headers={
            "Content-Type": "application/json",
            "X-CV-Timestamp": timestamp,
            "X-CV-Nonce": nonce,
            "X-CV-Signature": signature,
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
            status = resp.status
            raw = resp.read().decode("utf-8")
    except urllib.error.HTTPError as exc:
        status = exc.code
        raw = exc.read().decode("utf-8")

    try:
        payload = json.loads(raw)
    except json.JSONDecodeError:
        payload = {"error": "unparseable_response", "raw": raw[:500]}

    # 202 = job criado; 200 = replay idempotente (mesmo idempotencyKey).
    if "jobId" not in payload:
        print(json.dumps({"httpStatus": status, **payload}))
        return 1

    job_id = payload["jobId"]
    dossier = read_dossier(job_id)
    if dossier is None:
        print(json.dumps({"error": "dossier_not_found", "jobId": job_id}))
        return 1
    print(json.dumps(dossier, ensure_ascii=False))
    return 0


def read_dossier(job_id: str):
    if not os.path.exists(STATE_DB):
        return None
    try:
        db = sqlite3.connect(f"file:{STATE_DB}?mode=ro", uri=True, timeout=5)
    except sqlite3.Error:
        return None
    try:
        row = db.execute(
            "SELECT result_json FROM jobs WHERE id = ?", (job_id,)
        ).fetchone()
    finally:
        db.close()
    if not row or not row[0]:
        return None
    return json.loads(row[0])


if __name__ == "__main__":
    sys.exit(main())
