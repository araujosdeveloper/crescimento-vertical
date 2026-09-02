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
    SCHEMA_VERSION = 5
    _INITIALIZATION_LOCK = threading.Lock()
    RETRY_REASONS = {
        1: "retry_after_ephemeral_logging_fix",
        2: "retry_after_dossier_contract_and_observability_fix",
    }

    def __init__(self, path: str | None = None, *, _migration_fault: str | None = None):
        self.path = path or os.path.join(config.STATE_DIR, "jobs.sqlite3")
        os.makedirs(os.path.dirname(self.path), exist_ok=True)
        try:
            os.chmod(os.path.dirname(self.path), 0o700)
        except OSError:
            pass
        self._lock = threading.Lock()
        with self._INITIALIZATION_LOCK:
            self._migrate(_migration_fault)
            with self._connect() as db:
                db.execute("PRAGMA journal_mode=WAL")
        try:
            os.chmod(self.path, 0o600)
        except OSError:
            pass

    @staticmethod
    def _create_base_schema(db: sqlite3.Connection) -> None:
        db.execute(
            """CREATE TABLE jobs (
                    id TEXT PRIMARY KEY, idempotency_key TEXT UNIQUE NOT NULL,
                    correlation_id TEXT NOT NULL, topic_fingerprint TEXT NOT NULL,
                    state TEXT NOT NULL, created_at REAL NOT NULL, updated_at REAL NOT NULL,
                    result_json TEXT, error_code TEXT, usage_json TEXT
                )"""
        )
        db.execute(
            """CREATE TABLE battery_usage (
                    battery_id TEXT PRIMARY KEY, jobs_reserved INTEGER NOT NULL DEFAULT 0,
                    reserved_usd REAL NOT NULL DEFAULT 0,
                    estimated_usd REAL NOT NULL DEFAULT 0,
                    api_calls INTEGER NOT NULL DEFAULT 0,
                    input_tokens INTEGER NOT NULL DEFAULT 0,
                    output_tokens INTEGER NOT NULL DEFAULT 0,
                    cache_read_tokens INTEGER NOT NULL DEFAULT 0,
                    cache_write_tokens INTEGER NOT NULL DEFAULT 0,
                    reasoning_tokens INTEGER NOT NULL DEFAULT 0,
                    search_calls INTEGER NOT NULL DEFAULT 0,
                    extract_calls INTEGER NOT NULL DEFAULT 0,
                    updated_at REAL NOT NULL
                )"""
        )
        db.execute(
            """CREATE TABLE research_operations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    job_id TEXT NOT NULL REFERENCES jobs(id),
                    operation TEXT NOT NULL CHECK (operation IN ('search','extract','crawl','research')),
                    ordinal INTEGER NOT NULL,
                    status TEXT NOT NULL CHECK (status IN ('succeeded','failed')),
                    created_at REAL NOT NULL,
                    UNIQUE(job_id, operation, ordinal)
                )"""
        )
        db.execute(
            """CREATE TABLE failure_evidence (
                    job_id TEXT PRIMARY KEY REFERENCES jobs(id), path TEXT NOT NULL,
                    bytes INTEGER NOT NULL, finish_reason TEXT, suspected_truncation INTEGER NOT NULL,
                    schema_valid INTEGER NOT NULL, validation_error_count INTEGER NOT NULL,
                    created_at REAL NOT NULL
                )"""
        )
        db.execute("CREATE INDEX jobs_topic_idx ON jobs(topic_fingerprint)")
        db.execute("CREATE INDEX research_operations_job_idx ON research_operations(job_id)")

    @classmethod
    def _create_lineage_v5(cls, db: sqlite3.Connection, table: str = "retry_lineage") -> None:
        db.execute(
            f"""CREATE TABLE {table} (
                original_job_id TEXT NOT NULL REFERENCES jobs(id),
                replacement_job_id TEXT NOT NULL UNIQUE REFERENCES jobs(id),
                root_job_id TEXT NOT NULL REFERENCES jobs(id),
                retry_number INTEGER NOT NULL CHECK (retry_number IN (1,2)),
                reason TEXT NOT NULL CHECK (
                    (retry_number = 1 AND reason = '{cls.RETRY_REASONS[1]}') OR
                    (retry_number = 2 AND reason = '{cls.RETRY_REASONS[2]}')
                ),
                created_at REAL NOT NULL,
                PRIMARY KEY (original_job_id, retry_number),
                CHECK (original_job_id <> replacement_job_id),
                CHECK (root_job_id <> replacement_job_id)
            )"""
        )

    @classmethod
    def _create_lineage_triggers(cls, db: sqlite3.Connection) -> None:
        db.execute(
            """CREATE TRIGGER retry_lineage_v5_insert
            BEFORE INSERT ON retry_lineage
            BEGIN
                SELECT CASE
                    WHEN NEW.retry_number = 1 AND NEW.root_job_id <> NEW.original_job_id
                        THEN RAISE(ABORT, 'retry_root_inconsistent')
                    WHEN NEW.retry_number = 1 AND EXISTS (
                        SELECT 1 FROM retry_lineage WHERE replacement_job_id = NEW.original_job_id
                    ) THEN RAISE(ABORT, 'retry_chain_too_long')
                    WHEN NEW.retry_number = 2 AND NOT EXISTS (
                        SELECT 1 FROM retry_lineage parent
                        WHERE parent.replacement_job_id = NEW.original_job_id
                          AND parent.retry_number = 1
                          AND parent.root_job_id = NEW.root_job_id
                    ) THEN RAISE(ABORT, 'retry_root_inconsistent')
                    WHEN NEW.retry_number = 2 AND EXISTS (
                        SELECT 1 FROM retry_lineage parent
                        JOIN retry_lineage grandparent
                          ON grandparent.replacement_job_id = parent.original_job_id
                        WHERE parent.replacement_job_id = NEW.original_job_id
                    ) THEN RAISE(ABORT, 'retry_chain_too_long')
                    WHEN EXISTS (
                        WITH RECURSIVE descendants(id) AS (
                            SELECT NEW.replacement_job_id
                            UNION ALL
                            SELECT r.replacement_job_id
                            FROM retry_lineage r JOIN descendants d ON r.original_job_id = d.id
                        ) SELECT 1 FROM descendants WHERE id = NEW.original_job_id
                    ) THEN RAISE(ABORT, 'retry_cycle')
                END;
            END"""
        )
        db.execute(
            """CREATE TRIGGER retry_lineage_v5_immutable_update
            BEFORE UPDATE ON retry_lineage BEGIN
                SELECT RAISE(ABORT, 'retry_lineage_immutable');
            END"""
        )

    @classmethod
    def _lineage_rows_with_roots(cls, db: sqlite3.Connection) -> list[tuple]:
        columns = {row[1] for row in db.execute("PRAGMA table_info(retry_lineage)")}
        if not columns:
            raise RuntimeError("retry_lineage_missing")
        has_root = "root_job_id" in columns
        selected = "original_job_id,replacement_job_id,retry_number,reason,created_at"
        if has_root:
            selected += ",root_job_id"
        rows = [dict(row) for row in db.execute(f"SELECT {selected} FROM retry_lineage")]
        job_ids = {row[0] for row in db.execute("SELECT id FROM jobs")}
        replacements: dict[str, dict] = {}
        pairs: set[tuple[str, int]] = set()
        for row in rows:
            original = row["original_job_id"]
            replacement = row["replacement_job_id"]
            retry_number = row["retry_number"]
            if original not in job_ids or replacement not in job_ids:
                raise RuntimeError("retry_foreign_key_invalid")
            if original == replacement or replacement in replacements:
                raise RuntimeError("retry_cycle_or_duplicate_replacement")
            if retry_number not in cls.RETRY_REASONS or row["reason"] != cls.RETRY_REASONS[retry_number]:
                raise RuntimeError("retry_reason_incompatible")
            if (original, retry_number) in pairs:
                raise RuntimeError("retry_lineage_duplicate")
            pairs.add((original, retry_number))
            replacements[replacement] = row

        resolved: dict[str, str] = {}
        visiting: set[str] = set()

        def resolve(row: dict) -> str:
            replacement = row["replacement_job_id"]
            if replacement in resolved:
                return resolved[replacement]
            if replacement in visiting:
                raise RuntimeError("retry_cycle")
            visiting.add(replacement)
            if row["retry_number"] == 1:
                if row["original_job_id"] in replacements:
                    raise RuntimeError("retry_chain_invalid")
                root = row["original_job_id"]
            else:
                parent = replacements.get(row["original_job_id"])
                if parent is None or parent["retry_number"] != 1:
                    raise RuntimeError("retry_chain_invalid")
                root = resolve(parent)
            visiting.remove(replacement)
            existing = row.get("root_job_id") if has_root else None
            if existing is not None and existing != root:
                raise RuntimeError("retry_root_inconsistent")
            if root not in job_ids:
                raise RuntimeError("retry_root_foreign_key_invalid")
            resolved[replacement] = root
            return root

        result = []
        for row in rows:
            root = resolve(row)
            result.append((row["original_job_id"], row["replacement_job_id"], root,
                           row["retry_number"], row["reason"], row["created_at"]))
        return result

    @classmethod
    def _validate_v5(cls, db: sqlite3.Connection) -> None:
        table_sql_row = db.execute(
            "SELECT sql FROM sqlite_master WHERE type='table' AND name='retry_lineage'"
        ).fetchone()
        if table_sql_row is None:
            raise RuntimeError("retry_lineage_missing")
        table_sql = " ".join(table_sql_row[0].lower().split())
        required_sql = (
            "original_job_id text not null references jobs(id)",
            "replacement_job_id text not null unique references jobs(id)",
            "root_job_id text not null references jobs(id)",
            "retry_number integer not null check (retry_number in (1,2))",
            f"retry_number = 1 and reason = '{cls.RETRY_REASONS[1]}'",
            f"retry_number = 2 and reason = '{cls.RETRY_REASONS[2]}'",
            "check (original_job_id <> replacement_job_id)",
            "check (root_job_id <> replacement_job_id)",
        )
        if any(fragment not in table_sql for fragment in required_sql):
            raise RuntimeError("retry_lineage_v5_schema_invalid")
        columns = [
            (row[1], row[2].upper(), row[3], row[5])
            for row in db.execute("PRAGMA table_info(retry_lineage)")
        ]
        expected_columns = [
            ("original_job_id", "TEXT", 1, 1),
            ("replacement_job_id", "TEXT", 1, 0),
            ("root_job_id", "TEXT", 1, 0),
            ("retry_number", "INTEGER", 1, 2),
            ("reason", "TEXT", 1, 0),
            ("created_at", "REAL", 1, 0),
        ]
        if columns != expected_columns:
            raise RuntimeError("retry_lineage_v5_layout_invalid")
        foreign_keys = {
            (row[3], row[2], row[4], row[5], row[6])
            for row in db.execute("PRAGMA foreign_key_list(retry_lineage)")
        }
        expected_foreign_keys = {
            ("original_job_id", "jobs", "id", "NO ACTION", "NO ACTION"),
            ("replacement_job_id", "jobs", "id", "NO ACTION", "NO ACTION"),
            ("root_job_id", "jobs", "id", "NO ACTION", "NO ACTION"),
        }
        if foreign_keys != expected_foreign_keys:
            raise RuntimeError("retry_lineage_v5_foreign_keys_invalid")
        trigger_names = {
            row[0] for row in db.execute(
                "SELECT name FROM sqlite_master WHERE type='trigger' AND tbl_name='retry_lineage'"
            )
        }
        if not {"retry_lineage_v5_insert", "retry_lineage_v5_immutable_update"} <= trigger_names:
            raise RuntimeError("retry_lineage_v5_triggers_missing")
        cls._lineage_rows_with_roots(db)
        if db.execute("PRAGMA foreign_key_check").fetchall():
            raise RuntimeError("foreign_key_check_failed")
        if db.execute("PRAGMA integrity_check").fetchone()[0] != "ok":
            raise RuntimeError("integrity_check_failed")

    def _migrate(self, fault: str | None) -> None:
        db = sqlite3.connect(self.path, timeout=5, isolation_level=None)
        db.row_factory = sqlite3.Row
        try:
            db.execute("PRAGMA foreign_keys=ON")
            db.execute("BEGIN IMMEDIATE")
            version = db.execute("PRAGMA user_version").fetchone()[0]
            tables = {
                row[0] for row in db.execute(
                    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
                )
            }
            if version == 0 and not tables:
                self._create_base_schema(db)
                self._create_lineage_v5(db)
                self._create_lineage_triggers(db)
            elif version == 4:
                rows = self._lineage_rows_with_roots(db)
                self._create_lineage_v5(db, "retry_lineage_v5_new")
                db.executemany(
                    "INSERT INTO retry_lineage_v5_new "
                    "(original_job_id,replacement_job_id,root_job_id,retry_number,reason,created_at) "
                    "VALUES (?,?,?,?,?,?)",
                    rows,
                )
                if fault == "after_copy":
                    raise RuntimeError("injected_migration_failure")
                if db.execute("SELECT count(*) FROM retry_lineage_v5_new").fetchone()[0] != len(rows):
                    raise RuntimeError("retry_lineage_copy_count_mismatch")
                db.execute("DROP TABLE retry_lineage")
                db.execute("ALTER TABLE retry_lineage_v5_new RENAME TO retry_lineage")
                self._create_lineage_triggers(db)
            elif version == self.SCHEMA_VERSION:
                self._validate_v5(db)
                db.execute("COMMIT")
                return
            else:
                raise RuntimeError(f"unsupported_schema_version:{version}")
            if fault == "before_validation":
                raise RuntimeError("injected_migration_failure")
            self._validate_v5(db)
            db.execute(f"PRAGMA user_version = {self.SCHEMA_VERSION}")
            if db.execute("PRAGMA user_version").fetchone()[0] != self.SCHEMA_VERSION:
                raise RuntimeError("user_version_not_persisted")
            db.execute("COMMIT")
        except Exception:
            if db.in_transaction:
                db.execute("ROLLBACK")
            raise
        finally:
            db.close()

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
            retry_number = request.get("retryNumber", 1 if retry_of else None)
            root_job_id = request.get("rootJobId")
            if (retry_of is None) != (retry_reason is None):
                raise RetryLineageError("retry_lineage_fields_required")
            original = None
            if retry_of is not None:
                if retry_number not in (1, 2):
                    raise RetryLineageError("retry_number_not_allowed")
                expected_reason = "retry_after_ephemeral_logging_fix" if retry_number == 1 else config.RETRY2_REASON
                if retry_reason != expected_reason:
                    raise RetryLineageError("retry_reason_not_allowed")
                original = db.execute("SELECT * FROM jobs WHERE id = ?", (retry_of,)).fetchone()
                if original is None:
                    raise RetryLineageError("retry_original_not_found")
                expected_error = "hermes_nonzero_exit" if retry_number == 1 else "invalid_dossier_schema"
                if original["state"] != "failed" or original["error_code"] != expected_error:
                    raise RetryLineageError("retry_original_not_eligible")
                if retry_number == 2:
                    parent = db.execute("SELECT * FROM retry_lineage WHERE replacement_job_id = ?", (retry_of,)).fetchone()
                    if parent is None or root_job_id != (parent["root_job_id"] or parent["original_job_id"]):
                        raise RetryLineageError("retry_root_not_eligible")
                if original["id"] == request.get("id"):
                    raise RetryLineageError("retry_same_job")
                prior = db.execute(
                    "SELECT 1 FROM retry_lineage WHERE original_job_id = ? AND retry_number = ?",
                    (retry_of, retry_number),
                ).fetchone()
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
                    "INSERT INTO retry_lineage (original_job_id,replacement_job_id,root_job_id,retry_number,reason,created_at) VALUES (?,?,?,?,?,?)",
                    (original["id"], job["id"], root_job_id or original["id"], retry_number, retry_reason, now),
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
            if db.execute("SELECT 1 FROM retry_lineage WHERE original_job_id = ? AND retry_number = 2", (retry1_job_id,)).fetchone():
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
                "SELECT original_job_id,root_job_id,retry_number,reason,created_at FROM retry_lineage WHERE replacement_job_id = ?",
                (job["id"],),
            ).fetchone()
        if row:
            result["retryLineage"] = {
                "originalJobId": row["original_job_id"],
                "rootJobId": row["root_job_id"],
                "retryNumber": row["retry_number"],
                "reason": row["reason"],
                "createdAt": row["created_at"],
            }
        return result
