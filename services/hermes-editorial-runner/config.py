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


def _env_float(name: str, default: float) -> float:
    raw = os.environ.get(name)
    if raw is None or raw.strip() == "":
        return default
    try:
        return float(raw)
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
# Process lifecycle budgets are intentionally independent from HTTP deadlines.
# They are bounded tolerances, not guarantees of OS scheduling latency.
PROCESS_TERM_GRACE_SECONDS = _env_int("PROCESS_TERM_GRACE_SECONDS", 2)
PROCESS_KILL_WAIT_SECONDS = _env_int("PROCESS_KILL_WAIT_SECONDS", 2)
PROCESS_PIPE_DRAIN_SECONDS = _env_int("PROCESS_PIPE_DRAIN_SECONDS", 1)
# The synchronous client has independent budgets.  The job budget remains
# 300s; the other values reserve explicit time for admission, terminal
# persistence, and delivery of the HTTP response.
ADMISSION_BUDGET_SECONDS = _env_int("ADMISSION_BUDGET_SECONDS", 5)
FINALIZATION_BUDGET_SECONDS = _env_int("FINALIZATION_BUDGET_SECONDS", 15)
RESPONSE_DELIVERY_BUDGET_SECONDS = _env_int("RESPONSE_DELIVERY_BUDGET_SECONDS", 10)
CLIENT_DEADLINE_SECONDS = _env_int("CLIENT_DEADLINE_SECONDS", 330)
HTTP_POST_TIMEOUT_SECONDS = _env_int("HTTP_POST_TIMEOUT_SECONDS", 320)
HTTP_GET_TIMEOUT_SECONDS = _env_int("HTTP_GET_TIMEOUT_SECONDS", 30)
MAX_TURNS = _env_int("MAX_TURNS", 8)
MAX_WEB_SEARCHES = _env_int("MAX_WEB_SEARCHES", 3)
MAX_FINAL_SOURCES = _env_int("MAX_FINAL_SOURCES", 4)
OUTPUT_MAX_BYTES = _env_int("OUTPUT_MAX_BYTES", 256 * 1024)
MAX_CONCURRENT_JOBS = 1
MAX_SEARCHES_PER_JOB = 3
MODEL_MAX_TOKENS = 4096
PROVIDER_MAX_RETRIES = 1  # Hermes: 1 tentativa, zero repeticoes ordinarias.
STREAM_RETRIES = 0
BATTERY_ID = "phase-8-deepseek-v4-flash-candidate-v1"
MONTHLY_BUDGET_USD = _env_float("MONTHLY_BUDGET_USD", 10.0)
JOB_RESERVATION_USD = 0.50
# Precos oficiais DeepSeek consultados em 2026-09-01; usa faixa peak.
PRICE_CACHE_HIT_PER_MILLION = 0.014
PRICE_CACHE_MISS_PER_MILLION = 0.44
PRICE_OUTPUT_PER_MILLION = 1.32
STATE_DIR = os.environ.get("RUNNER_STATE_DIR", "/tmp/hermes-runner-state")
USAGE_DIR = os.environ.get("RUNNER_USAGE_DIR", os.path.join(STATE_DIR, "usage"))
FAILURE_DIR = os.environ.get("RUNNER_FAILURE_DIR", os.path.join(STATE_DIR, "failures"))
FAILURE_EVIDENCE_RETENTION = "until_phase8_close_then_explicit_decision"
RETRY2_REASON = "retry_after_dossier_contract_and_observability_fix"
MAX_RETRY_CHAIN = 2
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
    if MAX_CONCURRENT_JOBS != 1 or MODEL_MAX_TOKENS > 4096:
        raise ValueError("configured_limits_exceeded")
    if any(value <= 0 for value in (
        PROCESS_TERM_GRACE_SECONDS,
        PROCESS_KILL_WAIT_SECONDS,
        PROCESS_PIPE_DRAIN_SECONDS,
    )):
        raise ValueError("process_lifecycle_limits_invalid")
    validate_deadline_contract()


def validate_deadline_contract(*, client_deadline_seconds: float | None = None,
                               http_post_timeout_seconds: float | None = None,
                               http_get_timeout_seconds: float | None = None,
                               job_timeout_seconds: float | None = None,
                               admission_budget_seconds: float | None = None,
                               finalization_budget_seconds: float | None = None,
                               response_delivery_budget_seconds: float | None = None) -> None:
    """Reject timing configurations before a request can be sent.

    The monotonic client deadline starts before the POST.  The POST socket
    timeout is shorter than that deadline so a synchronous terminal response
    still has delivery budget.  Runner finalization is not currently bounded
    by code, therefore the finalization budget is an explicit contract margin,
    not a guarantee; that dependency remains a later lifecycle step.
    """
    client = CLIENT_DEADLINE_SECONDS if client_deadline_seconds is None else client_deadline_seconds
    post = HTTP_POST_TIMEOUT_SECONDS if http_post_timeout_seconds is None else http_post_timeout_seconds
    get = HTTP_GET_TIMEOUT_SECONDS if http_get_timeout_seconds is None else http_get_timeout_seconds
    job = JOB_TIMEOUT_SECONDS if job_timeout_seconds is None else job_timeout_seconds
    admission = ADMISSION_BUDGET_SECONDS if admission_budget_seconds is None else admission_budget_seconds
    finalization = FINALIZATION_BUDGET_SECONDS if finalization_budget_seconds is None else finalization_budget_seconds
    response = RESPONSE_DELIVERY_BUDGET_SECONDS if response_delivery_budget_seconds is None else response_delivery_budget_seconds
    values = (client, post, get, job, admission, finalization, response)
    if any(value <= 0 for value in values):
        raise ValueError("deadline_values_must_be_positive")
    if client < job + admission + finalization + response:
        raise ValueError("client_deadline_budget_insufficient")
    # Work, admission, and the contractual finalization margin belong to the
    # POST socket budget. Delivery is outside it; global slack cannot extend
    # an already expired POST operation.
    if post < job + admission + finalization:
        raise ValueError("post_timeout_budget_insufficient")
    if post >= client:
        raise ValueError("post_timeout_must_precede_client_deadline")
    if get > client:
        raise ValueError("get_timeout_exceeds_client_deadline")
