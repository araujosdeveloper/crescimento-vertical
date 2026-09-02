import os
import sys
import tempfile
import unittest
from pathlib import Path

RUNNER_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, RUNNER_DIR)

import app as app_module  # noqa: E402
import config  # noqa: E402
from state import JobStore  # noqa: E402


class TestTerminalFinalization(unittest.TestCase):
    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        self._state_dir = self._tmp.name
        self._old_failure_dir = config.FAILURE_DIR
        config.FAILURE_DIR = os.path.join(self._state_dir, "failures")
        self.store = JobStore(os.path.join(self._state_dir, "jobs.sqlite3"))

    def tearDown(self):
        config.FAILURE_DIR = self._old_failure_dir
        self._tmp.cleanup()

    def _job(self):
        job, _ = self.store.create_or_get({"idempotencyKey": "idem-x", "correlationId": "c"}, "fp")
        self.store.reserve_battery_job()
        return job

    def test_failure_persists_usage_and_evidence(self):
        job = self._job()
        usage = {"provider": "deepseek", "model": "deepseek-v4-flash",
                 "api_calls": 2, "input_tokens": 100, "output_tokens": 50,
                 "cache_read_tokens": 0, "cache_write_tokens": 0, "reasoning_tokens": 0,
                 "tavily_operations": {"search": 2, "extract": 1}}
        app_module._finalize_terminal(self.store, job["id"], "failed", "provider_finish_reason_missing", usage=usage)
        persisted = self.store.get_by_id(job["id"])
        self.assertEqual(persisted["state"], "failed")
        self.assertIsNotNone(persisted["usage_json"])  # usage persisted on failure
        with self.store._connect() as db:
            evidence_rows = db.execute("SELECT count(*) FROM failure_evidence WHERE job_id=?", (job["id"],)).fetchone()[0]
            research_rows = db.execute("SELECT count(*) FROM research_operations WHERE job_id=?", (job["id"],)).fetchone()[0]
        self.assertEqual(evidence_rows, 1)  # evidence persisted on failure
        self.assertEqual(research_rows, 3)  # 2 search + 1 extract counted

    def test_timeout_persists_evidence_without_usage(self):
        job = self._job()
        app_module._finalize_terminal(self.store, job["id"], "timed_out", "timeout")
        persisted = self.store.get_by_id(job["id"])
        self.assertEqual(persisted["state"], "timed_out")
        with self.store._connect() as db:
            evidence_rows = db.execute("SELECT count(*) FROM failure_evidence WHERE job_id=?", (job["id"],)).fetchone()[0]
        self.assertEqual(evidence_rows, 1)

    def test_evidence_contains_terminal_state_and_error(self):
        job = self._job()
        app_module._finalize_terminal(self.store, job["id"], "failed", "hermes_nonzero_exit", output="partial")
        manifest_root = Path(config.FAILURE_DIR) / job["id"]
        metadata_path = manifest_root / "response-metadata.json"
        self.assertTrue(metadata_path.exists())
        import json
        metadata = json.loads(metadata_path.read_text())
        self.assertEqual(metadata["terminal_state"], "failed")
        self.assertEqual(metadata["error_code"], "hermes_nonzero_exit")

    def test_retry3_is_permanently_blocked(self):
        job = self._job()
        self.store.update(job["id"], "failed", error_code="hermes_nonzero_exit")
        retry1, _ = self.store.create_or_get({"idempotencyKey": "r1", "correlationId": "r1",
                                              "retryOfJobId": job["id"],
                                              "retryReason": "retry_after_ephemeral_logging_fix"}, "fp")
        self.store.update(retry1["id"], "failed", error_code="invalid_dossier_schema")
        retry2, _ = self.store.create_or_get({"idempotencyKey": "r2", "correlationId": "r2",
                                              "retryOfJobId": retry1["id"],
                                              "retryReason": "retry_after_dossier_contract_and_observability_fix",
                                              "retryNumber": 2, "rootJobId": job["id"]}, "fp")
        self.store.update(retry2["id"], "failed", error_code="provider_finish_reason_missing")
        # retry 3 (retry_number=3) não é permitido pela constante MAX_RETRY_CHAIN=2.
        from state import RetryLineageError
        with self.assertRaisesRegex(RetryLineageError, "retry_number_not_allowed"):
            self.store.create_or_get({"idempotencyKey": "r3", "correlationId": "r3",
                                      "retryOfJobId": retry2["id"],
                                      "retryReason": "retry_after_dossier_contract_and_observability_fix",
                                      "retryNumber": 3, "rootJobId": job["id"]}, "fp")
        # e um terceiro salto (retry_number=2 sobre o retry2) também é recusado:
        # o original não é elegível (não é invalid_dossier_schema).
        with self.assertRaisesRegex(RetryLineageError, "retry_original_not_eligible"):
            self.store.create_or_get({"idempotencyKey": "r3b", "correlationId": "r3b",
                                      "retryOfJobId": retry2["id"],
                                      "retryReason": "retry_after_dossier_contract_and_observability_fix",
                                      "retryNumber": 2, "rootJobId": job["id"]}, "fp")


if __name__ == "__main__":
    unittest.main()
