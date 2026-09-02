"""Instrumentação mínima e testável de observabilidade do Hermes 0.20.4.

Este módulo é a implementação offline do patch
``hermes-0.20.4-observability.patch``. Ele NÃO importa o Hermes e NÃO faz rede:
serve para provar, por teste unitário, a lógica que o patch injeta em dois
arquivos do Hermes:

- ``hermes_cli/oneshot.py``::``_write_usage_file`` — exportar ``finish_reason``
  (derivado de ``turn_exit_reason``) e ``tavily_operations`` (contadores).
- ``plugins/web/tavily/provider.py`` — contabilizar ``search``/``extract`` no
  ponto real do HTTP.

Nenhum prompt, resposta integral, header, cookie ou segredo é registrado.
"""

from __future__ import annotations

import re

# Valores de finish_reason do provider aceitos pelo contrato de observabilidade
# v1. Qualquer outro valor (ou ausência) é tratado como fail-closed pelo runner.
VALID_FINISH_REASONS = frozenset({"stop", "length", "content_filter", "tool_calls"})

# Operações Tavily contabilizadas pelo contrato.
TAVILY_OPERATIONS = ("search", "extract")

# O Hermes grava ``_turn_exit_reason = f"text_response(finish_reason={finish_reason})"``
# (agent/conversation_loop.py). Este padrão recupera o valor real.
_TURN_EXIT_FINISH_RE = re.compile(r"finish_reason=([a-z_]+)")


def extract_finish_reason(turn_exit_reason) -> str | None:
    """Extrai o finish_reason real embutido em ``turn_exit_reason`` do Hermes.

    Retorna o valor normalizado quando válido; ``None`` representa ausência
    real e é tratado como fail-closed pelo runner (nunca inferido como stop).
    """
    if not isinstance(turn_exit_reason, str):
        return None
    match = _TURN_EXIT_FINISH_RE.search(turn_exit_reason)
    if not match:
        return None
    value = match.group(1)
    return value if value in VALID_FINISH_REASONS else None


class TavilyCounter:
    """Contador process-local de operações Tavily, espelhando o patch do provider.

    O patch incrementa ``search``/``extract`` no ponto real do HTTP
    (``plugins/web/tavily/provider.py``) e expõe os contadores no relatório de
    usage. O contador pertence ao processo one-shot, então é válido dentro da
    janela de execução do job.
    """

    def __init__(self):
        self._counts = {op: 0 for op in TAVILY_OPERATIONS}

    def record(self, operation: str) -> None:
        """Registra uma chamada Tavily; operações desconhecidas são ignoradas."""
        if operation in self._counts:
            self._counts[operation] += 1

    def snapshot(self) -> dict:
        """Devolve contadores exatos ``{search, extract}``."""
        return dict(self._counts)


def build_usage_report(result: dict, counter: TavilyCounter | None = None, failure=None) -> dict:
    """Constrói o relatório de usage enriquecido, espelhando ``_write_usage_file``.

    Preserva o conjunto fixo de campos já exportado pelo Hermes e adiciona
    ``finish_reason`` e ``tavily_operations``. Nunca inclui prompts, respostas
    integrais, headers, cookies ou segredos.
    """
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
        # --- campos do contrato de observabilidade v1 ---
        "finish_reason": extract_finish_reason(result.get("turn_exit_reason")),
        "tavily_operations": counter.snapshot() if counter is not None else {},
    }
    if failure is not None:
        report["failure"] = failure
    return report
