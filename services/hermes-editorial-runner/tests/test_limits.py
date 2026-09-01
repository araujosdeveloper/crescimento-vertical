import os
import sys
import unittest
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import config
import hermline


class TestCandidateLimits(unittest.TestCase):
    def test_exact_candidate_limits(self):
        self.assertEqual(config.HERMES_PROVIDER, "deepseek")
        self.assertEqual(config.HERMES_MODEL, "deepseek-v4-flash")
        self.assertEqual(config.HERMES_REASONING, "none")
        self.assertEqual(config.MAX_CONCURRENT_JOBS, 1)
        self.assertEqual(config.MAX_BATCH_JOBS, 4)
        self.assertEqual(config.MAX_TURNS, 8)
        self.assertEqual(config.MAX_WEB_SEARCHES, 3)
        self.assertEqual(config.MAX_FINAL_SOURCES, 4)
        self.assertEqual(config.JOB_TIMEOUT_SECONDS, 300)
        self.assertEqual(config.MODEL_MAX_TOKENS, 4096)
        self.assertEqual(config.OUTPUT_MAX_BYTES, 256 * 1024)
        self.assertEqual(config.PROVIDER_MAX_RETRIES, 1)
        self.assertEqual(config.STREAM_RETRIES, 0)
        self.assertEqual(config.BATTERY_BUDGET_USD, 2.0)

    def test_limit_validator_accepts_candidate(self):
        config.validate_limits()

    def test_stdout_limit_rejects_oversize(self):
        with self.assertRaisesRegex(RuntimeError, "output_too_large"):
            hermline.bounded_stdout("x" * (config.OUTPUT_MAX_BYTES + 1))

    def test_profile_has_no_fallback_and_minimal_thinking(self):
        profile = Path(__file__).parents[3] / "hermes/crescimento-vertical-editorial/config.yaml"
        text = profile.read_text(encoding="utf-8")
        self.assertIn("fallback_providers: []", text)
        self.assertIn("reasoning_effort: none", text)
        self.assertIn("max_tokens: 4096", text)
        self.assertIn("api_max_retries: 1", text)

    def test_compose_declares_hardened_opt_data_tmpfs(self):
        compose = Path(__file__).parents[3] / "docker-compose.hermes-editorial.yml"
        text = compose.read_text(encoding="utf-8")
        self.assertIn(
            "/opt/data:rw,nosuid,nodev,noexec,size=16m,mode=0700,uid=10000,gid=10000",
            text,
        )
        self.assertNotRegex(text, r"source:\s*[^\n]+\n\s+target:\s*/opt/data")
        self.assertIn("RUNNER_EXECUTION_ENABLED: \"false\"", text)
        self.assertIn("- runner-state:/state", text)

    def test_runner_image_remains_non_root_and_state_is_private(self):
        dockerfile = Path(__file__).parents[1] / "Dockerfile"
        text = dockerfile.read_text(encoding="utf-8")
        self.assertIn("install -d -o 10000 -g 10000 -m 0700 /state", text)
        self.assertIn("USER hermes", text)

    def test_runner_uses_ephemeral_logging_wrapper_without_changing_profile(self):
        compose = Path(__file__).parents[3] / "docker-compose.hermes-editorial.yml"
        dockerfile = Path(__file__).parents[1] / "Dockerfile"
        wrapper = Path(__file__).parents[1] / "hermes_wrapper.py"
        self.assertIn("HERMES_BIN: /app/hermes_wrapper.py", compose.read_text(encoding="utf-8"))
        self.assertIn("hermes_wrapper.py", dockerfile.read_text(encoding="utf-8"))
        wrapper_text = wrapper.read_text(encoding="utf-8")
        self.assertIn('kwargs["hermes_home"] = Path("/opt/data")', wrapper_text)
        self.assertIn('kwargs["max_size_mb"] = 1', wrapper_text)
        self.assertIn('kwargs["backup_count"] = 1', wrapper_text)
        self.assertIn("os.umask(0o077)", wrapper_text)


if __name__ == "__main__":
    unittest.main()
