"""Closeout ignores nested sub-boxes (track closeout_nested_subboxes_20261124).

An indented open box ([ ] or [~], indent greater than 0) gives no
``plan task is not complete`` line when its nearest shallower-indent
parent in ``processed`` is (a) an [x] line, covered or not, or (b) itself
an ignored nested open box. A top-level (indent 0) open box always
fails. An open box whose nearest parent is a non-ignored open box still
fails. A parent line that carries the word ``deferred`` never grants the
ignore. A nested [x] box keeps the SHA-coverage rule. ``track_incomplete``
already ignores nested boxes. Class 1 calls plan_closeout_feedback() on
plans in a temporary folder. Class 2 calls closeout_candidates() on a
temporary repository with two tracks. Each class imports the checker with
importlib, as in test_subbox_sha.py.

Red state: the ignore cases fail before the checker edit (each indented
open box still reports ``plan task is not complete``). The boundary cases
(top-level boxes, deferred parents, track_incomplete) already pass and
stay passing after the fix.
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
    """The checker as an importable module, as in test_subbox_sha.py."""
    import importlib.util

    spec = importlib.util.spec_from_file_location("measure_interphase_checks", CHECKER)
    module = importlib.util.module_from_spec(spec)
    sys.modules["measure_interphase_checks"] = module
    spec.loader.exec_module(module)
    return module


class CloseoutNestedSubboxesFeedbackTest(unittest.TestCase):
    """Class 1 (unit): plan_closeout_feedback() on fixture plans."""

    @classmethod
    def setUpClass(cls) -> None:
        cls.module = checker_module()

    def setUp(self) -> None:
        self.tmp = tempfile.mkdtemp(prefix="closeout_nested_")
        self.addCleanup(shutil.rmtree, self.tmp, ignore_errors=True)

    def plan(self, text: str) -> Path:
        path = Path(self.tmp) / "plan.md"
        path.write_text(text, encoding="utf-8")
        return path

    def test_case_01_math_shape_covered_parents(self) -> None:
        """Math shape: top-level [x] Task lines with SHAs and indented [ ] boxes."""
        plan = self.plan(
            f"- [x] Task 1.1: Migrate the config — `{SHA}`\n"
            "  - [ ] Verify the output\n"
            "  - [ ] Remove the old rule\n"
            f"- [x] Task 1.2: Migrate the rules — `{SHA}`\n"
            "  - [ ] Verify the output\n"
        )
        self.assertEqual(self.module.plan_closeout_feedback(plan), [])

    def test_case_02_top_level_open_task_fails(self) -> None:
        """A top-level [ ] task gives one 'plan task is not complete' line."""
        plan = self.plan("- [ ] Task 1.1: Do the work\n")
        self.assertEqual(
            self.module.plan_closeout_feedback(plan),
            ["plan task is not complete: - [ ] Task 1.1: Do the work"],
        )

    def test_case_03_top_level_in_progress_task_fails(self) -> None:
        """A top-level [~] task gives one 'plan task is not complete' line."""
        plan = self.plan("- [~] Task 1.1: Do the work\n")
        self.assertEqual(
            self.module.plan_closeout_feedback(plan),
            ["plan task is not complete: - [~] Task 1.1: Do the work"],
        )

    def test_case_04_nested_tilde_under_covered_parent(self) -> None:
        """A nested [~] box under a covered [x] parent gives []."""
        plan = self.plan(
            f"- [x] Task 1.1: Do the work — `{SHA}`\n"
            "  - [~] Add the first sub-step\n"
        )
        self.assertEqual(self.module.plan_closeout_feedback(plan), [])

    def test_case_05_two_levels_under_covered_parents(self) -> None:
        """A [ ] box two levels under covered [x] boxes gives []."""
        plan = self.plan(
            f"- [x] Task 1.1: Do the work — `{SHA}`\n"
            "  - [x] Add the first sub-step\n"
            "    - [ ] Check an edge case\n"
        )
        self.assertEqual(self.module.plan_closeout_feedback(plan), [])

    def test_case_06_open_box_under_top_level_tilde(self) -> None:
        """A [ ] box under a top-level [~] gives two lines: parent and box."""
        plan = self.plan(
            "- [~] Task 1.1: Do the work\n"
            "  - [ ] Add the first sub-step\n"
        )
        self.assertEqual(
            self.module.plan_closeout_feedback(plan),
            [
                "plan task is not complete: - [~] Task 1.1: Do the work",
                "plan task is not complete: - [ ] Add the first sub-step",
            ],
        )

    def test_case_07_tab_indented_subbox_ignored(self) -> None:
        """A tab-indented [ ] box under a covered [x] parent gives []."""
        plan = self.plan(
            f"- [x] Task 1.1: Do the work — `{SHA}`\n"
            "\t- [ ] Add the first sub-step\n"
        )
        self.assertEqual(self.module.plan_closeout_feedback(plan), [])

    def test_case_08_open_box_under_ignored_open_box(self) -> None:
        """A [ ] box under an ignored [ ] box (grandchild of a covered [x]) gives []."""
        plan = self.plan(
            f"- [x] Task 1.1: Do the work — `{SHA}`\n"
            "  - [ ] Add the first sub-step\n"
            "    - [ ] Check an edge case\n"
        )
        self.assertEqual(self.module.plan_closeout_feedback(plan), [])

    def test_case_09_x_with_sha_under_ignored_box(self) -> None:
        """A [x] box with a SHA under an ignored [ ] box gives []."""
        plan = self.plan(
            f"- [x] Task 1.1: Do the work — `{SHA}`\n"
            "  - [ ] Add the first sub-step\n"
            f"    - [x] Check an edge case — `{SHA}`\n"
        )
        self.assertEqual(self.module.plan_closeout_feedback(plan), [])

    def test_case_10_x_without_sha_under_ignored_box_covered_ancestor(self) -> None:
        """A [x] box without a SHA under an ignored [ ] box gives [] above a covered ancestor."""
        plan = self.plan(
            f"- [x] Task 1.1: Do the work — `{SHA}`\n"
            "  - [ ] Add the first sub-step\n"
            "    - [x] Check an edge case\n"
        )
        self.assertEqual(self.module.plan_closeout_feedback(plan), [])

    def test_case_11_x_without_sha_under_ignored_box_uncovered_ancestor(self) -> None:
        """A [x] box without a SHA under an ignored [ ] box gives two lines above an uncovered ancestor."""
        plan = self.plan(
            "- [x] Task 1.1: Do the work\n"
            "  - [ ] Add the first sub-step\n"
            "    - [x] Check an edge case\n"
        )
        self.assertEqual(
            self.module.plan_closeout_feedback(plan),
            [
                "completed plan task lacks commit SHA: - [x] Task 1.1: Do the work",
                "completed plan task lacks commit SHA: - [x] Check an edge case",
            ],
        )

    def test_case_12_open_box_under_x_box_under_open_top(self) -> None:
        """An open box under a [x] box under an open top-level task holds only the top line."""
        plan = self.plan(
            "- [ ] Task 1.1: Do the work\n"
            f"  - [x] Add the first sub-step — `{SHA}`\n"
            "    - [ ] Check an edge case\n"
        )
        self.assertEqual(
            self.module.plan_closeout_feedback(plan),
            ["plan task is not complete: - [ ] Task 1.1: Do the work"],
        )

    def test_case_13_nested_open_under_deferred_x_parent(self) -> None:
        """A nested [ ] box under a deferred [x] parent keeps today's line."""
        plan = self.plan(
            "- [x] Task 1.1: Do the work (deferred)\n"
            "  - [ ] Add the first sub-step\n"
        )
        self.assertEqual(
            self.module.plan_closeout_feedback(plan),
            ["plan task is not complete: - [ ] Add the first sub-step"],
        )

    def test_case_14_nested_open_under_deferred_open_parent(self) -> None:
        """A nested [ ] box under a deferred [ ] parent keeps today's line."""
        plan = self.plan(
            "- [ ] Task 1.1: Do the work (deferred)\n"
            "  - [ ] Add the first sub-step\n"
        )
        self.assertEqual(
            self.module.plan_closeout_feedback(plan),
            ["plan task is not complete: - [ ] Add the first sub-step"],
        )

    def test_case_15_math_lines_38_to_50_real_shape(self) -> None:
        """Real-shape Math lines 38-50: SHA'd task `commit 45c95cec` with nested boxes gives []."""
        plan = self.plan(
            "- [x] Task 2.3: Migrate the parser options — `commit 45c95cec`\n"
            "  - [ ] Confirm the spanned option maps\n"
            "  - [ ] Drop the folded rule\n"
            "    - [ ] Check the quoted edge case\n"
        )
        self.assertEqual(self.module.plan_closeout_feedback(plan), [])

    def test_case_16_math_line_52_plus_53_to_60_real_shape(self) -> None:
        """Real-shape Math line 52 plus lines 53-60: one SHA line for the line-52 task."""
        plan = self.plan(
            "- [x] Task 2.4: Migrate the remaining rules\n"
            "  - [ ] Map the first rule\n"
            "  - [ ] Map the second rule\n"
            "  - [ ] Map the third rule\n"
            "  - [ ] Map the fourth rule\n"
            "  - [ ] Map the fifth rule\n"
            "  - [ ] Map the sixth rule\n"
            "  - [ ] Map the seventh rule\n"
            "  - [ ] Map the eighth rule\n"
        )
        self.assertEqual(
            self.module.plan_closeout_feedback(plan),
            ["completed plan task lacks commit SHA: - [x] Task 2.4: Migrate the remaining rules"],
        )

    def test_case_17_track_incomplete_ignores_nested_boxes(self) -> None:
        """A plan with only nested [ ] boxes gives track_incomplete zero."""
        plan = self.plan(
            "# Plan\n"
            "\n"
            "  - [ ] A nested box with no top-level task\n"
            "    - [ ] A deeper nested box\n"
        )
        self.assertEqual(self.module.track_incomplete(plan), 0)


