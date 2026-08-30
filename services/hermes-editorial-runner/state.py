"""Estado mínimo persistente e idempotente do runner, sem payload editorial."""

from __future__ import annotations

import json
import os
import sqlite3
import threading
import time
import uuid

import config


class JobStore:
    def __init__(self, path: str | None = None):
        self.path = path or os.path.join(config.STATE_DIR, "jobs.sqlite3")
        os.makedirs(os.path.dirname(self.path), exist_ok=True)
        try:
            os.chmod(os.path.dirname(self.path), 0o700)
        except OSError:
            pass
        self._lock = threading.Lock()
        with self._connect() as db:
            db.execute("PRAGMA journal_mode=WAL")
            db.execute(
                """CREATE TABLE IF NOT EXISTS jobs (
                    id TEXT PRIMARY KEY, idempotency_key TEXT UNIQUE NOT NULL,
                    correlation_id TEXT NOT NULL, topic_fingerprint TEXT NOT NULL,
                    state TEXT NOT NULL, created_at REAL NOT NULL, updated_at REAL NOT NULL,
                    result_json TEXT, error_code TEXT, usage_json TEXT
                )"""
            )
            db.execute("CREATE INDEX IF NOT EXISTS jobs_topic_idx ON jobs(topic_fingerprint)")
        try:
            os.chmod(self.path, 0o600)
        except OSError:
            pass

    def _connect(self):
        db = sqlite3.connect(self.path, timeout=5, isolation_level="IMMEDIATE")
        db.row_factory = sqlite3.Row
        return db

    def get_by_idempotency(self, key: str) -> dict | None:
        with self._connect() as db:
            row = db.execute("SELECT * FROM jobs WHERE idempotency_key = ?", (key,)).fetchone()
            return dict(row) if row else None

    def get_by_id(self, job_id: str) -> dict | None:
        with self._connect() as db:
            row = db.execute("SELECT * FROM jobs WHERE id = ?", (job_id,)).fetchone()
            return dict(row) if row else None

    def get_by_fingerprint(self, fingerprint: str) -> dict | None:
        with self._connect() as db:
            row = db.execute("SELECT * FROM jobs WHERE topic_fingerprint = ? ORDER BY created_at LIMIT 1", (fingerprint,)).fetchone()
            return dict(row) if row else None

    def create_or_get(self, request: dict, fingerprint: str) -> tuple[dict, bool]:
        now = time.time()
        with self._lock, self._connect() as db:
            row = db.execute("SELECT * FROM jobs WHERE idempotency_key = ?", (request["idempotencyKey"],)).fetchone()
            if row:
                return dict(row), False
            job = {
                "id": uuid.uuid4().hex,
                "idempotency_key": request["idempotencyKey"],
                "correlation_id": request["correlationId"],
                "topic_fingerprint": fingerprint,
                "state": "accepted",
                "created_at": now,
                "updated_at": now,
                "result_json": None,
                "error_code": None,
                "usage_json": None,
            }
            db.execute(
                "INSERT INTO jobs (id,idempotency_key,correlation_id,topic_fingerprint,state,created_at,updated_at) VALUES (?,?,?,?,?,?,?)",
                tuple(job[k] for k in ("id", "idempotency_key", "correlation_id", "topic_fingerprint", "state", "created_at", "updated_at")),
            )
            return job, True

    def update(self, job_id: str, state: str, *, result: dict | None = None, error_code: str | None = None, usage: dict | None = None) -> None:
        with self._connect() as db:
            db.execute(
                "UPDATE jobs SET state=?, updated_at=?, result_json=?, error_code=?, usage_json=? WHERE id=?",
                (state, time.time(), json.dumps(result, ensure_ascii=False) if result is not None else None,
                 error_code, json.dumps(usage, ensure_ascii=False) if usage is not None else None, job_id),
            )

    def public(self, job: dict) -> dict:
        return {"jobId": job["id"], "correlationId": job["correlation_id"], "state": job["state"]}
