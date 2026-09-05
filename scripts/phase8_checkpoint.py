#!/usr/bin/env python3
"""Cria snapshots SQLite consistentes para checkpoints da Fase 8.

O banco fonte nunca é aberto sem ``mode=ro``. Para um container ativo, o
gerador recebe seu programa por stdin, grava um snapshot novo em ``/tmp`` e
emite um marcador JSON somente depois de fechar e validar o destino. O host
transporta esse snapshot por ``docker exec cat`` para um arquivo temporário
exclusivo e só então o promove ao caminho final.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import secrets
import sqlite3
import stat
import subprocess
import sys
import tempfile
import time
from pathlib import Path


class CheckpointError(RuntimeError):
    """Falha sanitizada do procedimento de checkpoint."""


def _regular_readable(path: Path) -> os.stat_result:
    try:
        info = path.stat()
    except OSError as exc:
        raise CheckpointError("source_stat_failed") from exc
    if not stat.S_ISREG(info.st_mode) or info.st_size <= 0:
        raise CheckpointError("source_missing_or_empty")
    if not os.access(path, os.R_OK):
        raise CheckpointError("source_not_readable")
    return info


def _new_destination(path: Path) -> None:
    if path.exists():
        raise CheckpointError("destination_exists")
    if not path.parent.is_dir() or not os.access(path.parent, os.W_OK):
        raise CheckpointError("destination_not_writable")


def _validate_snapshot(path: Path, expected_version: int | None = 5) -> dict:
    try:
        info = path.stat()
    except OSError as exc:
        raise CheckpointError("snapshot_missing") from exc
    if not stat.S_ISREG(info.st_mode) or info.st_size <= 0:
        raise CheckpointError("snapshot_empty")
    if stat.S_IMODE(info.st_mode) != 0o600:
        raise CheckpointError("snapshot_mode_invalid")
    try:
        db = sqlite3.connect(f"file:{path}?mode=ro", uri=True)
        integrity = db.execute("PRAGMA integrity_check").fetchone()[0]
        foreign_keys = db.execute("PRAGMA foreign_key_check").fetchall()
        version = db.execute("PRAGMA user_version").fetchone()[0]
        result = {"integrity": integrity, "foreignKeyViolations": len(foreign_keys), "userVersion": version}
    except (OSError, sqlite3.Error) as exc:
        raise CheckpointError("snapshot_sqlite_open_failed") from exc
    finally:
        try:
            db.close()
        except UnboundLocalError:
            pass
    if integrity != "ok" or foreign_keys or expected_version is not None and version != expected_version:
        raise CheckpointError("snapshot_sqlite_validation_failed")
    return result


def _remove_sidecars(path: Path) -> None:
    for suffix in ("-wal", "-shm"):
        sidecar = Path(str(path) + suffix)
        if sidecar.exists():
            sidecar.unlink()


def _snapshot_sqlite(source: Path, destination: Path, deadline_seconds: float) -> dict:
    _regular_readable(source)
    _new_destination(destination)
    deadline = time.monotonic() + deadline_seconds
    old_umask = os.umask(0o077)
    db = target = None
    try:
        fd = os.open(destination, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        os.close(fd)
        db = sqlite3.connect(f"file:{source}?mode=ro", uri=True)
        target = sqlite3.connect(destination)

        def progress(_status: int, _remaining: int, _total: int) -> None:
            if time.monotonic() > deadline:
                raise CheckpointError("snapshot_timeout")

        db.backup(target, pages=64, progress=progress)
        target.commit()
        target.close()
        target = None
        db.close()
        db = None
        with destination.open("rb") as stream:
            os.fsync(stream.fileno())
        os.chmod(destination, 0o600)
        validation = _validate_snapshot(destination)
        _remove_sidecars(destination)
        digest = hashlib.sha256(destination.read_bytes()).hexdigest()
        return {"size": destination.stat().st_size, "sha256": digest, **validation}
    except CheckpointError:
        raise
    except (OSError, sqlite3.Error) as exc:
        raise CheckpointError("snapshot_generation_failed") from exc
    finally:
        if target is not None:
            target.close()
        if db is not None:
            db.close()
        os.umask(old_umask)


CONTAINER_PROGRAM = r'''
import hashlib, json, os, secrets, sqlite3, stat, sys, time
source = "/state/jobs.sqlite3"
token = secrets.token_hex(12)
destination = "/tmp/cv-phase8-checkpoint-" + token + ".sqlite3"
deadline = time.monotonic() + float(os.environ.get("CV_CHECKPOINT_DEADLINE", "30"))
try:
    source_info = os.stat(source)
    if not stat.S_ISREG(source_info.st_mode) or source_info.st_size <= 0 or not os.access(source, os.R_OK):
        raise RuntimeError("source_missing_or_unreadable")
    os.umask(0o077)
    fd = os.open(destination, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    os.close(fd)
    src = sqlite3.connect("file:" + source + "?mode=ro", uri=True)
    dst = sqlite3.connect(destination)
    def progress(_status, _remaining, _total):
        if time.monotonic() > deadline:
            raise RuntimeError("snapshot_timeout")
    src.backup(dst, pages=64, progress=progress)
    dst.commit(); dst.close(); src.close()
    with open(destination, "rb") as stream:
        os.fsync(stream.fileno())
    info = os.stat(destination)
    db = sqlite3.connect("file:" + destination + "?mode=ro", uri=True)
    integrity = db.execute("PRAGMA integrity_check").fetchone()[0]
    fks = db.execute("PRAGMA foreign_key_check").fetchall()
    version = db.execute("PRAGMA user_version").fetchone()[0]
    db.close()
    if info.st_size <= 0 or stat.S_IMODE(info.st_mode) != 0o600 or integrity != "ok" or fks or version != 5:
        raise RuntimeError("snapshot_validation_failed")
    digest = hashlib.sha256(open(destination, "rb").read()).hexdigest()
    print(json.dumps({"marker":"phase8_checkpoint_snapshot_v1", "path":destination,
                      "size":info.st_size, "mode":stat.S_IMODE(info.st_mode),
                      "sha256":digest, "integrity":integrity, "foreignKeyViolations":len(fks),
                      "userVersion":version}), flush=True)
except Exception as exc:
    print(json.dumps({"error":str(exc) if str(exc) in {"source_missing_or_unreadable", "snapshot_timeout", "snapshot_validation_failed"} else "snapshot_generation_failed"}), flush=True)
    try: os.unlink(destination)
    except OSError: pass
    raise
'''


def _run(command: list[str], *, input_data: str | None = None, timeout: float) -> subprocess.CompletedProcess:
    try:
        return subprocess.run(command, input=input_data, text=True, capture_output=True, timeout=timeout, check=False)
    except subprocess.TimeoutExpired as exc:
        raise CheckpointError("docker_command_timeout") from exc
    except OSError as exc:
        raise CheckpointError("docker_command_failed") from exc


def snapshot_container(container: str, destination: Path, timeout: float = 45.0) -> dict:
    _new_destination(destination)
    marker = _run(["docker", "exec", "-i", container, "/opt/hermes/.venv/bin/python", "-"], input_data=CONTAINER_PROGRAM, timeout=timeout)
    if marker.returncode != 0:
        raise CheckpointError("container_snapshot_generator_failed")
    try:
        payload = json.loads(marker.stdout.strip().splitlines()[-1])
    except (json.JSONDecodeError, IndexError) as exc:
        raise CheckpointError("container_snapshot_marker_invalid") from exc
    if payload.get("marker") != "phase8_checkpoint_snapshot_v1":
        raise CheckpointError(payload.get("error", "container_snapshot_failed"))
    source_path = payload.get("path")
    if not isinstance(source_path, str) or not source_path.startswith("/tmp/cv-phase8-checkpoint-"):
        raise CheckpointError("container_snapshot_path_invalid")
    try:
        info = _run(["docker", "exec", container, "stat", "-c", "%s %a", source_path], timeout=5)
        if info.returncode != 0 or info.stdout.strip() != f"{payload['size']} 600":
            raise CheckpointError("container_snapshot_stat_mismatch")
        parent = destination.parent
        with tempfile.NamedTemporaryFile(prefix=f".{destination.name}.", suffix=".part", dir=parent, delete=False) as stream:
            partial = Path(stream.name)
            os.chmod(partial, 0o600)
            copy = subprocess.run(["docker", "exec", container, "cat", source_path], stdout=stream, stderr=subprocess.PIPE, timeout=timeout, check=False)
            stream.flush(); os.fsync(stream.fileno())
        if copy.returncode != 0:
            raise CheckpointError("container_snapshot_copy_failed")
        os.chmod(partial, 0o600)
        if partial.stat().st_size != payload["size"]:
            raise CheckpointError("container_snapshot_size_mismatch")
        validation = _validate_snapshot(partial)
        digest = hashlib.sha256(partial.read_bytes()).hexdigest()
        if digest != payload.get("sha256"):
            raise CheckpointError("container_snapshot_checksum_mismatch")
        # SQLite pode criar -wal/-shm ao validar o arquivo temporário. A API
        # de backup já produziu um snapshot autossuficiente; não transportar
        # sidecars antigos nem deixá-los ao lado do destino final.
        sidecars = [Path(str(partial) + suffix) for suffix in ("-wal", "-shm")]
        for sidecar in sidecars:
            if sidecar.exists():
                sidecar.unlink()
        os.replace(partial, destination)
        return {"size": destination.stat().st_size, "sha256": digest, **validation}
    finally:
        if "partial" in locals():
            for candidate in (partial, Path(str(partial) + "-wal"), Path(str(partial) + "-shm")):
                if candidate.exists():
                    candidate.unlink()
        _run(["docker", "exec", container, "rm", "-f", source_path], timeout=5)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest="command", required=True)
    local = sub.add_parser("snapshot-local")
    local.add_argument("--source", type=Path, required=True)
    local.add_argument("--destination", type=Path, required=True)
    local.add_argument("--timeout", type=float, default=30.0)
    remote = sub.add_parser("snapshot-container")
    remote.add_argument("--container", required=True)
    remote.add_argument("--destination", type=Path, required=True)
    remote.add_argument("--timeout", type=float, default=45.0)
    args = parser.parse_args(argv)
    try:
        result = (_snapshot_sqlite(args.source, args.destination, args.timeout)
                  if args.command == "snapshot-local"
                  else snapshot_container(args.container, args.destination, args.timeout))
        print(json.dumps(result, sort_keys=True))
        return 0
    except CheckpointError as exc:
        print(f"phase8_checkpoint_failed:{exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
