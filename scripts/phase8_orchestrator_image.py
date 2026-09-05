#!/usr/bin/env python3
"""Resolve e valida offline a imagem exata do runner da Fase 8."""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
from pathlib import Path

SERVICE = "cv-hermes-editorial-runner"
CONTAINER = "cv-hermes-editorial-runner"
IMAGE_RE = re.compile(r"^[a-zA-Z0-9][a-zA-Z0-9._/:@-]{0,511}$")
ID_RE = re.compile(r"^sha256:[0-9a-f]{64}$")
UNRESOLVED_RE = re.compile(r"\$\{[^}]+\}")
CAPABILITY_MARKER = "phase8-runner-capabilities-v1"


class ResolutionError(RuntimeError):
    pass


def _run(command: list[str], runner=subprocess.run) -> str:
    result = runner(command, text=True, capture_output=True, check=False)
    if result.returncode != 0:
        raise ResolutionError("image_resolution_command_failed")
    return result.stdout.strip()


def _strict_object(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ResolutionError("compose_duplicate_key")
        result[key] = value
    return result


def parse_compose_image(raw: str, service: str = SERVICE) -> str:
    if UNRESOLVED_RE.search(raw):
        raise ResolutionError("compose_unresolved_interpolation")
    try:
        document = json.loads(raw, object_pairs_hook=_strict_object)
    except ResolutionError:
        raise
    except (TypeError, json.JSONDecodeError) as exc:
        raise ResolutionError("compose_invalid_json") from exc
    services = document.get("services")
    if not isinstance(services, dict) or service not in services:
        raise ResolutionError("runner_service_missing")
    runner_service = services[service]
    if not isinstance(runner_service, dict):
        raise ResolutionError("runner_service_invalid")
    image = runner_service.get("image")
    if not isinstance(image, str) or not image.strip():
        raise ResolutionError("runner_image_empty")
    image = image.strip()
    if not IMAGE_RE.fullmatch(image):
        raise ResolutionError("runner_image_unsafe")
    tail = image.rsplit("/", 1)[-1]
    if "@" not in image and (":" not in tail or tail.rsplit(":", 1)[1] == "latest"):
        raise ResolutionError("runner_image_not_immutable_tag")
    return image


def _image_id(reference: str, runner=subprocess.run) -> str:
    value = _run(["docker", "image", "inspect", reference, "--format", "{{.Id}}"], runner)
    if not ID_RE.fullmatch(value):
        raise ResolutionError("local_image_missing_or_invalid")
    return value


def _repo_digest(reference: str, image_id: str, runner=subprocess.run) -> str:
    raw = _run(["docker", "image", "inspect", reference, "--format", "{{json .RepoDigests}}"], runner)
    try:
        digests = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise ResolutionError("image_repo_digest_invalid") from exc
    matches = [value for value in digests if isinstance(value, str) and value.endswith("@" + image_id)]
    if len(matches) != 1 or not IMAGE_RE.fullmatch(matches[0]):
        raise ResolutionError("image_repo_digest_missing")
    return matches[0]


def _container_state(runner=subprocess.run) -> dict:
    raw = _run(["docker", "inspect", CONTAINER], runner)
    try:
        values = json.loads(raw)
        value = values[0]
    except (json.JSONDecodeError, IndexError, KeyError, TypeError) as exc:
        raise ResolutionError("runner_container_inspect_invalid") from exc
    reference = value.get("Config", {}).get("Image")
    image_id = value.get("Image")
    if not isinstance(reference, str) or not reference.strip():
        raise ResolutionError("runner_container_image_reference_missing")
    if not isinstance(image_id, str) or not ID_RE.fullmatch(image_id):
        raise ResolutionError("runner_container_image_id_invalid")
    return {
        "reference": reference.strip(),
        "image_id": image_id,
        "running": value.get("State", {}).get("Running"),
        "health": value.get("State", {}).get("Health", {}).get("Status"),
    }


def _probe_contract(pinned_reference: str, runner=subprocess.run) -> None:
    probe = (
        "import json, pathlib; from state import JobStore; import config, provider_adapter; "
        "schema=json.loads(pathlib.Path('/app/schemas/editorial-research-request.v1.schema.json').read_text()); "
        "payload=provider_adapter.build_deepseek_payload('deepseek-v4-flash',[],4096,'none'); "
        "assert JobStore.SCHEMA_VERSION==6; assert pathlib.Path('/app/controlled_battery.py').is_file(); "
        "assert pathlib.Path('/app/evidence.py').is_file(); assert schema['properties']['retryNumber']['const']==2; "
        "assert 'rootJobId' in schema['properties']; assert config.MAX_RETRY_CHAIN==2; "
        "assert payload['extra_body']['thinking']['type']=='disabled'; "
        f"print('{CAPABILITY_MARKER}')"
    )
    marker = _run([
        "docker", "run", "--rm", "--network", "none", "--read-only",
        "--cap-drop", "ALL", "--security-opt", "no-new-privileges:true",
        "--entrypoint", "/opt/hermes/.venv/bin/python", pinned_reference, "-c", probe,
    ], runner)
    if marker != CAPABILITY_MARKER:
        raise ResolutionError("image_capability_contract_missing")


def resolve(compose_command: list[str], output: Path, runner=subprocess.run) -> tuple[str, str, str]:
    raw = _run(compose_command + ["config", "--format", "json"], runner)
    reference = parse_compose_image(raw)
    compose_image_id = _image_id(reference, runner)
    state = _container_state(runner)
    container_image_id = _image_id(state["reference"], runner)
    if (
        compose_image_id != container_image_id
        or compose_image_id != state["image_id"]
        or container_image_id != state["image_id"]
        or not state["running"]
        or state["health"] != "healthy"
    ):
        raise ResolutionError("compose_container_image_mismatch")
    pinned = _repo_digest(reference, compose_image_id, runner)
    _probe_contract(pinned, runner)
    output.write_text(reference + "\n" + compose_image_id + "\n" + pinned + "\n", encoding="utf-8")
    os.chmod(output, 0o600)
    return reference, compose_image_id, pinned


def recheck(reference: str, image_id: str, runner=subprocess.run) -> None:
    if _image_id(reference, runner) != image_id:
        raise ResolutionError("image_id_changed")
    state = _container_state(runner)
    container_image_id = _image_id(state["reference"], runner)
    if (
        container_image_id != image_id
        or state["image_id"] != image_id
        or not state["running"]
        or state["health"] != "healthy"
    ):
        raise ResolutionError("runner_state_changed")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("mode", choices=("resolve", "recheck"))
    parser.add_argument("--output", type=Path)
    parser.add_argument("--reference")
    parser.add_argument("--image-id")
    args, compose = parser.parse_known_args()
    try:
        if args.mode == "resolve":
            if args.output is None or not compose:
                raise ResolutionError("resolution_arguments_invalid")
            compose = compose[1:] if compose[0] == "--" else compose
            if not compose:
                raise ResolutionError("resolution_arguments_invalid")
            resolve(compose, args.output)
        else:
            if not args.reference or not args.image_id:
                raise ResolutionError("recheck_arguments_invalid")
            recheck(args.reference, args.image_id)
        return 0
    except (OSError, ResolutionError) as exc:
        print(f"phase8_image_validation_failed:{exc}", file=sys.stderr)
        return 26


if __name__ == "__main__":
    raise SystemExit(main())
