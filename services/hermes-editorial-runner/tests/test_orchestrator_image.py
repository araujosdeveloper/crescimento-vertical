import importlib.util
import json
import os
import stat
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).parents[3]
MODULE_PATH = ROOT / "scripts" / "phase8_orchestrator_image.py"
SCRIPT_PATH = ROOT / "scripts" / "phase8-controlled-battery.sh"
spec = importlib.util.spec_from_file_location("phase8_orchestrator_image", MODULE_PATH)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

REF = "cv-hermes-editorial-runner:phase8-sqlite-v5-test"
IMAGE_ID = "sha256:" + "a" * 64
OTHER_ID = "sha256:" + "b" * 64
PINNED = "cv-hermes-editorial-runner@" + IMAGE_ID
OTHER_PINNED = "cv-hermes-editorial-runner@" + OTHER_ID
SHORT_PREFIX = "sha256:" + "a" * 12
OTHER_TAG = "cv-hermes-editorial-runner:phase8-old"


class Result:
    def __init__(self, stdout="", returncode=0):
        self.stdout = stdout
        self.stderr = ""
        self.returncode = returncode


def compose(image=REF, service=True):
    services = {module.SERVICE: {"image": image}} if service else {"proxy": {"image": "proxy:v1"}}
    return json.dumps({"services": services})


def container(reference=REF, image_id=IMAGE_ID, running=True, health="healthy"):
    return json.dumps([{"Config": {"Image": reference}, "Image": image_id,
                        "State": {"Running": running, "Health": {"Status": health}}}])


def container_without_valid_image_id():
    return json.dumps([{"Config": {"Image": REF}, "State": {"Running": True, "Health": {"Status": "healthy"}}}])


class FakeDocker:
    def __init__(self, *, compose_raw=None, container_raw=None, digests=None,
                 capability=True, resolve_map=None, default_id=IMAGE_ID):
        self.compose_raw = compose_raw or compose()
        self.container_raw = container_raw or container()
        self.digests = digests or [PINNED]
        self.capability = capability
        self.resolve_map = resolve_map or {}
        self.default_id = default_id
        self.commands = []

    def _resolve(self, reference):
        if reference in self.resolve_map:
            return self.resolve_map[reference]
        return self.default_id

    def __call__(self, command, **_kwargs):
        self.commands.append(command)
        if command[-3:] == ["config", "--format", "json"]:
            return Result(self.compose_raw)
        if command[:3] == ["docker", "image", "inspect"] and command[-1] == "{{.Id}}":
            value = self._resolve(command[3])
            return Result("", 1) if value is None else Result(value)
        if command[:3] == ["docker", "image", "inspect"]:
            return Result(json.dumps(self.digests))
        if command[:2] == ["docker", "inspect"]:
            return Result(self.container_raw)
        if command[:2] == ["docker", "run"]:
            return Result(module.CAPABILITY_MARKER if self.capability else "missing")
        return Result("", 1)


class TestComposeParsing(unittest.TestCase):
    def test_exact_runner_service_and_fixed_tag(self):
        self.assertEqual(module.parse_compose_image(compose()), REF)

    def test_repodigest_and_full_image_id_are_immutable_references(self):
        self.assertEqual(module.parse_compose_image(compose(PINNED)), PINNED)
        self.assertEqual(module.parse_compose_image(compose(IMAGE_ID)), IMAGE_ID)

    def test_latest_empty_missing_and_unresolved_are_rejected(self):
        invalid = [compose("repo:latest"), compose(""), compose(service=False),
                   '{"services":{"cv-hermes-editorial-runner":{"image":"${IMAGE}"}}}']
        for raw in invalid:
            with self.subTest(raw=raw), self.assertRaises(module.ResolutionError):
                module.parse_compose_image(raw)

    def test_duplicate_service_key_is_rejected_and_proxy_never_selected(self):
        duplicate = '{"services":{"cv-hermes-editorial-runner":{"image":"a:v1"},"cv-hermes-editorial-runner":{"image":"b:v1"}}}'
        with self.assertRaisesRegex(module.ResolutionError, "duplicate"):
            module.parse_compose_image(duplicate)
        with self.assertRaisesRegex(module.ResolutionError, "missing"):
            module.parse_compose_image(compose(service=False))


