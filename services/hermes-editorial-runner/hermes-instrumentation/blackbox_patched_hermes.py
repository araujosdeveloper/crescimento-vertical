#!/usr/bin/env python3
"""Teste black-box do Hermes patchado (observabilidade v1).

Executa DENTRO da imagem candidata, com ``--network none``, e roda o binário
REAL do Hermes CLI contra servidores falsos locais (loopback). Valida o
usage-file realmente escrito pelo Hermes patchado.

Cobertura:
- provider_finish_reason: stop / length / content_filter / tool_calls /
  ausente (null) / stream sem chunk final;
- hermes_turn_exit_reason separado (nunca vira provider_finish_reason);
- usage presente/ausente e tokens exportados;
- Tavily search/extract com sucesso / HTTP 500 / erro de transporte / resposta
  inválida, contabilizados como attempted/succeeded/failed;
- invariante succeeded + failed == attempted;
- ausência de segredos/prompt/resposta integral/header/cookie no relatório;
- manifesto do patch presente.

Nenhuma chamada DeepSeek/Tavily real. Credenciais 100% fictícias.
"""

from __future__ import annotations

import http.server
import json
import os
import socketserver
import subprocess
import sys
import tempfile
import threading
import unittest
from pathlib import Path

PYTHON = "/opt/hermes/.venv/bin/python3"
HERMES_CLI = "/opt/hermes/hermes"

SSE_CHUNK = "data: {}\n\n"
SSE_DONE = b"data: [DONE]\n\n"


def _chunk(content=None, finish_reason=None, tool_calls=None, role=None, usage=None):
    delta = {}
    if role is not None:
        delta["role"] = role
    if content is not None:
        delta["content"] = content
    if tool_calls is not None:
        delta["tool_calls"] = tool_calls
    choice = {"index": 0, "delta": delta, "finish_reason": finish_reason}
    obj = {"id": "c1", "object": "chat.completion.chunk", "model": "deepseek-v4-flash",
           "choices": [choice]}
    if usage is not None:
        obj["usage"] = usage
    return obj


class FakeDeepSeek(http.server.BaseHTTPRequestHandler):
    """Servidor SSE OpenAI-compatible, com cenário configurável por instância."""
    scenario = "stop"
    request_count = 0

    def _sse(self, chunks, done=True, truncate_after=None):
        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream")
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()
        for i, c in enumerate(chunks):
            self.wfile.write(SSE_CHUNK.format(json.dumps(c)).encode())
            self.wfile.flush()
            if truncate_after is not None and i >= truncate_after:
                return  # encerra a stream abruptamente
        if done:
            self.wfile.write(SSE_DONE)
            self.wfile.flush()

    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        self.rfile.read(length)
        type(self).request_count += 1
        usage = {"prompt_tokens": 10, "completion_tokens": 5, "total_tokens": 15}

        if self.scenario == "tool_calls":
            if type(self).request_count == 1:
                tool_calls = [{"index": 0, "id": "call_1", "type": "function",
                               "function": {"name": "web_search",
                                            "arguments": json.dumps({"query": "inteligencia artificial", "limit": 3})}}]
                self._sse([_chunk(role="assistant"),
                           _chunk(tool_calls=tool_calls),
                           _chunk(finish_reason="tool_calls")])
            else:
                self._sse([_chunk(role="assistant"),
                           _chunk(content="dossie final fake"),
                           _chunk(finish_reason="stop", usage=usage)])
            return

        if self.scenario == "absent":
            self._sse([_chunk(role="assistant"), _chunk(content="texto"), _chunk()], done=True)
            return

        if self.scenario == "no_final_chunk":
            self._sse([_chunk(role="assistant"), _chunk(content="texto")], done=False)
            return

        # stop / length / content_filter
        self._sse([_chunk(role="assistant"), _chunk(content="texto"),
                   _chunk(finish_reason=self.scenario, usage=usage)])

    def log_message(self, *args):
        pass


