import os
import sys
import unittest

RUNNER_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, RUNNER_DIR)
sys.path.insert(0, os.path.join(RUNNER_DIR, "hermes-instrumentation"))

from observability import (  # noqa: E402
    TavilyCounter,
    build_usage_report,
    sanitize_provider_finish_reason,
    sanitize_turn_exit_reason,
)


class TestProviderFinishReason(unittest.TestCase):
    def test_valid_values(self):
        for value in ("stop", "length", "content_filter", "tool_calls"):
            self.assertEqual(sanitize_provider_finish_reason(value), value)

    def test_absent_stays_null(self):
        self.assertIsNone(sanitize_provider_finish_reason(None))
        self.assertIsNone(sanitize_provider_finish_reason(""))
        self.assertIsNone(sanitize_provider_finish_reason("weird"))

    def test_never_infers_stop(self):
        self.assertIsNone(sanitize_provider_finish_reason(None))


class TestTurnExitReason(unittest.TestCase):
    def test_enumerates_known(self):
        self.assertEqual(sanitize_turn_exit_reason("text_response(finish_reason=stop)"), "text_response")
        self.assertEqual(sanitize_turn_exit_reason("max_iterations_reached(8/8)"), "max_iterations_reached")
        self.assertEqual(sanitize_turn_exit_reason("budget_exhausted"), "budget_exhausted")

    def test_unknown(self):
        self.assertEqual(sanitize_turn_exit_reason("bizarre_reason"), "unknown")

    def test_empty_none(self):
        self.assertIsNone(sanitize_turn_exit_reason(""))
        self.assertIsNone(sanitize_turn_exit_reason(None))


class TestTavilyCounter(unittest.TestCase):
    def test_attempted_succeeded_failed(self):
        counter = TavilyCounter()
        counter.attempt("search")
        counter.attempt("search")
        counter.success("search")
        counter.failure("search")
        counter.attempt("extract")
        counter.success("extract")
        self.assertEqual(counter.snapshot()["search"], {"attempted": 2, "succeeded": 1, "failed": 1})
        self.assertEqual(counter.snapshot()["extract"], {"attempted": 1, "succeeded": 1, "failed": 0})
        self.assertTrue(counter.invariant_holds())

    def test_invariant_broken_detected(self):
        counter = TavilyCounter()
        counter.attempt("search")  # sem resultado -> succeeded+failed (0) != attempted (1)
        self.assertFalse(counter.invariant_holds())

    def test_unknown_operation_ignored(self):
        counter = TavilyCounter()
        counter.attempt("crawl")
        self.assertEqual(counter.snapshot(), {
            "search": {"attempted": 0, "succeeded": 0, "failed": 0},
            "extract": {"attempted": 0, "succeeded": 0, "failed": 0},
        })


class TestUsageReport(unittest.TestCase):
    def test_provider_and_turn_finish_reasons_are_separate(self):
        counter = TavilyCounter()
        report = build_usage_report(
            {"provider": "deepseek", "model": "deepseek-v4-flash",
             "provider_finish_reason": "stop",
             "turn_exit_reason": "text_response(finish_reason=stop)"},
            counter,
        )
        self.assertEqual(report["provider_finish_reason"], "stop")
        self.assertEqual(report["hermes_turn_exit_reason"], "text_response")

    def test_turn_exit_reason_does_not_fill_provider_finish_reason(self):
        report = build_usage_report(
            {"provider": "deepseek", "model": "deepseek-v4-flash",
             "turn_exit_reason": "text_response(finish_reason=stop)"},
            TavilyCounter(),
        )
        self.assertIsNone(report["provider_finish_reason"])  # nunca deriva de turn_exit_reason
        self.assertEqual(report["hermes_turn_exit_reason"], "text_response")

    def test_deprecated_finish_reason_reflects_provider_only(self):
        report = build_usage_report(
            {"provider": "deepseek", "model": "deepseek-v4-flash",
             "provider_finish_reason": "length",
             "turn_exit_reason": "text_response(finish_reason=stop)"},
            TavilyCounter(),
        )
        self.assertEqual(report["finish_reason"], "length")  # deprecated = provider only

    def test_tavily_counts_exported(self):
        counter = TavilyCounter()
        counter.attempt("search")
        counter.success("search")
        report = build_usage_report({"provider": "deepseek", "model": "deepseek-v4-flash"}, counter)
        self.assertEqual(report["tavily_operations"]["search"], {"attempted": 1, "succeeded": 1, "failed": 0})

    def test_no_secrets(self):
        report = build_usage_report(
            {"provider": "deepseek", "model": "deepseek-v4-flash",
             "api_key": "SECRET", "authorization": "Bearer SECRET", "prompt": "SECRET"},
            TavilyCounter(),
        )
        for forbidden in ("api_key", "authorization", "prompt", "messages"):
            self.assertNotIn(forbidden, report)


if __name__ == "__main__":
    unittest.main()