class TestResolution(unittest.TestCase):
    def resolve(self, fake):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "resolution"
            result = module.resolve(["docker", "compose"], output, fake)
            contents = output.read_text().splitlines()
            mode = stat.S_IMODE(output.stat().st_mode)
            return result, contents, mode, fake.commands

    def test_compose_tag_container_same_tag_same_id(self):
        fake = FakeDocker(resolve_map={REF: IMAGE_ID})
        result, contents, mode, _ = self.resolve(fake)
        self.assertEqual(result, (REF, IMAGE_ID, PINNED))
        self.assertEqual(contents, [REF, IMAGE_ID, PINNED])
        self.assertEqual(mode, 0o600)

    def test_compose_tag_container_repodigest_equivalent(self):
        fake = FakeDocker(container_raw=container(reference=PINNED),
                          resolve_map={REF: IMAGE_ID, PINNED: IMAGE_ID})
        result, contents, _, _ = self.resolve(fake)
        self.assertEqual(result, (REF, IMAGE_ID, PINNED))

    def test_compose_repodigest_container_tag_equivalent(self):
        fake = FakeDocker(compose_raw=compose(PINNED),
                          container_raw=container(reference=REF),
                          resolve_map={PINNED: IMAGE_ID, REF: IMAGE_ID})
        result, contents, _, _ = self.resolve(fake)
        self.assertEqual(result, (PINNED, IMAGE_ID, PINNED))

    def test_compose_and_container_full_image_id_equivalent(self):
        fake = FakeDocker(compose_raw=compose(IMAGE_ID),
                          container_raw=container(reference=IMAGE_ID),
                          resolve_map={IMAGE_ID: IMAGE_ID})
        result, contents, _, _ = self.resolve(fake)
        self.assertEqual(result, (IMAGE_ID, IMAGE_ID, PINNED))

    def test_short_prefix_resolves_but_is_never_used_for_decision(self):
        fake = FakeDocker(container_raw=container(reference=SHORT_PREFIX),
                          resolve_map={REF: IMAGE_ID, SHORT_PREFIX: IMAGE_ID})
        result, contents, _, _ = self.resolve(fake)
        self.assertEqual(result, (REF, IMAGE_ID, PINNED))
        self.assertEqual(contents[1], IMAGE_ID)
        self.assertNotIn(SHORT_PREFIX, contents)

    def test_compose_tag_different_from_container_image_is_rejected(self):
        fake = FakeDocker(container_raw=container(reference=OTHER_TAG, image_id=OTHER_ID),
                          resolve_map={REF: IMAGE_ID, OTHER_TAG: OTHER_ID})
        with tempfile.TemporaryDirectory() as directory, self.assertRaisesRegex(module.ResolutionError, "mismatch"):
            module.resolve(["docker", "compose"], Path(directory) / "out", fake)

    def test_different_repodigest_is_rejected(self):
        fake = FakeDocker(container_raw=container(reference=OTHER_PINNED, image_id=OTHER_ID),
                          resolve_map={REF: IMAGE_ID, OTHER_PINNED: OTHER_ID})
        with tempfile.TemporaryDirectory() as directory, self.assertRaisesRegex(module.ResolutionError, "mismatch"):
            module.resolve(["docker", "compose"], Path(directory) / "out", fake)

    def test_missing_local_image_is_rejected(self):
        fake = FakeDocker(resolve_map={REF: None})
        with tempfile.TemporaryDirectory() as directory, self.assertRaisesRegex(module.ResolutionError, "failed"):
            module.resolve(["docker", "compose"], Path(directory) / "out", fake)

    def test_container_reference_missing_locally_is_rejected(self):
        fake = FakeDocker(container_raw=container(reference=PINNED),
                          resolve_map={REF: IMAGE_ID, PINNED: None})
        with tempfile.TemporaryDirectory() as directory, self.assertRaisesRegex(module.ResolutionError, "failed"):
            module.resolve(["docker", "compose"], Path(directory) / "out", fake)

    def test_ambiguous_reference_is_rejected(self):
        fake = FakeDocker(resolve_map={REF: "sha256:" + "c" * 12})
        with tempfile.TemporaryDirectory() as directory, self.assertRaisesRegex(module.ResolutionError, "missing"):
            module.resolve(["docker", "compose"], Path(directory) / "out", fake)

    def test_inspect_without_valid_image_id_is_rejected(self):
        fake = FakeDocker(container_raw=container_without_valid_image_id(),
                          resolve_map={REF: IMAGE_ID})
        with tempfile.TemporaryDirectory() as directory, self.assertRaisesRegex(module.ResolutionError, "image_id"):
            module.resolve(["docker", "compose"], Path(directory) / "out", fake)

    def test_incompatible_manifest_probe_is_rejected(self):
        fake = FakeDocker(capability=False, resolve_map={REF: IMAGE_ID})
        with tempfile.TemporaryDirectory() as directory, self.assertRaisesRegex(module.ResolutionError, "capability"):
            module.resolve(["docker", "compose"], Path(directory) / "out", fake)

    def test_no_build_pull_fallback_or_external_network(self):
        _, _, _, commands = self.resolve(FakeDocker(resolve_map={REF: IMAGE_ID}))
        joined = "\n".join(" ".join(command) for command in commands)
        self.assertNotIn(" build", joined)
        self.assertNotIn(" pull", joined)
        self.assertNotIn("latest", joined)
        self.assertIn("--network none", joined)


