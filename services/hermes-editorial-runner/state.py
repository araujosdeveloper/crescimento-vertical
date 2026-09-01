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


class RetryLineageError(RuntimeError):
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
            db.execute("PRAGMA foreign_keys=ON")
            db.execute("PRAGMA journal_mode=WAL")
            db.execute(
                """CREATE TABLE IF NOT EXISTS jobs (
                    id TEXT PRIMARY KEY, idempotency_key TEXT UNIQUE NOT NULL,
                    correlation_id TEXT NOT NULL, topic_fingerprint TEXT NOT NULL,
                    state TEXT NOT NULL, created_at REAL NOT NULL, updated_at REAL NOT NULL,
                    result_json TEXT, error_code TEXT, usage_json TEXT
                )"""
            )
            db.execute(
                """CREATE TABLE IF NOT EXISTS retry_lineage (
                    original_job_id TEXT NOT NULL REFERENCES jobs(id),
                    replacement_job_id TEXT NOT NULL UNIQUE REFERENCES jobs(id),
                    retry_number INTEGER NOT NULL CHECK (retry_number = 1),
                    reason TEXT NOT NULL CHECK (reason = 'retry_after_ephemeral_logging_fix'),
                    created_at REAL NOT NULL,
                    PRIMARY KEY (original_job_id, retry_number)
                )"""
            )
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
            # Version 3 adds persistent, operation-level research accounting.
            columns = {row[1] for row in db.execute("PRAGMA table_info(battery_usage)")}
            for name in ("search_calls", "extract_calls"):
                if name not in columns:
                    db.execute(f"ALTER TABLE battery_usage ADD COLUMN {name} INTEGER NOT NULL DEFAULT 0")
            db.execute(
                """CREATE TABLE IF NOT EXISTS research_operations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    job_id TEXT NOT NULL REFERENCES jobs(id),
                    operation TEXT NOT NULL CHECK (operation IN ('search','extract','crawl','research')),
                    ordinal INTEGER NOT NULL,
                    status TEXT NOT NULL CHECK (status IN ('succeeded','failed')),
                    created_at REAL NOT NULL,
                    UNIQUE(job_id, operation, ordinal)
                )"""
            )
            db.execute("CREATE INDEX IF NOT EXISTS research_operations_job_idx ON research_operations(job_id)")
            db.execute("PRAGMA user_version = 3")
            db.execute("CREATE INDEX IF NOT EXISTS jobs_topic_idx ON jobs(topic_fingerprint)")
            db.execute(
                """CREATE TABLE IF NOT EXISTS failure_evidence (
                    job_id TEXT PRIMARY KEY REFERENCES jobs(id), path TEXT NOT NULL,
                    bytes INTEGER NOT NULL, finish_reason TEXT, suspected_truncation INTEGER NOT NULL,
                    schema_valid INTEGER NOT NULL, validation_error_count INTEGER NOT NULL,
                    created_at REAL NOT NULL
                )"""
            )
            # Version 4 persists the pointer-level evidence manifest only; raw
            # candidate bytes stay in the protected filesystem artifact.
            db.execute("PRAGMA user_version = 4")
        try:
            os.chmod(self.path, 0o600)
        except OSError:
            pass

    def _connect(self):
        db = sqlite3.connect(self.path, timeout=5, isolation_level="IMMEDIATE")
        db.row_factory = sqlite3.Row
        db.execute("PRAGMA foreign_keys=ON")
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
            retry_of = request.get("retryOfJobId")
            retry_reason = request.get("retryReason")
            if (retry_of is None) != (retry_reason is None):
                raise RetryLineageError("retry_lineage_fields_required")
            original = None
            if retry_of is not None:
                if retry_reason != "retry_after_ephemeral_logging_fix":
                    raise RetryLineageError("retry_reason_not_allowed")
                original = db.execute("SELECT * FROM jobs WHERE id = ?", (retry_of,)).fetchone()
                if original is None:
                    raise RetryLineageError("retry_original_not_found")
                if original["state"] != "failed" or original["error_code"] != "hermes_nonzero_exit":
                    raise RetryLineageError("retry_original_not_eligible")
                if original["id"] == request.get("id"):
                    raise RetryLineageError("retry_same_job")
                prior = db.execute("SELECT 1 FROM retry_lineage WHERE original_job_id = ?", (retry_of,)).fetchone()
                if prior:
                    raise RetryLineageError("retry_number_exhausted")
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
            if original is not None:
                db.execute(
                    "INSERT INTO retry_lineage (original_job_id,replacement_job_id,retry_number,reason,created_at) VALUES (?,?,?,?,?)",
                    (original["id"], job["id"], 1, retry_reason, now),
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

    def release_battery_reservation(self) -> None:
        """Release only the unconsumed reservation; job count remains auditable."""
        with self._lock, self._connect() as db:
            db.execute(
                "UPDATE battery_usage SET reserved_usd=MAX(0, reserved_usd-?), updated_at=? WHERE battery_id=?",
                (config.JOB_RESERVATION_USD, time.time(), config.BATTERY_ID),
            )

    def record_research_usage(self, job_id: str, usage: dict) -> dict:
        """Persist exact Tavily operations; missing telemetry fails closed."""
        operations = usage.get("tavily_operations")
        if not isinstance(operations, dict):
            raise RuntimeError("tavily_usage_unavailable")
        rows = []
        for operation, entries in operations.items():
            if operation not in {"search", "extract", "crawl", "research"} or not isinstance(entries, list):
                raise RuntimeError("tavily_usage_invalid")
            for ordinal, entry in enumerate(entries, 1):
                if not isinstance(entry, dict) or entry.get("status") not in {"succeeded", "failed"}:
                    raise RuntimeError("tavily_usage_invalid")
                rows.append((job_id, operation, ordinal, entry["status"], time.time()))
        searches = sum(1 for row in rows if row[1] == "search")
        if searches > config.MAX_SEARCHES_PER_JOB:
            raise RuntimeError("tavily_search_limit_reached")
        with self._lock, self._connect() as db:
            db.execute("DELETE FROM research_operations WHERE job_id = ?", (job_id,))
            db.executemany(
                "INSERT INTO research_operations(job_id,operation,ordinal,status,created_at) VALUES (?,?,?,?,?)",
                rows,
            )
            db.execute(
                "UPDATE battery_usage SET search_calls=?, extract_calls=?, updated_at=? WHERE battery_id=?",
                (searches, sum(1 for row in rows if row[1] == "extract"), time.time(), config.BATTERY_ID),
            )
        return {"searchCalls": searches, "extractCalls": sum(1 for row in rows if row[1] == "extract")}

    def record_failure_evidence(self, job_id: str, evidence: dict, metadata: dict) -> None:
        with self._lock, self._connect() as db:
            db.execute(
                """INSERT OR REPLACE INTO failure_evidence
                (job_id,path,bytes,finish_reason,suspected_truncation,schema_valid,validation_error_count,created_at)
                VALUES (?,?,?,?,?,?,?,?)""",
                (job_id, evidence["path"], int(evidence["bytes"]), metadata.get("finish_reason"),
                 int(bool(metadata.get("suspected_truncation"))), 0,
                 int(metadata.get("validation_error_count", 0)), time.time()),
            )

    def retry2_eligibility(self, retry1_job_id: str, *, accumulated_cost_usd: float, reserve_usd: float, human_authorized: bool) -> dict:
        """Validate a possible retry=2 without creating a job or lineage row."""
        with self._connect() as db:
            retry1 = db.execute("SELECT * FROM jobs WHERE id = ?", (retry1_job_id,)).fetchone()
            link = db.execute("SELECT * FROM retry_lineage WHERE replacement_job_id = ?", (retry1_job_id,)).fetchone()
            if retry1 is None or link is None:
                return {"eligible": False, "reason": "retry1_or_lineage_not_found"}
            if retry1["state"] != "failed" or retry1["error_code"] != "invalid_dossier_schema":
                return {"eligible": False, "reason": "retry1_not_invalid_dossier_schema"}
            if link["retry_number"] != 1 or link["reason"] != "retry_after_ephemeral_logging_fix":
                return {"eligible": False, "reason": "retry1_lineage_invalid"}
            if db.execute("SELECT 1 FROM retry_lineage WHERE original_job_id = ? AND retry_number = 2", (link["original_job_id"],)).fetchone():
                return {"eligible": False, "reason": "retry2_already_exists"}
            if accumulated_cost_usd + reserve_usd >= config.BATTERY_BUDGET_USD:
                return {"eligible": False, "reason": "retry2_budget_guardrail"}
            if not human_authorized:
                return {"eligible": False, "reason": "human_authorization_required"}
            return {
                "eligible": True,
                "retry_number": 2,
                "original_job_id": retry1["id"],
                "root_job_id": link["original_job_id"],
                "replacement_job_id": None,
                "reason": config.RETRY2_REASON,
                "max_retry_chain": config.MAX_RETRY_CHAIN,
            }

    def public(self, job: dict) -> dict:
        result = {"jobId": job["id"], "correlationId": job["correlation_id"], "state": job["state"]}
        with self._connect() as db:
            row = db.execute(
                "SELECT original_job_id,retry_number,reason,created_at FROM retry_lineage WHERE replacement_job_id = ?",
                (job["id"],),
            ).fetchone()
        if row:
            result["retryLineage"] = {
                "originalJobId": row["original_job_id"],
                "retryNumber": row["retry_number"],
                "reason": row["reason"],
                "createdAt": row["created_at"],
            }
        return result
