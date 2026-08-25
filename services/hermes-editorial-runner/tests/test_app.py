import http.client
import json
import os
import sys
import tempfile
import threading
import time
import unittest

TEST_DIR = os.path.dirname(os.path.abspath(__file__))
RUNNER_DIR = os.path.dirname(TEST_DIR)
sys.path.insert(0, RUNNER_DIR)

_secret_file = tempfile.NamedTemporaryFile(delete=False)
SECRET = b"a-32-byte-test-secret-value-0123456789"
_secret_file.write(SECRET)
_secret_file.close()

os.environ["HMAC_SECRET_FILE"] = _secret_file.name
os.environ["SCHEMAS_DIR"] = os.path.abspath(
    os.path.join(RUNNER_DIR, "..", "..", "docs", "schemas")
)
os.environ["RUNNER_EXECUTION_ENABLED"] = "false"
os.environ["EXECUTION_ENABLE_FILE"] = "/nonexistent/execution-enable"
os.environ["BODY_MAX_BYTES"] = "1000"

import config  # noqa: E402
import hmac_auth  # noqa: E402
import app as app_module  # noqa: E402

_nonce_counter = 0


def sign(timestamp: int, nonce: str, body: bytes = b"") -> str:
    return hmac_auth.compute_signature(SECRET, str(timestamp), nonce, body)


def request_headers(body: bytes, timestamp: int | None = None, nonce: str | None = None):
    global _nonce_counter
    _nonce_counter += 1
    ts = timestamp if timestamp is not None else int(time.time())
    n = nonce if nonce is not None else f"nonce-{_nonce_counter}"
    sig = sign(ts, n, body)
    return {
        "X-CV-Signature": sig,
        "X-CV-Timestamp": str(ts),
        "X-CV-Nonce": n,
        "Content-Type": "application/json",
    }


def valid_request():
    return {
        "schemaVersion": "1.0",
        "correlationId": "corr-1",
        "idempotencyKey": "idem-1",
        "topic": "IA aplicada a vendas",
        "primaryPillar": "ai-business",
        "searchIntent": "verificar impacto",
        "language": "pt-BR",
        "requestedAt": "2026-08-25T12:00:00Z",
        "maxSources": 5,
    }


def do_request(method, path, body=b"", headers=None):
    conn = http.client.HTTPConnection("127.0.0.1", PORT, timeout=10)
    conn.request(method, path, body=body, headers=headers or {})
    resp = conn.getresponse()
    data = resp.read()
    conn.close()
    return resp.status, data


class TestApp(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        global PORT
        cls.server = app_module.ThreadingHTTPServer(("127.0.0.1", 0), app_module.Handler)
        cls.server.daemon_threads = True
        PORT = cls.server.server_address[1]
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()

    def test_health_ok_and_disabled(self):
        status, data = do_request("GET", "/health")
        self.assertEqual(status, 200)
        body = json.loads(data)
        self.assertEqual(body["status"], "ok")
        self.assertFalse(body["executionEnabled"])

    def test_validate_without_hmac_401(self):
        status, _ = do_request(
            "POST", "/v1/validate", body=json.dumps(valid_request()).encode(),
            headers={"Content-Type": "application/json"},
        )
        self.assertEqual(status, 401)

    def test_invalid_signature_401(self):
        body = json.dumps(valid_request()).encode()
        headers = request_headers(body)
        headers["X-CV-Signature"] = "0" * 64
        status, _ = do_request("POST", "/v1/validate", body=body, headers=headers)
        self.assertEqual(status, 401)

    def test_expired_timestamp_401(self):
        body = json.dumps(valid_request()).encode()
        headers = request_headers(body, timestamp=int(time.time()) - 9999)
        status, _ = do_request("POST", "/v1/validate", body=body, headers=headers)
        self.assertEqual(status, 401)

    def test_repeated_nonce_409(self):
        body = json.dumps(valid_request()).encode()
        nonce = "fixed-nonce-replay"
        headers = request_headers(body, nonce=nonce)
        do_request("POST", "/v1/validate", body=body, headers=headers)
        headers2 = request_headers(body, nonce=nonce)
        status, _ = do_request("POST", "/v1/validate", body=body, headers=headers2)
        self.assertEqual(status, 409)

    def test_body_too_large_413(self):
        body = b"x" * 2000
        status, _ = do_request("POST", "/v1/validate", body=body, headers=request_headers(body))
        self.assertEqual(status, 413)

    def test_invalid_json_400(self):
        body = b"not-json"
        status, _ = do_request("POST", "/v1/validate", body=body, headers=request_headers(body))
        self.assertEqual(status, 400)

    def test_extra_property_422(self):
        req = valid_request()
        req["extraField"] = True
        body = json.dumps(req).encode()
        status, _ = do_request("POST", "/v1/validate", body=body, headers=request_headers(body))
        self.assertEqual(status, 422)

    def test_command_field_rejected_422(self):
        req = valid_request()
        req["command"] = "rm -rf /"
        body = json.dumps(req).encode()
        status, _ = do_request("POST", "/v1/validate", body=body, headers=request_headers(body))
        self.assertEqual(status, 422)

    def test_valid_request_200(self):
        body = json.dumps(valid_request()).encode()
        status, data = do_request("POST", "/v1/validate", body=body, headers=request_headers(body))
        self.assertEqual(status, 200)
        self.assertEqual(json.loads(data)["valid"], True)

    def test_jobs_disabled_503(self):
        body = json.dumps(valid_request()).encode()
        status, data = do_request("POST", "/v1/jobs", body=body, headers=request_headers(body))
        self.assertEqual(status, 503)
        self.assertEqual(json.loads(data)["error"], "execution_disabled")

    def test_get_job_not_found_404(self):
        headers = request_headers(b"")
        status, _ = do_request("GET", "/v1/jobs/does-not-exist", headers=headers)
        self.assertEqual(status, 404)


if __name__ == "__main__":
    unittest.main()
