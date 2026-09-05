import json
import os
import stat
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import config
import evidence


class TestFailureEvidence(unittest.TestCase):
    def test_metadata_finish_reasons_and_missing_are_distinct(self):
        self.assertEqual(evidence.finish_reason({"finish_reason": "stop"}), "stop")
        self.assertEqual(evidence.finish_reason({"calls": [{"finish_reason": "length"}]}), "length")
        self.assertIsNone(evidence.finish_reason({}))

    def test_atomic_sanitized_artifact_permissions_and_limit(self):
        with tempfile.TemporaryDirectory() as directory:
            old = config.FAILURE_DIR
            config.FAILURE_DIR = directory
            try:
                result = evidence.persist_failure(
                    "job-safe-1", '{"api_key":"SECRET", "x":"ok"}', [],
                    {"provider": "deepseek", "model": "deepseek-v4-flash", "finish_reason": "length"},
                    evidence.output_metadata('{"x":"ok"}', {"finish_reason": "length"}, parse_success=True),
                )
                root = Path(result["path"])
                self.assertEqual(stat.S_IMODE(root.stat().st_mode), 0o700)
                for path in root.iterdir():
                    self.assertEqual(stat.S_IMODE(path.stat().st_mode), 0o600)
                self.assertNotIn("SECRET", (root / "candidate-output.txt").read_text())
                metadata = json.loads((root / "response-metadata.json").read_text())
                self.assertEqual(metadata["job_id"], "job-safe-1")
                self.assertEqual(metadata["finish_reason"], "length")
            finally:
                config.FAILURE_DIR = old

    def test_large_evidence_is_truncated_without_provider_truncation_claim(self):
        raw = "x" * (evidence.EVIDENCE_MAX_BYTES + 1000)
        with tempfile.TemporaryDirectory() as directory:
            old = config.FAILURE_DIR
            config.FAILURE_DIR = directory
            try:
                result = evidence.persist_failure("job-safe-2", raw, [], None,
                    evidence.output_metadata(raw, None, parse_success=False))
                self.assertTrue(result["truncatedEvidence"])
                metadata = json.loads((Path(result["path"]) / "response-metadata.json").read_text())
                self.assertTrue(metadata["truncated_evidence"])
                self.assertFalse(metadata["suspected_truncation"])
            finally:
                config.FAILURE_DIR = old


if __name__ == "__main__":
    unittest.main()
