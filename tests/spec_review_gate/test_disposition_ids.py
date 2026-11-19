"""S2 contract tests: the dispositions ID accepts every found finding form.

Routed findings use more than single-letter IDs. The Desktop repos'
`measure/runs/` logs hold single-letter IDs (`M1`, `N1`), compound IDs
(`F-G4`, `ADV-2`, `A-P3-3`, `C-P4-2`, `R3-1`, `RA-3`, `PM-1`), and slug IDs
(`storytime-nest`, `l2-w01-practice-line-nest`). The gate accepts each form
that names a finding and still rejects the malformed forms.

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
INVALID_PREFIX = "invalid dispositions line"
JR_GREEN_PASS = "PASS: jr-green gate passed"

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

# Every ID form found in the Desktop repos' measure/runs/ logs that names a finding,
# plus the R2-F1 shape named in the request (the logs hold R3-1 and R4-1).
# The request's "review-a F1" occurs only in prose, never as an ID.
FOUND_IDS = [
    "F3",
    "M1",
    "N1",
    "N3",
    "A1",
    "B2",
    "C4",
    "D1",
    "E2",
    "G5",
    "P1",
    "X1",
    "F-G4",
    "ADV-2",
    "A-P3-1",
    "A-P3-3",
    "A-P3-4",
    "A-P4-1",
    "C-P3-1",
    "C-P3-3",
    "C-P4-1",
    "C-P4-2",
    "R2-F1",
    "R3-1",
    "R4-1",
    "RA-1",
    "RA-3",
    "RA-4",
    "RA-5",
    "PM-1",
    "storytime-nest",
    "l2-w01-practice-line-nest",
    "l2-w01-check-row-nest",
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


class DispositionIdFormsTest(unittest.TestCase):
    """The dispositions ID accepts every found finding form."""

    def setUp(self) -> None:
        self.tmp = tempfile.mkdtemp(prefix="disposition_ids_")
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

    def block(self, *extra: str) -> list[str]:
        return [*BLOCK_LINES, *extra, "END_MEASURE_AGENT_RESULT"]

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

    def assert_passes(self, value: str) -> None:
        self.write_log(self.block(f"dispositions: {value}"))
        code, out = self.gate()
        self.assertEqual(code, 0, f"exit {code}, expected 0 for [{value}]; output:\n{out}")
        self.assertNotIn("Traceback", out)
        self.assertIn(JR_GREEN_PASS, out)
        self.assertNotIn(INVALID_PREFIX, out)

    def assert_rejected(self, value: str, *messages: str) -> None:
        self.write_log(self.block(f"dispositions: {value}"))
        code, out = self.gate()
        self.assertEqual(code, 1, f"exit {code}, expected 1 for [{value}]; output:\n{out}")
        self.assertNotIn("Traceback", out)
        self.assertNotIn(JR_GREEN_PASS, out)
        self.assertIn(INVALID_PREFIX, out, f"missing message for [{value}]; output:\n{out}")
        fail_lines = [line for line in out.splitlines() if line.startswith("FAIL:")]
        self.assertTrue(fail_lines, f"no FAIL line for [{value}]; output:\n{out}")
        for line in fail_lines:
            self.assertTrue(
                line.startswith(f"FAIL: {INVALID_PREFIX}"),
                f"a FAIL line other than the dispositions message for [{value}]: {line}",
            )
        for message in messages:
            self.assertIn(message, out)

    # ------------------------------------------------------------------ normal
    def test_each_found_id_form_passes(self) -> None:
        for finding_id in FOUND_IDS:
            with self.subTest(finding_id=finding_id):
                self.assert_passes(f"{finding_id}=FIX")

    def test_mixed_found_forms_share_one_line(self) -> None:
        self.assert_passes(
            "F-G4=FIX; ADV-2=CONTEST(tests/test_x.py::test_x covers it); "
            "R3-1=ESCALATE(team rule); storytime-nest=DECLINE"
        )

    # -------------------------------------------------------------------- edge
    def test_malformed_ids_stay_rejected(self) -> None:
        for value in (
            "F0=FIX",
            "F01=FIX",
            "f1=FIX",
            "F1=fix",
            "F1=FIX;",
            "F1=FIX; F1=DECLINE",
            "F2=CONTEST",
            "F2=CONTEST()",
        ):
            with self.subTest(value=value):
                self.assert_rejected(value)


if __name__ == "__main__":
    unittest.main()
