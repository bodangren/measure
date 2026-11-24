"""Contract test: the jr-green gate ignores one open review task (track green_gate_review_task_20261124, FR-1 to FR-3).

Each case builds a temporary git repository with one fixture track and runs
the checker of this repository as a subprocess. Each subprocess gets an
explicit environment, so no host gate variable and no host git configuration
reaches it. The result files live outside the repository, so they never show
in a diff.

The base fixture is one phase with two completed tasks that carry commit SHA
evidence. The jr-green gate must pass when the phase holds one `[~]` task
that names a later role at the start of its text, and must still fail for a
second such task, a `[~]` task that names no later role, a `[ ]` review task,
near-miss body words, a missing SHA, and the unchanged mid-red and review-a
gates. The spec names no letter-suffix number form, so no such case exists.
"""

from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CHECKER = ROOT / "skills" / "measure-orchestrator" / "scripts" / "measure_interphase_checks.py"

TRACK = "green_gate_track"
PHASE = "Phase 1: Green"
GREEN_PASS = "PASS: jr-green gate passed"
MID_PASS = "PASS: mid-red gate passed"
INCOMPLETE_1 = "FAIL: current phase still has 1 non-deferred incomplete tasks"
SHA_MSG = "FAIL: some completed [x] tasks lack commit SHA evidence"

BASE_TASKS = [
    "- [x] Task 1.1 Green: implement the helper abc1234",
    "- [x] Task 1.2 Docs: update the guide abc1234",
]

# FR-1: each named later role, all eleven forms, each label-at-start.
LATER_ROLE_LABELS = [
    "Review A",
    "Review B",
    "Review C",
    "review a",
    "review b",
    "review c",
    "Adversarial",
    "Adversarial testing",
    "Acceptance",
    "Phase acceptance",
    "Final acceptance",
]

REVIEW_AUDIT_PAYLOAD = {
    "schema_version": 1,
    "status": "pass",
    "summary": "Review A of green_gate_track found no Blocker.",
    "blocking_findings": [],
    "nonblocking_findings": [],
    "evidence": ["Read spec.md and plan.md of green_gate_track."],
    "commands": ["git rev-parse HEAD"],
    "changed_files": [],
    "retry_recommendation": "none",
    "confidence": "high",
}


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


def plan_text(lines: list[str]) -> str:
    """One phase plan with the given task lines."""
    return "# Plan\n\n## Phase 1: Green\n\n" + "\n".join(lines) + "\n"


