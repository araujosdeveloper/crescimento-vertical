"""Adapter mínimo testável para o payload DeepSeek, sem rede."""

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
