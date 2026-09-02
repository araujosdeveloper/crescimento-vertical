#!/usr/bin/env python3
"""Aplicação determinística do patch de observabilidade do Hermes 0.20.4.

Falha fechado quando a versão/build divergirem, quando os hashes dos
arquivos-alvo antes/depois não baterem, ou quando o patch já estiver
parcialmente aplicado. Grava um manifesto não secreto com os hashes.

Uso (dentro da imagem candidata, como usuário de build):
  python3 /app/instrumentation/apply-instrumentation.py
"""

from __future__ import annotations

import hashlib
import json
import os
import subprocess
import sys
from pathlib import Path

HERMES_ROOT = Path(os.environ.get("HERMES_ROOT", "/opt/hermes"))
PATCH_FILE = Path(os.environ.get("PATCH_FILE", "/app/instrumentation/hermes-0.20.4-observability.patch"))
MANIFEST_FILE = Path(os.environ.get("MANIFEST_FILE", "/app/instrumentation/manifest.json"))

EXPECTED_BUILD_SHA = "649c20629eedea5a26d34b01ec8f3e14e96e9249"
EXPECTED_VERSION = "0.20.4"
PATCH_ID = "hermes-0.20.4-observability-v1"
CONTRACT_VERSION = "1.0"

# Arquivos-alvo e seus hashes SHA-256 ANTES e DEPOIS do patch.
TARGETS = [
    {
        "path": "hermes_cli/oneshot.py",
        "before": "1938cf480986a0742a568c6419c3e1a12c3bdebaae3f55161c5d02b62f87c76b",
        "after": "38790d4afe37242fe3123e6ef0ab96efe872b4f16ff78e5172c94d30c031752c",
    },
    {
        "path": "plugins/web/tavily/provider.py",
        "before": "2ef90e4d6064e291d9882d3d9863c7c124c21666b44d617edba03dd92e37eb19",
        "after": "8b62315d9f8ba1b9ecf4cbbb9876ae37d90de134fa76bdd0c851a58d1b83ec39",
    },
    {
        "path": "agent/chat_completion_helpers.py",
        "before": "d9a5a7b6733ef50525df4861568c2b92e08ee879e17f6a2113e1037b5b7fdd7b",
        "after": "7ed8fe9551d644b3eb564e69a49fada83a365865786a015572420c21b0c5ff08",
    },
    {
        "path": "agent/turn_finalizer.py",
        "before": "8c6157b55abf936d6f413c3722c919e2a8a0f02439b3c99ba13f6b22063cab7f",
        "after": "649bae4c8f63d7b281eb10e23c047b0f9115b65dfacba892e0011d10e903807e",
    },
]


def _sha256(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def _fail(message: str) -> "None":
    print(f"instrumentation_patch_failed: {message}", file=sys.stderr)
    sys.exit(1)


def _verify_identity() -> None:
    build_sha_file = HERMES_ROOT / ".hermes_build_sha"
    if not build_sha_file.exists():
        _fail("build_sha_missing")
    build_sha = build_sha_file.read_text().strip()
    if build_sha != EXPECTED_BUILD_SHA:
        _fail(f"build_sha_mismatch:{build_sha}")

    pkg_info = HERMES_ROOT / "hermes_agent.egg-info" / "PKG-INFO"
    if not pkg_info.exists():
        _fail("pkg_info_missing")
    version = None
    for line in pkg_info.read_text(errors="replace").splitlines():
        if line.startswith("Version:"):
            version = line.split(":", 1)[1].strip()
            break
    if version != EXPECTED_VERSION:
        _fail(f"version_mismatch:{version}")


def _verify_before() -> None:
    for target in TARGETS:
        path = HERMES_ROOT / target["path"]
        if not path.exists():
            _fail(f"target_missing:{target['path']}")
        actual = _sha256(path)
        if actual != target["before"]:
            _fail(f"before_hash_mismatch:{target['path']}:{actual}")


def _apply_patch() -> None:
    result = subprocess.run(
        ["patch", "-p1", "--fuzz=0", "--silent"],
        cwd=str(HERMES_ROOT),
        stdin=open(PATCH_FILE, "rb"),
        capture_output=True,
    )
    if result.returncode != 0:
        _fail(f"patch_apply_failed:{result.stderr.decode(errors='replace')[:300]}")


def _verify_after() -> None:
    for target in TARGETS:
        path = HERMES_ROOT / target["path"]
        actual = _sha256(path)
        if actual != target["after"]:
            _fail(f"after_hash_mismatch:{target['path']}:{actual}")


def _write_manifest() -> None:
    manifest = {
        "patch_id": PATCH_ID,
        "hermes_version": EXPECTED_VERSION,
        "hermes_build_sha": EXPECTED_BUILD_SHA,
        "observability_contract_version": CONTRACT_VERSION,
        "files": TARGETS,
    }
    MANIFEST_FILE.write_text(json.dumps(manifest, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def main() -> int:
    _verify_identity()
    _verify_before()
    _apply_patch()
    _verify_after()
    _write_manifest()
    print("instrumentation_patch_ok")
    return 0


if __name__ == "__main__":
    sys.exit(main())
