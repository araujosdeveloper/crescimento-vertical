import io
import json
import os
import sys
import unittest
from unittest import mock

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
        runner = cb.SinglePostExecutor("http://fake", 330, 0, opener)
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
            runner = cb.SinglePostExecutor("http://fake", 330, 0, lambda *_, **__: response)
            with self.assertRaisesRegex(cb.ExecutorError, expected):
                runner.execute(request_body())
            self.assertEqual(runner.post_count, 1)

    def test_get_id_mismatch_and_transport_errors(self):
        responses = [Response(body={"jobId":"a"*32,"state":"queued"}), Response(body={"jobId":"b"*32,"state":"running"})]
        runner = cb.SinglePostExecutor("http://fake", 330, 0, lambda *_, **__: responses.pop(0))
        with mock.patch.object(cb.time, "sleep"):
            with self.assertRaisesRegex(cb.ExecutorError, "job_id_mismatch"):
                runner.execute(request_body())
        def transport(request, timeout):
            if request.method == "POST":
                raise OSError("offline")
            return Response(body={"jobId":"a"*32,"state":"succeeded"})
        runner = cb.SinglePostExecutor("http://fake", 330, 0, transport)
        with self.assertRaisesRegex(cb.ExecutorError, "transport_error"):
            runner.execute(request_body())
        self.assertEqual(runner.post_count, 1)

    def test_deadline_and_second_post_guard(self):
        runner = cb.SinglePostExecutor(
            "http://fake", 10, 0,
            lambda *_, **__: Response(body={"jobId":"a"*32,"state":"queued"}),
            http_post_timeout_seconds=8, http_get_timeout_seconds=2,
            job_timeout_seconds=1, admission_budget_seconds=1,
            finalization_budget_seconds=1, response_delivery_budget_seconds=1,
        )
        runner.started = 0
        with mock.patch.object(cb.time, "monotonic", side_effect=[0, 11]), mock.patch.object(cb.time, "sleep"):
            with self.assertRaisesRegex(cb.ExecutorError, "deadline_exhausted"):
                runner.execute(request_body())
        with self.assertRaisesRegex(cb.ExecutorError, "second_post_blocked"):
            runner.post_once(request_body())

    def test_operation_timeout_is_bounded_by_global_deadline(self):
        observed = []
        def opener(request, timeout):
            observed.append((request.method, timeout))
            return Response(body={"jobId":"a"*32,"state":"succeeded"})
        with mock.patch.object(cb.time, "monotonic", side_effect=[0, 4, 4]):
            runner = cb.SinglePostExecutor("http://fake", 330, 0, opener)
            runner.execute(request_body())
        self.assertEqual(observed, [("POST", 320)])

    def test_admission_delay_reduces_operation_timeout_from_remaining_budget(self):
        observed = []
        with mock.patch.object(cb.time, "monotonic", side_effect=[0, 20, 20]):
            runner = cb.SinglePostExecutor("http://fake", 330, 0,
                                           lambda request, timeout: (observed.append(timeout),
                                           Response(body={"jobId":"a"*32,"state":"succeeded"}))[1])
            runner.execute(request_body())
        self.assertEqual(observed, [310])

    def test_previous_race_terminal_504_fits_response_margin(self):
        observed = []
        def opener(request, timeout):
            observed.append((request.method, timeout))
            return Response(status=504, body={"jobId":"a"*32,"state":"timed_out"})
        runner = cb.SinglePostExecutor("http://fake", 330, 0, opener)
        summary, code = runner.execute(request_body())
        self.assertEqual(code, cb.EXIT_TERMINAL_FAILURE)
        self.assertEqual(observed, [("POST", 320)])
        self.assertEqual(summary["httpPostCount"], 1)
        self.assertEqual(summary["terminalStatus"], "timed_out")

    def test_http_error_504_is_parsed_as_terminal_response(self):
        payload = json.dumps({"jobId": "a" * 32, "state": "timed_out"}).encode()
        headers = {"Content-Type": "application/json"}

        def transport(request, timeout):
            raise cb.urllib.error.HTTPError(
                request.full_url, 504, "Gateway Timeout", headers, io.BytesIO(payload)
            )

        runner = cb.SinglePostExecutor("http://fake", 330, 0, transport)
        summary, code = runner.execute(request_body())
        self.assertEqual(code, cb.EXIT_TERMINAL_FAILURE)
        self.assertEqual(summary["terminalStatus"], "timed_out")
        self.assertEqual(runner.post_count, 1)

    def test_socket_expiry_is_not_extended_by_delivery_margin(self):
        clock = [0.0]

        def transport(request, timeout):
            self.assertEqual(request.method, "POST")
            self.assertEqual(timeout, 320)
            clock[0] = 320.0
            raise TimeoutError("socket expired")

        with mock.patch.object(cb.time, "monotonic", side_effect=lambda: clock[0]):
            runner = cb.SinglePostExecutor("http://fake", 330, 0, transport)
            with self.assertRaisesRegex(cb.ExecutorError, "transport_error"):
                runner.execute(request_body())
        self.assertEqual(runner.post_count, 1)
        self.assertEqual(runner.get_count, 0)

    def test_terminal_response_after_job_and_finalization_delay_is_accepted(self):
        clock = [0.0]
        def opener(request, timeout):
            self.assertEqual(timeout, 320)
            clock[0] = 315.0
            return Response(status=504, body={"jobId":"a"*32,"state":"timed_out"})
        with mock.patch.object(cb.time, "monotonic", side_effect=lambda: clock[0]):
            runner = cb.SinglePostExecutor("http://fake", 330, 0, opener)
            summary, code = runner.execute(request_body())
        self.assertEqual(code, cb.EXIT_TERMINAL_FAILURE)
        self.assertEqual(summary["terminalStatus"], "timed_out")

    def test_invalid_deadline_rejected_before_post(self):
        calls = []
        with self.assertRaisesRegex(ValueError, "client_deadline_budget_insufficient"):
            cb.SinglePostExecutor("http://fake", 310, 0, lambda *args: calls.append(args))
        self.assertEqual(calls, [])

    def test_transport_timeout_does_not_assign_job_state(self):
        def transport(request, timeout):
            self.assertEqual(request.method, "POST")
            self.assertEqual(timeout, 320)
            raise TimeoutError("socket")
        runner = cb.SinglePostExecutor("http://fake", 330, 0, transport)
        with self.assertRaisesRegex(cb.ExecutorError, "transport_error"):
            runner.execute(request_body())
        self.assertIsNone(runner.terminal_status)
        self.assertEqual(runner.post_count, 1)

    def test_input_strict_and_dry_run(self):
        schema_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), "docs", "schemas")
        class FakeStdin:
            def __init__(self, raw):
                self.buffer = io.BytesIO(raw)
        with mock.patch.object(cb.config, "SCHEMAS_DIR", schema_dir):
            with mock.patch.object(cb.sys, "stdin", FakeStdin(request_body())):
                self.assertEqual(cb.main(["--dry-run"]), cb.EXIT_SUCCEEDED)
            with mock.patch.object(cb.sys, "stdin", FakeStdin(request_body() + b"x")):
                self.assertEqual(cb.main(["--dry-run"]), cb.EXIT_INVALID)

    def test_static_single_post_and_only_get_polling(self):
        with open(os.path.join(os.path.dirname(os.path.dirname(__file__)), "controlled_battery.py"), encoding="utf-8") as handle:
            source = handle.read()
        self.assertEqual(source.count('self._request("POST"'), 1)
        self.assertEqual(source.count('self._request("GET"'), 1)
        self.assertNotIn("idempot", source.lower())

    def test_fake_transport_exercises_one_post_and_get_polling(self):
        calls = []
        responses = [
            Response(body={"jobId": "c" * 32, "state": "queued"}),
            Response(body={"jobId": "c" * 32, "state": "succeeded"}),
        ]
        def opener(request, timeout):
            calls.append(request.method)
            return responses.pop(0)
        runner = cb.SinglePostExecutor("http://fake", 330, 0.001, opener)
        with mock.patch.object(cb.time, "sleep"):
            summary, code = runner.execute(request_body())
        self.assertEqual(code, cb.EXIT_SUCCEEDED)
        self.assertEqual(calls, ["POST", "GET"])
        self.assertEqual(summary["httpPostCount"], 1)


if __name__ == "__main__":
    unittest.main()
