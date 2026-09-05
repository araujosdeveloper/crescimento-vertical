import os
import socket
import sqlite3
import sys
import tempfile
import threading
import unittest
from unittest import mock

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from state import JobStore


RETRY1_REASON = "retry_after_ephemeral_logging_fix"
RETRY2_REASON = "retry_after_dossier_contract_and_observability_fix"


def create_v4(path, *, root_column=False, rows=None, strict=True):
    rows = rows if rows is not None else [("job-a", "job-b", 1, RETRY1_REASON, 20.0, "job-a")]
    db = sqlite3.connect(path)
    db.execute("PRAGMA foreign_keys=OFF")
    db.execute(
        """CREATE TABLE jobs (
        id TEXT PRIMARY KEY, idempotency_key TEXT UNIQUE NOT NULL,
        correlation_id TEXT NOT NULL, topic_fingerprint TEXT NOT NULL,
        state TEXT NOT NULL, created_at REAL NOT NULL, updated_at REAL NOT NULL,
        result_json TEXT, error_code TEXT, usage_json TEXT)"""
    )
    jobs = (
        ("job-a", "idem-a", "corr-a", "fp", "failed", 10.0, 11.0, None, "hermes_nonzero_exit", '{"tokens":1}'),
        ("job-b", "idem-b", "corr-b", "fp", "failed", 20.0, 21.0, None, "invalid_dossier_schema", '{"tokens":2}'),
        ("job-c", "idem-c", "corr-c", "fp", "accepted", 30.0, 30.0, None, None, None),
    )
    db.executemany("INSERT INTO jobs VALUES (?,?,?,?,?,?,?,?,?,?)", jobs)
    db.execute(
        """CREATE TABLE battery_usage (
        battery_id TEXT PRIMARY KEY, jobs_reserved INTEGER NOT NULL DEFAULT 0,
        reserved_usd REAL NOT NULL DEFAULT 0, estimated_usd REAL NOT NULL DEFAULT 0,
        api_calls INTEGER NOT NULL DEFAULT 0, input_tokens INTEGER NOT NULL DEFAULT 0,
        output_tokens INTEGER NOT NULL DEFAULT 0, cache_read_tokens INTEGER NOT NULL DEFAULT 0,
        cache_write_tokens INTEGER NOT NULL DEFAULT 0, reasoning_tokens INTEGER NOT NULL DEFAULT 0,
        search_calls INTEGER NOT NULL DEFAULT 0, extract_calls INTEGER NOT NULL DEFAULT 0,
        updated_at REAL NOT NULL)"""
    )
    db.execute("INSERT INTO battery_usage VALUES ('phase8',2,0,0.054254576,8,59167,18993,225024,0,14080,0,0,40)")
    db.execute(
        """CREATE TABLE research_operations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_id TEXT NOT NULL REFERENCES jobs(id),
        operation TEXT NOT NULL CHECK (operation IN ('search','extract','crawl','research')),
        ordinal INTEGER NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('succeeded','failed')),
        created_at REAL NOT NULL,
        UNIQUE(job_id, operation, ordinal))"""
    )
    db.execute("INSERT INTO research_operations(job_id,operation,ordinal,status,created_at) VALUES ('job-b','search',1,'succeeded',35)")
    unique = "UNIQUE" if strict else ""
    primary = ", PRIMARY KEY (original_job_id,retry_number)" if strict else ""
    root_sql = ", root_job_id TEXT REFERENCES jobs(id)" if root_column else ""
    db.execute(
        f"""CREATE TABLE retry_lineage (
        original_job_id TEXT NOT NULL REFERENCES jobs(id),
        replacement_job_id TEXT NOT NULL {unique} REFERENCES jobs(id),
        retry_number INTEGER NOT NULL, reason TEXT NOT NULL, created_at REAL NOT NULL
        {root_sql}{primary})"""
    )
    for original, replacement, number, reason, created, root in rows:
        values = (original, replacement, number, reason, created, root)
        columns = "original_job_id,replacement_job_id,retry_number,reason,created_at"
        if root_column:
            columns += ",root_job_id"
            db.execute(f"INSERT INTO retry_lineage ({columns}) VALUES (?,?,?,?,?,?)", values)
        else:
            db.execute(f"INSERT INTO retry_lineage ({columns}) VALUES (?,?,?,?,?)", values[:5])
    db.execute("PRAGMA user_version=4")
    db.commit()
    db.close()


