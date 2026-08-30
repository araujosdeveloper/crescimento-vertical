import os
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from state import JobStore


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


if __name__ == "__main__":
    unittest.main()
