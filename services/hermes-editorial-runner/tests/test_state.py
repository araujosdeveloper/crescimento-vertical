import os
import sys
import tempfile
import threading
import sqlite3
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from state import IdempotencyConflictError, JobStore, RetryLineageError
import config


class TestJobStore(unittest.TestCase):
    def test_schema_v5_and_retry2_is_only_eligibility(self):
        with tempfile.TemporaryDirectory() as directory:
            store = JobStore(os.path.join(directory, "jobs.sqlite3"))
            original, _ = store.create_or_get({"idempotencyKey": "root", "correlationId": "c"}, "fp")
            store.update(original["id"], "failed", error_code="hermes_nonzero_exit")
            retry, _ = store.create_or_get({"idempotencyKey": "retry1", "correlationId": "r", "retryOfJobId": original["id"], "retryReason": "retry_after_ephemeral_logging_fix"}, "fp")
            store.update(retry["id"], "failed", error_code="invalid_dossier_schema")
            with store._connect() as db:
                self.assertEqual(db.execute("PRAGMA user_version").fetchone()[0], 5)
                self.assertIsNotNone(db.execute("SELECT 1 FROM failure_evidence WHERE 0").description)
            denied = store.retry2_eligibility(retry["id"], accumulated_cost_usd=0.05, reserve_usd=0, human_authorized=False)
            self.assertEqual(denied["reason"], "human_authorization_required")
            eligible = store.retry2_eligibility(retry["id"], accumulated_cost_usd=0.05, reserve_usd=0, human_authorized=True)
            self.assertTrue(eligible["eligible"])
            self.assertEqual(eligible["retry_number"], 2)
            self.assertIsNone(eligible["replacement_job_id"])
            with store._connect() as db:
                self.assertEqual(db.execute("SELECT count(*) FROM retry_lineage").fetchone()[0], 1)
    def test_idempotent_create_and_update(self):
        with tempfile.TemporaryDirectory() as directory:
            store = JobStore(os.path.join(directory, "jobs.sqlite3"))
            request = {"idempotencyKey": "idem-1", "correlationId": "corr-1"}
            job, created = store.create_or_get(request, "fingerprint")
            replay, replay_created = store.create_or_get(request, "fingerprint")
            self.assertTrue(created)
            self.assertFalse(replay_created)
            self.assertEqual(job["id"], replay["id"])
            store.update(job["id"], "rejected", error_code="topic_out_of_scope")
            self.assertEqual(store.get_by_idempotency("idem-1")["state"], "rejected")

    def test_same_idempotency_key_with_different_content_conflicts(self):
        with tempfile.TemporaryDirectory() as directory:
            store = JobStore(os.path.join(directory, "jobs.sqlite3"))
            request = {"idempotencyKey": "idem-conflict", "correlationId": "corr-1"}
            store.create_or_get(request, "fingerprint-a")
            with self.assertRaisesRegex(IdempotencyConflictError, "idempotency_conflict"):
                store.create_or_get(request, "fingerprint-b")

    def test_battery_guardrail_persists_and_limits_jobs(self):
        with tempfile.TemporaryDirectory() as directory:
            store = JobStore(os.path.join(directory, "jobs.sqlite3"))
            for _ in range(config.MAX_BATCH_JOBS):
                store.reserve_battery_job()
                store.release_battery_reservation()
            with self.assertRaisesRegex(RuntimeError, "battery_job_limit_reached"):
                store.reserve_battery_job()

    def test_battery_usage_counts_cost_dimensions(self):
        with tempfile.TemporaryDirectory() as directory:
            store = JobStore(os.path.join(directory, "jobs.sqlite3"))
            store.reserve_battery_job()
            result = store.record_battery_usage({
                "api_calls": 2, "input_tokens": 1000, "output_tokens": 500,
                "cache_read_tokens": 200, "cache_write_tokens": 100,
                "reasoning_tokens": 300,
            })
            self.assertEqual(result["costStatus"], "estimated")
            self.assertGreater(result["estimatedCostUsd"], 0)
            store.release_battery_reservation()
            with store._connect() as db:
                self.assertEqual(db.execute("select reserved_usd from battery_usage").fetchone()[0], 0)

    def test_research_operations_are_persistent_and_fourth_search_is_blocked(self):
        with tempfile.TemporaryDirectory() as directory:
            store = JobStore(os.path.join(directory, "jobs.sqlite3"))
            job, _ = store.create_or_get({"idempotencyKey": "research", "correlationId": "c"}, "fp")
            store.reserve_battery_job()
            usage = {"tavily_operations": {"search": [{"status": "succeeded"}] * 3,
                                               "extract": [{"status": "succeeded"}]}}
            self.assertEqual(store.record_research_usage(job["id"], usage)["searchCalls"], 3)
            reopened = JobStore(os.path.join(directory, "jobs.sqlite3"))
            with reopened._connect() as db:
                self.assertEqual(db.execute("select count(*) from research_operations where job_id=?", (job["id"],)).fetchone()[0], 4)
            with self.assertRaisesRegex(RuntimeError, "tavily_search_limit_reached"):
                reopened.record_research_usage(job["id"], {"tavily_operations": {"search": [{"status": "succeeded"}] * 4}})

    def test_research_usage_missing_fails_closed(self):
        with tempfile.TemporaryDirectory() as directory:
            store = JobStore(os.path.join(directory, "jobs.sqlite3"))
            job, _ = store.create_or_get({"idempotencyKey": "research-missing", "correlationId": "c"}, "fp")
            with self.assertRaisesRegex(RuntimeError, "tavily_usage_unavailable"):
                store.record_research_usage(job["id"], {})

    def test_retry_lineage_is_atomic_persistent_and_sanitized(self):
        with tempfile.TemporaryDirectory() as directory:
            path = os.path.join(directory, "jobs.sqlite3")
            store = JobStore(path)
            original, _ = store.create_or_get({"idempotencyKey": "original", "correlationId": "c"}, "fp")
            store.update(original["id"], "failed", error_code="hermes_nonzero_exit")
            retry = {"idempotencyKey": "replacement", "correlationId": "r", "retryOfJobId": original["id"], "retryReason": "retry_after_ephemeral_logging_fix"}
            replacement, created = store.create_or_get(retry, "fp")
            self.assertTrue(created)
            self.assertEqual(store.public(replacement)["retryLineage"]["originalJobId"], original["id"])
            self.assertEqual(store.public(replacement)["retryLineage"]["retryNumber"], 1)
            self.assertEqual(store.public(replacement)["retryLineage"]["reason"], "retry_after_ephemeral_logging_fix")
            replay, replay_created = store.create_or_get(retry, "fp")
            self.assertFalse(replay_created)
            self.assertEqual(replay["id"], replacement["id"])
            reopened = JobStore(path)
            self.assertIsNotNone(reopened.public(reopened.get_by_id(replacement["id"])).get("retryLineage"))
            with self.assertRaisesRegex(RetryLineageError, "retry_number_exhausted"):
                reopened.create_or_get({"idempotencyKey": "replacement-2", "correlationId": "r2", "retryOfJobId": original["id"], "retryReason": "retry_after_ephemeral_logging_fix"}, "fp")

    def test_retry_lineage_rejects_invalid_original_and_rolls_back(self):
        with tempfile.TemporaryDirectory() as directory:
            store = JobStore(os.path.join(directory, "jobs.sqlite3"))
            with self.assertRaisesRegex(RetryLineageError, "retry_original_not_found"):
                store.create_or_get({"idempotencyKey": "x", "correlationId": "c", "retryOfJobId": "0" * 32, "retryReason": "retry_after_ephemeral_logging_fix"}, "fp")
            self.assertIsNone(store.get_by_idempotency("x"))
            original, _ = store.create_or_get({"idempotencyKey": "o", "correlationId": "c"}, "fp2")
            with self.assertRaisesRegex(RetryLineageError, "retry_original_not_eligible"):
                store.create_or_get({"idempotencyKey": "y", "correlationId": "c", "retryOfJobId": original["id"], "retryReason": "retry_after_ephemeral_logging_fix"}, "fp2")
            self.assertIsNone(store.get_by_idempotency("y"))

    def test_retry_lineage_rejects_reason_and_missing_fields(self):
        with tempfile.TemporaryDirectory() as directory:
            store = JobStore(os.path.join(directory, "jobs.sqlite3"))
            original, _ = store.create_or_get({"idempotencyKey": "o", "correlationId": "c"}, "fp")
            store.update(original["id"], "failed", error_code="hermes_nonzero_exit")
            with self.assertRaisesRegex(RetryLineageError, "retry_lineage_fields_required"):
                store.create_or_get({"idempotencyKey": "x", "correlationId": "c", "retryOfJobId": original["id"]}, "fp")
            with self.assertRaisesRegex(RetryLineageError, "retry_reason_not_allowed"):
                store.create_or_get({"idempotencyKey": "y", "correlationId": "c", "retryOfJobId": original["id"], "retryReason": "retry-2"}, "fp")

    def test_retry_lineage_concurrent_attempts_create_one_replacement(self):
        with tempfile.TemporaryDirectory() as directory:
            store = JobStore(os.path.join(directory, "jobs.sqlite3"))
            original, _ = store.create_or_get({"idempotencyKey": "o", "correlationId": "c"}, "fp")
            store.update(original["id"], "failed", error_code="hermes_nonzero_exit")
            results, errors = [], []
            def attempt(i):
                try:
                    results.append(store.create_or_get({"idempotencyKey": f"r{i}", "correlationId": f"r{i}", "retryOfJobId": original["id"], "retryReason": "retry_after_ephemeral_logging_fix"}, "fp"))
                except RetryLineageError as exc:
                    errors.append(str(exc))
            threads = [threading.Thread(target=attempt, args=(i,)) for i in range(2)]
            for t in threads: t.start()
            for t in threads: t.join()
            self.assertEqual(sum(created for _, created in results), 1)
            self.assertIn("retry_number_exhausted", errors)
            with sqlite3.connect(os.path.join(directory, "jobs.sqlite3")) as db:
                self.assertEqual(db.execute("select count(*) from retry_lineage").fetchone()[0], 1)


if __name__ == "__main__":
    unittest.main()
