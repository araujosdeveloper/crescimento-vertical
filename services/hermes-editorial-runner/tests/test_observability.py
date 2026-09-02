import os
import sys
import unittest

RUNNER_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, RUNNER_DIR)
sys.path.insert(0, os.path.join(RUNNER_DIR, "hermes-instrumentation"))

from observability import TavilyCounter, build_usage_report, extract_finish_reason  # noqa: E402


class TestFinishReasonExtraction(unittest.TestCase):
    def test_stop(self):
        self.assertEqual(extract_finish_reason("text_response(finish_reason=stop)"), "stop")

    def test_length(self):
        self.assertEqual(extract_finish_reason("text_response(finish_reason=length)"), "length")

    def test_content_filter(self):
        self.assertEqual(extract_finish_reason("text_response(finish_reason=content_filter)"), "content_filter")

    def test_tool_calls(self):
        self.assertEqual(extract_finish_reason("text_response(finish_reason=tool_calls)"), "tool_calls")

    def test_absent_finish_reason_is_none(self):
        self.assertIsNone(extract_finish_reason("text_response()"))
        self.assertIsNone(extract_finish_reason(None))
        self.assertIsNone(extract_finish_reason("budget_exhausted"))

    def test_unknown_value_is_none(self):
        self.assertIsNone(extract_finish_reason("text_response(finish_reason=weird)"))


class TestTavilyCounter(unittest.TestCase):
    def test_counts_search_and_extract_at_http_point(self):
        counter = TavilyCounter()
        counter.record("search")
        counter.record("search")
        counter.record("extract")
        self.assertEqual(counter.snapshot(), {"search": 2, "extract": 1})

    def test_unknown_operation_ignored(self):
        counter = TavilyCounter()
        counter.record("crawl")
        self.assertEqual(counter.snapshot(), {"search": 0, "extract": 0})


class TestUsageReport(unittest.TestCase):
    def test_report_exports_finish_reason_and_tavily_counts(self):
        counter = TavilyCounter()
        counter.record("search")
        report = build_usage_report(
            {"provider": "deepseek", "model": "deepseek-v4-flash",
             "api_calls": 1, "input_tokens": 10, "turn_exit_reason": "text_response(finish_reason=stop)"},
            counter,
        )
        self.assertEqual(report["finish_reason"], "stop")
        self.assertEqual(report["tavily_operations"], {"search": 1, "extract": 0})

    def test_report_never_contains_prompts_responses_headers_or_secrets(self):
        counter = TavilyCounter()
        report = build_usage_report(
            {"provider": "deepseek", "model": "deepseek-v4-flash",
             "turn_exit_reason": "text_response(finish_reason=stop)",
             # campos sensíveis que, mesmo se presentes no result, não devem vazar
             "api_key": "SECRET", "authorization": "Bearer SECRET", "prompt": "SECRET"},
            counter,
        )
        self.assertNotIn("api_key", report)
        self.assertNotIn("authorization", report)
        self.assertNotIn("prompt", report)
        self.assertNotIn("messages", report)


if __name__ == "__main__":
    unittest.main()
