"""Heavy-run wrapper and exclude tests for `role-gate` (track role_gate_heavy_run_20261118).

The gate runs each gate command through a heavy-run wrapper when one is set.
The wrapper resolves in this order: `--runner <path>`, the `MEASURE_HEAVY_RUN`
env var, then `heavy-run.sh` on PATH. With no wrapper, the gate runs the
command directly and prints one note line. The wrapper takes the gate shell
string with `-c` and returns the command exit code.

`--exclude <file>` is repeatable. Each excluded file stays out of the gate
test run. A gate command that names no matching test file fails closed
instead of running the file. Each excluded file prints one INFO line.

Each case runs the checker of the repository as a subprocess in a temporary
git repository with a jr-green fixture (an `[x]` plan task with a SHA, a
Green commit past the baseline, and a valid result block). Each subprocess
gets an explicit environment, so no host gate variable reaches it.
"""

from __future__ import annotations

import os
import shutil
import stat
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CHECKER = ROOT / "skills" / "measure-orchestrator" / "scripts" / "measure_interphase_checks.py"

TRACK = "demo_track"
PHASE = "Phase S1: Fixture"
PASS_LINE = "PASS: jr-green gate passed"
NO_WRAPPER_NOTE = "INFO: no heavy-run wrapper found; running gate commands directly"

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


def clean_env(extra: dict[str, str] | None = None) -> dict[str, str]:
    """Build an explicit environment. Nothing from the host gate variables is copied."""
    env = {
        "PATH": "/usr/bin:/bin",
        "HOME": "/nonexistent-home-for-test",
        "LC_ALL": "C.UTF-8",
        "GIT_CONFIG_GLOBAL": "/dev/null",
        "GIT_CONFIG_NOSYSTEM": "1",
        "PYTHONDONTWRITEBYTECODE": "1",
    }
    if extra:
        env.update(extra)
    return env


def write_wrapper(path: Path, log: Path) -> None:
    """Write a fake heavy-run wrapper: log the call, run the -c string, keep its exit code."""
    path.write_text(
        "#!/bin/bash\n"
        f'echo "wrapper called: $*" >> "{log}"\n'
        'if [ "$1" = "-c" ]; then\n'
        "  shift\n"
        '  bash -c "$1"\n'
        "  exit $?\n"
        "fi\n"
        'exec "$@"\n',
        encoding="utf-8",
    )
    path.chmod(path.stat().st_mode | stat.S_IXUSR | stat.S_IXGRP | stat.S_IXOTH)


