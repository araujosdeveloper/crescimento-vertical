"""Estado mínimo persistente e idempotente do runner, sem payload editorial."""

from __future__ import annotations

import json
import os
import sqlite3
import threading
import time
import uuid

import config


class IdempotencyConflictError(RuntimeError):
    pass


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
            db.execute(
                """CREATE TABLE IF NOT EXISTS battery_usage (
                    battery_id TEXT PRIMARY KEY, jobs_reserved INTEGER NOT NULL DEFAULT 0,
                    reserved_usd REAL NOT NULL DEFAULT 0,
                    estimated_usd REAL NOT NULL DEFAULT 0,
                    api_calls INTEGER NOT NULL DEFAULT 0,
                    input_tokens INTEGER NOT NULL DEFAULT 0,
                    output_tokens INTEGER NOT NULL DEFAULT 0,
                    cache_read_tokens INTEGER NOT NULL DEFAULT 0,
                    cache_write_tokens INTEGER NOT NULL DEFAULT 0,
                    reasoning_tokens INTEGER NOT NULL DEFAULT 0,
                    updated_at REAL NOT NULL
                )"""
            )
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
                if row["topic_fingerprint"] != fingerprint:
                    raise IdempotencyConflictError("idempotency_conflict")
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

    def reserve_battery_job(self) -> None:
        """Reserva persistente e atomica; e guardrail, nao teto transacional."""
        with self._lock, self._connect() as db:
            db.execute(
                "INSERT OR IGNORE INTO battery_usage (battery_id, updated_at) VALUES (?, ?)",
                (config.BATTERY_ID, time.time()),
            )
            row = db.execute(
                "SELECT * FROM battery_usage WHERE battery_id = ?", (config.BATTERY_ID,)
            ).fetchone()
            if row["jobs_reserved"] >= config.MAX_BATCH_JOBS:
                raise RuntimeError("battery_job_limit_reached")
            effective = max(row["reserved_usd"], row["estimated_usd"])
            if effective + config.JOB_RESERVATION_USD > config.BATTERY_BUDGET_USD:
                raise RuntimeError("budget_guardrail_reached")
            db.execute(
                "UPDATE battery_usage SET jobs_reserved=jobs_reserved+1, "
                "reserved_usd=reserved_usd+?, updated_at=? WHERE battery_id=?",
                (config.JOB_RESERVATION_USD, time.time(), config.BATTERY_ID),
            )

    def record_battery_usage(self, usage: dict) -> dict:
        def count(name: str) -> int:
            value = usage.get(name, 0)
            return max(0, int(value or 0))

        input_tokens = count("input_tokens")
        output_tokens = count("output_tokens")
        cache_read = count("cache_read_tokens")
        cache_write = count("cache_write_tokens")
        reasoning = count("reasoning_tokens")
        # Hermes inclui reasoning em output_tokens quando o provedor o reporta.
        output_billed = max(output_tokens, reasoning)
        estimated = (
            input_tokens * config.PRICE_CACHE_MISS_PER_MILLION
            + cache_read * config.PRICE_CACHE_HIT_PER_MILLION
            + cache_write * config.PRICE_CACHE_MISS_PER_MILLION
            + output_billed * config.PRICE_OUTPUT_PER_MILLION
        ) / 1_000_000
        with self._lock, self._connect() as db:
            db.execute(
                "UPDATE battery_usage SET estimated_usd=estimated_usd+?, api_calls=api_calls+?, "
                "input_tokens=input_tokens+?, output_tokens=output_tokens+?, "
                "cache_read_tokens=cache_read_tokens+?, cache_write_tokens=cache_write_tokens+?, "
                "reasoning_tokens=reasoning_tokens+?, updated_at=? WHERE battery_id=?",
                (estimated, count("api_calls"), input_tokens, output_tokens, cache_read,
                 cache_write, reasoning, time.time(), config.BATTERY_ID),
            )
        return {"estimatedCostUsd": round(estimated, 8), "costStatus": "estimated"}

    def public(self, job: dict) -> dict:
        return {"jobId": job["id"], "correlationId": job["correlation_id"], "state": job["state"]}
