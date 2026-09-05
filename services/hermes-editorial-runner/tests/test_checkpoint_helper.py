import importlib.util
import os
import sqlite3
import tempfile
import unittest
from pathlib import Path
from unittest import mock


ROOT = Path(__file__).resolve().parents[3]
SPEC = importlib.util.spec_from_file_location("phase8_checkpoint", ROOT / "scripts/phase8_checkpoint.py")
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


def make_db(path: Path, *, wal: bool = False) -> sqlite3.Connection:
    db = sqlite3.connect(path)
    db.execute("PRAGMA user_version=5")
    db.execute("CREATE TABLE IF NOT EXISTS items (id INTEGER PRIMARY KEY, value TEXT NOT NULL)")
    if wal:
        db.execute("PRAGMA journal_mode=WAL")
    db.execute("INSERT INTO items(value) VALUES ('fixture')")
    db.commit()
    return db


class CheckpointHelperTests(unittest.TestCase):
    def test_valid_snapshot_and_wal_data(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            source = root / "source.sqlite3"
            db = make_db(source, wal=True)
            db.execute("INSERT INTO items(value) VALUES ('uncheckpointed')")
            db.commit()
            destination = root / "snapshot.sqlite3"
            result = MODULE._snapshot_sqlite(source, destination, 5)
            self.assertEqual(result["integrity"], "ok")
            self.assertEqual(sqlite3.connect(destination).execute("SELECT count(*) FROM items").fetchone()[0], 2)
            db.close()

    def test_source_missing_does_not_create_it(self):
        with tempfile.TemporaryDirectory() as tmp:
            source = Path(tmp) / "missing.sqlite3"
            with self.assertRaisesRegex(MODULE.CheckpointError, "source_stat_failed"):
                MODULE._snapshot_sqlite(source, Path(tmp) / "out.sqlite3", 1)
            self.assertFalse(source.exists())

    def test_empty_source_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            source = Path(tmp) / "empty.sqlite3"
            source.touch()
            with self.assertRaisesRegex(MODULE.CheckpointError, "source_missing_or_empty"):
                MODULE._snapshot_sqlite(source, Path(tmp) / "out.sqlite3", 1)

    def test_existing_destination_is_never_overwritten(self):
        with tempfile.TemporaryDirectory() as tmp:
            source = Path(tmp) / "source.sqlite3"
            make_db(source).close()
            destination = Path(tmp) / "out.sqlite3"
            destination.write_bytes(b"sentinel")
            with self.assertRaisesRegex(MODULE.CheckpointError, "destination_exists"):
                MODULE._snapshot_sqlite(source, destination, 1)
            self.assertEqual(destination.read_bytes(), b"sentinel")

    def test_spaces_in_paths(self):
        with tempfile.TemporaryDirectory(prefix="checkpoint spaces ") as tmp:
            root = Path(tmp)
            source = root / "source file.sqlite3"
            make_db(source).close()
            result = MODULE._snapshot_sqlite(source, root / "destination file.sqlite3", 1)
            self.assertEqual(result["userVersion"], 5)

    def test_corrupt_source_fails_closed(self):
        with tempfile.TemporaryDirectory() as tmp:
            source = Path(tmp) / "source.sqlite3"
            source.write_bytes(b"not sqlite")
            with self.assertRaisesRegex(MODULE.CheckpointError, "snapshot_generation_failed"):
                MODULE._snapshot_sqlite(source, Path(tmp) / "out.sqlite3", 1)

    def test_validation_rejects_empty_snapshot(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "empty.sqlite3"
            path.touch(mode=0o600)
            with self.assertRaisesRegex(MODULE.CheckpointError, "snapshot_empty"):
                MODULE._validate_snapshot(path)

    def test_container_generator_receives_stdin_and_propagates_failure(self):
        with tempfile.TemporaryDirectory() as tmp:
            destination = Path(tmp) / "snapshot.sqlite3"
            completed = mock.Mock(returncode=1, stdout='{"error":"snapshot_timeout"}\n')
            with mock.patch.object(MODULE, "_run", return_value=completed) as run:
                with self.assertRaisesRegex(MODULE.CheckpointError, "container_snapshot_generator_failed"):
                    MODULE.snapshot_container("runner", destination)
                self.assertTrue(any("python" in item for item in run.call_args.args[0]))
                self.assertTrue(run.call_args.kwargs["input_data"])

    def test_checksum_mismatch_is_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            source = root / "source.sqlite3"
            make_db(source).close()
            destination = root / "destination.sqlite3"
            marker = {"marker": "phase8_checkpoint_snapshot_v1", "path": "/tmp/cv-phase8-checkpoint-a.sqlite3", "size": 10, "sha256": "0" * 64}
            responses = [mock.Mock(returncode=0, stdout=json_line(marker)), mock.Mock(returncode=0, stdout="10 600\n")]
            def run_side_effect(*args, **kwargs):
                return responses.pop(0) if responses else mock.Mock(returncode=0, stdout="", stderr=b"")
            with mock.patch.object(MODULE, "_run", side_effect=run_side_effect), mock.patch("subprocess.run") as copy:
                copy.return_value = mock.Mock(returncode=0, stderr=b"")
                with self.assertRaises(MODULE.CheckpointError):
                    MODULE.snapshot_container("runner", destination)

    def test_local_snapshot_has_no_wal_sidecars(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            source = root / "source.sqlite3"
            db = make_db(source, wal=True)
            db.execute("INSERT INTO items(value) VALUES ('second')")
            db.commit()
            destination = root / "destination.sqlite3"
            MODULE._snapshot_sqlite(source, destination, 1)
            self.assertFalse(Path(str(destination) + "-wal").exists())
            self.assertFalse(Path(str(destination) + "-shm").exists())
            db.close()

    def test_timeout_is_explicit(self):
        with tempfile.TemporaryDirectory() as tmp:
            source = Path(tmp) / "source.sqlite3"
            make_db(source).close()
            with mock.patch.object(MODULE.time, "monotonic", side_effect=[0, 2]):
                with self.assertRaisesRegex(MODULE.CheckpointError, "snapshot_timeout"):
                    MODULE._snapshot_sqlite(source, Path(tmp) / "out.sqlite3", 1)


def json_line(value):
    import json
    return json.dumps(value) + "\n"
