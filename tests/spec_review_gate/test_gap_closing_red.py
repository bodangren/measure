"""S2 contract tests: the mid-red gap-closing Red round.

A Red round that only closes adversarial test gaps carries new tests that
already pass. The role declares the round in its result block with
`red_kind: gap_closing`, a `gaps:` line, and a `breakage_proof:` line, and the
gate then expects RED_TEST_COMMAND to pass. Every other Red round keeps the
rule that the new tests must fail first.

Each case runs the checker of the repository as a subprocess in a temporary
git repository. Each subprocess gets an explicit environment, so no inherited
gate variable and no host git configuration reaches it. The fixture track is
`demo_track`; no test reads the real track folder. Each failure case asserts
its exact message, not only the exit code (A4).
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

TRACK = "demo_track"
PHASE = "Phase S1: Fixture"
PASS_LINE = "PASS: mid-red gate passed"

BLOCK_LINES = [
    "MEASURE_AGENT_RESULT",
    "role: mid-red",
    "status: complete",
    f"track: {TRACK}",
    f"phase: {PHASE}",
    "commits: abc1234",
    "tests_run: RED_TEST_COMMAND",
    "files_changed: tests/test_gap.py",
    "plan_updates: none",
    "known_failures: none",
    "handoff: none",
]


def clean_env(extra: dict[str, str] | None = None) -> dict[str, str]:
    """Build an explicit environment. Nothing from the host gate variables is copied."""
    env = {
        "PATH": os.environ.get("PATH", "/usr/bin:/bin"),
        "HOME": "/nonexistent-home-for-test",
        "LC_ALL": "C.UTF-8",
        "GIT_CONFIG_GLOBAL": "/dev/null",
        "GIT_CONFIG_NOSYSTEM": "1",
        "PYTHONDONTWRITEBYTECODE": "1",
    }
    if extra:
        env.update(extra)
    return env


class GapClosingRedTest(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = tempfile.mkdtemp(prefix="gap_closing_red_")
        self.addCleanup(shutil.rmtree, self.tmp, ignore_errors=True)
        self.assertTrue(os.path.isdir(self.tmp), "mktemp did not return a folder")
        self.repo = Path(self.tmp) / "repo"
        self.repo.mkdir()
        self.log = Path(self.tmp) / "mid-red.log"
        self.write("measure/index.md", "# Measure\n")
        self.write("measure/tracks.md", "# Tracks\n")
        self.write(
            f"measure/tracks/{TRACK}/plan.md",
            f"# Plan\n\n## {PHASE}\n\n- [~] Task 1.1: Fixture task\n",
        )
        self.git("init", "-q")
        self.git("add", "measure/index.md", "measure/tracks.md", f"measure/tracks/{TRACK}/plan.md")
        self.git("commit", "-q", "-m", "fixture")
        self.baseline = self.git("rev-parse", "HEAD").stdout.strip()
        self.assertRegex(self.baseline, r"^[0-9a-f]{40}$")
        self.write("tests/test_gap.py", "def test_gap():\n    assert True\n")
        self.git("add", "tests/test_gap.py")
        self.git("commit", "-q", "-m", "red tests")

    # ------------------------------------------------------------------ helpers
    def write(self, rel: str, text: str) -> Path:
        path = self.repo / rel
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text, encoding="utf-8")
        return path

    def git(self, *args: str) -> subprocess.CompletedProcess:
        proc = subprocess.run(
            ["git", "-c", "user.name=test", "-c", "user.email=test@example.com", "-c", "commit.gpgsign=false", *args],
            cwd=str(self.repo),
            env=clean_env(),
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            check=False,
        )
        if proc.returncode != 0:
            self.fail(f"fixture git {' '.join(args)} failed: {proc.stdout}")
        return proc

    def block(self, *extra: str) -> list[str]:
        return [*BLOCK_LINES, *extra, "END_MEASURE_AGENT_RESULT"]

    def write_log(self, lines: list[str]) -> None:
        self.log.write_bytes(("\n".join(lines) + "\n").encode("utf-8"))

    def gate(self, red_command: str) -> tuple[int, str]:
        proc = subprocess.run(
            [
                sys.executable, "-I", str(CHECKER), "role-gate",
                "--repo", str(self.repo), "--role", "mid-red", "--track", TRACK,
                "--phase", PHASE, "--baseline", self.baseline,
                "--log-file", str(self.log),
            ],
            cwd=self.tmp,
            env=clean_env({"RED_TEST_COMMAND": red_command}),
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            check=False,
        )
        return proc.returncode, proc.stdout

    def assert_exit(self, expected: int, code: int, out: str) -> None:
        self.assertEqual(code, expected, f"exit {code}, expected {expected}; output:\n{out}")
        self.assertNotIn("Traceback", out)

    # ------------------------------------------------------------------ normal
    def test_normal_red_failing_suite_passes(self) -> None:
        """Control: a normal Red round with a failing suite passes."""
        self.write_log(self.block())
        code, out = self.gate("false")
        self.assert_exit(0, code, out)
        self.assertIn(PASS_LINE, out)

    def test_normal_red_passing_suite_fails(self) -> None:
        """Control: a normal Red round with a passing suite fails."""
        self.write_log(self.block())
        code, out = self.gate("true")
        self.assert_exit(1, code, out)
        self.assertIn("expected failure", out)
        self.assertNotIn(PASS_LINE, out)

    # ------------------------------------------------------------ gap closing
    def test_gap_closing_passing_suite_passes(self) -> None:
        self.write_log(self.block(
            "red_kind: gap_closing",
            "gaps: ADV-2 uncovered branch",
            "breakage_proof: neutralized-code run of tests/test_gap.py fails as expected",
        ))
        code, out = self.gate("true")
        self.assert_exit(0, code, out)
        self.assertIn(PASS_LINE, out)

    def test_gap_closing_failing_suite_fails(self) -> None:
        self.write_log(self.block(
            "red_kind: gap_closing",
            "gaps: ADV-2 uncovered branch",
            "breakage_proof: neutralized-code run of tests/test_gap.py fails as expected",
        ))
        code, out = self.gate("false")
        self.assert_exit(1, code, out)
        self.assertIn("expected success", out)
        self.assertNotIn(PASS_LINE, out)

    def test_gap_closing_missing_gaps_fails(self) -> None:
        self.write_log(self.block(
            "red_kind: gap_closing",
            "breakage_proof: neutralized-code run of tests/test_gap.py fails as expected",
        ))
        code, out = self.gate("true")
        self.assert_exit(1, code, out)
        self.assertIn("gaps:", out)
        self.assertNotIn(PASS_LINE, out)

    def test_gap_closing_missing_proof_fails(self) -> None:
        self.write_log(self.block(
            "red_kind: gap_closing",
            "gaps: ADV-2 uncovered branch",
        ))
        code, out = self.gate("true")
        self.assert_exit(1, code, out)
        self.assertIn("breakage_proof:", out)
        self.assertNotIn(PASS_LINE, out)

    def test_unknown_red_kind_fails(self) -> None:
        self.write_log(self.block("red_kind: fast"))
        code, out = self.gate("false")
        self.assert_exit(1, code, out)
        self.assertIn("unknown red_kind: fast", out)
        self.assertNotIn(PASS_LINE, out)


if __name__ == "__main__":
    unittest.main()
