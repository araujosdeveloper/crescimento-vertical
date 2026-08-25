"""Proteção contra replay por nonce (em memória, com TTL e limite)."""

import threading
import time


class NonceStore:
    def __init__(self, ttl_seconds: int = 600, max_entries: int = 10000):
        self._ttl = ttl_seconds
        self._max_entries = max_entries
        self._seen: dict[str, float] = {}
        self._lock = threading.Lock()

    def check_and_add(self, nonce: str) -> bool:
        """Retorna True se o nonce é novo (e o registra); False se é replay."""
        if not nonce:
            return False
        now = time.time()
        with self._lock:
            expired = [n for n, t in self._seen.items() if now - t > self._ttl]
            for n in expired:
                del self._seen[n]
            if nonce in self._seen:
                return False
            if len(self._seen) >= self._max_entries:
                oldest = min(self._seen, key=self._seen.get)
                del self._seen[oldest]
            self._seen[nonce] = now
            return True
