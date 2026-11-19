"""S2 contract tests: the exact result block form and the missing end line.

Every audit role brief and the orchestrator contract state the exact block
form: the opening `MEASURE_AGENT_RESULT` line, the fields, and the closing
`END_MEASURE_AGENT_RESULT` line. A log with a start line but no end line fails
the role gate with a message that names the exact missing line and shows the
form. A log with no block at all keeps the old missing-block message.

Each gate case runs the checker of the repository as a subprocess in a
temporary git repository. Each subprocess gets an explicit environment, so no
inherited gate variable and no host git configuration reaches it. The fixture
track is `demo_track`; no test reads the real track folder. Each failure case
asserts its exact message, not only the exit code (A4).
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
CONTRACTS = ROOT / "skills" / "measure-orchestrator" / "references" / "contracts.md"

TRACK = "demo_track"
PHASE = "Phase S1: Fixture"
PASS_LINE = "PASS: jr-green gate passed"
MISSING_BLOCK = "missing MEASURE_AGENT_RESULT block"
MISSING_END = "missing END_MEASURE_AGENT_RESULT line"

BLOCK_LINES = [
    "MEASURE_AGENT_RESULT",
    "role: jr-green",
    "status: complete",
    f"track: {TRACK}",
    f"phase: {PHASE}",
    "commits: abc1234",
    "tests_run: true: pass",
    "files_changed: src.txt",
    "plan_updates: none",
    "known_failures: none",
    "handoff: none",
]

AUDIT_BRIEFS = [
    "agents/measure-adversarial-testing.md",
    "agents/measure-closeout.md",
    "agents/measure-final-acceptance.md",
    "agents/measure-orchestrator-audit.md",
    "agents/measure-phase-acceptance.md",
    "agents/measure-review-a-correctness.md",
    "agents/measure-review-b-security.md",
    "agents/measure-review-c-ux-api.md",
    "agents/measure-spec-review.md",
    "agents/measure-ux-browser-review.md",
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


class MissingEndLineTest(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = tempfile.mkdtemp(prefix="result_block_form_")
        self.addCleanup(shutil.rmtree, self.tmp, ignore_errors=True)
        self.assertTrue(os.path.isdir(self.tmp), "mktemp did not return a folder")
        self.repo = Path(self.tmp) / "repo"
        self.repo.mkdir()
        self.log = Path(self.tmp) / "jr-green.log"
        self.write("measure/index.md", "# Measure\n")
        self.write("measure/tracks.md", "# Tracks\n")
        self.write(
            f"measure/tracks/{TRACK}/plan.md",
            f"# Plan\n\n## {PHASE}\n\n- [x] Task 1.1: Fixture task abc1234\n",
        )
        self.git("init", "-q")
        self.git("add", "measure/index.md", "measure/tracks.md", f"measure/tracks/{TRACK}/plan.md")
        self.git("commit", "-q", "-m", "fixture")
        self.baseline = self.git("rev-parse", "HEAD").stdout.strip()
        self.assertRegex(self.baseline, r"^[0-9a-f]{40}$")
        self.write("src.txt", "green change\n")
        self.git("add", "src.txt")
        self.git("commit", "-q", "-m", "green change")

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

    def write_log(self, lines: list[str]) -> None:
        self.log.write_bytes(("\n".join(lines) + "\n").encode("utf-8"))

    def gate(self) -> tuple[int, str]:
        proc = subprocess.run(
            [
                sys.executable, "-I", str(CHECKER), "role-gate",
                "--repo", str(self.repo), "--role", "jr-green", "--track", TRACK,
                "--phase", PHASE, "--baseline", self.baseline,
                "--log-file", str(self.log),
            ],
            cwd=self.tmp,
            env=clean_env({"GREEN_TEST_COMMAND": "true"}),
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            check=False,
        )
        return proc.returncode, proc.stdout

    def assert_exit(self, expected: int, code: int, out: str) -> None:
        self.assertEqual(code, expected, f"exit {code}, expected {expected}; output:\n{out}")
        self.assertNotIn("Traceback", out)

    # ------------------------------------------------------------------ gate
    def test_complete_block_passes(self) -> None:
        """Control: a block with both marker lines passes."""
        self.write_log([*BLOCK_LINES, "END_MEASURE_AGENT_RESULT"])
        code, out = self.gate()
        self.assert_exit(0, code, out)
        self.assertIn(PASS_LINE, out)

    def test_missing_end_line_names_it_and_shows_the_form(self) -> None:
        self.write_log(BLOCK_LINES)
        code, out = self.gate()
        self.assert_exit(1, code, out)
        self.assertIn(MISSING_END, out)
        self.assertIn("END_MEASURE_AGENT_RESULT", out)
        self.assertIn("handoff:", out)
        self.assertNotIn(PASS_LINE, out)

    def test_missing_block_keeps_the_old_message(self) -> None:
        self.write_log(["role: jr-green", "status: complete"])
        code, out = self.gate()
        self.assert_exit(1, code, out)
        self.assertIn(MISSING_BLOCK, out)
        self.assertNotIn(PASS_LINE, out)

    def test_markers_inside_words_keep_the_old_message(self) -> None:
        self.write_log(["handoff: MEASURE_AGENT_RESULT_EXTRA", "END_MEASURE_AGENT_RESULT2: x"])
        code, out = self.gate()
        self.assert_exit(1, code, out)
        self.assertIn(MISSING_BLOCK, out)
        self.assertNotIn(MISSING_END, out)


class BriefFormTest(unittest.TestCase):
    """Each audit role brief and the contract state the exact block form."""

    def test_each_audit_brief_names_both_marker_lines(self) -> None:
        for rel in AUDIT_BRIEFS:
            with self.subTest(brief=rel):
                text = (ROOT / rel).read_text(encoding="utf-8")
                self.assertIn("MEASURE_AGENT_RESULT", text)
                self.assertIn("END_MEASURE_AGENT_RESULT", text)

    def test_contract_names_the_missing_end_line(self) -> None:
        text = CONTRACTS.read_text(encoding="utf-8")
        self.assertIn("missing END_MEASURE_AGENT_RESULT line", text)


if __name__ == "__main__":
    unittest.main()
