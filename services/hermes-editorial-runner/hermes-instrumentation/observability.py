"""Instrumentação mínima e testável de observabilidade do Hermes 0.20.4.

Este módulo é a implementação offline do patch
``hermes-0.20.4-observability.patch``. Ele NÃO importa o Hermes e NÃO faz rede:
serve para provar, por teste unitário, a lógica que o patch injeta no Hermes.

CORREÇÃO DE CONTRATO (ADR-034 v2): ``provider_finish_reason`` (vindo
diretamente da resposta/chunk final do SDK) e ``hermes_turn_exit_reason``
(decisão interna do loop) são campos SEPARADOS. ``turn_exit_reason`` NUNCA é
usado como ``provider_finish_reason``: ausência permanece ``null`` e nunca é
inferida como ``stop``.

Nenhum prompt, resposta integral, header, cookie ou segredo é registrado.
"""

from __future__ import annotations

import re

# Valores reais de finish_reason do provider (SDK). Qualquer outro valor, ou
# ausência, vira null — nunca "stop" por inferência.
VALID_PROVIDER_FINISH_REASONS = frozenset({"stop", "length", "content_filter", "tool_calls"})

# Operações Tavily contabilizadas pelo contrato.
TAVILY_OPERATIONS = ("search", "extract")

# Enumeração sanitizada das decisões internas do loop do Hermes (turn_exit_reason).
# A parte dinâmica entre parênteses (ex.: "max_iterations_reached(8/8)") é
# removida; qualquer prefixo desconhecido vira "unknown".
_TURN_EXIT_REASON_CATEGORIES = frozenset({
    "text_response",
    "max_iterations_reached",
    "budget_exhausted",
    "interrupted_by_user",
    "interrupted_during_api_call",
    "all_retries_exhausted_no_response",
    "empty_response_exhausted",
    "compaction_handoff_not_actionable",
    "session_persistence_failed",
    "guardrail_halt",
    "partial_stream_recovery",
    "fallback_prior_turn_content",
    "local_processing_error",
    "error_near_max_iterations",
    "ollama_runtime_context_too_small",
    "unknown",
})

_PAREN_RE = re.compile(r"\(.*\)$")


def sanitize_provider_finish_reason(value) -> str | None:
    """Normaliza o finish_reason real do SDK. Nunca infere 'stop'."""
    if not isinstance(value, str):
        return None
    return value if value in VALID_PROVIDER_FINISH_REASONS else None


def sanitize_turn_exit_reason(turn_exit_reason) -> str | None:
    """Sanitiza e enumera a decisão interna do loop do Hermes.

    Remove o conteúdo dinâmico entre parênteses e mapeia para uma enumeração
    fechada; desconhecido vira ``unknown``. Nunca é usado como finish_reason do
    provedor.
    """
    if not isinstance(turn_exit_reason, str) or not turn_exit_reason.strip():
        return None
    prefix = _PAREN_RE.sub("", turn_exit_reason.strip()).strip()
    return prefix if prefix in _TURN_EXIT_REASON_CATEGORIES else "unknown"


class TavilyCounter:
    """Contador process-local de operações Tavily no ponto real do HTTP.

    O patch incrementa ``attempted`` imediatamente antes do HTTP, e
    ``succeeded``/``failed`` somente após o desfecho. A invariante é
    ``succeeded + failed == attempted`` ao terminar o job.
    """

    def __init__(self):
        self._counts = {op: {"attempted": 0, "succeeded": 0, "failed": 0} for op in TAVILY_OPERATIONS}

    def attempt(self, operation: str) -> None:
        if operation in self._counts:
            self._counts[operation]["attempted"] += 1

    def success(self, operation: str) -> None:
        if operation in self._counts:
            self._counts[operation]["succeeded"] += 1

    def failure(self, operation: str) -> None:
        if operation in self._counts:
            self._counts[operation]["failed"] += 1

    def invariant_holds(self) -> bool:
        return all(
            self._counts[op]["succeeded"] + self._counts[op]["failed"] == self._counts[op]["attempted"]
            for op in TAVILY_OPERATIONS
        )

    def snapshot(self) -> dict:
        return {op: dict(self._counts[op]) for op in TAVILY_OPERATIONS}


def build_usage_report(result: dict, counter: TavilyCounter | None = None, failure=None) -> dict:
    """Constrói o relatório de usage enriquecido, espelhando ``_write_usage_file``.

    ``provider_finish_reason`` vem somente do campo exportado pelo patch
    (direto do SDK); ``hermes_turn_exit_reason`` é a enumeração sanitizada da
    decisão do loop. O campo ``finish_reason`` é DEPRECATED e espelha apenas
    ``provider_finish_reason``, nunca ``turn_exit_reason``.
    """
    provider_finish_reason = sanitize_provider_finish_reason(result.get("provider_finish_reason"))
    report = {
        "estimated_cost_usd": result.get("estimated_cost_usd"),
        "cost_status": result.get("cost_status"),
        "cost_source": result.get("cost_source"),
        "input_tokens": result.get("input_tokens"),
        "output_tokens": result.get("output_tokens"),
        "cache_read_tokens": result.get("cache_read_tokens"),
        "cache_write_tokens": result.get("cache_write_tokens"),
        "reasoning_tokens": result.get("reasoning_tokens"),
        "total_tokens": result.get("total_tokens"),
        "api_calls": result.get("api_calls"),
        "model": result.get("model"),
        "provider": result.get("provider"),
        "session_id": result.get("session_id"),
        "completed": result.get("completed"),
        "failed": bool(result.get("failed")) or failure is not None,
        "service_tier": result.get("service_tier"),
        # --- campos do contrato de observabilidade v1 (ADR-034 v2) ---
        "provider_finish_reason": provider_finish_reason,
        "hermes_turn_exit_reason": sanitize_turn_exit_reason(result.get("turn_exit_reason")),
        # Deprecated: reflete somente provider_finish_reason.
        "finish_reason": provider_finish_reason,
        "tavily_operations": counter.snapshot() if counter is not None else {},
    }
    if failure is not None:
        report["failure"] = failure
    return report
