#!/usr/bin/env python3
"""Matriz black-box offline do Hermes 0.20.4 realmente patchado."""
from __future__ import annotations
import hashlib, http.server, importlib, json, os, socket, socketserver, subprocess, tempfile, threading, time, unittest
from pathlib import Path
from unittest import mock

PYTHON="/opt/hermes/.venv/bin/python3"; HERMES_CLI="/opt/hermes/hermes"
INST=Path("/app/instrumentation"); ROOT=Path("/opt/hermes")
TOKENS={"prompt_tokens":10,"completion_tokens":5,"total_tokens":15}
PRIVATE=("BLACKBOX_PRIVATE_PROMPT","BLACKBOX_PRIVATE_RESPONSE","BLACKBOX_PRIVATE_QUERY","fake-not-real","person@example.invalid")
def sha(path): return hashlib.sha256(Path(path).read_bytes()).hexdigest()
def chunk(content=None,finish_reason=None,tool_calls=None,role=None,usage=None):
    delta={}
    if role is not None: delta["role"]=role
    if content is not None: delta["content"]=content
    if tool_calls is not None: delta["tool_calls"]=tool_calls
    out={"id":"fake","object":"chat.completion.chunk","model":"deepseek-v4-flash","choices":[{"index":0,"delta":delta,"finish_reason":finish_reason}]}
    if usage is not None: out["usage"]=usage
    return out

class FakeDeepSeek(http.server.BaseHTTPRequestHandler):
    scenario="stop"; request_count=0; main_count=0; bodies=[]
    def sse(self,values,done=True):
        self.send_response(200); self.send_header("Content-Type","text/event-stream"); self.end_headers()
        for value in values: self.wfile.write(("data: "+json.dumps(value)+"\n\n").encode()); self.wfile.flush()
        if done: self.wfile.write(b"data: [DONE]\n\n"); self.wfile.flush()
    def do_POST(self):
        raw=self.rfile.read(int(self.headers.get("Content-Length",0))); type(self).request_count+=1
        try: body=json.loads(raw)
        except json.JSONDecodeError: body={}
        type(self).bodies.append(body)
        tool_names=[tool.get("function",{}).get("name") for tool in body.get("tools",[])]
        is_main="web_search" in tool_names
        if not is_main:
            self.sse([chunk(role="assistant"),chunk(content='{"title":"Offline black box"}'),chunk(finish_reason="stop",usage=TOKENS)]); return
        type(self).main_count+=1
        if self.scenario=="http_error": self.send_response(503); self.end_headers(); return
        if self.scenario=="transport_error": self.connection.shutdown(socket.SHUT_RDWR); self.connection.close(); return
        if self.scenario=="timeout": time.sleep(1); return
        if self.scenario=="tool_calls" and type(self).main_count==1:
            calls=[{"index":0,"id":"call_1","type":"function","function":{"name":"web_search","arguments":json.dumps({"query":"BLACKBOX_PRIVATE_QUERY","limit":1})}}]
            self.sse([chunk(role="assistant"),chunk(tool_calls=calls),chunk(finish_reason="tool_calls")]); return
        if self.scenario=="absent": self.sse([chunk(role="assistant"),chunk(content="BLACKBOX_PRIVATE_RESPONSE"),chunk()]); return
        if self.scenario=="no_final_chunk": self.sse([chunk(role="assistant"),chunk(content="BLACKBOX_PRIVATE_RESPONSE")],False); return
        reason="stop" if self.scenario=="tool_calls" else self.scenario
        self.sse([chunk(role="assistant"),chunk(content="BLACKBOX_PRIVATE_RESPONSE"),chunk(finish_reason=reason,usage=TOKENS)])
    def log_message(self,*_): pass

class FakeTavily(http.server.BaseHTTPRequestHandler):
    scenarios={"search":"ok","extract":"ok"}; received={"search":0,"extract":0}
    def do_POST(self):
        endpoint=self.path.strip("/"); self.rfile.read(int(self.headers.get("Content-Length",0)))
        type(self).received[endpoint]=type(self).received.get(endpoint,0)+1; scenario=type(self).scenarios.get(endpoint,"ok")
        if scenario=="http500": self.send_response(500); self.end_headers(); return
        if scenario=="transport": self.connection.shutdown(socket.SHUT_RDWR); self.connection.close(); return
        if scenario=="timeout": time.sleep(1); return
        self.send_response(200); self.send_header("Content-Type","application/json"); self.end_headers()
        if scenario=="invalid_json": self.wfile.write(b"not-json{"); return
        if scenario=="invalid_shape": self.wfile.write(b'{"unexpected":true}'); return
        item={"title":"T","url":"https://example.invalid/redacted","content":"C","raw_content":"R"}
        self.wfile.write(json.dumps({"results":[item]}).encode())
    def log_message(self,*_): pass

class Server(threading.Thread):
    def __init__(self,handler):
        super().__init__(daemon=True); self.httpd=socketserver.ThreadingTCPServer(("127.0.0.1",0),handler); self.port=self.httpd.server_address[1]
    def run(self): self.httpd.serve_forever()
    def close(self): self.httpd.shutdown(); self.httpd.server_close()

