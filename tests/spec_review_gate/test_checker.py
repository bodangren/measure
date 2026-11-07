"""S2 contract tests: `role-gate --role spec-review` and `audit-result --role spec-review`.

Each case runs the checker of the repository as a subprocess in a temporary git
repository. Each subprocess gets an explicit environment, so no inherited gate variable
(GREEN_TEST_COMMAND, RED_TEST_COMMAND, PROJECT_*) and no host git configuration reaches
it. The fixture track is `demo_track`; no test reads the real track folder (A9).
Each failure case asserts its exact message, not only the exit code (A4).
"""

from __future__ import annotations

import copy
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

TRACK = "demo_track"
PHASE = "track setup"
RESULT_REL = f"measure/runs/{TRACK}/spec-review-test.json"
PASS_LINE = "PASS: spec-review gate passed"
OUTSIDE_MSG = "spec-review committed files outside measure/runs/"
ZERO_SHA = "0" * 40

MAJOR = "F1 [Major] plan.md Phase S2: The plan leaves the file location open. Rationale: the implementer must guess."
NIT = "F2 [Nit] spec.md Overview: One sentence has a loose word. Rationale: wording only."
BLOCKER = "F3 [Blocker] spec.md Decision 4: The spec fixes a symptom. Rationale: the root problem stays."

BASE_PAYLOAD = {
    "schema_version": 1,
    "status": "pass",
    "summary": "Spec review of demo_track found no Blocker.",
    "blocking_findings": [],
    "nonblocking_findings": [MAJOR, NIT],
    "evidence": ["Read spec.md and plan.md of demo_track."],
    "commands": ["git rev-parse HEAD"],
    "changed_files": [],
    "retry_recommendation": "none",
    "confidence": "high",
    "paraphrase": {
        "proposes": "The track adds a fixture feature.",
        "current_system": "The current system has no fixture feature.",
    },
}


def pass_payload() -> dict:
    return copy.deepcopy(BASE_PAYLOAD)


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


