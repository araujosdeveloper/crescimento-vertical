import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import hmac_auth
from nonce_store import NonceStore


class TestHmacAuth(unittest.TestCase):
    def setUp(self):
        self.secret = b"a-32-byte-test-secret-value-012345"

    def test_compute_and_verify_roundtrip(self):
        body = b'{"topic": "IA"}'
        sig = hmac_auth.compute_signature(self.secret, "1700000000", "nonce-1", body)
        self.assertTrue(
            hmac_auth.verify_signature(self.secret, "1700000000", "nonce-1", body, sig)
        )

    def test_wrong_secret_rejected(self):
        body = b"x"
        sig = hmac_auth.compute_signature(self.secret, "1", "n", body)
        self.assertFalse(
            hmac_auth.verify_signature(b"other-secret", "1", "n", body, sig)
        )

    def test_wrong_body_rejected(self):
        sig = hmac_auth.compute_signature(self.secret, "1", "n", b"a")
        self.assertFalse(
            hmac_auth.verify_signature(self.secret, "1", "n", b"b", sig)
        )

    def test_missing_fields_rejected(self):
        self.assertFalse(
            hmac_auth.verify_signature(self.secret, "", "n", b"a", "sig")
        )


class TestNonceStore(unittest.TestCase):
    def test_first_use_accepted(self):
        store = NonceStore()
        self.assertTrue(store.check_and_add("nonce-a"))

    def test_replay_rejected(self):
        store = NonceStore()
        self.assertTrue(store.check_and_add("nonce-b"))
        self.assertFalse(store.check_and_add("nonce-b"))

    def test_empty_nonce_rejected(self):
        store = NonceStore()
        self.assertFalse(store.check_and_add(""))


if __name__ == "__main__":
    unittest.main()
