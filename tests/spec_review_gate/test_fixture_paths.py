"""Fixture-path tests for the mid-red non_test_paths() rule (track fixture_paths_20261115).

The mid-red role gate lists a path as non-test when it starts with measure/,
ends with a TEST_SUFFIXES suffix, or holds /__tests__/, /tests/, or a leading
tests/. A path under a fixtures folder inside a folder whose name ends in
-tests also counts as test-owned (the is_tests_fixture() rule). Class 1 pins
non_test_paths() on every example path of the spec. Class 2 runs the real
role-gate --role mid-red in a temporary git repository with one track, the
same way as test_red_track_scope.py. Each subprocess gets an explicit clean
environment with RED_TEST_COMMAND=false, so no host gate variable and no host
git configuration reaches it.
"""

from __future__ import annotations

import os
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CHECKER = ROOT / "skills" / "measure-orchestrator" / "scripts" / "measure_interphase_checks.py"

TRACK = "fixture_track"
PHASE = "Phase 1: Red"
PASS_LINE = "PASS: mid-red gate passed"
NON_TEST_MSG = "Mid Red changed non-test/non-Measure files"

# Example paths of the spec, group by group.
TEST_OWNED = [
    "harness/model-guide-tests/fixtures/x.json",
    "harness/model-guide-tests/fixtures/deep/y.json",
    "model-guide-tests/fixtures/x.json",
    "harness/model-guide-tests/cases/fixtures/x.json",
]
STILL_NON_TEST = [
    "harness/fixtures/x.json",
    "fixtures/x.json",
    "harness/model-guide-tests/x.json",
    "harness/model-guide-tests-old/fixtures/x.json",
    "harness/model-guidetests/fixtures/x.json",
    "fixtures/model-guide-tests/x.json",
    "harness/model-guide-tests/fixtures",
    "harness/model-guide-tests/fixtures.json",
    "harness/Model-Guide-TESTS/fixtures/x.json",
    "harness/model-guide-tests/fixturesx/x.json",
]
OLD_RULES_TEST_OWNED = [
    "tests/x.py",
    "src/tests/x.py",
    "src/__tests__/x.ts",
    "src/a.test.ts",
    "measure/plan.md",
]
OLD_RULES_NON_TEST = [
    "src/a.py",
    "src/test/x.py",
]
ALL_EXAMPLE_PATHS = TEST_OWNED + STILL_NON_TEST + OLD_RULES_TEST_OWNED + OLD_RULES_NON_TEST
EXPECTED_LISTED = sorted(STILL_NON_TEST + OLD_RULES_NON_TEST)


def clean_env(extra: dict[str, str] | None = None) -> dict[str, str]:
    """Build an explicit environment. Nothing from the host gate variables is copied."""
    env = {
        "PATH": os.environ.get("PATH", "/usr/bin:/bin"),
        "HOME": "/nonexistent-home-for-test",
        "LC_ALL": "C.UTF-8",
        "GIT_CONFIG_GLOBAL": "/dev/null",
        "GIT_CONFIG_NOSYSTEM": "1",
        "PYTHONDONTWRITEBYTECODE": "1",
        "RED_TEST_COMMAND": "false",
    }
    if extra:
        env.update(extra)
    return env


def checker_module():
    """The checker as an importable module, for non_test_paths()."""
    import importlib.util

    spec = importlib.util.spec_from_file_location("measure_interphase_checks", CHECKER)
    module = importlib.util.module_from_spec(spec)
    # Dataclasses resolve their module through sys.modules; register it before exec.
    sys.modules["measure_interphase_checks"] = module
    spec.loader.exec_module(module)
    return module


class FixturePathsUnitTest(unittest.TestCase):
    """Class 1 (unit): non_test_paths() on every example path of the spec."""

    @classmethod
    def setUpClass(cls) -> None:
        cls.module = checker_module()

    def test_owned_group_is_not_listed(self) -> None:
        """Test-owned group: the -tests fixtures are not listed."""
        listed = self.module.non_test_paths(ALL_EXAMPLE_PATHS)
        for path in TEST_OWNED:
            self.assertNotIn(path, listed)

    def test_still_non_test_group_is_listed(self) -> None:
        """Still non-test group: every path stays listed."""
        listed = self.module.non_test_paths(ALL_EXAMPLE_PATHS)
        for path in STILL_NON_TEST:
            self.assertIn(path, listed)

    def test_old_rules_group_is_unchanged(self) -> None:
        """Old rules group: on the old example paths the listed set is unchanged."""
        paths = OLD_RULES_TEST_OWNED + OLD_RULES_NON_TEST
        listed = self.module.non_test_paths(paths)
        self.assertEqual(listed, sorted(OLD_RULES_NON_TEST))


