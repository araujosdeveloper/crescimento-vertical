import json
import os
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import evidence


def valid_usage():
    return {
        "provider": "deepseek", "model": "deepseek-v4-flash",
        "api_calls": 1, "input_tokens": 10, "output_tokens": 5,
        "cache_read_tokens": 0, "cache_write_tokens": 0, "reasoning_tokens": 0,
        "provider_finish_reason": "stop",
        "tavily_operations": {"search": {"attempted": 0, "succeeded": 0, "failed": 0}},
    }


class TestUsageCollection(unittest.TestCase):
    def write(self, root, value):
        path = Path(root) / "usage-job.json"
        if isinstance(value, bytes):
            path.write_bytes(value)
        else:
            path.write_text(json.dumps(value), encoding="utf-8")
        return str(path)

    def test_valid_document_is_present_and_complete(self):
        with tempfile.TemporaryDirectory() as root:
            result = evidence.collect_usage(self.write(root, valid_usage()), lifecycle_proven=True)
        self.assertEqual(result["status"], "present")
        self.assertTrue(result["complete"])
        self.assertEqual(result["usage"]["input_tokens"], 10)

    def test_timeout_available_usage_is_partial_when_finish_unknown(self):
        usage = valid_usage()
        del usage["provider_finish_reason"]
        with tempfile.TemporaryDirectory() as root:
            result = evidence.collect_usage(self.write(root, usage), lifecycle_proven=True)
        self.assertEqual(result["status"], "partial")
        self.assertFalse(result["complete"])

    def test_unproven_lifecycle_never_reports_complete(self):
        with tempfile.TemporaryDirectory() as root:
            result = evidence.collect_usage(self.write(root, valid_usage()), lifecycle_proven=False)
        self.assertEqual(result["status"], "partial")
        self.assertEqual(result["error"], "lifecycle_unproven")

    def test_absent_empty_invalid_negative_and_boolean(self):
        with tempfile.TemporaryDirectory() as root:
            absent = evidence.collect_usage(str(Path(root) / "missing.json"), lifecycle_proven=True)
            empty = evidence.collect_usage(self.write(root, b""), lifecycle_proven=True)
            invalid = evidence.collect_usage(self.write(root, b"{\"api_calls\":"), lifecycle_proven=True)
            bad = valid_usage(); bad["input_tokens"] = -1
            negative = evidence.collect_usage(self.write(root, bad), lifecycle_proven=True)
            bad["input_tokens"] = True
            boolean = evidence.collect_usage(self.write(root, bad), lifecycle_proven=True)
        self.assertEqual(absent["status"], "absent")
        self.assertEqual(empty["status"], "empty")
        self.assertEqual(invalid["status"], "invalid")
        self.assertEqual(negative["status"], "invalid")
        self.assertEqual(boolean["status"], "invalid")

    def test_symlink_and_excessive_file_are_rejected(self):
        with tempfile.TemporaryDirectory() as root:
            target = self.write(root, valid_usage())
            link = str(Path(root) / "link.json")
            os.symlink(target, link)
            symlink = evidence.collect_usage(link, lifecycle_proven=True)
            huge = evidence.collect_usage(self.write(root, b"x" * (evidence.USAGE_MAX_BYTES + 1)), lifecycle_proven=True)
        self.assertEqual(symlink["status"], "invalid")
        self.assertEqual(huge["status"], "invalid")


if __name__ == "__main__":
    unittest.main()
