"""Track scope tests for the spec-review, jr-green, and ux-browser-review gates and
the ux-paths command (track gate_track_scope_20261108).

Each case builds a temporary git repository with two tracks, `look_track` and
`login_track`, and runs the checker of this repository as a subprocess. The checks
read `look_track`. A commit of `login_track` carries its id in the subject tag
`(track_id: login_track)`. Each subprocess gets an explicit environment, so no host
gate variable and no host git configuration reaches it. The result files live
outside the repository, so they never show in a diff.
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

LOOK = "look_track"
LOGIN = "login_track"
SPEC_PHASE = "track setup"
GREEN_PHASE = "Phase 1: Green"
SPEC_PASS = "PASS: spec-review gate passed"
GREEN_PASS = "PASS: jr-green gate passed"
UX_PASS = "PASS: ux-browser-review gate passed"
OUTSIDE_MSG = "FAIL: spec-review committed files outside measure/runs/"
UX_MSG = "FAIL: UX-relevant files changed but PROJECT_DEV_URL is unset"
NO_OWN_GREEN = f"FAIL: expected committed Green-phase implementation change, but baseline..HEAD has no commit of track {LOOK}"

SPEC_PAYLOAD = {
    "schema_version": 1,
    "status": "pass",
    "summary": "Spec review of look_track found no Blocker.",
    "blocking_findings": [],
    "nonblocking_findings": [],
    "evidence": ["Read spec.md and plan.md of look_track."],
    "commands": ["git rev-parse HEAD"],
    "changed_files": [],
    "retry_recommendation": "none",
    "confidence": "high",
    "paraphrase": {
        "proposes": "The track changes the look.",
        "current_system": "The current system has the old look.",
    },
}

UX_PAYLOAD = {
    "schema_version": 1,
    "status": "pass",
    "summary": "UX review of look_track: not applicable.",
    "blocking_findings": [],
    "nonblocking_findings": [],
    "evidence": ["The phase changes no user-facing file."],
    "commands": [],
    "changed_files": [],
    "retry_recommendation": "none",
    "confidence": "high",
    "ux_applicability": "not_applicable",
    "webbridge_status": "not_run",
    "webbridge_evidence": {"screenshots": [], "accessibility_snapshots": [], "interactions": []},
}


def info_line(name: str, count: int) -> str:
    return f"INFO: {name} skipped {count} commits of other tracks"


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


class GateTrackScopeBase(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = tempfile.mkdtemp(prefix="gate_track_scope_")
        self.addCleanup(shutil.rmtree, self.tmp, ignore_errors=True)
        self.repo = Path(self.tmp) / "repo"
        self.repo.mkdir()
        self.git("init", "-q", "-b", "main")
        self.write("measure/index.md", "# Measure\n")
        self.write("measure/tracks.md", "# Tracks\n")
        self.write(f"measure/tracks/{LOOK}/plan.md", "# Plan\n\n## Phase 1: Green\n\n- [x] Task 1.1: Green change abc1234\n")
        self.write(f"measure/tracks/{LOGIN}/plan.md", "# Plan\n\n## Phase 1: Login\n\n- [~] Task 1.1: Login\n")
        self.write("src/a.py", 'print("a")\n')
        self.write("app/src/a.tsx", "export const a = 1;\n")
        self.commit("fixture")
        self.baseline = self.head()
        results = Path(self.tmp) / "results"
        results.mkdir()
        self.spec_result = results / "spec-review.json"
        self.spec_result.write_text(json.dumps(SPEC_PAYLOAD), encoding="utf-8")
        self.ux_result = results / "ux-browser-review.json"
        self.ux_result.write_text(json.dumps(UX_PAYLOAD), encoding="utf-8")

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

    def change(self, rel: str, message: str) -> str:
        self.write(rel, f"# {rel}\n")
        return self.commit(message)

    def login_commits(self) -> list[str]:
        """The two `login_track` commits of the spec: one file each, oldest first."""
        return [
            self.change("src/login.py", f"feat(login): add the sign-in form (track_id: {LOGIN})"),
            self.change(f"measure/tracks/{LOGIN}/plan.md", f"chore(measure): record the login evidence (track_id: {LOGIN})"),
        ]

    def unlist(self, sha: str) -> None:
        """Delete the loose root tree object of a commit that is not HEAD."""
        self.assertNotEqual(sha, self.head(), "an unlistable commit must not be HEAD")
        tree = self.git("rev-parse", f"{sha}^{{tree}}").stdout.strip()
        path = self.repo / ".git" / "objects" / tree[:2] / tree[2:]
        self.assertTrue(path.is_file(), f"no loose tree object {tree}")
        path.unlink()

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

    def role_gate(self, role: str, phase: str, *, result: Path | None = None, env: dict[str, str] | None = None) -> tuple[int, str]:
        args = ["role-gate", "--repo", str(self.repo), "--role", role, "--track", LOOK, "--phase", phase, "--baseline", self.baseline]
        if result is not None:
            args += ["--result-file", str(result)]
        code, out, err = self.run_checker(*args, env=env)
        # D8: a role gate prints each line, the INFO lines too, to stdout.
        self.assertEqual(err, "", out)
        return code, out

    def ux_paths(self, *extra: str) -> tuple[int, str, str]:
        return self.run_checker("ux-paths", "--repo", str(self.repo), "--baseline", self.baseline, *extra)

    def assert_skipped(self, out: str, name: str, shas: list[str]) -> None:
        """The INFO lines of D8: the count, then one line for each sha, the newest first."""
        lines = out.splitlines()
        self.assertIn(info_line(name, len(shas)), lines)
        rows = [f"INFO: - {sha[:12]} {LOGIN}" for sha in reversed(shas)]
        for row in rows:
            self.assertIn(row, lines)
        self.assertEqual([lines.index(row) for row in rows], sorted(lines.index(row) for row in rows))


class SpecReviewScopeTest(GateTrackScopeBase):
    def gate(self) -> tuple[int, str]:
        return self.role_gate("spec-review", SPEC_PHASE, result=self.spec_result)

    def test_spec_review_mixed_range_passes(self) -> None:
        """AC-1: commits of another track outside measure/runs/ do not fail the gate."""
        self.change(f"measure/runs/{LOOK}/notes.md", f"chore(measure): record the look review (track_id: {LOOK})")
        login = self.login_commits()
        code, out = self.gate()
        self.assertEqual(code, 0, out)
        self.assertIn(SPEC_PASS, out)
        self.assert_skipped(out, "spec-review", login)
        lines = out.splitlines()
        self.assertLess(lines.index(info_line("spec-review", 2)), lines.index(SPEC_PASS))
        self.assertNotIn("src/login.py", out)
        self.assertNotIn(f"measure/tracks/{LOGIN}/plan.md", out)

    def test_spec_review_own_commit_outside_runs_fails(self) -> None:
        """AC-2: a file outside measure/runs/ in a commit of the track fails the gate."""
        self.change(f"measure/runs/{LOOK}/notes.md", f"chore(measure): record the look review (track_id: {LOOK})")
        self.login_commits()
        self.change(f"measure/tracks/{LOOK}/spec.md", f"docs(measure): change the look spec (track_id: {LOOK})")
        code, out = self.gate()
        self.assertEqual(code, 1, out)
        lines = out.splitlines()
        self.assertIn(OUTSIDE_MSG, lines)
        self.assertIn(f"FAIL: - measure/tracks/{LOOK}/spec.md", lines)
        self.assertNotIn("src/login.py", out)
        self.assertNotIn(f"measure/tracks/{LOGIN}/plan.md", out)
        self.assertNotIn(SPEC_PASS, out)

    def test_spec_review_only_other_tracks_passes(self) -> None:
        """AC-3: a range with no commit of the track passes the scope rule."""
        login = self.login_commits()
        code, out = self.gate()
        self.assertEqual(code, 0, out)
        self.assertIn(SPEC_PASS, out)
        self.assert_skipped(out, "spec-review", login)

    def test_spec_review_untagged_commit_counts_as_own(self) -> None:
        """AC-4: a commit with no id is a commit of the track (fail closed)."""
        self.login_commits()
        self.change("src/misc.py", "feat: add a helper")
        code, out = self.gate()
        self.assertEqual(code, 1, out)
        lines = out.splitlines()
        self.assertIn(OUTSIDE_MSG, lines)
        self.assertIn("FAIL: - src/misc.py", lines)
        self.assertNotIn("src/login.py", out)

    def test_spec_review_unlistable_own_commit_fails(self) -> None:
        """AC-5: a commit of the track whose files git cannot list fails the gate."""
        look = self.change(f"measure/runs/{LOOK}/notes.md", f"chore(measure): record the look review (track_id: {LOOK})")
        self.login_commits()
        self.unlist(look)
        code, out = self.gate()
        self.assertEqual(code, 1, out)
        self.assertIn(f"FAIL: spec-review could not list the files of commit {look[:12]}", out.splitlines())
        self.assertNotIn(SPEC_PASS, out)

    def test_spec_review_missing_baseline_tree_fails_in_scoped_mode(self) -> None:
        """AC-6: the tree diff runs first in each mode, so a missing baseline tree fails the gate (D4)."""
        self.login_commits()
        tree = self.git("rev-parse", f"{self.baseline}^{{tree}}").stdout.strip()
        (self.repo / ".git" / "objects" / tree[:2] / tree[2:]).unlink()
        code, out = self.gate()
        self.assertEqual(code, 1, out)
        self.assertTrue(
            any(line.startswith("FAIL: spec-review could not list committed files:") for line in out.splitlines()), out
        )
        self.assertNotIn("INFO:", out)
        self.assertNotIn(SPEC_PASS, out)

    def test_spec_review_single_track_range_keeps_output(self) -> None:
        """AC-7: a range with no commit of another track keeps the old output."""
        self.change(f"measure/runs/{LOOK}/notes.md", f"chore(measure): record the look review (track_id: {LOOK})")
        code, out = self.gate()
        self.assertEqual(code, 0, out)
        self.assertEqual(out.strip(), SPEC_PASS)


class JrGreenScopeTest(GateTrackScopeBase):
    def gate(self) -> tuple[int, str]:
        return self.role_gate("jr-green", GREEN_PHASE, env=clean_env({"GREEN_TEST_COMMAND": "true"}))

    def test_jr_green_range_without_own_commit_fails(self) -> None:
        """AC-8: commits of another track do not count as the Green change of the track."""
        login = self.login_commits()
        code, out = self.gate()
        self.assertEqual(code, 1, out)
        self.assertIn(NO_OWN_GREEN, out.splitlines())
        self.assert_skipped(out, "jr-green", login)
        self.assertNotIn(GREEN_PASS, out)

    def test_jr_green_mixed_range_passes(self) -> None:
        """AC-9: one commit of the track in a mixed range passes the HEAD check."""
        first = self.change("src/login.py", f"feat(login): add the sign-in form (track_id: {LOGIN})")
        self.change("src/look.py", f"feat(look): change the look code (track_id: {LOOK})")
        second = self.change(f"measure/tracks/{LOGIN}/plan.md", f"chore(measure): record the login evidence (track_id: {LOGIN})")
        code, out = self.gate()
        self.assertEqual(code, 0, out)
        self.assertIn(GREEN_PASS, out)
        self.assert_skipped(out, "jr-green", [first, second])

    def test_jr_green_untagged_commit_counts_as_own(self) -> None:
        """AC-10: a commit with no id counts as a commit of the track (fail closed)."""
        login = self.login_commits()
        self.change("src/misc.py", "feat: add a helper")
        code, out = self.gate()
        self.assertEqual(code, 0, out)
        self.assertIn(GREEN_PASS, out)
        self.assert_skipped(out, "jr-green", login)


class UxReviewScopeTest(GateTrackScopeBase):
    def gate(self) -> tuple[int, str]:
        return self.role_gate("ux-browser-review", GREEN_PHASE, result=self.ux_result)

    def look_test_and_login_ui(self) -> tuple[str, str]:
        look = self.change("tests/test_look.py", f"test(look): pin the look rules (track_id: {LOOK})")
        login = self.change("app/src/login.tsx", f"feat(login): add the sign-in page (track_id: {LOGIN})")
        return look, login

    def test_ux_review_other_track_ui_commit_passes(self) -> None:
        """AC-11: a user-facing file of another track does not need PROJECT_DEV_URL."""
        _look, login = self.look_test_and_login_ui()
        code, out = self.gate()
        self.assertEqual(code, 0, out)
        self.assertIn(UX_PASS, out)
        self.assert_skipped(out, "ux-browser-review", [login])
        self.assertNotIn(UX_MSG, out)

    def test_ux_review_own_ui_commit_needs_dev_url(self) -> None:
        """AC-12: a user-facing file of the track still needs PROJECT_DEV_URL."""
        self.look_test_and_login_ui()
        self.change("app/src/look.tsx", f"feat(look): change the look page (track_id: {LOOK})")
        code, out = self.gate()
        self.assertEqual(code, 1, out)
        self.assertIn(UX_MSG, out.splitlines())

    def test_ux_review_working_tree_change_counts(self) -> None:
        """AC-13: an unstaged change has no track id, so it always counts."""
        self.look_test_and_login_ui()
        self.write("app/src/a.tsx", "export const a = 2;\n")
        code, out = self.gate()
        self.assertEqual(code, 1, out)
        self.assertIn(UX_MSG, out.splitlines())

    def test_ux_review_staged_change_counts(self) -> None:
        """AC-13: a staged change has no track id, so it always counts (Review A F1)."""
        self.look_test_and_login_ui()
        self.write("app/src/a.tsx", "export const a = 2;\n")
        self.git("add", "app/src/a.tsx")
        code, out = self.gate()
        self.assertEqual(code, 1, out)
        self.assertIn(UX_MSG, out.splitlines())

    def test_ux_review_unlistable_own_commit_fails(self) -> None:
        """AC-14: a commit of the track whose files git cannot list fails the gate."""
        look, _login = self.look_test_and_login_ui()
        self.unlist(look)
        code, out = self.gate()
        self.assertEqual(code, 1, out)
        self.assertIn(f"FAIL: ux-browser-review could not list the files of commit {look[:12]}", out.splitlines())
        self.assertNotIn(UX_PASS, out)


class UxPathsScopeTest(GateTrackScopeBase):
    def look_and_login_ui(self) -> tuple[str, str]:
        look = self.change("app/src/look.tsx", f"feat(look): change the look page (track_id: {LOOK})")
        login = self.change("app/src/login.tsx", f"feat(login): add the sign-in page (track_id: {LOGIN})")
        return look, login

    def test_ux_paths_track_option_scopes_stdout(self) -> None:
        """AC-15: with --track, stdout lists only the paths of the track, and stderr names the skips."""
        _look, login = self.look_and_login_ui()
        code, out, err = self.ux_paths("--track", LOOK)
        self.assertEqual(code, 0, out + err)
        self.assertEqual(out.splitlines(), ["app/src/look.tsx"])
        self.assertEqual(err.splitlines(), [info_line("ux-paths", 1), f"INFO: - {login[:12]} {LOGIN}"])

    def test_ux_paths_without_track_keeps_full_range(self) -> None:
        """AC-16: with no --track, the command keeps the full range and writes nothing to stderr."""
        self.look_and_login_ui()
        code, out, err = self.ux_paths()
        self.assertEqual(code, 0, out + err)
        self.assertEqual(sorted(out.splitlines()), ["app/src/login.tsx", "app/src/look.tsx"])
        self.assertEqual(err, "")

    def test_ux_paths_require_with_only_other_tracks_fails(self) -> None:
        """AC-17: --require fails when only commits of other tracks change user-facing files."""
        self.change("app/src/login.tsx", f"feat(login): add the sign-in page (track_id: {LOGIN})")
        code, out, err = self.ux_paths("--track", LOOK, "--require")
        self.assertEqual(code, 1, out + err)
        self.assertEqual(out.splitlines(), ["FAIL: no UX-relevant paths found"])

    def test_ux_paths_unlistable_own_commit_fails(self) -> None:
        """AC-18: a commit of the track whose files git cannot list fails the command, with no path."""
        look, _login = self.look_and_login_ui()
        self.unlist(look)
        code, out, err = self.ux_paths("--track", LOOK)
        self.assertEqual(code, 1, out + err)
        self.assertEqual(out.splitlines(), [f"FAIL: ux-paths could not list the files of commit {look[:12]}"])


if __name__ == "__main__":
    unittest.main()
