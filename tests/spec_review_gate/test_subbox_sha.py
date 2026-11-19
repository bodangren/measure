"""Sub-box SHA tests for plan_closeout_feedback() and closeout_candidates() (track subbox_sha_20261118).

A top-level [x] task line needs a commit SHA. An indented [x] sub-box is
covered when it has its own SHA, or when its nearest parent [x] line is
covered. An unticked box fails at every depth, except a "deferred" line.
Class 1 calls plan_closeout_feedback() on plans in a temporary folder.
Class 2 calls closeout_candidates() on a temporary repository with three
tracks. Each class imports the checker with importlib, as in
test_fixture_paths.py.
"""

from __future__ import annotations

import shutil
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CHECKER = ROOT / "skills" / "measure-orchestrator" / "scripts" / "measure_interphase_checks.py"

SHA = "a1b2c3d"


def checker_module():
    """The checker as an importable module, as in test_fixture_paths.py."""
    import importlib.util

    spec = importlib.util.spec_from_file_location("measure_interphase_checks", CHECKER)
    module = importlib.util.module_from_spec(spec)
    sys.modules["measure_interphase_checks"] = module
    spec.loader.exec_module(module)
    return module


class SubboxShaFeedbackTest(unittest.TestCase):
    """Class 1 (unit): plan_closeout_feedback() on plans of the Tests section."""

    @classmethod
    def setUpClass(cls) -> None:
        cls.module = checker_module()

    def setUp(self) -> None:
        self.tmp = tempfile.mkdtemp(prefix="subbox_sha_")
        self.addCleanup(shutil.rmtree, self.tmp, ignore_errors=True)

    def plan(self, text: str) -> Path:
        path = Path(self.tmp) / "plan.md"
        path.write_text(text, encoding="utf-8")
        return path

    def test_case_1_sha_parent_covers_subbox(self) -> None:
        """Case 1: a SHA'd top-level [x] covers an indented [x] sub-box."""
        plan = self.plan(
            f"- [x] Task 1.1: Do the work — `{SHA}`\n"
            "  - [x] Add the first sub-step\n"
        )
        self.assertEqual(self.module.plan_closeout_feedback(plan), [])

    def test_case_2_no_sha_parent_fails_parent_and_child(self) -> None:
        """Case 2: a top-level [x] without a SHA fails the parent and the child."""
        plan = self.plan(
            "- [x] Task 1.1: Do the work\n"
            "  - [x] Add the first sub-step\n"
        )
        feedback = self.module.plan_closeout_feedback(plan)
        self.assertEqual(len(feedback), 2)
        for item in feedback:
            self.assertIn("lacks commit SHA", item)
        self.assertIn("Task 1.1", feedback[0])
        self.assertIn("Add the first sub-step", feedback[1])

    def test_case_3_unticked_subbox_fails(self) -> None:
        """Case 3: an indented [ ] sub-box under a SHA'd parent gets one line."""
        plan = self.plan(
            f"- [x] Task 1.1: Do the work — `{SHA}`\n"
            "  - [ ] Add the first sub-step\n"
        )
        feedback = self.module.plan_closeout_feedback(plan)
        self.assertEqual(len(feedback), 1)
        self.assertIn("plan task is not complete", feedback[0])
        self.assertIn("Add the first sub-step", feedback[0])

    def test_case_3b_deferred_subbox_passes(self) -> None:
        """Case 3b: an indented deferred [ ] sub-box gives no feedback."""
        plan = self.plan(
            f"- [x] Task 1.1: Do the work — `{SHA}`\n"
            "  - [ ] Add the first sub-step (deferred)\n"
        )
        self.assertEqual(self.module.plan_closeout_feedback(plan), [])

    def test_case_3c_two_level_nesting_passes(self) -> None:
        """Case 3c: a middle line covered by the top covers its own child."""
        plan = self.plan(
            f"- [x] Task 1.1: Do the work — `{SHA}`\n"
            "  - [x] Add the first sub-step\n"
            "    - [x] Add a nested sub-step\n"
        )
        self.assertEqual(self.module.plan_closeout_feedback(plan), [])


class SubboxShaCandidatesTest(unittest.TestCase):
    """Class 2 (end to end): closeout_candidates() on a temporary repository."""

    @classmethod
    def setUpClass(cls) -> None:
        cls.module = checker_module()

    def setUp(self) -> None:
        self.tmp = tempfile.mkdtemp(prefix="subbox_sha_repo_")
        self.addCleanup(shutil.rmtree, self.tmp, ignore_errors=True)
        self.repo = Path(self.tmp)
        for name in ("passes", "fails", "open"):
            (self.repo / "measure" / "tracks" / name).mkdir(parents=True)
        self.write("passes", f"- [x] Task 1.1: Do the work — `{SHA}`\n  - [x] Add the first sub-step\n")
        self.write("fails", "- [x] Task 1.1: Do the work\n  - [x] Add the first sub-step\n")
        self.write("open", "- [ ] Task 1.1: Do the work\n")

    def write(self, track: str, text: str) -> None:
        path = self.repo / "measure" / "tracks" / track / "plan.md"
        path.write_text(text, encoding="utf-8")

    def plan(self, track: str) -> Path:
        return self.repo / "measure" / "tracks" / track / "plan.md"

    def test_case_4_candidates_equal_the_gate_passes(self) -> None:
        """Case 4: status candidates are the tracks with no closeout feedback."""
        expected = sorted(
            track
            for track in ("passes", "fails", "open")
            if self.module.plan_closeout_feedback(self.plan(track)) == []
        )
        self.assertEqual(self.module.closeout_candidates(self.repo, ""), expected)
        self.assertEqual(expected, ["passes"])


if __name__ == "__main__":
    unittest.main()
