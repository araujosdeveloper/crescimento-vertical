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
HERMES_PROVIDER = "deepseek"
HERMES_MODEL = "deepseek-v4-flash"
HERMES_REASONING = "none"
DEEPSEEK_API_KEY_FILE = os.environ.get(
    "DEEPSEEK_API_KEY_FILE", "/run/secrets/deepseek-api-key"
)
TAVILY_API_KEY_FILE = os.environ.get(
    "TAVILY_API_KEY_FILE", "/run/secrets/tavily-api-key"
)
SCHEMAS_DIR = os.environ.get("SCHEMAS_DIR", "/app/schemas")
EXECUTION_ENABLE_FILE = os.environ.get(
    "EXECUTION_ENABLE_FILE", "/run/secrets/execution-enable"
)
JOB_TIMEOUT_SECONDS = _env_int("JOB_TIMEOUT_SECONDS", 300)
MAX_TURNS = _env_int("MAX_TURNS", 8)
MAX_WEB_SEARCHES = _env_int("MAX_WEB_SEARCHES", 3)
MAX_FINAL_SOURCES = _env_int("MAX_FINAL_SOURCES", 4)
OUTPUT_MAX_BYTES = _env_int("OUTPUT_MAX_BYTES", 256 * 1024)
MAX_CONCURRENT_JOBS = 1
MAX_BATCH_JOBS = 4
MODEL_MAX_TOKENS = 4096
PROVIDER_MAX_RETRIES = 1  # Hermes: 1 tentativa, zero repeticoes ordinarias.
STREAM_RETRIES = 0
BATTERY_ID = "phase-8-deepseek-v4-flash-candidate-v1"
BATTERY_BUDGET_USD = 2.0
JOB_RESERVATION_USD = 0.50
# Precos oficiais DeepSeek consultados em 2026-09-01; usa faixa peak.
PRICE_CACHE_HIT_PER_MILLION = 0.014
PRICE_CACHE_MISS_PER_MILLION = 0.44
PRICE_OUTPUT_PER_MILLION = 1.32
STATE_DIR = os.environ.get("RUNNER_STATE_DIR", "/tmp/hermes-runner-state")
USAGE_DIR = os.environ.get("RUNNER_USAGE_DIR", os.path.join(STATE_DIR, "usage"))
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


def load_deepseek_api_key() -> str:
    """Lê a credencial exclusiva somente na janela de execução autorizada."""
    try:
        with open(DEEPSEEK_API_KEY_FILE, encoding="utf-8") as fh:
            api_key = fh.read().strip()
    except OSError:
        raise RuntimeError("deepseek_credential_unavailable") from None
    if not api_key:
        raise RuntimeError("deepseek_credential_unavailable")
    return api_key


def load_tavily_api_key() -> str:
    """Lê a credencial web exclusiva somente após a dupla trava."""
    try:
        with open(TAVILY_API_KEY_FILE, encoding="utf-8") as fh:
            api_key = fh.read().strip()
    except OSError:
        raise RuntimeError("tavily_credential_unavailable") from None
    if not api_key:
        raise RuntimeError("tavily_credential_unavailable")
    return api_key


def validate_limits() -> None:
    if MAX_TURNS > 8 or MAX_WEB_SEARCHES > 3 or MAX_FINAL_SOURCES > 4:
        raise ValueError("configured_limits_exceeded")
    if not 0 < JOB_TIMEOUT_SECONDS <= 300 or not 0 < OUTPUT_MAX_BYTES <= 256 * 1024:
        raise ValueError("configured_limits_invalid")
    if MAX_BATCH_JOBS > 4 or MAX_CONCURRENT_JOBS != 1 or MODEL_MAX_TOKENS > 4096:
        raise ValueError("configured_limits_exceeded")
