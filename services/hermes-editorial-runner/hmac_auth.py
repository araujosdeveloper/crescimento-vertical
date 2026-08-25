"""Assinatura HMAC-SHA256 com comparação em tempo constante."""

import hashlib
import hmac

ALGORITHM = "sha256"


def canonical_string(timestamp: str, nonce: str, body: bytes) -> bytes:
    """Entrada canônica da assinatura: ``{timestamp}.{nonce}.{body}``."""
    return f"{timestamp}.{nonce}.".encode("utf-8") + body


def compute_signature(
    secret: bytes, timestamp: str, nonce: str, body: bytes
) -> str:
    return hmac.new(
        secret, canonical_string(timestamp, nonce, body), hashlib.sha256
    ).hexdigest()


def verify_signature(
    secret: bytes,
    timestamp: str,
    nonce: str,
    body: bytes,
    signature: str,
) -> bool:
    if not signature or not timestamp or not nonce:
        return False
    expected = compute_signature(secret, timestamp, nonce, body)
    return hmac.compare_digest(expected, signature)
