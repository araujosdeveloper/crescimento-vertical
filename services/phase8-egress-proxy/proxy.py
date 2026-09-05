"""Proxy CONNECT mínimo e deny-by-default para a janela isolada da Fase 8."""

from __future__ import annotations

import ipaddress
import logging
import selectors
import socket
import socketserver

ALLOWED_HOSTS = frozenset({"api.deepseek.com", "api.tavily.com"})
LISTEN = ("0.0.0.0", 3128)
MAX_HEADER_BYTES = 8192
CONNECT_TIMEOUT_SECONDS = 10
IDLE_TIMEOUT_SECONDS = 30

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("phase8-egress-proxy")


def validate_target(target: str) -> tuple[str, int]:
    if target.count(":") != 1:
        raise ValueError("invalid_target")
    host, raw_port = target.rsplit(":", 1)
    try:
        ipaddress.ip_address(host.strip("[]"))
    except ValueError:
        pass
    else:
        raise ValueError("literal_ip_denied")
    host = host.rstrip(".").lower()
    if host not in ALLOWED_HOSTS:
        raise ValueError("host_denied")
    try:
        port = int(raw_port)
    except ValueError:
        raise ValueError("invalid_port") from None
    if port != 443:
        raise ValueError("port_denied")
    return host, port


def resolve_public(host: str, port: int) -> list[tuple]:
    addresses = socket.getaddrinfo(host, port, type=socket.SOCK_STREAM)
    public = []
    for family, socktype, proto, canonname, sockaddr in addresses:
        address = ipaddress.ip_address(sockaddr[0])
        if not address.is_global:
            raise ValueError("non_public_resolution_denied")
        public.append((family, socktype, proto, canonname, sockaddr))
    if not public:
        raise ValueError("resolution_empty")
    return public


def connect_resolved(addresses: list[tuple]) -> socket.socket:
    last_error = None
    for family, socktype, proto, _canonname, sockaddr in addresses:
        upstream = socket.socket(family, socktype, proto)
        upstream.settimeout(CONNECT_TIMEOUT_SECONDS)
        try:
            upstream.connect(sockaddr)
            upstream.settimeout(None)
            return upstream
        except OSError as exc:
            last_error = exc
            upstream.close()
    raise OSError("upstream_connect_failed") from last_error


def relay(client: socket.socket, upstream: socket.socket) -> None:
    selector = selectors.DefaultSelector()
    selector.register(client, selectors.EVENT_READ, upstream)
    selector.register(upstream, selectors.EVENT_READ, client)
    try:
        while True:
            events = selector.select(IDLE_TIMEOUT_SECONDS)
            if not events:
                return
            for key, _mask in events:
                data = key.fileobj.recv(65536)
                if not data:
                    return
                key.data.sendall(data)
    finally:
        selector.close()


class ProxyHandler(socketserver.BaseRequestHandler):
    def handle(self) -> None:
        self.request.settimeout(CONNECT_TIMEOUT_SECONDS)
        raw = b""
        try:
            while b"\r\n\r\n" not in raw and len(raw) <= MAX_HEADER_BYTES:
                chunk = self.request.recv(1024)
                if not chunk:
                    return
                raw += chunk
            if len(raw) > MAX_HEADER_BYTES:
                raise ValueError("header_too_large")
            request_line = raw.split(b"\r\n", 1)[0].decode("ascii", "strict")
            method, target, version = request_line.split(" ", 2)
            if method != "CONNECT" or not version.startswith("HTTP/1."):
                raise ValueError("connect_only")
            host, port = validate_target(target)
            upstream = connect_resolved(resolve_public(host, port))
        except (ValueError, UnicodeError) as exc:
            logger.warning("decision=deny reason=%s", str(exc))
            self.request.sendall(b"HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n")
            return
        except OSError:
            logger.warning("decision=deny reason=upstream_unavailable")
            self.request.sendall(b"HTTP/1.1 502 Bad Gateway\r\nConnection: close\r\n\r\n")
            return
        logger.info("decision=allow destination=%s", host)
        try:
            self.request.sendall(b"HTTP/1.1 200 Connection Established\r\n\r\n")
            relay(self.request, upstream)
        finally:
            upstream.close()


class ProxyServer(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


if __name__ == "__main__":
    with ProxyServer(LISTEN, ProxyHandler) as server:
        logger.info("proxy ready policy=deny-default destinations=2")
        server.serve_forever()