class BlackBoxPatchedHermes(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.deepseek=Server(FakeDeepSeek); cls.tavily=Server(FakeTavily); cls.deepseek.start(); cls.tavily.start()
        os.environ.update(TAVILY_BASE_URL=f"http://127.0.0.1:{cls.tavily.port}",TAVILY_API_KEY="fake-not-real")
    @classmethod
    def tearDownClass(cls): cls.deepseek.close(); cls.tavily.close()
    def setUp(self):
        FakeDeepSeek.request_count=0; FakeDeepSeek.main_count=0; FakeDeepSeek.bodies=[]; FakeTavily.received={"search":0,"extract":0}; FakeTavily.scenarios={"search":"ok","extract":"ok"}
    def home(self):
        value=tempfile.mkdtemp(prefix="hbb-")
        Path(value,"config.yaml").write_text(f"""model:
  provider: deepseek
  default: deepseek-v4-flash
  max_tokens: 4096
  base_url: http://127.0.0.1:{self.deepseek.port}/v1
providers:
  deepseek:
    request_timeout_seconds: 0.2
agent:
  api_max_retries: 0
fallback_providers: []
toolsets: [web]
web:
  backend: tavily
  search_backend: tavily
  extract_backend: tavily
""")
        return value
    def run_cli(self,scenario):
        FakeDeepSeek.scenario=scenario; home=self.home(); usage=Path(home,"usage.json")
        env={k:v for k,v in os.environ.items() if not(k.endswith("_API_KEY") or "TOKEN" in k or "COOKIE" in k)}
        env.update(HERMES_HOME=home,DEEPSEEK_API_KEY="fake-not-real",TAVILY_API_KEY="fake-not-real",TAVILY_BASE_URL=f"http://127.0.0.1:{self.tavily.port}",HERMES_STREAM_RETRIES="0")
        cmd=[PYTHON,HERMES_CLI,"-z","BLACKBOX_PRIVATE_PROMPT","--provider","deepseek","--model","deepseek-v4-flash","--toolsets","web","--usage-file",str(usage)]
        result=subprocess.run(cmd,env=env,capture_output=True,text=True,timeout=20)
        return result,json.loads(usage.read_text()) if usage.exists() else None
    def provider(self):
        module=importlib.import_module("plugins.web.tavily.provider")
        for op in ("search","extract"): module._OPERATION_COUNTS[op]={"attempted":0,"succeeded":0,"failed":0}
        return module
    def call_tavily(self,endpoint,scenario):
        module=self.provider(); FakeTavily.scenarios[endpoint]=scenario; real_post=importlib.import_module("httpx").post
        def short_post(*args,**kwargs): kwargs["timeout"]=0.1; return real_post(*args,**kwargs)
        with mock.patch("httpx.post",side_effect=short_post):
            result=module.TavilyWebSearchProvider().search("BLACKBOX_PRIVATE_QUERY",1) if endpoint=="search" else module.TavilyWebSearchProvider().extract(["https://example.invalid/private"])
        return module,result,module.get_operation_counts()[endpoint]
    def assert_count(self,count,attempted=1,succeeded=0,failed=1):
        self.assertEqual(count,{"attempted":attempted,"succeeded":succeeded,"failed":failed}); self.assertEqual(count["succeeded"]+count["failed"],count["attempted"])

    def test_01_deepseek_stop(self): self.assertEqual(self.run_cli("stop")[1]["provider_finish_reason"],"stop")
    def test_02_deepseek_length(self): self.assertEqual(self.run_cli("length")[1]["provider_finish_reason"],"length")
    def test_03_deepseek_content_filter(self): self.assertEqual(self.run_cli("content_filter")[1]["provider_finish_reason"],"content_filter")
    def test_04_tool_call_then_final(self):
        result,usage=self.run_cli("tool_calls"); self.assertEqual(result.returncode,0); self.assertEqual(usage["provider_finish_reason"],"stop")
    def test_05_absent_finish_reason_is_null(self): self.assertIsNone(self.run_cli("absent")[1]["provider_finish_reason"])
    def test_06_stream_without_final_chunk_is_null(self): self.assertIsNone(self.run_cli("no_final_chunk")[1]["provider_finish_reason"])
    def test_07_deepseek_http_error(self):
        _,usage=self.run_cli("http_error"); self.assertTrue(usage is None or usage.get("provider_finish_reason") is None)
    def test_08_deepseek_transport_error(self):
        _,usage=self.run_cli("transport_error"); self.assertTrue(usage is None or usage.get("provider_finish_reason") is None)
    def test_09_deepseek_timeout(self):
        _,usage=self.run_cli("timeout"); self.assertTrue(usage is None or usage.get("provider_finish_reason") is None)
    def test_10_turn_exit_never_fills_provider(self):
        _,usage=self.run_cli("absent"); self.assertIsNone(usage["provider_finish_reason"]); self.assertIsNone(usage.get("finish_reason")); self.assertNotEqual(usage.get("hermes_turn_exit_reason"),"stop")
    def test_11_usage_present_consistent(self):
        _,usage=self.run_cli("stop"); self.assertEqual((usage["input_tokens"],usage["output_tokens"],usage["total_tokens"]),(10,5,15))
    def test_12_usage_absent_fails_closed(self): self.assertIn('HermesRunError("usage_file_missing_or_invalid"',Path("/app/hermline.py").read_text())
    def test_13_search_success(self): self.assert_count(self.call_tavily("search","ok")[2],succeeded=1,failed=0)
    def test_14_search_http500(self): self.assert_count(self.call_tavily("search","http500")[2])
    def test_15_search_transport(self): self.assert_count(self.call_tavily("search","transport")[2])
    def test_16_search_timeout(self): self.assert_count(self.call_tavily("search","timeout")[2])
    def test_17_search_invalid_response(self): self.assert_count(self.call_tavily("search","invalid_shape")[2])
    def test_18_extract_success(self): self.assert_count(self.call_tavily("extract","ok")[2],succeeded=1,failed=0)
    def test_19_extract_http500(self): self.assert_count(self.call_tavily("extract","http500")[2])
    def test_20_extract_transport(self): self.assert_count(self.call_tavily("extract","transport")[2])
    def test_21_extract_timeout(self): self.assert_count(self.call_tavily("extract","timeout")[2])
    def test_22_extract_invalid_response(self): self.assert_count(self.call_tavily("extract","invalid_shape")[2])
    def test_23_tool_call_reaches_instrumented_tavily(self):
        _,usage=self.run_cli("tool_calls"); self.assertGreaterEqual(FakeTavily.received["search"],1); self.assertGreaterEqual(usage["tavily_operations"]["search"]["attempted"],1)
        self.assertTrue(any(any(message.get("role")=="tool" for message in body.get("messages",[])) for body in FakeDeepSeek.bodies))
    def test_24_fourth_search_blocked(self):
        module=self.provider(); provider=module.TavilyWebSearchProvider()
        for _ in range(3): provider.search("x",1)
        before=FakeTavily.received["search"]; result=provider.search("x",1)
        self.assertFalse(result["success"]); self.assertEqual(FakeTavily.received["search"],before); self.assertEqual(module.get_operation_counts()["search"]["attempted"],3)
    def test_25_counter_invariant(self):
        module=self.provider(); FakeTavily.scenarios["search"]="http500"; module.TavilyWebSearchProvider().search("x")
        self.assertTrue(all(v["succeeded"]+v["failed"]==v["attempted"] for v in module.get_operation_counts().values()))
    def test_26_manifest_present(self): self.assertTrue((INST/"manifest.json").is_file())
    def test_27_build_sha_and_version(self):
        m=json.loads((INST/"manifest.json").read_text()); self.assertEqual(m["hermes_build_sha"],"649c20629eedea5a26d34b01ec8f3e14e96e9249"); self.assertEqual(m["hermes_version"],"0.20.4")
    def test_28_pre_post_hashes(self):
        m=json.loads((INST/"manifest.json").read_text()); self.assertTrue(all(sha(ROOT/item["path"])==item["after"] for item in m["files"]))
    def test_29_zero_fuzz_and_partial_fails(self):
        source=(INST/"apply-instrumentation.py").read_text(); self.assertIn('"--fuzz=0"',source)
        result=subprocess.run([PYTHON,str(INST/"apply-instrumentation.py")],capture_output=True,text=True); self.assertNotEqual(result.returncode,0); self.assertIn("before_hash_mismatch",result.stderr)
    def test_30_imported_modules_are_patched(self):
        module=self.provider(); self.assertEqual(Path(module.__file__).resolve(),ROOT/"plugins/web/tavily/provider.py"); self.assertTrue(hasattr(module,"_reserve_attempt"))
    def test_31_embedded_test_hash_manifest(self):
        m=json.loads((INST/"manifest.json").read_text()); self.assertEqual(sha(Path(__file__)),m["instrumentation_files"]["blackbox_patched_hermes.py"])
    def test_32_embedded_case_names_manifest(self):
        m=json.loads((INST/"manifest.json").read_text()); self.assertEqual(sorted(n for n in dir(type(self)) if n.startswith("test_")),m["blackbox_tests"])
    def test_33_no_credentials_in_image_environment(self):
        for key,value in os.environ.items(): self.assertFalse(key.endswith("_API_KEY") and value not in ("fake-not-real",""))
    def test_34_no_sensitive_content_in_usage(self):
        _,usage=self.run_cli("tool_calls"); raw=json.dumps(usage)
        for marker in PRIVATE: self.assertNotIn(marker,raw)
        self.assertNotIn("https://",raw); self.assertNotIn("authorization",raw.lower()); self.assertNotIn("cookie",raw.lower())
    def test_35_runner_does_not_call_provider_directly(self):
        source=Path("/app/app.py").read_text(); self.assertNotIn("call_chat_completion(",source); self.assertNotIn("provider_adapter",source)
    def test_36_retry3_prohibited(self):
        source=Path("/app/state.py").read_text(); self.assertIn("retry_number IN (1,2)",source); self.assertNotIn("retry_number IN (1,2,3)",source)

if __name__=="__main__": unittest.main(verbosity=2)
