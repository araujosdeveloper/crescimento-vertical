"""Persistência sanitizada de falhas finais do dossier.

Este módulo nunca escreve logs, headers, cookies, prompts ou credenciais. A
evidência é limitada, escrita atomicamente e só é chamada para o resultado
final inválido.
"""

from __future__ import annotations

import json
import os
import re
import tempfile
import time
from pathlib import Path

import config

EVIDENCE_MAX_BYTES = 256 * 1024
_CANDIDATE_MAX_BYTES = 192 * 1024
_JOB_RE = re.compile(r"^[A-Za-z0-9_-]{1,64}$")
_SECRET_RE = re.compile(
    r"(?i)(authorization\s*:\s*bearer\s+|cookie\s*:\s*|set-cookie\s*:\s*|"
    r"(?:api[_-]?key|token|password|secret)\s*[:=]\s*)[^\s,;]+"
)
_JSON_SECRET_RE = re.compile(r'(?i)((?:api[_-]?key|token|password|secret)\s*["\']?\s*:\s*["\'])[^"\']*(["\'])')


class HermesRunError(RuntimeError):
    """Falha terminal da execução do Hermes com contexto sanitizado.

    Carrega o que estiver disponível para que o runner persista usage,
    evidência e contabilização em qualquer estado terminal, sem revelar
    prompts, respostas integrais, headers, cookies ou segredos.
    """

    def __init__(self, error_code: str, *, output: str | None = None,
                 errors: list | None = None, metadata: dict | None = None,
                 usage: dict | None = None):
        super().__init__(error_code)
        self.error_code = error_code
        self.output = output
        self.errors = errors or []
        self.metadata = metadata or {}
        self.usage = usage


class DossierValidationError(HermesRunError):
    def __init__(self, output: str, errors: list[dict], metadata: dict, usage: dict | None, error_code: str = "invalid_dossier_schema"):
        super().__init__(error_code, output=output, errors=errors, metadata=metadata, usage=usage)


class OutputLimitError(RuntimeError):
    def __init__(self, output: str):
        super().__init__("output_too_large")
        self.output = output


def sanitize_usage(raw: dict | None) -> dict | None:
    """Whitelist operational fields; discard provider payloads and messages."""
    if not isinstance(raw, dict):
        return None
    allowed = {
        "provider", "model", "api_calls", "input_tokens", "output_tokens",
        "completion_tokens", "prompt_tokens", "total_tokens", "cache_read_tokens",
        "cache_write_tokens", "reasoning_tokens", "max_output_tokens", "max_tokens",
        "finish_reason", "finishReason", "final_finish_reason", "tavily_operations",
    }
    result = {key: raw[key] for key in allowed if key in raw}
    calls = raw.get("calls")
    if isinstance(calls, list):
        result["calls"] = [
            {key: item[key] for key in ("finish_reason", "finishReason") if key in item}
            for item in calls if isinstance(item, dict)
        ]
    payload = raw.get("provider_payload")
    if isinstance(payload, dict):
        result["provider_payload"] = {
            key: payload[key] for key in (
                "reasoning_requested", "effective_reasoning_field",
                "effective_reasoning_value", "extra_body_thinking_present",
                "max_tokens", "fallback_disabled",
            ) if key in payload
        }
    operations = result.get("tavily_operations")
    if isinstance(operations, dict):
        sanitized_ops = {}
        for op, value in operations.items():
            if op not in {"search", "extract", "crawl", "research"}:
                continue
            if isinstance(value, int) and value >= 0:
                # Contrato de observabilidade v1: contadores exatos.
                sanitized_ops[op] = value
            elif isinstance(value, list):
                # Forma legada: lista de operações com status.
                sanitized_ops[op] = [
                    {"status": item.get("status")}
                    for item in value if isinstance(item, dict) and item.get("status") in {"succeeded", "failed"}
                ]
        result["tavily_operations"] = sanitized_ops
    return result


def finish_reason(usage: dict | None) -> str | None:
    usage = usage or {}
    value = usage.get("finish_reason") or usage.get("finishReason") or usage.get("final_finish_reason")
    calls = usage.get("calls")
    if not value and isinstance(calls, list) and calls and isinstance(calls[-1], dict):
        value = calls[-1].get("finish_reason") or calls[-1].get("finishReason")
    return value if value in {"stop", "length", "content_filter", "tool_calls"} else None


def _json_pointer(path) -> str:
    pointer = ""
    for item in path:
        value = str(item).replace("~", "~0").replace("/", "~1")
        pointer += "/" + value
    return pointer or ""


def validation_error_record(error) -> dict:
    schema = error.schema if isinstance(error.schema, dict) else {}
    record = {
        "json_pointer": _json_pointer(error.absolute_path),
        "keyword": str(error.validator),
        "expected_type": schema.get("type"),
        "received_type": type(error.instance).__name__,
    }
    if error.validator == "required":
        match = re.search(r"'([^']+)'", error.message)
        record["missing_field"] = match.group(1) if match else "unknown"
    elif error.validator == "additionalProperties":
        match = re.search(r"'([^']+)'", error.message)
        record["additional_field"] = match.group(1) if match else "unknown"
    elif error.validator == "enum":
        record["allowed_enum"] = error.validator_value
    elif error.validator in {"minLength", "maxLength", "minimum", "maximum", "minItems", "maxItems"}:
        record["expected_limit"] = error.validator_value
        if isinstance(error.instance, (str, list, dict)):
            record["received_quantity"] = len(error.instance)
    return record


