"""Generated check error names the gates.json path and state.

Env wins over gates.json. The env and gates.json pass cases pin that order. Each missing state names the key, the absolute path, and the state. A missing generated folder skips the check.
"""

from __future__ import annotations

import contextlib
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


class GeneratedGatesJsonTest(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = tempfile.mkdtemp(prefix="generated_gates_json_")
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
        (self.archive / "plan.md").write_text(CLOSEOUT_PLAN, encoding="utf-8")
        (self.repo / "measure" / "generated").mkdir(parents=True, exist_ok=True)

    def write_gates(self, payload: dict) -> None:
        (self.repo / "measure" / "gates.json").write_text(json.dumps(payload), encoding="utf-8")

    def closeout_feedback(self) -> list[str]:
        stdout = io.StringIO()
        with contextlib.redirect_stdout(stdout):
            return mic.closeout_feedback(self.repo, TRACK)

    def test_key_in_env_only_passes(self) -> None:
        with unittest.mock.patch.dict(os.environ, {"GENERATED_CHECK_COMMAND": "true"}, clear=False):
            self.assertEqual(self.closeout_feedback(), [])

    def test_key_in_gates_json_only_passes(self) -> None:
        self.write_gates({"GENERATED_CHECK_COMMAND": "true"})
        with unittest.mock.patch.dict(os.environ, {}, clear=False):
            os.environ.pop("GENERATED_CHECK_COMMAND", None)
            self.assertEqual(self.closeout_feedback(), [])

    def test_key_in_neither_names_key_and_file(self) -> None:
        with unittest.mock.patch.dict(os.environ, {}, clear=False):
            os.environ.pop("GENERATED_CHECK_COMMAND", None)
            feedback = self.closeout_feedback()
        self.assertEqual(len(feedback), 1)
        self.assertIn("GENERATED_CHECK_COMMAND", feedback[0])
        self.assertIn("measure/gates.json", feedback[0])

    def test_missing_file_names_missing_state(self) -> None:
        with unittest.mock.patch.dict(os.environ, {}, clear=False):
            os.environ.pop("GENERATED_CHECK_COMMAND", None)
            feedback = self.closeout_feedback()
        self.assertEqual(len(feedback), 1)
        gates_path = str(self.repo / "measure" / "gates.json")
        self.assertIn("GENERATED_CHECK_COMMAND", feedback[0])
        self.assertIn(gates_path, feedback[0])
        self.assertIn("(file missing)", feedback[0])

    def test_unreadable_file_names_unreadable_state(self) -> None:
        (self.repo / "measure" / "gates.json").write_text("{bad json", encoding="utf-8")
        with unittest.mock.patch.dict(os.environ, {}, clear=False):
            os.environ.pop("GENERATED_CHECK_COMMAND", None)
            feedback = self.closeout_feedback()
        self.assertEqual(len(feedback), 1)
        gates_path = str(self.repo / "measure" / "gates.json")
        self.assertIn("GENERATED_CHECK_COMMAND", feedback[0])
        self.assertIn(gates_path, feedback[0])
        self.assertIn("(file unreadable or not a JSON object)", feedback[0])

    def test_key_absent_names_absent_state(self) -> None:
        self.write_gates({})
        with unittest.mock.patch.dict(os.environ, {}, clear=False):
            os.environ.pop("GENERATED_CHECK_COMMAND", None)
            feedback = self.closeout_feedback()
        self.assertEqual(len(feedback), 1)
        gates_path = str(self.repo / "measure" / "gates.json")
        self.assertIn("GENERATED_CHECK_COMMAND", feedback[0])
        self.assertIn(gates_path, feedback[0])
        self.assertIn("(key absent)", feedback[0])

    def test_env_wins_over_gates_json(self) -> None:
        self.write_gates({"GENERATED_CHECK_COMMAND": "false"})
        with unittest.mock.patch.dict(os.environ, {"GENERATED_CHECK_COMMAND": "true"}, clear=False):
            self.assertEqual(self.closeout_feedback(), [])


if __name__ == "__main__":
    unittest.main()
