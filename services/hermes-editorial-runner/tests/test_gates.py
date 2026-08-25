import os
import sys
import tempfile
import unittest

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
        self._enable_file = tempfile.NamedTemporaryFile(delete=False)
        self._enable_file.close()
        os.environ["EXECUTION_ENABLE_FILE"] = self._enable_file.name

    def tearDown(self):
        if self._orig_flag is None:
            os.environ.pop("RUNNER_EXECUTION_ENABLED", None)
        else:
            os.environ["RUNNER_EXECUTION_ENABLED"] = self._orig_flag
        if os.path.exists(self._enable_file.name):
            os.unlink(self._enable_file.name)

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
        prompt = cmd[cmd.index("-z") + 1]
        self.assertIn("a; rm -rf / ; echo", prompt)  # passado como dado


if __name__ == "__main__":
    unittest.main()
