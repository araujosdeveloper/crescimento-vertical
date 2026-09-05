import unittest
from unittest import mock

import proxy


class TestPolicy(unittest.TestCase):
    def test_allows_only_named_hosts_on_443(self):
        self.assertEqual(proxy.validate_target("api.deepseek.com:443"), ("api.deepseek.com", 443))
        self.assertEqual(proxy.validate_target("api.tavily.com:443"), ("api.tavily.com", 443))

    def test_denies_unlisted_literal_private_and_wrong_port(self):
        for target in ("example.com:443", "127.0.0.1:443", "10.0.0.1:443", "api.deepseek.com:80"):
            with self.subTest(target=target), self.assertRaises(ValueError):
                proxy.validate_target(target)

    def test_denies_private_dns_resolution(self):
        answer = [(2, 1, 6, "", ("10.0.0.5", 443))]
        with mock.patch("proxy.socket.getaddrinfo", return_value=answer):
            with self.assertRaisesRegex(ValueError, "non_public_resolution_denied"):
                proxy.resolve_public("api.deepseek.com", 443)


if __name__ == "__main__":
    unittest.main()
