import os
import sys
import tempfile
import unittest
from unittest import mock

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import config
import hermline


def _request():
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


class TestExecutionGates(unittest.TestCase):
    def setUp(self):
        self._orig_flag = os.environ.get("RUNNER_EXECUTION_ENABLED")
        self._orig_openai_key = os.environ.get("OPENAI_API_KEY")
        self._orig_credential_file = config.DEEPSEEK_API_KEY_FILE
        self._enable_file = tempfile.NamedTemporaryFile(delete=False)
        self._enable_file.close()
        os.environ["EXECUTION_ENABLE_FILE"] = self._enable_file.name

    def tearDown(self):
        if self._orig_flag is None:
            os.environ.pop("RUNNER_EXECUTION_ENABLED", None)
        else:
            os.environ["RUNNER_EXECUTION_ENABLED"] = self._orig_flag
        if self._orig_openai_key is None:
            os.environ.pop("OPENAI_API_KEY", None)
        else:
            os.environ["OPENAI_API_KEY"] = self._orig_openai_key
        if os.path.exists(self._enable_file.name):
            os.unlink(self._enable_file.name)
        config.DEEPSEEK_API_KEY_FILE = self._orig_credential_file

    def test_disabled_when_flag_false(self):
        os.environ["RUNNER_EXECUTION_ENABLED"] = "false"
        self.assertFalse(config.execution_enabled())

    def test_disabled_when_enable_file_absent(self):
        os.environ["RUNNER_EXECUTION_ENABLED"] = "true"
        os.unlink(self._enable_file.name)  # arquivo ausente
        self.assertFalse(config.execution_enabled())

    def test_enabled_only_when_both_present(self):
        os.environ["RUNNER_EXECUTION_ENABLED"] = "true"
        self.assertTrue(config.execution_enabled())

    def test_run_hermes_blocked_when_disabled(self):
        os.environ["RUNNER_EXECUTION_ENABLED"] = "false"
        with self.assertRaises(hermline.ExecutionDisabledError):
            hermline.run_hermes(_request())

    def test_missing_exclusive_credential_fails_closed_before_subprocess(self):
        os.environ["RUNNER_EXECUTION_ENABLED"] = "true"
        config.DEEPSEEK_API_KEY_FILE = "/definitely/missing/deepseek-api-key"
        with mock.patch("hermline.subprocess.run") as run:
            with self.assertRaisesRegex(RuntimeError, "deepseek_credential_unavailable"):
                hermline.run_hermes(_request())
        run.assert_not_called()

    def test_exclusive_credential_is_scoped_to_child_process(self):
        os.environ["RUNNER_EXECUTION_ENABLED"] = "true"
        os.environ["OPENAI_API_KEY"] = "must-not-reach-child"
        with tempfile.NamedTemporaryFile(mode="w", delete=False) as credential:
            credential.write("exclusive-test-key")
            credential_path = credential.name
        config.DEEPSEEK_API_KEY_FILE = credential_path
        completed = mock.Mock(returncode=1, stdout="", stderr="provider error")
        try:
            with mock.patch("hermline.subprocess.run", return_value=completed) as run:
                with self.assertRaisesRegex(RuntimeError, "hermes_nonzero_exit"):
                    hermline.run_hermes(_request())
            child_env = run.call_args.kwargs["env"]
            self.assertEqual(child_env["DEEPSEEK_API_KEY"], "exclusive-test-key")
            self.assertEqual(child_env["HERMES_INFERENCE_PROVIDER"], "deepseek")
            self.assertEqual(child_env["HERMES_INFERENCE_MODEL"], "deepseek-v4-flash")
            self.assertNotIn("OPENAI_API_KEY", child_env)
            self.assertNotIn("DEEPSEEK_API_KEY", os.environ)
        finally:
            os.unlink(credential_path)

    def test_subprocess_timeout_maps_to_runner_timeout(self):
        os.environ["RUNNER_EXECUTION_ENABLED"] = "true"
        with tempfile.NamedTemporaryFile(mode="w", delete=False) as credential:
            credential.write("exclusive-test-key")
            credential_path = credential.name
        config.DEEPSEEK_API_KEY_FILE = credential_path
        try:
            with mock.patch(
                "hermline.subprocess.run",
                side_effect=hermline.subprocess.TimeoutExpired("hermes", 900),
            ):
                with self.assertRaisesRegex(TimeoutError, "timeout"):
                    hermline.run_hermes(_request())
        finally:
            os.unlink(credential_path)


class TestCommandBuild(unittest.TestCase):
    def test_no_shell_and_no_user_arg_injection(self):
        req = _request()
        req["topic"] = "a; rm -rf / ; echo"
        cmd = hermline.build_hermes_command(req)
        # sempre lista, nunca string (shell=False)
        self.assertIsInstance(cmd, list)
        # o prompt é um único argumento, não interpretado pelo shell
        self.assertEqual(cmd[0], config.HERMES_BIN)
        self.assertIn("-z", cmd)
        self.assertEqual(cmd[cmd.index("--provider") + 1], "deepseek")
        self.assertEqual(cmd[cmd.index("--model") + 1], "deepseek-v4-flash")
        self.assertEqual(cmd[cmd.index("--reasoning") + 1], "high")
        prompt = cmd[cmd.index("-z") + 1]
        self.assertIn("a; rm -rf / ; echo", prompt)  # passado como dado


if __name__ == "__main__":
    unittest.main()