def output_metadata(raw: str, usage: dict | None, *, parse_success: bool, normalized: bool = False) -> dict:
    bom = raw.startswith("\ufeff")
    stripped = raw.lstrip("\ufeff").strip()
    fence = stripped.startswith("```")
    text_extra = False
    object_count = 0
    if parse_success:
        try:
            decoder = json.JSONDecoder()
            _, end = decoder.raw_decode(stripped)
            text_extra = bool(stripped[end:].strip())
        except (ValueError, TypeError):
            pass
    try:
        parsed = json.loads(stripped)
        object_count = len(parsed) if isinstance(parsed, list) else (1 if isinstance(parsed, dict) else 0)
    except (ValueError, TypeError):
        pass
    usage = usage or {}
    provider_payload = usage.get("provider_payload") if isinstance(usage.get("provider_payload"), dict) else {}
    calls = usage.get("calls") if isinstance(usage.get("calls"), list) else []
    finish = finish_reason(usage)
    output_tokens = usage.get("output_tokens", usage.get("completion_tokens"))
    reasoning_tokens = usage.get("reasoning_tokens")
    return {
        "provider": usage.get("provider", config.HERMES_PROVIDER),
        "model": usage.get("model", config.HERMES_MODEL),
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "size_bytes": len(raw.encode("utf-8", errors="replace")),
        "encoding": "utf-8",
        "json_parse_success": parse_success,
        "bom_detected": bom,
        "code_fence_detected": fence,
        "text_additional_detected": text_extra,
        "json_object_count": object_count,
        "normalization_applied": normalized,
        "finish_reason": finish,
        "provider_finish_reason_missing": finish is None,
        "reasoning_requested": provider_payload.get("reasoning_requested", config.HERMES_REASONING),
        "effective_reasoning_field": provider_payload.get("effective_reasoning_field", "extra_body.thinking"),
        "effective_reasoning_value": provider_payload.get("effective_reasoning_value", "disabled"),
        "extra_body_thinking_present": bool(provider_payload.get("extra_body_thinking_present", True)),
        "fallback_disabled": True,
        "max_output_tokens": usage.get("max_output_tokens", usage.get("max_tokens")),
        "output_tokens": output_tokens,
        "reasoning_tokens": reasoning_tokens,
        "max_tokens_reached": finish == "length",
        "suspected_truncation": finish == "length" or text_extra,
        "schema_version": "1.0",
        "schema_valid": False,
        "validation_error_count": 0,
    }


def _sanitize_candidate(raw: str) -> tuple[str, bool, bool]:
    sanitized = _SECRET_RE.sub(lambda match: match.group(1) + "[REDACTED]", raw)
    sanitized = _JSON_SECRET_RE.sub(r'\1[REDACTED]\2', sanitized)
    changed = sanitized != raw
    encoded = sanitized.encode("utf-8", errors="replace")
    truncated = len(encoded) > _CANDIDATE_MAX_BYTES
    if truncated:
        head = _CANDIDATE_MAX_BYTES // 2
        tail = _CANDIDATE_MAX_BYTES - head
        encoded = encoded[:head] + b"\n[ EVIDENCE_TRUNCATED ]\n" + encoded[-tail:]
        sanitized = encoded.decode("utf-8", errors="replace")
    return sanitized, changed, truncated


def _atomic_write(path: Path, content: bytes) -> None:
    fd, temp_name = tempfile.mkstemp(prefix=f".{path.name}.", dir=path.parent)
    try:
        with os.fdopen(fd, "wb") as handle:
            os.fchmod(handle.fileno(), 0o600)
            handle.write(content)
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(temp_name, path)
        os.chmod(path, 0o600)
        dir_fd = os.open(path.parent, os.O_RDONLY)
        try:
            os.fsync(dir_fd)
        finally:
            os.close(dir_fd)
    finally:
        if os.path.exists(temp_name):
            os.unlink(temp_name)


def persist_failure(job_id: str, output: str, errors: list, usage: dict | None, metadata: dict, *, state: str = "failed", error_code: str | None = None) -> dict:
    """Persiste evidência sanitizada do estado terminal, mesmo sem candidato.

    Aceita ``output`` vazio (falhas sem dossiê válido, como timeout ou saída
    não-zero) e registra ``terminal_state``/``error_code`` no metadata. Nunca
    grava prompts, respostas integrais, headers, cookies ou segredos.
    """
    if not _JOB_RE.fullmatch(job_id):
        raise ValueError("invalid_job_id")
    root = Path(config.FAILURE_DIR) / job_id
    root.mkdir(mode=0o700, parents=True, exist_ok=True)
    os.chmod(root, 0o700)
    candidate, scrubbed, evidence_truncated = _sanitize_candidate(output or "")
    metadata = dict(metadata)
    metadata["job_id"] = job_id
    metadata["terminal_state"] = state
    metadata["error_code"] = error_code
    metadata["sanitized_technical_content"] = scrubbed
    metadata["truncated_evidence"] = evidence_truncated
    metadata["evidence_max_bytes"] = EVIDENCE_MAX_BYTES
    metadata["candidate_bytes"] = len(candidate.encode("utf-8"))
    metadata["validation_error_count"] = len(errors)
    metadata["schema_valid"] = False
    metadata_bytes = json.dumps(metadata, ensure_ascii=False, sort_keys=True).encode("utf-8")
    errors_bytes = json.dumps([validation_error_record(error) if hasattr(error, "absolute_path") else error for error in errors], ensure_ascii=False, sort_keys=True).encode("utf-8")
    total = len(candidate.encode("utf-8")) + len(metadata_bytes) + len(errors_bytes)
    if total > EVIDENCE_MAX_BYTES:
        raise ValueError("failure_evidence_too_large")
    _atomic_write(root / "candidate-output.txt", candidate.encode("utf-8"))
    _atomic_write(root / "validation-errors.json", errors_bytes)
    _atomic_write(root / "response-metadata.json", metadata_bytes)
    return {"path": str(root), "bytes": total, "truncatedEvidence": evidence_truncated}