class GreenGateReviewTaskTest(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = tempfile.mkdtemp(prefix="green_gate_review_task_")
        self.addCleanup(shutil.rmtree, self.tmp, ignore_errors=True)
        self.repo = Path(self.tmp) / "repo"
        self.repo.mkdir()
        self.git("init", "-q", "-b", "main")
        self.write("measure/index.md", "# Measure\n")
        self.write("measure/tracks.md", "# Tracks\n")
        self.write(f"measure/tracks/{TRACK}/plan.md", plan_text(BASE_TASKS))
        self.commit("fixture")
        self.baseline = self.head()
        results = Path(self.tmp) / "results"
        results.mkdir()
        self.review_result = results / "review-a.json"
        self.review_result.write_text(json.dumps(REVIEW_AUDIT_PAYLOAD), encoding="utf-8")

    # ------------------------------------------------------------------ helpers
    def write(self, rel: str, text: str) -> None:
        path = self.repo / rel
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text, encoding="utf-8")

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

    def head(self) -> str:
        return self.git("rev-parse", "HEAD").stdout.strip()

    def commit(self, message: str) -> str:
        self.git("add", "-A")
        self.git("commit", "-q", "-m", message)
        return self.head()

    def run_checker(self, *args: str, env: dict[str, str] | None = None) -> tuple[int, str, str]:
        proc = subprocess.run(
            [sys.executable, "-I", str(CHECKER), *args],
            cwd=self.tmp,
            env=env if env is not None else clean_env(),
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=False,
        )
        self.assertNotIn("Traceback", proc.stdout + proc.stderr)
        return proc.returncode, proc.stdout, proc.stderr

    def gate(self, role: str, *, green: str = "true", red: str = "true", result: Path | None = None) -> tuple[int, str]:
        """Run one role gate on the fixture with the plan as written in setUp or the case."""
        args = ["role-gate", "--repo", str(self.repo), "--role", role, "--track", TRACK, "--phase", PHASE,
                "--baseline", self.baseline]
        if result is not None:
            args += ["--result-file", str(result)]
        env = clean_env({"GREEN_TEST_COMMAND": green, "RED_TEST_COMMAND": red})
        code, out, err = self.run_checker(*args, env=env)
        # D8: a role gate prints each line, the INFO lines too, to stdout.
        self.assertEqual(err, "", out)
        return code, out

    def stage_plan(self, lines: list[str]) -> None:
        """Replace the fixture plan with the case plan and commit a Green change past the baseline."""
        self.write(f"measure/tracks/{TRACK}/plan.md", plan_text(lines))
        self.write("src.txt", "green change\n")
        self.commit("green change")

    def assert_gate_pass(self, out: str, code: int, message: str, expected: str = GREEN_PASS) -> None:
        self.assertEqual(code, 0, f"{message}; exit {code}, expected 0; output:\n{out}")
        self.assertIn(expected, out.splitlines(), f"{message}; output:\n{out}")

    def assert_gate_fails(self, out: str, code: int, message: str, expected: str) -> None:
        self.assertEqual(code, 1, f"{message}; exit {code}, expected 1; output:\n{out}")
        self.assertIn(expected, out.splitlines(), f"{message}; output:\n{out}")
        self.assertNotIn(GREEN_PASS, out.splitlines(), f"{message}; output:\n{out}")

    # ------------------------------------------------------------------ FR-1 core
    def test_single_open_review_task_passes(self) -> None:
        """Base plus `- [~] Task 1.3 Review A of the helper` gives `PASS: jr-green gate passed`."""
        self.stage_plan([*BASE_TASKS, "- [~] Task 1.3 Review A of the helper"])
        code, out = self.gate("jr-green")
        self.assert_gate_pass(out, code, "one open [~] review task")

    def test_only_open_review_task_without_completed_task_fails(self) -> None:
        """Only `- [~] Task 1.3 Review A of the helper` and no `[x]` task gives the one-incomplete line."""
        self.stage_plan(["- [~] Task 1.3 Review A of the helper"])
        code, out = self.gate("jr-green")
        self.assert_gate_fails(out, code, "only open [~] review task and no completed task", INCOMPLETE_1)

    def test_two_open_review_tasks_fail(self) -> None:
        """Base plus two label-at-start `[~]` tasks gives the one-incomplete line (one ignore only)."""
        self.stage_plan([
            *BASE_TASKS,
            "- [~] Task 1.3 Review A of the helper",
            "- [~] Task 1.4 Review B of the helper",
        ])
        code, out = self.gate("jr-green")
        self.assert_gate_fails(out, code, "two open [~] review tasks", INCOMPLETE_1)

    def test_tilde_task_without_later_role_fails(self) -> None:
        """Base plus a `[~]` task that names no later role gives the one-incomplete line."""
        self.stage_plan([*BASE_TASKS, "- [~] Task 1.3 Green: polish the helper"])
        code, out = self.gate("jr-green")
        self.assert_gate_fails(out, code, "[~] task with no later role", INCOMPLETE_1)

    def test_bracket_review_task_fails(self) -> None:
        """Base plus a `[ ]` review task gives the one-incomplete line (only `[~]` qualifies)."""
        self.stage_plan([*BASE_TASKS, "- [ ] Task 1.3 Review A of the helper"])
        code, out = self.gate("jr-green")
        self.assert_gate_fails(out, code, "[ ] review task", INCOMPLETE_1)

    def test_each_later_role_label_passes(self) -> None:
        """Each of the eleven FR-1 forms label-at-start as the only `[~]` task passes jr-green."""
        for label in LATER_ROLE_LABELS:
            with self.subTest(label=label):
                line = f"- [~] Task 1.3 {label} of the helper"
                self.write(f"measure/tracks/{TRACK}/plan.md", plan_text([*BASE_TASKS, line]))
                self.write("src.txt", f"green change {label}\n")
                self.commit("green change")
                code, out = self.gate("jr-green")
                self.assert_gate_pass(out, code, f"fixture plan line: {line}")

    # ------------------------------------------------------------------ FR-1 near misses
    def test_body_word_never_matches(self) -> None:
        """Base plus `- [~] Task 1.2 Green: check per the acceptance criteria` fails (body word never matches)."""
        self.stage_plan(["- [x] Task 1.1 Green: implement the helper abc1234",
                         "- [~] Task 1.2 Green: check per the acceptance criteria"])
        code, out = self.gate("jr-green")
        self.assert_gate_fails(out, code, "later-role word only in the task body", INCOMPLETE_1)

    def test_review_assignments_prefix_miss_fails(self) -> None:
        """Base plus `- [~] Task 2.1 Review assignments for the phase` fails (`review a` is not a whole phrase)."""
        self.stage_plan([*BASE_TASKS, "- [~] Task 2.1 Review assignments for the phase"])
        code, out = self.gate("jr-green")
        self.assert_gate_fails(out, code, "review-assignments prefix miss", INCOMPLETE_1)

    # ------------------------------------------------------------------ FR-2 deferred
    def test_deferred_review_task_passes(self) -> None:
        """Base plus `- [~] Task 3.5 Review A (deferred:review-a)` passes, as today (never an ignore candidate)."""
        self.stage_plan([*BASE_TASKS, "- [~] Task 3.5 Review A (deferred:review-a)"])
        code, out = self.gate("jr-green")
        self.assert_gate_pass(out, code, "deferred [~] review task")

    def test_deferred_review_never_uses_the_ignore(self) -> None:
        """Deferred review plus `- [~] Task 3.6 Green: finish the export` fails (the deferred task never uses the one ignore)."""
        self.stage_plan([
            *BASE_TASKS,
            "- [~] Task 3.5 Review A (deferred:review-a)",
            "- [~] Task 3.6 Green: finish the export",
        ])
        code, out = self.gate("jr-green")
        self.assert_gate_fails(out, code, "deferred review plus unfinished Green task", INCOMPLETE_1)

    def test_deferred_review_before_eligible_review_passes(self) -> None:
        """A deferred review before an eligible review passes: the deferred task never spends the one ignore."""
        self.stage_plan([
            *BASE_TASKS,
            "- [~] Task 3.5 Review A (deferred:review-a)",
            "- [~] Task 3.6 Review B of the helper",
        ])
        code, out = self.gate("jr-green")
        self.assert_gate_pass(out, code, "deferred review before an eligible review task")

    # ------------------------------------------------------------------ FR-2 SHA check unchanged
    def test_missing_sha_with_review_task_fails(self) -> None:
        """An `[x]` task with no SHA plus `- [~] Task 1.2 Review A of the helper` fails with the SHA message."""
        self.stage_plan([
            "- [x] Task 1.1 Green: implement the helper",
            "- [~] Task 1.2 Review A of the helper",
        ])
        code, out = self.gate("jr-green")
        self.assertEqual(code, 1, f"missing SHA; exit {code}, expected 1; output:\n{out}")
        self.assertIn(SHA_MSG, out.splitlines(), f"missing SHA; output:\n{out}")
        self.assertNotIn(GREEN_PASS, out.splitlines(), f"missing SHA; output:\n{out}")

    # ------------------------------------------------------------------ FR-2 unchanged gates
    def test_mid_red_gate_unchanged(self) -> None:
        """Mid-red on `[x]` plus `[ ]` plus one `[~] Review A` task passes; the change must keep this output identical."""
        self.write(f"measure/tracks/{TRACK}/plan.md", plan_text([
            "- [x] Task 1.1 Green: implement the helper abc1234",
            "- [ ] Task 1.2 Docs: update the guide",
            "- [~] Task 1.3 Review A of the helper",
        ]))
        self.write("tests/test_helper.py", "def test_helper():\n    assert True\n")
        self.commit("test: pin the helper")
        code, out = self.gate("mid-red", red="false")
        self.assertEqual(code, 0, f"mid-red unchanged; exit {code}, expected 0; output:\n{out}")
        self.assertIn(MID_PASS, out.splitlines(), f"mid-red unchanged; output:\n{out}")
        self.assertNotIn("non-deferred incomplete tasks", out, f"mid-red unchanged; output:\n{out}")

    def test_review_a_gate_still_counts_review_task(self) -> None:
        """All `[x]` tasks with SHAs plus one `[~] Review A` task still fails review-a with the one-incomplete line."""
        self.stage_plan([*BASE_TASKS, "- [~] Task 1.3 Review A of the helper"])
        code, out = self.gate("review-a", result=self.review_result)
        self.assertEqual(code, 1, f"review-a unchanged; exit {code}, expected 1; output:\n{out}")
        self.assertIn(INCOMPLETE_1, out.splitlines(), f"review-a unchanged; output:\n{out}")

    # ------------------------------------------------------------------ FR-1 Lending shape
    def test_lending_phase_shape_passes(self) -> None:
        """The Lending Phase 3 shape (commit 6faaf42) passes jr-green: only task 3.5 can use the one ignore."""
        self.stage_plan([
            "- [x] 3.1 Module: add the bench be5a8a8",
            "- [x] 3.2 Export: add the export be5a8a8 7c5a825",
            "- [x] 3.3 Page and text: add the page a1d3be9",
            "- [x] 3.4 Green gate: record the gate 96a9197",
            "- [~] 3.5 Review A of the phase",
            "- [b] 3.6 Adversarial tests of the phase \u2014 deferred:adversarial-testing",
            "- [b] 3.7 UX browser review of the phase \u2014 deferred:ux-browser-review",
        ])
        code, out = self.gate("jr-green")
        self.assert_gate_pass(out, code, "Lending Phase 3 shape")


if __name__ == "__main__":
    unittest.main()
