import os
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from state import IdempotencyConflictError, JobStore
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


if __name__ == "__main__":
    unittest.main()
