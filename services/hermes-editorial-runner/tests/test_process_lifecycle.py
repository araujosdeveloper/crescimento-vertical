import os
import signal
import subprocess
import sys
import threading
import time
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import hermline


class TestProcessLifecycle(unittest.TestCase):
    def spawn(self, script):
        return subprocess.Popen(
            [sys.executable, "-c", script],
            stdin=subprocess.DEVNULL,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            start_new_session=True,
        )

    def reap(self, proc):
        try:
            hermline._terminate_group(proc)
        except (ProcessLookupError, hermline.ProcessLifecycleError):
            pass
        for stream in (proc.stdout, proc.stderr):
            if stream:
                stream.close()
        try:
            proc.wait(timeout=2)
        except subprocess.TimeoutExpired:
            self.fail("synthetic process remained alive")

    def test_normal_completion_has_no_group_members(self):
        proc = self.spawn("print('ok', flush=True)")
        proc.wait(timeout=2)
        self.assertFalse(hermline._group_exists(proc.pid))
        proc.stdout.close()
        proc.stderr.close()

    def test_term_is_sufficient_for_cooperative_process(self):
        proc = self.spawn("import time; time.sleep(30)")
        try:
            hermline._terminate_group(proc)
            self.assertIsNotNone(proc.returncode)
            self.assertEqual(-signal.SIGTERM, proc.returncode)
            self.assertFalse(hermline._group_exists(proc.pid))
        finally:
            self.reap(proc)

    def test_term_ignored_requires_kill(self):
        proc = self.spawn("import signal, time; signal.signal(signal.SIGTERM, signal.SIG_IGN); time.sleep(0.3); time.sleep(30)")
        try:
            time.sleep(0.1)
            hermline._terminate_group(proc)
            self.assertIsNotNone(proc.returncode)
            self.assertFalse(hermline._group_exists(proc.pid))
        finally:
            self.reap(proc)

    def test_leader_exit_does_not_hide_child_and_grandchild(self):
        script = (
            "import subprocess,sys,time; "
            "subprocess.Popen([sys.executable,'-c','import time; time.sleep(30)']); "
            "time.sleep(0.2)"
        )
        proc = self.spawn(script)
        proc.wait(timeout=2)
        try:
            self.assertTrue(hermline._group_exists(proc.pid))
            with self.assertRaisesRegex(hermline.ProcessLifecycleError, "hermes_process_group_not_empty"):
                hermline._terminate_group(proc)
            self.assertIsNotNone(proc.returncode)
        finally:
            self.reap(proc)

    def test_bounded_reader_drains_concurrent_excess_output(self):
        proc = self.spawn("import sys,time; sys.stdout.write('x'*1000000); sys.stdout.flush(); time.sleep(30)")
        done = threading.Event()
        sink = bytearray()
        reader = threading.Thread(
            target=hermline._bounded_pipe_reader,
            args=(proc.stdout, sink, 1024, done),
            daemon=True,
        )
        reader.start()
        try:
            time.sleep(0.1)
            hermline._terminate_group(proc)
            proc.stderr.close()
            proc.stdout.close()
            self.assertTrue(done.wait(2))
            self.assertEqual(len(sink), 1024)
        finally:
            self.reap(proc)

    def test_process_outside_group_survives_job_cleanup(self):
        outside = subprocess.Popen([sys.executable, "-c", "import time; time.sleep(30)"])
        job = self.spawn("import time; time.sleep(30)")
        try:
            hermline._terminate_group(job)
            self.assertIsNone(outside.poll())
        finally:
            outside.terminate()
            outside.wait(timeout=2)
            self.reap(job)


if __name__ == "__main__":
    unittest.main()
