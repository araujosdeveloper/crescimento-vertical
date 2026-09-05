"""Política editorial determinística aplicada antes de qualquer pesquisa."""

from __future__ import annotations

import hashlib
import re
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

ALLOWED_PILLARS = frozenset(
    {"ai-business", "automation", "sales-attendance", "sites-conversion", "tools-integrations"}
)
BLOCKED_TERMS = frozenset(
    {
        "política partidária", "futebol", "esportes", "apostas", "celebridades",
        "conteúdo adulto", "saúde clínica", "aconselhamento jurídico individual",
        "investimento especulativo", "revelar credenciais", "executar comandos",
        "publicar conteúdo",
    }
)
TRACKING_KEYS = frozenset(
    {"fbclid", "gclid", "dclid", "msclkid", "mc_cid", "mc_eid", "ref", "ref_src"}
)
_INJECTION_RE = re.compile(
    r"(?:ignore|disregard|forget)\s+(?:all\s+)?(?:previous|prior|above)\s+instructions?"
    r"|system\s*prompt|reveal\s+(?:the\s+)?(?:secret|credential|key)",
    re.IGNORECASE,
)


def canonicalize_url(value: str) -> str:
    """Normaliza somente URL HTTPS, sem alterar caminho ou conteúdo remoto."""
    parsed = urlsplit(value.strip())
    if parsed.scheme.lower() != "https" or not parsed.netloc or parsed.username or parsed.password:
        raise ValueError("url_must_be_https")
    query = [pair for pair in parse_qsl(parsed.query, keep_blank_values=True)
             if pair[0].lower() not in TRACKING_KEYS and not pair[0].lower().startswith("utm_")]
    return urlunsplit(("https", parsed.netloc.lower(), parsed.path or "/", urlencode(query), ""))


def source_hash(canonical_url: str) -> str:
    return hashlib.sha256(canonical_url.encode("utf-8")).hexdigest()


def topic_fingerprint(topic: str, pillar: str) -> str:
    normalized = " ".join(topic.casefold().split())
    return hashlib.sha256(f"{pillar}\n{normalized}".encode("utf-8")).hexdigest()


def classify_request(request: dict) -> tuple[str, list[str]]:
    """Retorna allowed ou rejected e razões sanitizadas, sem consultar a rede."""
    topic = " ".join(str(request.get(name, "")) for name in ("topic", "searchIntent")).casefold()
    if request.get("primaryPillar") not in ALLOWED_PILLARS:
        return "rejected", ["pillar_out_of_scope"]
    if _INJECTION_RE.search(topic):
        return "rejected", ["prompt_injection_detected"]
    matched = sorted(term for term in BLOCKED_TERMS if term in topic)
    if matched:
        return "rejected", ["topic_out_of_scope"]
    return "accepted", []


def canonical_seed_sources(request: dict) -> list[str]:
    return list(dict.fromkeys(canonicalize_url(url) for url in request.get("seedSources", [])))
