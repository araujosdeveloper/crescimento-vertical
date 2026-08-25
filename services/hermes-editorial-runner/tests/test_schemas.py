import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ["SCHEMAS_DIR"] = os.path.abspath(
    os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
        "docs",
        "schemas",
    )
)

import schemas


def valid_request():
    return {
        "schemaVersion": "1.0",
        "correlationId": "corr-1",
        "idempotencyKey": "idem-1",
        "topic": "IA aplicada a vendas",
        "primaryPillar": "ai-business",
        "searchIntent": "verificar impacto",
        "language": "pt-BR",
        "requestedAt": "2026-08-25T12:00:00Z",
        "maxSources": 5,
        "seedSources": ["https://exemplo.com/doc"],
    }


class TestRequestSchema(unittest.TestCase):
    def test_valid_request(self):
        self.assertEqual(schemas.validate_request(valid_request()), [])

    def test_extra_property_rejected(self):
        req = valid_request()
        req["command"] = "rm -rf /"
        errs = schemas.validate_request(req)
        self.assertTrue(errs)

    def test_forbidden_fields_rejected(self):
        for field in ("prompt", "shell", "tool", "credentials"):
            req = valid_request()
            req[field] = "x"
            self.assertTrue(schemas.validate_request(req), field)

    def test_http_seed_rejected(self):
        req = valid_request()
        req["seedSources"] = ["http://exemplo.com/doc"]
        self.assertTrue(schemas.validate_request(req))

    def test_language_must_be_pt_br(self):
        req = valid_request()
        req["language"] = "en-US"
        self.assertTrue(schemas.validate_request(req))

    def test_max_sources_bounds(self):
        req = valid_request()
        req["maxSources"] = 1
        self.assertTrue(schemas.validate_request(req))
        req["maxSources"] = 11
        self.assertTrue(schemas.validate_request(req))


class TestDossierSchema(unittest.TestCase):
    def test_valid_dossier(self):
        dossier = {
            "schemaVersion": "1.0",
            "idempotencyKey": "abc",
            "hermesRunId": "r1",
            "discoveredAt": "2026-08-25T12:00:00Z",
            "contentType": "news",
            "primaryPillar": "ai-business",
            "riskLevel": "low",
            "sources": [
                {
                    "url": "https://exemplo.com/doc",
                    "publisher": "F",
                    "sourceLevel": "A",
                    "publishedAt": "2026-08-24T00:00:00Z",
                    "accessedAt": "2026-08-25T12:00:00Z",
                }
            ],
            "claims": [{"id": "a", "text": "t", "status": "verified"}],
        }
        self.assertEqual(schemas.validate_dossier(dossier), [])

    def test_dossier_without_sources_rejected(self):
        dossier = {
            "schemaVersion": "1.0",
            "idempotencyKey": "abc",
            "hermesRunId": "r1",
            "discoveredAt": "2026-08-25T12:00:00Z",
            "contentType": "news",
            "primaryPillar": "ai-business",
            "riskLevel": "low",
        }
        self.assertTrue(schemas.validate_dossier(dossier))


if __name__ == "__main__":
    unittest.main()
