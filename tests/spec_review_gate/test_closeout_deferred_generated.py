"""S2 contract tests: closeout needs a done SHA on deferred closeout tasks.

A deferred task of the closeout phase cites its done SHA on the line. The
closeout phase is the last phase of the plan, or a task whose text names
records, closeout, or regenerate. Deferred tasks in earlier phases keep the
old rule and give no feedback.

Each case builds a closeout archive fixture in a temporary repository. The
fixture track is `demo_track`; no test reads the real track folder. Each
failure case asserts its exact message (A4).
"""

from __future__ import annotations

import contextlib
import copy
import io
import json
import os
import shutil
import tempfile
import unittest
import unittest.mock
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CHECKER = ROOT / "skills" / "measure-orchestrator" / "scripts" / "measure_interphase_checks.py"

import sys

sys.path.insert(0, str(CHECKER.parent))
import measure_interphase_checks as mic  # noqa: E402

TRACK = "demo_track"
DESCRIPTION = "Demo track."

CLOSEOUT_PLAN = """# Plan

## Phase 1: Fixture

- [x] Task 1.1: Fixture task abc1234

## Phase 2: Records and closeout

- [x] Task 2.1: Records task def5678
"""


class CloseoutDeferredGeneratedTest(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = tempfile.mkdtemp(prefix="closeout_deferred_generated_")
        self.addCleanup(shutil.rmtree, self.tmp, ignore_errors=True)
        self.repo = Path(self.tmp) / "repo"
        self.archive = self.repo / "measure" / "archive" / TRACK
        self.archive.mkdir(parents=True)
        (self.repo / "measure" / "index.md").write_text("# Measure\n", encoding="utf-8")
        (self.repo / "measure" / "tracks.md").write_text(
            "# Project Tracks\n\n## Active Tracks\n\n- (none)\n\n---\n\n## Archived Tracks\n\n"
            f"- [x] **Track: Demo track**\n  *Link: [./archive/{TRACK}/](./archive/{TRACK}/)*\n  *{DESCRIPTION}*\n",
            encoding="utf-8",
        )
        metadata = {
            "track_id": TRACK,
            "type": "fix",
            "status": "done",
            "created_at": "2026-11-19T00:00:00Z",
            "updated_at": "2026-11-19T00:00:00Z",
            "description": DESCRIPTION,
            "estimated_tasks": 2,
            "actual_tasks": 2,
            "completed": "2026-11-19",
            "lane": "light",
        }
        (self.archive / "metadata.json").write_text(json.dumps(metadata), encoding="utf-8")
        (self.archive / mic.CLOSEOUT_MANIFEST).write_text("{}", encoding="utf-8")
        self.write_plan(CLOSEOUT_PLAN)

    # ------------------------------------------------------------------ helpers
    def write_plan(self, text: str) -> None:
        (self.archive / "plan.md").write_text(text, encoding="utf-8")

    def plan_feedback(self) -> list[str]:
        return mic.plan_closeout_feedback(self.archive / "plan.md")

    def closeout_feedback(self) -> tuple[list[str], str]:
        stdout = io.StringIO()
        with contextlib.redirect_stdout(stdout):
            feedback = mic.closeout_feedback(self.repo, TRACK)
        return feedback, stdout.getvalue()

    # ------------------------------------------------------------------ deferred
    def test_deferred_closeout_task_with_sha_passes(self) -> None:
        self.write_plan(CLOSEOUT_PLAN.replace(
            "- [x] Task 2.1: Records task def5678",
            "- [x] Task 2.1: Records task def5678\n- [ ] Regenerate the board (deferred:owner) abc1234",
        ))
        self.assertEqual(self.plan_feedback(), [])

    def test_deferred_closeout_task_without_sha_fails(self) -> None:
        self.write_plan(CLOSEOUT_PLAN.replace(
            "- [x] Task 2.1: Records task def5678",
            "- [x] Task 2.1: Records task def5678\n- [ ] Regenerate the board (deferred:owner)",
        ))
        feedback = self.plan_feedback()
        self.assertEqual(len(feedback), 1)
        self.assertIn("deferred closeout task lacks done SHA", feedback[0])
        self.assertIn("Regenerate the board", feedback[0])

    def test_deferred_closeout_word_in_earlier_phase_fails(self) -> None:
        self.write_plan(CLOSEOUT_PLAN.replace(
            "- [x] Task 1.1: Fixture task abc1234",
            "- [x] Task 1.1: Fixture task abc1234\n- [ ] Closeout the board (deferred:owner)",
        ))
        feedback = self.plan_feedback()
        self.assertEqual(len(feedback), 1)
        self.assertIn("deferred closeout task lacks done SHA", feedback[0])

    def test_deferred_task_in_earlier_phase_keeps_the_old_rule(self) -> None:
        self.write_plan(CLOSEOUT_PLAN.replace(
            "- [x] Task 1.1: Fixture task abc1234",
            "- [x] Task 1.1: Fixture task abc1234\n- [ ] Old probe (deferred:owner)",
        ))
        self.assertEqual(self.plan_feedback(), [])

    # ------------------------------------------------------------------ generated
    def test_closeout_gate_reports_the_deferred_sha_failure(self) -> None:
        self.write_plan(CLOSEOUT_PLAN.replace(
            "- [x] Task 2.1: Records task def5678",
            "- [x] Task 2.1: Records task def5678\n- [ ] Regenerate the board (deferred:owner)",
        ))
        feedback, _ = self.closeout_feedback()
        self.assertIn("deferred closeout task lacks done SHA", "\n".join(feedback))


if __name__ == "__main__":
    unittest.main()