class TestRecheck(unittest.TestCase):
    def test_tag_id_change_is_detected(self):
        fake = FakeDocker(resolve_map={REF: OTHER_ID, OTHER_TAG: OTHER_ID})
        with self.assertRaisesRegex(module.ResolutionError, "changed"):
            module.recheck(REF, IMAGE_ID, fake)

    def test_container_image_change_is_detected(self):
        fake = FakeDocker(container_raw=container(reference=OTHER_TAG, image_id=OTHER_ID),
                          resolve_map={REF: IMAGE_ID, OTHER_TAG: OTHER_ID})
        with self.assertRaisesRegex(module.ResolutionError, "changed"):
            module.recheck(REF, IMAGE_ID, fake)

    def test_stable_reference_and_container_pass(self):
        fake = FakeDocker(container_raw=container(reference=PINNED),
                          resolve_map={REF: IMAGE_ID, PINNED: IMAGE_ID})
        module.recheck(REF, IMAGE_ID, fake)


class TestShellOrchestrator(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.text = SCRIPT_PATH.read_text(encoding="utf-8")

    def test_obsolete_and_equivalent_hardcoded_tags_are_absent(self):
        self.assertNotIn("phase8-hermes-logs-f0638ac", self.text)
        self.assertIsNone(__import__("re").search(r"^IMAGE=[^$]", self.text, __import__("re").MULTILINE))

    def test_only_runner_recreated_with_no_build_no_pull_and_no_orphans(self):
        self.assertGreaterEqual(self.text.count("--no-build --pull never --force-recreate cv-hermes-editorial-runner"), 2)
        self.assertNotIn("compose down", self.text)
        self.assertNotIn("--remove-orphans", self.text)
        self.assertNotIn("phase8-egress-proxy", self.text)

    def test_resolution_happens_before_enable_and_failures_do_not_open_gates(self):
        self.assertLess(self.text.index('"$RESOLVER" resolve'), self.text.index('install -m 600 /dev/null "$ENABLE"'))
        self.assertLess(self.text.index('"$RESOLVER" recheck'), self.text.index('RUNNER_EXECUTION_ENABLED: "true"'))
        self.assertIn('if [ "$WINDOW_OPENED" -eq 1 ]', self.text)
        self.assertLess(self.text.index("WINDOW_OPENED=1"), self.text.index("docker run -i"))

    def test_override_is_private_removed_and_initial_image_reused(self):
        self.assertIn('chmod 600 "$OVERRIDE"', self.text)
        self.assertIn('rm -f "$RESOLUTION" "$OVERRIDE"', self.text)
        self.assertIn('rmdir "$WORK_DIR"', self.text)
        self.assertIn('"$IMAGE_PINNED" -m controlled_battery', self.text)
        self.assertIn('IMAGE_REF=$IMAGE_PINNED', self.text)

    def test_single_post_client_and_finally_are_preserved(self):
        self.assertIn("trap cleanup EXIT", self.text)
        self.assertIn("controlled_battery", self.text)
        self.assertNotIn("docker build", self.text)
        self.assertNotIn("docker pull", self.text)

    def test_resolver_cli_keeps_output_separate_from_compose_command(self):
        helper = MODULE_PATH.read_text(encoding="utf-8")
        self.assertIn("parse_known_args()", helper)
        self.assertIn('compose = compose[1:] if compose[0] == "--" else compose', helper)


if __name__ == "__main__":
    unittest.main()