class SpecReviewRoleGateTest(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = tempfile.mkdtemp(prefix="spec_review_gate_")
        self.addCleanup(shutil.rmtree, self.tmp, ignore_errors=True)
        self.assertTrue(os.path.isdir(self.tmp), "mkdtemp did not return a folder")
        self.repo = Path(self.tmp) / "repo"
        self.repo.mkdir()
        self.write("measure/index.md", "# Measure\n")
        self.write("measure/tracks.md", "# Tracks\n")
        self.write(
            f"measure/tracks/{TRACK}/plan.md",
            "# Plan\n\n## Phase S1: Fixture\n\n- [x] Task 1.1: Fixture task abc1234\n",
        )
        self.git("init", "-q")
        self.git("add", "measure/index.md", "measure/tracks.md", f"measure/tracks/{TRACK}/plan.md")
        self.commit("fixture")
        self.baseline = self.git("rev-parse", "HEAD").stdout.strip()
        self.assertRegex(self.baseline, r"^[0-9a-f]{40}$")

    # ------------------------------------------------------------------ helpers
    def write(self, rel: str, text: str) -> Path:
        path = self.repo / rel
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text, encoding="utf-8")
        return path

    def git(self, *args: str, env: dict[str, str] | None = None, check: bool = True) -> subprocess.CompletedProcess:
        proc = subprocess.run(
            ["git", "-c", "user.name=test", "-c", "user.email=test@example.com", "-c", "commit.gpgsign=false", *args],
            cwd=str(self.repo),
            env=env if env is not None else clean_env(),
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            check=False,
        )
        if check and proc.returncode != 0:
            self.fail(f"fixture git {' '.join(args)} failed: {proc.stdout}")
        return proc

    def commit(self, message: str) -> str:
        self.git("commit", "-q", "-m", message)
        return self.git("rev-parse", "HEAD").stdout.strip()

    def write_result(self, payload: object) -> Path:
        return self.write(RESULT_REL, json.dumps(payload))

    def run_checker(self, *args: str, env: dict[str, str] | None = None) -> tuple[int, str]:
        proc = subprocess.run(
            [sys.executable, "-I", str(CHECKER), *args],
            cwd=self.tmp,
            env=env if env is not None else clean_env(),
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            check=False,
        )
        return proc.returncode, proc.stdout

    def gate(
        self,
        *,
        role: str = "spec-review",
        baseline: str | None = "default",
        result: bool = True,
        env: dict[str, str] | None = None,
    ) -> tuple[int, str]:
        args = ["role-gate", "--repo", str(self.repo), "--role", role, "--track", TRACK, "--phase", PHASE]
        if baseline == "default":
            baseline = self.baseline
        if baseline is not None:
            args += ["--baseline", baseline]
        if result:
            args += ["--result-file", str(self.repo / RESULT_REL)]
        return self.run_checker(*args, env=env)

    def audit(self, role: str = "spec-review") -> tuple[int, str]:
        return self.run_checker("audit-result", "--role", role, "--file", str(self.repo / RESULT_REL))

    def assert_exit(self, expected: int, code: int, out: str) -> None:
        self.assertEqual(code, expected, f"exit {code}, expected {expected}; output:\n{out}")
        self.assertNotIn("Traceback", out)

    def assert_gate_pass(self, **kwargs: object) -> None:
        code, out = self.gate(**kwargs)  # type: ignore[arg-type]
        self.assert_exit(0, code, out)
        self.assertIn(PASS_LINE, out)

    def assert_gate_fails(self, message: str, **kwargs: object) -> str:
        code, out = self.gate(**kwargs)  # type: ignore[arg-type]
        self.assert_exit(1, code, out)
        self.assertIn(message, out)
        return out

    def assert_payload_rejected(self, payload: dict, message: str) -> None:
        """The rule lives in validate_audit_payload, so role-gate and audit-result both report it."""
        self.write_result(payload)
        out = self.assert_gate_fails(message)
        self.assertNotIn(PASS_LINE, out)
        code, audit_out = self.audit()
        self.assert_exit(1, code, audit_out)
        self.assertIn(message, audit_out)

    # ------------------------------------------------------------------ normal
    def test_normal_pass_with_major_and_nit(self) -> None:
        self.write_result(pass_payload())
        self.assert_gate_pass()

    def test_normal_aliases_pass(self) -> None:
        self.write_result(pass_payload())
        for alias in ("spec_review", "measure-spec-review"):
            with self.subTest(alias=alias):
                self.assert_gate_pass(role=alias)

    def test_normal_commit_inside_runs_folder_passes(self) -> None:
        self.write_result(pass_payload())
        self.write(f"measure/runs/{TRACK}/note.txt", "note\n")
        self.git("add", f"measure/runs/{TRACK}/note.txt")
        self.commit("add a run note")
        self.assert_gate_pass()

    def test_normal_audit_result_accepts_pass_json(self) -> None:
        self.write_result(pass_payload())
        code, out = self.audit()
        self.assert_exit(0, code, out)
        self.assertIn("PASS: audit result is valid", out)

    # -------------------------------------------------------------- edge: gate
    def test_edge_missing_result_file(self) -> None:
        self.write_result(pass_payload())
        self.assert_gate_fails("--result-file is required for audit roles", result=False)

    def test_edge_missing_baseline(self) -> None:
        self.write_result(pass_payload())
        self.assert_gate_fails("--baseline is required for spec-review", baseline=None)

    def test_edge_status_fail_with_blocker(self) -> None:
        payload = pass_payload()
        payload.update(
            status="fail",
            blocking_findings=[BLOCKER],
            retry_recommendation="escalate_human",
        )
        self.write_result(payload)
        out = self.assert_gate_fails("audit status must be pass, got 'fail'")
        self.assertIn(BLOCKER, out)

    # ----------------------------------------------------- edge: payload rules
    def test_edge_no_paraphrase(self) -> None:
        payload = pass_payload()
        del payload["paraphrase"]
        self.assert_payload_rejected(payload, "paraphrase must be an object with proposes and current_system")

    def test_edge_empty_proposes(self) -> None:
        payload = pass_payload()
        payload["paraphrase"]["proposes"] = ""
        self.assert_payload_rejected(payload, "paraphrase.proposes must be a non-empty string")

    def test_edge_current_system_of_spaces(self) -> None:
        payload = pass_payload()
        payload["paraphrase"]["current_system"] = "   "
        self.assert_payload_rejected(payload, "paraphrase.current_system must be a non-empty string")

    def test_edge_finding_without_id(self) -> None:
        payload = pass_payload()
        payload["nonblocking_findings"] = ["Major: no id"]
        self.assert_payload_rejected(payload, "spec-review finding has an invalid format: Major: no id")

    def test_edge_blocker_in_nonblocking_findings(self) -> None:
        payload = pass_payload()
        payload["nonblocking_findings"] = [BLOCKER]
        self.assert_payload_rejected(payload, f"nonblocking_findings may contain only [Major] or [Nit] findings: {BLOCKER}")

    def test_edge_major_in_blocking_findings(self) -> None:
        payload = pass_payload()
        payload.update(
            status="fail",
            blocking_findings=[MAJOR],
            nonblocking_findings=[],
            retry_recommendation="escalate_human",
        )
        self.assert_payload_rejected(payload, f"blocking_findings may contain only [Blocker] findings: {MAJOR}")

    def test_edge_status_pass_with_blocker(self) -> None:
        payload = pass_payload()
        payload["blocking_findings"] = [BLOCKER]
        self.assert_payload_rejected(payload, "spec-review status pass requires empty blocking_findings")

    def test_edge_status_fail_with_retry_implementation(self) -> None:
        payload = pass_payload()
        payload.update(
            status="fail",
            blocking_findings=[BLOCKER],
            retry_recommendation="retry_implementation",
        )
        self.write_result(payload)
        code, out = self.audit()
        self.assert_exit(1, code, out)
        self.assertIn("spec-review status fail requires retry_recommendation escalate_human", out)

    # --------------------------------------------------------- edge: baseline
    def test_edge_scope_commit_outside_runs_folder(self) -> None:
        self.write_result(pass_payload())
        self.write("src/app.py", 'print("app")\n')
        self.git("add", "src/app.py")
        self.commit("add src/app.py")
        out = self.assert_gate_fails(OUTSIDE_MSG)
        self.assertIn("- src/app.py", out)
        self.assertNotIn(PASS_LINE, out)

    def test_edge_unresolvable_baseline_zero_sha(self) -> None:
        self.write_result(pass_payload())
        out = self.assert_gate_fails(f"--baseline does not resolve to a commit: {ZERO_SHA}", baseline=ZERO_SHA)
        self.assertNotIn(PASS_LINE, out)

    def test_edge_unresolvable_baseline_not_a_ref(self) -> None:
        self.write_result(pass_payload())
        out = self.assert_gate_fails("--baseline does not resolve to a commit: not-a-ref", baseline="not-a-ref")
        self.assertNotIn(PASS_LINE, out)

    # ----------------------------------------------------------- edge: rename
    def test_edge_rename_into_runs_folder_lists_old_path(self) -> None:
        """Spec Decision 29: a rename lists its old path and its new path, whatever diff.renames says."""
        self.write_result(pass_payload())
        self.write("src/a.py", 'print("a")\n')
        self.git("add", "src/a.py")
        base = self.commit("add src/a.py")
        self.git("mv", "src/a.py", f"measure/runs/{TRACK}/a.py")
        self.commit("move src/a.py into the runs folder")
        env = clean_env(
            {
                "GIT_CONFIG_COUNT": "1",
                "GIT_CONFIG_KEY_0": "diff.renames",
                "GIT_CONFIG_VALUE_0": "true",
            }
        )
        # Precondition: with rename detection on, plain git diff lists only the new path.
        pre = self.git("diff", "--name-only", f"{base}..HEAD", env=env)
        self.assertEqual(
            pre.stdout.split(),
            [f"measure/runs/{TRACK}/a.py"],
            f"precondition failed: rename detection is not active; output:\n{pre.stdout}",
        )
        code, out = self.gate(baseline=base, env=env)
        self.assert_exit(1, code, out)
        self.assertIn(OUTSIDE_MSG, out)
        self.assertIn("- src/a.py", out)

    def test_edge_mid_red_rename_into_tests_lists_old_path(self) -> None:
        """The mid-red gate lists the old path of a production file renamed into tests/."""
        self.write("src/a.py", 'print("a")\n')
        self.git("add", "src/a.py")
        base = self.commit("add src/a.py")
        (self.repo / "tests").mkdir()
        self.git("mv", "src/a.py", "tests/a.py")
        self.commit("move src/a.py into tests/")
        env = clean_env(
            {
                "GIT_CONFIG_COUNT": "1",
                "GIT_CONFIG_KEY_0": "diff.renames",
                "GIT_CONFIG_VALUE_0": "true",
                "RED_TEST_COMMAND": "false",
            }
        )
        # Precondition: with rename detection on, plain git diff lists only the new path.
        pre = self.git("diff", "--name-only", f"{base}..HEAD", env=env)
        self.assertEqual(pre.stdout.split(), ["tests/a.py"], f"precondition failed: {pre.stdout}")
        code, out = self.run_checker(
            "role-gate",
            "--repo",
            str(self.repo),
            "--role",
            "mid-red",
            "--track",
            TRACK,
            "--phase",
            "Phase S1: Fixture",
            "--baseline",
            base,
            env=env,
        )
        self.assert_exit(1, code, out)
        self.assertIn("Mid Red changed non-test/non-Measure files", out)
        self.assertIn("- src/a.py", out)

    def test_edge_mid_red_test_only_commit_is_clean(self) -> None:
        """A Red commit that changes only test files keeps the mid-red report clean."""
        self.write("tests/b.py", 'print("b")\n')
        self.git("add", "tests/b.py")
        self.commit("add a test file")
        env = clean_env({"RED_TEST_COMMAND": "false"})
        code, out = self.run_checker(
            "role-gate",
            "--repo",
            str(self.repo),
            "--role",
            "mid-red",
            "--track",
            TRACK,
            "--phase",
            "Phase S1: Fixture",
            "--baseline",
            self.baseline,
            env=env,
        )
        self.assert_exit(0, code, out)
        self.assertIn("PASS: mid-red gate passed", out)
        self.assertNotIn("Mid Red changed non-test/non-Measure files", out)

    # ------------------------------------------------- backward compatibility
    def test_backward_compat_review_a_json_without_paraphrase(self) -> None:
        payload = pass_payload()
        del payload["paraphrase"]
        payload["nonblocking_findings"] = ["Any text is valid for review-a."]
        self.write_result(payload)
        code, out = self.audit("review-a")
        self.assert_exit(0, code, out)
        self.assertIn("PASS: audit result is valid", out)

    def test_backward_compat_unknown_role_lists_spec_review(self) -> None:
        code, out = self.gate(role="nope", baseline=None, result=False)
        self.assertEqual(code, 1, out)
        self.assertIn("unknown role 'nope'", out)
        marker = "Valid roles: "
        self.assertIn(marker, out)
        listed = [name.strip() for name in out.split(marker, 1)[1].splitlines()[0].split(",")]
        self.assertIn("review-a", listed)
        self.assertIn("spec-review", listed)