def snapshot(path):
    db = sqlite3.connect(path)
    result = {
        "version": db.execute("PRAGMA user_version").fetchone()[0],
        "jobs": db.execute("SELECT * FROM jobs ORDER BY id").fetchall(),
        "usage": db.execute(
            "SELECT battery_id, jobs_reserved, reserved_usd, estimated_usd, api_calls, "
            "input_tokens, output_tokens, cache_read_tokens, cache_write_tokens, "
            "reasoning_tokens, search_calls, extract_calls, updated_at "
            "FROM battery_usage ORDER BY battery_id"
        ).fetchall(),
        "research": db.execute("SELECT * FROM research_operations ORDER BY id").fetchall(),
        "lineage": db.execute("SELECT * FROM retry_lineage ORDER BY created_at").fetchall(),
    }
    db.close()
    return result


class TestStateMigrationV5(unittest.TestCase):
    def test_v4_without_root_migrates_and_backfills_deterministically(self):
        with tempfile.TemporaryDirectory() as directory:
            path = os.path.join(directory, "jobs.sqlite3")
            create_v4(path)
            before = snapshot(path)
            JobStore(path)
            after = snapshot(path)
            self.assertEqual(after["version"], 6)
            self.assertEqual(after["jobs"], before["jobs"])
            self.assertEqual(after["usage"], before["usage"])
            self.assertEqual(after["research"], before["research"])
            self.assertEqual(after["lineage"][0][2], "job-a")
            self.assertEqual(after["lineage"][0][0:2], ("job-a", "job-b"))

    def test_transitional_v4_with_root_migrates(self):
        with tempfile.TemporaryDirectory() as directory:
            path = os.path.join(directory, "jobs.sqlite3")
            create_v4(path, root_column=True)
            JobStore(path)
            self.assertEqual(snapshot(path)["lineage"][0][2], "job-a")

    def test_transitional_v4_completes_only_provable_null_root(self):
        with tempfile.TemporaryDirectory() as directory:
            path = os.path.join(directory, "jobs.sqlite3")
            create_v4(path, root_column=True, rows=[("job-a", "job-b", 1, RETRY1_REASON, 20.0, None)])
            JobStore(path)
            self.assertEqual(snapshot(path)["lineage"][0][2], "job-a")

    def test_v5_reopen_does_not_change_rows_or_schema(self):
        with tempfile.TemporaryDirectory() as directory:
            path = os.path.join(directory, "jobs.sqlite3")
            store = JobStore(path)
            root, _ = store.create_or_get({"idempotencyKey": "root", "correlationId": "c"}, "fp")
            store.update(root["id"], "failed", error_code="hermes_nonzero_exit")
            store.create_or_get({"idempotencyKey": "retry", "correlationId": "r", "retryOfJobId": root["id"], "retryReason": RETRY1_REASON}, "fp")
            before = snapshot(path)
            with sqlite3.connect(path) as db:
                schema_before = db.execute("SELECT type,name,sql FROM sqlite_master ORDER BY type,name").fetchall()
            JobStore(path)
            self.assertEqual(snapshot(path), before)
            with sqlite3.connect(path) as db:
                self.assertEqual(db.execute("SELECT type,name,sql FROM sqlite_master ORDER BY type,name").fetchall(), schema_before)

    def test_v5_rejects_a_second_layout_with_the_same_user_version(self):
        with tempfile.TemporaryDirectory() as directory:
            path = os.path.join(directory, "jobs.sqlite3")
            JobStore(path)
            with sqlite3.connect(path) as db:
                db.execute("ALTER TABLE retry_lineage ADD COLUMN shadow_layout TEXT")
            with self.assertRaisesRegex(RuntimeError, "retry_lineage_v5_layout_invalid"):
                JobStore(path)

    def test_valid_retry_two_chain_has_consistent_root(self):
        with tempfile.TemporaryDirectory() as directory:
            store = JobStore(os.path.join(directory, "jobs.sqlite3"))
            root, _ = store.create_or_get({"idempotencyKey": "root", "correlationId": "c"}, "fp")
            store.update(root["id"], "failed", error_code="hermes_nonzero_exit")
            retry1, _ = store.create_or_get({"idempotencyKey": "r1", "correlationId": "r1", "retryOfJobId": root["id"], "retryReason": RETRY1_REASON}, "fp")
            store.update(retry1["id"], "failed", error_code="invalid_dossier_schema")
            retry2, _ = store.create_or_get({"idempotencyKey": "r2", "correlationId": "r2", "retryOfJobId": retry1["id"], "retryNumber": 2, "rootJobId": root["id"], "retryReason": RETRY2_REASON}, "fp")
            self.assertEqual(store.public(retry2)["retryLineage"]["rootJobId"], root["id"])

    def assert_migration_fails_and_stays_v4(self, **kwargs):
        with tempfile.TemporaryDirectory() as directory:
            path = os.path.join(directory, "jobs.sqlite3")
            create_v4(path, **kwargs)
            before = snapshot(path)
            with self.assertRaises(RuntimeError):
                JobStore(path)
            self.assertEqual(snapshot(path), before)

    def test_divergent_root_fails_closed(self):
        self.assert_migration_fails_and_stays_v4(root_column=True, rows=[("job-a", "job-b", 1, RETRY1_REASON, 20.0, "job-c")])

    def test_cycle_fails_closed(self):
        self.assert_migration_fails_and_stays_v4(rows=[("job-a", "job-b", 1, RETRY1_REASON, 20.0, None), ("job-b", "job-a", 2, RETRY2_REASON, 30.0, None)], strict=False)

    def test_retry_three_fails_closed(self):
        self.assert_migration_fails_and_stays_v4(rows=[("job-a", "job-b", 3, RETRY2_REASON, 20.0, None)])

    def test_invalid_foreign_key_fails_closed(self):
        self.assert_migration_fails_and_stays_v4(rows=[("missing", "job-b", 1, RETRY1_REASON, 20.0, None)], strict=False)

    def test_duplicate_replacement_fails_closed(self):
        self.assert_migration_fails_and_stays_v4(rows=[("job-a", "job-b", 1, RETRY1_REASON, 20.0, None), ("job-c", "job-b", 1, RETRY1_REASON, 30.0, None)], strict=False)

    def test_incompatible_reason_fails_closed(self):
        self.assert_migration_fails_and_stays_v4(rows=[("job-a", "job-b", 1, RETRY2_REASON, 20.0, None)])

    def test_failure_during_rebuild_rolls_back_everything(self):
        with tempfile.TemporaryDirectory() as directory:
            path = os.path.join(directory, "jobs.sqlite3")
            create_v4(path, root_column=True)
            before = snapshot(path)
            with self.assertRaisesRegex(RuntimeError, "injected_migration_failure"):
                JobStore(path, _migration_fault="after_copy")
            self.assertEqual(snapshot(path), before)
            with sqlite3.connect(path) as db:
                self.assertIsNone(db.execute("SELECT 1 FROM sqlite_master WHERE name='retry_lineage_v5_new'").fetchone())

    def test_concurrent_migration_serializes_and_preserves_state(self):
        with tempfile.TemporaryDirectory() as directory:
            path = os.path.join(directory, "jobs.sqlite3")
            create_v4(path)
            before = snapshot(path)
            stores = []
            errors = []

            def migrate():
                try:
                    stores.append(JobStore(path))
                except Exception as exc:  # pragma: no cover - asserted below
                    errors.append(exc)

            threads = [threading.Thread(target=migrate) for _ in range(4)]
            for thread in threads:
                thread.start()
            for thread in threads:
                thread.join()
            self.assertEqual(errors, [])
            self.assertEqual(len(stores), 4)
            after = snapshot(path)
            self.assertEqual(after["version"], 6)
            self.assertEqual(after["jobs"], before["jobs"])
            self.assertEqual(after["usage"], before["usage"])
            self.assertEqual(after["research"], before["research"])
            self.assertEqual(len(after["lineage"]), 1)

    def test_fresh_database_is_created_directly_as_v5(self):
        with tempfile.TemporaryDirectory() as directory:
            path = os.path.join(directory, "jobs.sqlite3")
            JobStore(path)
            with sqlite3.connect(path) as db:
                self.assertEqual(db.execute("PRAGMA user_version").fetchone()[0], 6)
                root = {row[1]: row for row in db.execute("PRAGMA table_info(retry_lineage)")}["root_job_id"]
                self.assertEqual(root[3], 1)

    def test_prior_v4_backup_is_restored_then_migrated(self):
        with tempfile.TemporaryDirectory() as directory:
            source = os.path.join(directory, "prior-v4.sqlite3")
            restored = os.path.join(directory, "restored.sqlite3")
            create_v4(source)
            with sqlite3.connect(source) as src, sqlite3.connect(restored) as dst:
                src.backup(dst)
            JobStore(restored)
            self.assertEqual(snapshot(restored)["version"], 6)

    def test_migration_uses_zero_external_network(self):
        with tempfile.TemporaryDirectory() as directory:
            path = os.path.join(directory, "jobs.sqlite3")
            create_v4(path)
            with mock.patch.object(socket.socket, "connect", side_effect=AssertionError("network forbidden")):
                JobStore(path)


if __name__ == "__main__":
    unittest.main()