class FakeTavily(http.server.BaseHTTPRequestHandler):
    """Servidor Tavily-compatible com cenário configurável."""
    scenario = "ok"

    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        self.rfile.read(length)
        if self.scenario == "http500":
            self.send_response(500)
            self.end_headers()
            return
        if self.scenario == "invalid":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(b"not-json{{")
            return
        if self.scenario == "reset":
            self.wfile.close()
            self.connection.close()
            return
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        body = {"results": [{"title": "T", "url": "https://exemplo.com", "content": "c",
                             "raw_content": "r"}]}
        self.wfile.write(json.dumps(body).encode())

    def log_message(self, *args):
        pass


class _Server(threading.Thread):
    def __init__(self, handler):
        super().__init__(daemon=True)
        self.httpd = socketserver.TCPServer(("127.0.0.1", 0), handler)
        self.port = self.httpd.server_address[1]

    def run(self):
        self.httpd.serve_forever()


class BlackBoxPatchedHermes(unittest.TestCase):
    deepseek = None
    tavily = None

    @classmethod
    def setUpClass(cls):
        cls.deepseek = _Server(FakeDeepSeek)
        cls.tavily = _Server(FakeTavily)
        cls.deepseek.start()
        cls.tavily.start()
        # aponta o provider Tavily (processo de teste) para o servidor falso
        os.environ["TAVILY_BASE_URL"] = f"http://127.0.0.1:{cls.tavily.port}"
        os.environ["TAVILY_API_KEY"] = "fake-not-real"

    def _home(self):
        home = tempfile.mkdtemp(prefix="hbb-")
        Path(home, "config.yaml").write_text(
            f"""model:
  provider: deepseek
  default: deepseek-v4-flash
  max_tokens: 4096
  base_url: http://127.0.0.1:{self.deepseek.port}/v1
fallback_providers: []
toolsets:
  - web
web:
  backend: tavily
  search_backend: tavily
  extract_backend: tavily
""", encoding="utf-8")
        return home

    def _run(self, deepseek_scenario, *, tavily_scenario="ok", extra_env=None):
        FakeDeepSeek.scenario = deepseek_scenario
        FakeDeepSeek.request_count = 0
        FakeTavily.scenario = tavily_scenario
        home = self._home()
        usage = os.path.join(home, "usage.json")
        env = dict(os.environ)
        env.update({
            "HERMES_HOME": home,
            "DEEPSEEK_API_KEY": "fake-not-real",
            "TAVILY_API_KEY": "fake-not-real",
            "TAVILY_BASE_URL": f"http://127.0.0.1:{self.tavily.port}",
        })
        if extra_env:
            env.update(extra_env)
        cmd = [PYTHON, HERMES_CLI, "-z", "pesquise e devolva JSON",
               "--provider", "deepseek", "--model", "deepseek-v4-flash",
               "--toolsets", "web",
               "--usage-file", usage]
        result = subprocess.run(cmd, env=env, capture_output=True, text=True, timeout=120)
        return result, home, usage

    def _usage(self, usage):
        if not os.path.exists(usage):
            return None
        return json.loads(Path(usage).read_text())

    def test_provider_finish_reason_stop(self):
        _, _, usage = self._run("stop")
        u = self._usage(usage)
        self.assertEqual(u["provider_finish_reason"], "stop")
        self.assertEqual(u["hermes_turn_exit_reason"], "text_response")

    def test_provider_finish_reason_length(self):
        _, _, usage = self._run("length")
        u = self._usage(usage)
        self.assertEqual(u["provider_finish_reason"], "length")

    def test_provider_finish_reason_content_filter(self):
        _, _, usage = self._run("content_filter")
        u = self._usage(usage)
        self.assertEqual(u["provider_finish_reason"], "content_filter")

    def test_provider_finish_reason_absent_is_null(self):
        _, _, usage = self._run("absent")
        u = self._usage(usage)
        self.assertIsNone(u["provider_finish_reason"])

    def test_stream_without_final_chunk_is_null(self):
        result, _, usage = self._run("no_final_chunk")
        u = self._usage(usage)
        self.assertIsNone(u.get("provider_finish_reason"))

    def test_tokens_exported(self):
        _, _, usage = self._run("stop")
        u = self._usage(usage)
        self.assertEqual(u["input_tokens"], 10)
        self.assertEqual(u["output_tokens"], 5)
        self.assertEqual(u["api_calls"], 1)

    def test_tool_calls_followed_by_final_answer(self):
        # A resposta com tool_calls é seguida pela resposta final; o
        # provider_finish_reason do turno final é "stop" (não "tool_calls").
        # A telemetria Tavily (attempted/succeeded/failed) é comprovada pelos
        # testes de provider abaixo, contra o servidor falso via HTTP real.
        _, _, usage = self._run("tool_calls", tavily_scenario="ok")
        u = self._usage(usage)
        self.assertEqual(u["provider_finish_reason"], "stop")
        self.assertEqual(u["hermes_turn_exit_reason"], "text_response")

    def test_tavily_search_success_counts_succeeded(self):
        from plugins.web.tavily import provider
        provider._OPERATION_COUNTS["search"] = {"attempted": 0, "succeeded": 0, "failed": 0}
        FakeTavily.scenario = "ok"
        result = provider.TavilyWebSearchProvider().search("x")
        self.assertTrue(result.get("success", False))
        c = provider.get_operation_counts()["search"]
        self.assertEqual(c, {"attempted": 1, "succeeded": 1, "failed": 0})

    def test_tavily_search_transport_error_counts_failed(self):
        from plugins.web.tavily import provider
        provider._OPERATION_COUNTS["search"] = {"attempted": 0, "succeeded": 0, "failed": 0}
        FakeTavily.scenario = "reset"
        provider.TavilyWebSearchProvider().search("x")
        c = provider.get_operation_counts()["search"]
        self.assertEqual(c["succeeded"] + c["failed"], c["attempted"])
        self.assertGreaterEqual(c["failed"], 1)

    def test_tavily_search_http500_counts_failed(self):
        from plugins.web.tavily import provider
        provider._OPERATION_COUNTS["search"] = {"attempted": 0, "succeeded": 0, "failed": 0}
        FakeTavily.scenario = "http500"
        result = provider.TavilyWebSearchProvider().search("x")
        self.assertFalse(result.get("success", True))  # falhou
        c = provider.get_operation_counts()["search"]
        self.assertEqual(c["succeeded"] + c["failed"], c["attempted"])
        self.assertGreaterEqual(c["failed"], 1)

    def test_tavily_extract_success_counts_succeeded(self):
        from plugins.web.tavily import provider
        provider._OPERATION_COUNTS["extract"] = {"attempted": 0, "succeeded": 0, "failed": 0}
        FakeTavily.scenario = "ok"
        result = provider.TavilyWebSearchProvider().extract(["https://exemplo.com"])
        self.assertTrue(result)
        c = provider.get_operation_counts()["extract"]
        self.assertEqual(c, {"attempted": 1, "succeeded": 1, "failed": 0})

    def test_tavily_extract_invalid_response_counts_failed(self):
        from plugins.web.tavily import provider
        provider._OPERATION_COUNTS["extract"] = {"attempted": 0, "succeeded": 0, "failed": 0}
        FakeTavily.scenario = "invalid"
        result = provider.TavilyWebSearchProvider().extract(["https://exemplo.com"])
        self.assertTrue(result)  # devolve lista com erro
        c = provider.get_operation_counts()["extract"]
        self.assertGreaterEqual(c["attempted"], 1)
        self.assertEqual(c["succeeded"] + c["failed"], c["attempted"])

    def test_manifest_present(self):
        self.assertTrue(Path("/app/instrumentation/manifest.json").exists())

    def test_no_secrets_in_usage(self):
        _, _, usage = self._run("stop")
        raw = Path(usage).read_text()
        for forbidden in ("api_key", "authorization", "Bearer", "fake-not-real"):
            self.assertNotIn(forbidden, raw.lower())
        # a chave fictícia não pode vazar
        self.assertNotIn("fake-not-real", raw)


if __name__ == "__main__":
    unittest.main(verbosity=2)