BLOCK_LINES = [
    "MEASURE_AGENT_RESULT",
    "role: jr-green",
    "status: complete",
    f"track: {TRACK}",
    "phase: Phase S1: Fixture",
    "commits: abc1234",
    "tests_run: true: pass",
    "files_changed: src.txt",
    "plan_updates: none",
    "known_failures: none",
    "handoff: none",
]
LONG_VALID_LINE = (
    "F1=FIX; F2=CONTEST(tests/test_x.py::test_empty covers the empty case); "
    "F3=ESCALATE(team rule from the 2026-10-01 call); F4=DECLINE"
)
INVALID_PREFIX = "invalid dispositions line"
JR_GREEN_PASS = "PASS: jr-green gate passed"


class DispositionsLineTest(unittest.TestCase):
    """S3 contract tests: the optional `dispositions:` line of a MEASURE_AGENT_RESULT block.

    Fixture: the S2 repository (plan phase `Phase S1: Fixture` with one `[x]` task that has
    a SHA) plus a second commit that adds `src.txt`. The role is jr-green, and
    GREEN_TEST_COMMAND is `true`. The no-line case is the control (A4): it proves that the
    fixture passes every other jr-green check. Each invalid case also asserts that every
    FAIL line starts with `FAIL: invalid dispositions line`, so an exit 1 from a fixture
    defect cannot count as a parser rejection.
    """

    def setUp(self) -> None:
        self.tmp = tempfile.mkdtemp(prefix="spec_review_gate_disp_")
        self.addCleanup(shutil.rmtree, self.tmp, ignore_errors=True)
        self.assertTrue(os.path.isdir(self.tmp), "mkdtemp did not return a folder")
        self.repo = Path(self.tmp) / "repo"
        self.repo.mkdir()
        self.log = Path(self.tmp) / "jr-green.log"
        self.write("measure/index.md", "# Measure\n")
        self.write("measure/tracks.md", "# Tracks\n")
        self.write(
            f"measure/tracks/{TRACK}/plan.md",
            "# Plan\n\n## Phase S1: Fixture\n\n- [x] Task 1.1: Fixture task abc1234\n",
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
                "--phase", "Phase S1: Fixture", "--baseline", self.baseline,
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

    def assert_passes(self, lines: list[str]) -> None:
        self.write_log(lines)
        code, out = self.gate()
        self.assertEqual(code, 0, f"exit {code}, expected 0; output:\n{out}")
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
    def test_normal_no_dispositions_line_passes(self) -> None:
        """Control: a block without the line stays valid (backward compatibility)."""
        self.assert_passes(self.block())

    def test_normal_dispositions_none_passes(self) -> None:
        self.assert_passes(self.block("dispositions: none"))

    def test_normal_full_dispositions_line_passes(self) -> None:
        self.assert_passes(self.block(f"dispositions: {LONG_VALID_LINE}"))

    # -------------------------------------------------------------------- edge
    def test_edge_invalid_values_exit_1(self) -> None:
        for value in (
            "F1=fix",
            "F1=IGNORE",
            "F2=CONTEST",
            "F2=CONTEST()",
            "F2=CONTEST(   )",
            "F3=ESCALATE()",
            "F1=FIX(done)",
            "",
            "F0=FIX",
            "X1=FIX",
            "F1=FIX;",
        ):
            with self.subTest(value=value):
                self.assert_rejected(value)

    def test_edge_duplicate_id_exit_1(self) -> None:
        self.assert_rejected("F1=FIX; F1=DECLINE", "duplicate finding id F1")

    def test_edge_only_the_last_block_counts(self) -> None:
        self.assert_passes([*self.block("dispositions: F1=bad"), *self.block("dispositions: none")])

    def test_edge_line_after_end_marker_is_ignored(self) -> None:
        self.assert_passes([*self.block(), "dispositions: F1=bad"])


if __name__ == "__main__":
    unittest.main()
