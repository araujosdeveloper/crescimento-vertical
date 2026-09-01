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
