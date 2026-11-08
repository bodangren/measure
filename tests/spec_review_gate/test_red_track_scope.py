"""Track scope tests for `role-gate --role mid-red` (track red_gate_track_scope_20261108).

Each case builds a temporary git repository with two tracks, `look_track` and
`login_track`, and runs the checker of this repository as a subprocess. The gate
checks `look_track`. A commit of `login_track` carries its id in the subject tag
`(track_id: login_track)` or in a body line `track_id: login_track`. Each
subprocess gets an explicit environment with `RED_TEST_COMMAND=false`, so no
host gate variable and no host git configuration reaches it.
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

LOOK = "look_track"
LOGIN = "login_track"
PHASE = "Phase 1: Red"
PASS_LINE = "PASS: mid-red gate passed"
NON_TEST_MSG = "Mid Red changed non-test/non-Measure files"
NO_OWN_MSG = f"expected committed Red-phase test change, but baseline..HEAD has no commit of track {LOOK}"


def info_line(count: int) -> str:
    return f"INFO: mid-red skipped {count} commits of other tracks"


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


class RedTrackScopeTest(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = tempfile.mkdtemp(prefix="red_track_scope_")
        self.addCleanup(shutil.rmtree, self.tmp, ignore_errors=True)
        self.repo = Path(self.tmp) / "repo"
        self.repo.mkdir()
        self.git("init", "-q", "-b", "main")
        self.write("measure/index.md", "# Measure\n")
        self.write("measure/tracks.md", "# Tracks\n")
        self.write(f"measure/tracks/{LOOK}/plan.md", "# Plan\n\n## Phase 1: Red\n\n- [~] Task 1.1: Red tests\n")
        self.write(f"measure/tracks/{LOGIN}/plan.md", "# Plan\n\n## Phase 1: Login\n\n- [~] Task 1.1: Login\n")
        self.write("measure/archive/stray.md", "a file, not a track folder\n")
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

    def gate(self, *, baseline: str | None = None, env: dict[str, str] | None = None) -> tuple[int, str]:
        proc = subprocess.run(
            [
                sys.executable,
                "-I",
                str(CHECKER),
                "role-gate",
                "--repo",
                str(self.repo),
                "--role",
                "mid-red",
                "--track",
                LOOK,
                "--phase",
                PHASE,
                "--baseline",
                baseline or self.baseline,
            ],
            cwd=self.tmp,
            env=env if env is not None else clean_env(),
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            check=False,
        )
        self.assertNotIn("Traceback", proc.stdout)
        return proc.returncode, proc.stdout

    def look_test_and_plan(self) -> None:
        self.change("tests/test_look.py", f"test(look): pin the look rules (track_id: {LOOK})")
        self.write(f"measure/tracks/{LOOK}/plan.md", "# Plan\n\n## Phase 1: Red\n\n- [~] Task 1.1: Red tests (evidence)\n")
        self.commit(f"chore(measure): record the look Red evidence (track_id: {LOOK})")

    def login_production(self) -> list[str]:
        return [
            self.change("src/login.py", f"feat(login): add the sign-in form (track_id: {LOGIN})"),
            self.change("packages/db/schema.sql", f"fix(db): lock the account row (track_id: {LOGIN})"),
        ]

    # ------------------------------------------------------------- the request
    def test_mixed_range_passes_when_own_commits_are_test_or_plan(self) -> None:
        """AC-1: commits of another track that touch production code do not fail the gate."""
        self.change("tests/test_look.py", f"test(look): pin the look rules (track_id: {LOOK})")
        first = self.change("src/login.py", f"feat(login): add the sign-in form (track_id: {LOGIN})")
        self.write(f"measure/tracks/{LOOK}/plan.md", "# Plan\n\n## Phase 1: Red\n\n- [~] Task 1.1: Red tests (evidence)\n")
        self.commit(f"chore(measure): record the look Red evidence (track_id: {LOOK})")
        second = self.change("packages/db/schema.sql", f"fix(db): lock the account row (track_id: {LOGIN})")
        code, out = self.gate()
        self.assertEqual(code, 0, out)
        self.assertIn(PASS_LINE, out)
        self.assertNotIn(NON_TEST_MSG, out)
        self.assertIn(info_line(2), out)
        lines = out.splitlines()
        # git log order: the newest commit comes first.
        self.assertIn(f"INFO: - {second[:12]} {LOGIN}", lines)
        self.assertIn(f"INFO: - {first[:12]} {LOGIN}", lines)
        self.assertLess(lines.index(f"INFO: - {second[:12]} {LOGIN}"), lines.index(f"INFO: - {first[:12]} {LOGIN}"))
        self.assertNotIn("src/login.py", out)
        self.assertNotIn("packages/db/schema.sql", out)

    def test_mixed_range_fails_when_own_commit_touches_production(self) -> None:
        """AC-2: a production file in a commit of the track fails the gate, and only that file is listed."""
        self.look_test_and_plan()
        self.login_production()
        self.change("src/look.py", f"feat(look): change the look code (track_id: {LOOK})")
        code, out = self.gate()
        self.assertEqual(code, 1, out)
        self.assertIn(NON_TEST_MSG, out)
        self.assertIn("FAIL: - src/look.py", out.splitlines())
        self.assertNotIn("src/login.py", out)
        self.assertNotIn("packages/db/schema.sql", out)
        self.assertNotIn(PASS_LINE, out)

    # ------------------------------------------------------------ the id forms
    def test_body_line_marks_another_track(self) -> None:
        """AC-3: a body line `track_id: <id>` marks a commit of another track."""
        self.look_test_and_plan()
        self.change("src/login.py", "feat(login): add the sign-in form", "Adds the form.", f"track_id: {LOGIN}")
        code, out = self.gate()
        self.assertEqual(code, 0, out)
        self.assertIn(PASS_LINE, out)
        self.assertIn(info_line(1), out)
        self.assertNotIn("src/login.py", out)

    # ------------------------------------------------------------ fail closed
    def test_untagged_commit_counts_as_own(self) -> None:
        """AC-4: a commit with no id is a commit of the track."""
        self.look_test_and_plan()
        self.login_production()
        self.change("src/misc.py", "feat: add a helper")
        code, out = self.gate()
        self.assertEqual(code, 1, out)
        self.assertIn(NON_TEST_MSG, out)
        self.assertIn("FAIL: - src/misc.py", out.splitlines())
        self.assertIn(info_line(2), out)
        self.assertNotIn("src/login.py", out)

    def test_unknown_track_id_counts_as_own(self) -> None:
        """AC-4: an id that names no track folder does not move a commit out of the scope."""
        self.look_test_and_plan()
        self.login_production()
        self.change("src/ghost.py", "feat: add the ghost code (track_id: ghost_track)")
        code, out = self.gate()
        self.assertEqual(code, 1, out)
        self.assertIn("FAIL: - src/ghost.py", out.splitlines())
        self.assertIn(info_line(2), out)

    def test_commit_with_both_ids_counts_as_own(self) -> None:
        """AC-4: a commit that also names the track under check is a commit of the track."""
        self.look_test_and_plan()
        self.login_production()
        self.change("src/shared.py", f"feat: share the session code (track_id: {LOGIN}) (track_id: {LOOK})")
        self.change("src/shared_body.py", f"feat: share more code (track_id: {LOGIN})", f"track_id: {LOOK}")
        code, out = self.gate()
        self.assertEqual(code, 1, out)
        lines = out.splitlines()
        self.assertIn("FAIL: - src/shared.py", lines)
        self.assertIn("FAIL: - src/shared_body.py", lines)
        self.assertIn(info_line(2), out)

    def test_malformed_tag_counts_as_own(self) -> None:
        """AC-4: text outside the two id forms or the id grammar gives no id."""
        cases = [
            ("dot-dot id", ["feat: x (track_id: ..)"]),
            ("path id", [f"feat: x (track_id: {LOGIN}/..)"]),
            ("file, not a folder", ["feat: x (track_id: stray.md)"]),
            ("empty id", ["feat: x (track_id: )"]),
            ("no closing parenthesis", [f"feat: x (track_id: {LOGIN}"]),
            ("other key case in the subject", [f"feat: x (Track_Id: {LOGIN})"]),
            ("other key case in the body", ["feat: x", f"Track_Id: {LOGIN}"]),
            ("body line with more text", ["feat: x", f"see track_id: {LOGIN}"]),
            ("body tag form, not a line", ["feat: x", f"(track_id: {LOGIN})"]),
        ]
        for index, (label, message) in enumerate(cases):
            with self.subTest(case=label):
                base = self.head()
                self.change(f"src/login_{index}.py", f"feat(login): add part {index} (track_id: {LOGIN})")
                self.change(f"src/m{index}.py", *message)
                code, out = self.gate(baseline=base)
                self.assertEqual(code, 1, out)
                self.assertIn(f"FAIL: - src/m{index}.py", out.splitlines())
                self.assertIn(info_line(1), out)
                self.assertNotIn(f"src/login_{index}.py", out)

    # ------------------------------------------------------- no own commit
    def test_range_without_own_commit_fails(self) -> None:
        """AC-5: a range with only commits of other tracks has no Red change."""
        self.change("tests/test_login.py", f"test(login): pin the sign-in (track_id: {LOGIN})")
        self.login_production()
        code, out = self.gate()
        self.assertEqual(code, 1, out)
        self.assertIn(NO_OWN_MSG, out)
        self.assertIn(info_line(3), out)
        self.assertNotIn("src/login.py", out)
        self.assertNotIn(PASS_LINE, out)

    # ------------------------------------------------- rename and merge
    def test_own_rename_into_tests_lists_old_path(self) -> None:
        """AC-6: in the scoped mode, a rename lists its old production path."""
        self.login_production()
        (self.repo / "tests").mkdir()
        self.git("mv", "src/a.py", "tests/a.py")
        self.git("commit", "-q", "-m", f"test(look): move a.py into tests (track_id: {LOOK})")
        env = clean_env(
            {
                "GIT_CONFIG_COUNT": "1",
                "GIT_CONFIG_KEY_0": "diff.renames",
                "GIT_CONFIG_VALUE_0": "true",
            }
        )
        code, out = self.gate(env=env)
        self.assertEqual(code, 1, out)
        lines = out.splitlines()
        self.assertIn(NON_TEST_MSG, out)
        self.assertIn("FAIL: - src/a.py", lines)
        self.assertNotIn("FAIL: - tests/a.py", lines)
        self.assertIn(info_line(2), out)

    def test_own_merge_change_is_listed(self) -> None:
        """AC-7: a merge commit of the track lists the paths that the merge changes itself."""
        self.git("checkout", "-q", "-b", "login")
        self.change("src/login.py", f"feat(login): add the sign-in form (track_id: {LOGIN})")
        self.git("checkout", "-q", "main")
        self.look_test_and_plan()
        self.git("merge", "-q", "--no-ff", "--no-commit", "login")
        self.write("src/merge_only.py", "# written in the merge\n")
        self.git("add", "src/merge_only.py")
        self.git("commit", "-q", "-m", "Merge branch 'login'")
        code, out = self.gate()
        self.assertEqual(code, 1, out)
        lines = out.splitlines()
        self.assertIn("FAIL: - src/merge_only.py", lines)
        self.assertNotIn("src/login.py", out)
        self.assertIn(info_line(1), out)

    # ------------------------------------------------- no other track
    def test_single_track_range_prints_no_info(self) -> None:
        """AC-8: a range with no commit of another track keeps the old output."""
        self.look_test_and_plan()
        self.change("tests/test_more.py", "test: add one more case")
        code, out = self.gate()
        self.assertEqual(code, 0, out)
        self.assertEqual(out.strip(), PASS_LINE)


if __name__ == "__main__":
    unittest.main()
