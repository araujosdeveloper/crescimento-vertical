import os
import sys
import unittest
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from provider_adapter import call_chat_completion


class _Completions:
    def __init__(self): self.payload = None
    def create(self, **payload): self.payload = payload; return {"ok": True}


class _Client:
    def __init__(self): self.chat = type("Chat", (), {"completions": _Completions()})()


class TestProviderAdapter(unittest.TestCase):
    def test_reasoning_none_is_explicitly_disabled_offline(self):
        client = _Client()
        call_chat_completion(client, model="deepseek-v4-flash", messages=[{"role": "user", "content": "fixture"}], max_tokens=123, reasoning="none")
        payload = client.chat.completions.payload
        self.assertEqual(payload["extra_body"]["thinking"]["type"], "disabled")
        self.assertEqual(payload["max_tokens"], 123)
        self.assertNotIn("api_key", payload)


if __name__ == "__main__": unittest.main()
