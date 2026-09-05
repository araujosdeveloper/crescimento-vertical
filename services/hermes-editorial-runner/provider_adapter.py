"""Adapter mínimo testável para o payload DeepSeek, sem rede.

ATENÇÃO (ADR-034): este módulo NÃO participa do caminho editorial. O Hermes é o
editor-chefe e o único responsável por chamar DeepSeek/Tavily. Este adapter
existe exclusivamente para a prova de contrato de capacidades do orquestrador
(``phase8_orchestrator_image.py``) e para testes offline do wire format
(``extra_body.thinking``). Nunca é usado para produzir pauta, texto ou inferência
em substituição ao Hermes.
"""

from __future__ import annotations


def build_deepseek_payload(model: str, messages: list[dict], max_tokens: int, reasoning: str) -> dict:
    payload = {
        "model": model,
        "messages": messages,
        "max_tokens": max_tokens,
        "stream": False,
        "extra_body": {"thinking": {"type": "disabled" if reasoning == "none" else "enabled"}},
    }
    return payload


def call_chat_completion(client, *, model: str, messages: list[dict], max_tokens: int, reasoning: str):
    payload = build_deepseek_payload(model, messages, max_tokens, reasoning)
    return client.chat.completions.create(**payload)
