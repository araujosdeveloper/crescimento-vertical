import os, sys, unittest
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import hermline

class TestHermlineContract(unittest.TestCase):
    def test_only_nonsemantic_normalization(self):
        self.assertEqual(hermline.normalize_json_output('\ufeff```json\n{"a":1}\n```'), '{"a":1}')
        self.assertEqual(hermline.normalize_json_output('{"a":1}\nextra'), '{"a":1}\nextra')

    def test_extracts_json_from_text_preface(self):
        self.assertEqual(
            hermline.normalize_json_output('Pesquisa concluída.\n\n{"a":1}\n'),
            '{"a":1}',
        )

    def test_prompt_contains_exact_contract_and_limits(self):
        prompt = hermline.build_prompt({"topic":"x", "primaryPillar":"ai-business", "searchIntent":"s", "maxSources":4})
        self.assertIn("Chaves obrigatórias", prompt)
        self.assertIn("Não inclua outras chaves", prompt)
        self.assertIn("1 a 4", prompt)
        self.assertIn("Não use campo justification", prompt)
        self.assertIn("unverified-claim", prompt)

if __name__ == '__main__': unittest.main()
