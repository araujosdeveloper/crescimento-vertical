"""Configuração do runner editorial.

Nenhum segredo vive aqui: o segredo HMAC é lido de um arquivo montado via
secret (HMAC_SECRET_FILE). Valores são sobrescrevíveis por variáveis de
ambiente para permitir testes locais.
"""

import os


def _env_bool(name: str, default: bool = False) -> bool:
    raw = os.environ.get(name)
    if raw is None:
        return default
    return raw.strip().lower() in ("1", "true", "yes", "on")


def _env_int(name: str, default: int) -> int:
    raw = os.environ.get(name)
    if raw is None or raw.strip() == "":
        return default
    try:
        return int(raw)
    except ValueError:
        return default


HMAC_SECRET_FILE = os.environ.get("HMAC_SECRET_FILE", "/run/secrets/hmac-secret")
TIMESTAMP_TOLERANCE_SECONDS = _env_int("TIMESTAMP_TOLERANCE_SECONDS", 300)
BODY_MAX_BYTES = _env_int("BODY_MAX_BYTES", 1024 * 1024)
HERMES_BIN = os.environ.get("HERMES_BIN", "hermes")
SCHEMAS_DIR = os.environ.get("SCHEMAS_DIR", "/app/schemas")
EXECUTION_ENABLE_FILE = os.environ.get(
    "EXECUTION_ENABLE_FILE", "/run/secrets/execution-enable"
)
JOB_TIMEOUT_SECONDS = _env_int("JOB_TIMEOUT_SECONDS", 900)
LISTEN_HOST = os.environ.get("RUNNER_HOST", "0.0.0.0")
LISTEN_PORT = _env_int("RUNNER_PORT", 8100)


def execution_enabled() -> bool:
    """Dupla trava: só executa quando a flag AND o arquivo existem."""
    flag = _env_bool("RUNNER_EXECUTION_ENABLED", False)
    enable_file = os.environ.get("EXECUTION_ENABLE_FILE", "/run/secrets/execution-enable")
    enable_file_exists = os.path.exists(enable_file)
    return flag and enable_file_exists


def load_hmac_secret() -> bytes:
    with open(HMAC_SECRET_FILE, "rb") as fh:
        return fh.read().strip()