class CloseoutNestedSubboxesCandidatesTest(unittest.TestCase):
    """Class 2 (end to end): closeout_candidates() on a temporary repository."""

    @classmethod
    def setUpClass(cls) -> None:
        cls.module = checker_module()

    def setUp(self) -> None:
        self.tmp = tempfile.mkdtemp(prefix="closeout_nested_repo_")
        self.addCleanup(shutil.rmtree, self.tmp, ignore_errors=True)
        self.repo = Path(self.tmp)
        for name in ("nested-ok", "open-top"):
            (self.repo / "measure" / "tracks" / name).mkdir(parents=True)
        self.write(
            "nested-ok",
            f"- [x] Task 1.1: Do the work — `{SHA}`\n"
            "  - [ ] Add the first sub-step\n"
            "    - [ ] Check an edge case\n",
        )
        self.write("open-top", "- [ ] Task 1.1: Do the work\n")

    def write(self, track: str, text: str) -> None:
        path = self.repo / "measure" / "tracks" / track / "plan.md"
        path.write_text(text, encoding="utf-8")

    def test_case_18_candidates_hold_only_nested_ok(self) -> None:
        """closeout_candidates() returns exactly ["nested-ok"]."""
        self.assertEqual(self.module.closeout_candidates(self.repo, ""), ["nested-ok"])


if __name__ == "__main__":
    unittest.main()
