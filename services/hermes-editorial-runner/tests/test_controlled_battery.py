import io
import json
import os
import sys
import threading
import unittest
from unittest import mock
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import controlled_battery as cb


class Response:
    def __init__(self, status=202, body=None, content_type="application/json"):
        self.status = status
        self.headers = {"Content-Type": content_type}
        self.raw = json.dumps(body or {}).encode()

    def read(self, limit=-1):
        return self.raw if limit < 0 else self.raw[:limit]


def request_body():
    return b'{"schemaVersion":"1.0","correlationId":"c","idempotencyKey":"i","topic":"t","primaryPillar":"ai-business","searchIntent":"s","language":"pt-BR","requestedAt":"2026-09-01T00:00:00Z","maxSources":2}'


class TestControlledBattery(unittest.TestCase):
    def run_sequence(self, responses):
        calls = []
        def opener(request, timeout):
            calls.append(request.method)
            result = responses[len(calls) - 1]
            return result
        runner = cb.SinglePostExecutor("http://fake", 300, 0, opener)
        with mock.patch.object(cb.time, "sleep"):
            summary, code = runner.execute(request_body())
        return summary, code, calls

    def test_post_succeeded_is_single_post(self):
        summary, code, calls = self.run_sequence([Response(body={"jobId":"a"*32,"state":"succeeded"})])
        self.assertEqual(code, cb.EXIT_SUCCEEDED)
        self.assertEqual(calls, ["POST"])
        self.assertEqual(summary["httpPostCount"], 1)
        self.assertFalse(summary["pollingPerformed"])

    def test_queued_running_succeeded_polls_get_only(self):
        summary, code, calls = self.run_sequence([
            Response(body={"jobId":"a"*32,"state":"queued"}),
            Response(body={"jobId":"a"*32,"state":"running"}),
            Response(body={"jobId":"a"*32,"state":"succeeded"}),
        ])
        self.assertEqual(code, cb.EXIT_SUCCEEDED)
        self.assertEqual(calls, ["POST", "GET", "GET"])
        self.assertEqual(summary["httpPostCount"], 1)
        self.assertEqual(summary["httpGetCount"], 2)

    def test_running_failed_is_terminal_failure(self):
        summary, code, calls = self.run_sequence([
            Response(body={"jobId":"a"*32,"state":"running"}),
            Response(body={"jobId":"a"*32,"state":"failed"}),
        ])
        self.assertEqual(code, cb.EXIT_TERMINAL_FAILURE)
        self.assertEqual(calls, ["POST", "GET"])

    def test_terminal_failed_does_not_poll(self):
        _, code, calls = self.run_sequence([Response(body={"jobId":"a"*32,"state":"failed"})])
        self.assertEqual(code, cb.EXIT_TERMINAL_FAILURE)
        self.assertEqual(calls, ["POST"])

    def test_invalid_responses_fail_closed(self):
        for response, expected in ((Response(body={"state":"succeeded"}), "missing_job_id"),
                                   (Response(body={"jobId":"a"*32,"state":"other"}), "unknown_state"),
                                   (Response(body={"jobId":"a"*32,"state":"succeeded"}, content_type="text/plain"), "invalid_content_type"),
                                   (Response(body={"jobId":"a"*32,"state":"succeeded"}), "")):
            if expected == "":
                response.raw = b"not-json"
                expected = "invalid_response_json"
            runner = cb.SinglePostExecutor("http://fake", 300, 0, lambda *_, **__: response)
            with self.assertRaisesRegex(cb.ExecutorError, expected):
                runner.execute(request_body())
            self.assertEqual(runner.post_count, 1)

    def test_get_id_mismatch_and_transport_errors(self):
        responses = [Response(body={"jobId":"a"*32,"state":"queued"}), Response(body={"jobId":"b"*32,"state":"running"})]
        runner = cb.SinglePostExecutor("http://fake", 300, 0, lambda *_, **__: responses.pop(0))
        with mock.patch.object(cb.time, "sleep"):
            with self.assertRaisesRegex(cb.ExecutorError, "job_id_mismatch"):
                runner.execute(request_body())
        def transport(request, timeout):
            if request.method == "POST":
                raise OSError("offline")
            return Response(body={"jobId":"a"*32,"state":"succeeded"})
        runner = cb.SinglePostExecutor("http://fake", 300, 0, transport)
        with self.assertRaisesRegex(cb.ExecutorError, "transport_error"):
            runner.execute(request_body())
        self.assertEqual(runner.post_count, 1)

    def test_timeout_and_second_post_guard(self):
        runner = cb.SinglePostExecutor("http://fake", 1, 0, lambda *_, **__: Response(body={"jobId":"a"*32,"state":"queued"}))
        runner.started = 0
        with mock.patch.object(cb.time, "monotonic", side_effect=[0, 2]), mock.patch.object(cb.time, "sleep"):
            with self.assertRaisesRegex(cb.ExecutorError, "timeout_unreconciled"):
                runner.execute(request_body())
        with self.assertRaisesRegex(cb.ExecutorError, "second_post_blocked"):
            runner.post_once(request_body())

    def test_input_strict_and_dry_run(self):
        with mock.patch.object(cb.sys, "stdin", io.TextIOWrapper(io.BytesIO(request_body()))):
            self.assertEqual(cb.main(["--dry-run"]), cb.EXIT_SUCCEEDED)
        with mock.patch.object(cb.sys, "stdin", io.TextIOWrapper(io.BytesIO(request_body() + b"x"))):
            self.assertEqual(cb.main(["--dry-run"]), cb.EXIT_INVALID)

    def test_static_single_post_and_only_get_polling(self):
        with open(os.path.join(os.path.dirname(os.path.dirname(__file__)), "controlled_battery.py"), encoding="utf-8") as handle:
            source = handle.read()
        self.assertEqual(source.count('self._request("POST"'), 1)
        self.assertEqual(source.count('self._request("GET"'), 1)
        self.assertNotIn("idempot", source.lower())

    def test_local_http_server_exercises_one_post_and_get_polling(self):
        calls = []
        class Handler(BaseHTTPRequestHandler):
            def do_POST(self):
                calls.append(self.command)
                self.rfile.read(int(self.headers["Content-Length"]))
                payload = json.dumps({"jobId": "c" * 32, "state": "queued"}).encode()
                self.send_response(202); self.send_header("Content-Type", "application/json"); self.send_header("Content-Length", str(len(payload))); self.end_headers(); self.wfile.write(payload)
            def do_GET(self):
                calls.append(self.command)
                payload = json.dumps({"jobId": "c" * 32, "state": "succeeded"}).encode()
                self.send_response(200); self.send_header("Content-Type", "application/json"); self.send_header("Content-Length", str(len(payload))); self.end_headers(); self.wfile.write(payload)
            def log_message(self, *_): pass
        server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        threading.Thread(target=server.serve_forever, daemon=True).start()
        runner = cb.SinglePostExecutor(f"http://127.0.0.1:{server.server_address[1]}", 2, 0.001)
        with mock.patch.object(cb.time, "sleep"):
            summary, code = runner.execute(request_body())
        server.shutdown(); server.server_close()
        self.assertEqual(code, cb.EXIT_SUCCEEDED)
        self.assertEqual(calls, ["POST", "GET"])
        self.assertEqual(summary["httpPostCount"], 1)


if __name__ == "__main__":
    unittest.main()