class RoleGateHeavyRunTest(unittest.TestCase):
    """End-to-end heavy-run wrapper and --exclude tests on the jr-green gate."""

    def setUp(self) -> None:
        self.tmp = tempfile.mkdtemp(prefix="role_gate_heavy_run_")
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
        self.write_log([*BLOCK_LINES, "END_MEASURE_AGENT_RESULT"])

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

    def make_wrapper(self, name: str) -> tuple[Path, Path]:
        script = Path(self.tmp) / name
        log = Path(self.tmp) / f"{name}.log"
        write_wrapper(script, log)
        return script, log

    def gate(
        self,
        *,
        green: str = "true",
        runner: str | None = None,
        excludes: list[str] | None = None,
        env: dict[str, str] | None = None,
    ) -> tuple[int, str]:
        args = [
            "role-gate", "--repo", str(self.repo), "--role", "jr-green",
            "--track", TRACK, "--phase", PHASE, "--baseline", self.baseline,
            "--log-file", str(self.log),
        ]
        if runner is not None:
            args += ["--runner", runner]
        for item in excludes or []:
            args += ["--exclude", item]
        base = clean_env({"GREEN_TEST_COMMAND": green})
        if env:
            base.update(env)
        proc = subprocess.run(
            [sys.executable, "-I", str(CHECKER), *args],
            cwd=self.tmp,
            env=base,
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            check=False,
        )
        return proc.returncode, proc.stdout

    def assert_gate_pass(self, **kwargs: object) -> str:
        code, out = self.gate(**kwargs)  # type: ignore[arg-type]
        self.assertEqual(code, 0, f"exit {code}, expected 0; output:\n{out}")
        self.assertNotIn("Traceback", out)
        self.assertIn(PASS_LINE, out)
        return out

    def assert_gate_fails(self, message: str, **kwargs: object) -> str:
        code, out = self.gate(**kwargs)  # type: ignore[arg-type]
        self.assertEqual(code, 1, f"exit {code}, expected 1; output:\n{out}")
        self.assertNotIn("Traceback", out)
        self.assertIn(message, out)
        self.assertNotIn(PASS_LINE, out)
        return out

    # ------------------------------------------------------------------ wrapper
    def test_wrapper_from_flag_runs_the_command(self) -> None:
        """Case 1: --runner sends the gate command through the wrapper."""
        script, log = self.make_wrapper("flag_wrapper.sh")
        out = self.assert_gate_pass(runner=str(script))
        self.assertIn("wrapper called:", log.read_text(encoding="utf-8"))
        self.assertNotIn(NO_WRAPPER_NOTE, out)

    def test_wrapper_from_env_runs_the_command(self) -> None:
        """Case 2: MEASURE_HEAVY_RUN sends the gate command through the wrapper."""
        script, log = self.make_wrapper("env_wrapper.sh")
        out = self.assert_gate_pass(env={"MEASURE_HEAVY_RUN": str(script)})
        self.assertIn("wrapper called:", log.read_text(encoding="utf-8"))
        self.assertNotIn(NO_WRAPPER_NOTE, out)

    def test_wrapper_flag_wins_over_env(self) -> None:
        """Case 3: --runner wins over MEASURE_HEAVY_RUN."""
        flag_script, flag_log = self.make_wrapper("order_flag.sh")
        env_script, env_log = self.make_wrapper("order_env.sh")
        self.assert_gate_pass(
            runner=str(flag_script), env={"MEASURE_HEAVY_RUN": str(env_script)}
        )
        self.assertIn("wrapper called:", flag_log.read_text(encoding="utf-8"))
        self.assertFalse(env_log.exists(), "the env wrapper must not run when --runner is set")

    def test_no_wrapper_runs_direct_with_note(self) -> None:
        """Case 4: no wrapper runs the command directly and prints one note line."""
        out = self.assert_gate_pass()
        self.assertIn(NO_WRAPPER_NOTE, out)
        self.assertEqual(out.count(NO_WRAPPER_NOTE), 1)

    # ------------------------------------------------------------------ exit code
    def test_exit_code_zero_passes_through_wrapper(self) -> None:
        """Case 5: a passing command through the wrapper passes the gate."""
        script, log = self.make_wrapper("zero_wrapper.sh")
        self.assert_gate_pass(green="true", runner=str(script))
        self.assertIn("wrapper called:", log.read_text(encoding="utf-8"))

    def test_exit_code_nonzero_passes_through_wrapper(self) -> None:
        """Case 6: a failing command through the wrapper fails the gate."""
        script, log = self.make_wrapper("nonzero_wrapper.sh")
        out = self.assert_gate_fails("GREEN_TEST_COMMAND failed", green="false", runner=str(script))
        self.assertIn("wrapper called:", log.read_text(encoding="utf-8"))
        self.assertIn("exit 1", out)

    # ------------------------------------------------------------------ excludes
    def test_one_exclude_leaves_the_file_out(self) -> None:
        """Case 7: one --exclude file is missing from the command the wrapper runs."""
        script, log = self.make_wrapper("exclude_one.sh")
        out = self.assert_gate_pass(
            green="echo a.test.js b.test.js c.test.js",
            runner=str(script),
            excludes=["b.test.js"],
        )
        self.assertIn("INFO: excluded b.test.js", out)
        logged = log.read_text(encoding="utf-8")
        self.assertIn("a.test.js", logged)
        self.assertIn("c.test.js", logged)
        self.assertNotIn("b.test.js", logged)

    def test_two_excludes_leave_both_files_out(self) -> None:
        """Case 8: two --exclude files are both missing from the command the wrapper runs."""
        script, log = self.make_wrapper("exclude_two.sh")
        out = self.assert_gate_pass(
            green="echo a.test.js b.test.js c.test.js",
            runner=str(script),
            excludes=["b.test.js", "c.test.js"],
        )
        self.assertIn("INFO: excluded b.test.js", out)
        self.assertIn("INFO: excluded c.test.js", out)
        logged = log.read_text(encoding="utf-8")
        self.assertIn("a.test.js", logged)
        self.assertNotIn("b.test.js", logged)
        self.assertNotIn("c.test.js", logged)

    def test_exclude_applies_to_a_glob_selection(self) -> None:
        """Case 9: a glob that selects the excluded file becomes the other files."""
        self.write("tests/g_a.test.js", "pass\n")
        self.write("tests/g_b.test.js", "pass\n")
        script, log = self.make_wrapper("exclude_glob.sh")
        out = self.assert_gate_pass(
            green="echo tests/g_*.test.js",
            runner=str(script),
            excludes=["tests/g_b.test.js"],
        )
        self.assertIn("INFO: excluded tests/g_b.test.js", out)
        logged = log.read_text(encoding="utf-8")
        self.assertIn("tests/g_a.test.js", logged)
        self.assertNotIn("tests/g_b.test.js", logged)
        self.assertNotIn("g_*", logged)

    def test_exclude_command_cannot_take_fails_closed(self) -> None:
        """Case 10: a command that names no matching test file fails instead of running it."""
        script, log = self.make_wrapper("exclude_closed.sh")
        marker = Path(self.tmp) / "must_not_run"
        out = self.assert_gate_fails(
            "--exclude missing.test.js cannot be applied to GREEN_TEST_COMMAND",
            green=f"touch {marker} && echo done",
            runner=str(script),
            excludes=["missing.test.js"],
        )
        self.assertIn("INFO: excluded missing.test.js", out)
        self.assertFalse(marker.exists(), "the gate command must not run when the exclude cannot apply")
        self.assertFalse(log.exists(), "the wrapper must not run when the exclude cannot apply")


if __name__ == "__main__":
    unittest.main()