class FixturePathsGateTest(unittest.TestCase):
    """Class 2 (end to end): role-gate --role mid-red in a temporary repository."""

    def setUp(self) -> None:
        self.tmp = tempfile.mkdtemp(prefix="fixture_paths_")
        self.addCleanup(shutil.rmtree, self.tmp, ignore_errors=True)
        self.repo = Path(self.tmp) / "repo"
        self.repo.mkdir()
        self.git("init", "-q", "-b", "main")
        self.write("measure/index.md", "# Measure\n")
        self.write("measure/tracks.md", "# Tracks\n")
        self.write(
            f"measure/tracks/{TRACK}/plan.md",
            "# Plan\n\n## Phase 1: Red\n\n- [~] Task 1.1: Red tests (evidence)\n",
        )
        self.write("src/a.py", 'print("a")\n')
        self.commit("fixture")
        self.baseline = self.head()

    # ------------------------------------------------------------------ helpers
    def write(self, rel: str, text: str) -> None:
        path = self.repo / rel
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text, encoding="utf-8")

    def git(self, *args: str, env: dict[str, str] | None = None) -> subprocess.CompletedProcess:
        proc = subprocess.run(
            ["git", "-c", "user.name=test", "-c", "user.email=test@example.com", "-c", "commit.gpgsign=false", *args],
            cwd=str(self.repo),
            env=env if env is not None else clean_env(),
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            check=False,
        )
        if proc.returncode != 0:
            self.fail(f"fixture git {' '.join(args)} failed: {proc.stdout}")
        return proc

    def head(self) -> str:
        return self.git("rev-parse", "HEAD").stdout.strip()

    def commit(self, *paragraphs: str) -> str:
        """Stage every change and commit it. Each paragraph is one `-m` value."""
        self.git("add", "-A")
        args = ["commit", "-q"]
        for paragraph in paragraphs:
            args += ["-m", paragraph]
        self.git(*args)
        return self.head()

    def change(self, rel: str, *paragraphs: str) -> str:
        self.write(rel, f"# {rel}\n")
        return self.commit(*paragraphs)

    def gate(self) -> tuple[int, str]:
        args = [
            sys.executable,
            "-I",
            str(CHECKER),
            "role-gate",
            "--repo",
            str(self.repo),
            "--role",
            "mid-red",
            "--track",
            TRACK,
            "--phase",
            PHASE,
            "--baseline",
            self.baseline,
        ]
        proc = subprocess.run(
            args,
            cwd=self.tmp,
            env=clean_env(),
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            check=False,
        )
        self.assertNotIn("Traceback", proc.stdout)
        return proc.returncode, proc.stdout

    # ------------------------------------------------------------------ cases
    def test_case_a_tests_fixture_passes(self) -> None:
        """Case A: a -tests fixtures file counts as test-owned, so the gate passes."""
        self.change("tests/test_look.py", f"test(look): pin the look rules (track_id: {TRACK})")
        self.change(
            "harness/model-guide-tests/fixtures/case.json",
            f"test(look): add the model-guide case (track_id: {TRACK})",
        )
        code, out = self.gate()
        self.assertEqual(code, 0, out)
        self.assertIn(PASS_LINE, out)
        self.assertNotIn(NON_TEST_MSG, out)

    def test_case_b_plain_fixtures_fails(self) -> None:
        """Case B: a fixtures file outside a -tests folder stays non-test."""
        self.change("tests/test_look.py", f"test(look): pin the look rules (track_id: {TRACK})")
        self.change("harness/fixtures/case.json", f"test(look): add the case (track_id: {TRACK})")
        code, out = self.gate()
        self.assertEqual(code, 1, out)
        self.assertIn(NON_TEST_MSG, out)
        self.assertIn("FAIL: - harness/fixtures/case.json", out)


if __name__ == "__main__":
    unittest.main()
