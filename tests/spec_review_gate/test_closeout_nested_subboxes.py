"""Closeout ignores nested sub-boxes (track closeout_nested_subboxes_20261124).

Narrow rule: an open box ([ ] or [~], indent greater than 0) gives no
``plan task is not complete`` line only when it sits directly under an
[x] line inside one contiguous checkbox block. A plain list item, a text
line, a heading, a blank line, a line at the same or shallower indent, a
[b] line, or a deferred line ends the block. There is no ignored chain:
an open box under another open box fails. A deferred [x] parent never
grants the ignore. A top-level (indent 0) open box always fails. A nested
[x] needs its own SHA unless its direct [x] parent in the block covers it.
``track_incomplete`` already ignores nested boxes. Class 1 calls
plan_closeout_feedback() on plans in a temporary folder. Class 2 calls
closeout_candidates() on a temporary repository with two tracks. Each
class imports the checker with importlib, as in test_subbox_sha.py.

Red state: the direct-under-[x] cases fail before the checker edit. The
F6 regressions in this file fail at role base a5fc0be because a plain
item, a heading, or a blank line does not clear the prior [x] branch.
"""

from __future__ import annotations

import re
import shutil
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CHECKER = ROOT / "skills" / "measure-orchestrator" / "scripts" / "measure_interphase_checks.py"
FIXTURES = Path(__file__).resolve().parent / "fixtures"
MATH_PLAN = FIXTURES / "math_real_plan.md"

SHA = "a1b2c3d"

# Line numbers refer to fixtures/math_real_plan.md, a verbatim copy of Math's
# read-only plan. The narrow rule removes nested-checklist noise under [x]
# blocks only. These lines are genuine open tasks of Math's plan; Math must
# tick or defer them. The plan is not fully covered by this fix.
#
# The 35 nested open lines that still fail: 26 sit under four top-level open
# manual-verification parents; 9 sit after the plain list item at line 261.
MATH_NC_TOP = (147, 272, 394, 481, 490)
MATH_NC_OPEN_PARENT = (
    148, 149, 150, 151, 152, 153,
    273, 274, 275, 276, 277, 278, 279,
    395, 396, 397, 398, 399, 400, 401,
    491, 492, 493, 494, 495, 496,
)
MATH_NC_PLAIN_ITEM = (262, 263, 264, 265, 266, 267, 268, 269, 270)
MATH_NC_LINES = MATH_NC_TOP + MATH_NC_OPEN_PARENT + MATH_NC_PLAIN_ITEM

# The 71 completed lines without usable SHA coverage: 15 top-level lines and
# 56 nested lines. The narrow rule does not change this part of the feedback.
MATH_SHA_TOP = (52, 89, 116, 136, 157, 184, 209, 229, 246, 260, 405, 414, 423, 439, 452)
MATH_SHA_NESTED = (
    406, 407, 408, 409, 410, 411, 412,
    415, 416, 417, 418, 419, 420, 421,
    424, 425, 426, 427, 428, 429, 430, 431, 432, 433, 434, 435, 436, 437,
    440, 441, 442, 443, 444, 445, 446, 447, 448, 449, 450,
    453, 454, 455, 456, 457, 458, 459, 460, 461, 462,
    482, 483, 484, 485, 486, 487, 488,
)
MATH_SHA_LINES = MATH_SHA_TOP + MATH_SHA_NESTED
MATH_NC_SET = set(MATH_NC_LINES)
MATH_SHA_SET = set(MATH_SHA_LINES)


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

    def archive_repo(self, name: str, text: str) -> Path:
        """A minimal archived track so closeout_feedback() can be called."""
        repo = Path(self.tmp) / "repo"
        archive = repo / "measure" / "archive" / name
        archive.mkdir(parents=True)
        (archive / "plan.md").write_text(text, encoding="utf-8")
        (archive / "metadata.json").write_text(
            '{"status": "done", "completed": "2026-11-24", "lane": "light"}\n',
            encoding="utf-8",
        )
        (archive / "automation-supervisor-closeout-manifest.json").write_text("{}\n", encoding="utf-8")
        return repo

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
        """Narrow rule: an open box under an ignored open box fails; no ignored chain."""
        plan = self.plan(
            f"- [x] Task 1.1: Do the work — `{SHA}`\n"
            "  - [ ] Add the first sub-step\n"
            "    - [ ] Check an edge case\n"
        )
        self.assertEqual(
            self.module.plan_closeout_feedback(plan),
            ["plan task is not complete: - [ ] Check an edge case"],
        )

    def test_case_09_x_with_sha_under_ignored_box(self) -> None:
        """A SHA-less root gives only its own line; the nested [x] keeps its own SHA."""
        plan = self.plan(
            "- [x] Task 1.1: Do the work\n"
            "  - [ ] Add the first sub-step\n"
            f"    - [x] Check an edge case — `{SHA}`\n"
        )
        self.assertEqual(
            self.module.plan_closeout_feedback(plan),
            ["completed plan task lacks commit SHA: - [x] Task 1.1: Do the work"],
        )

    def test_case_10_x_without_sha_under_ignored_box_covered_ancestor(self) -> None:
        """Narrow rule: a [x] under an open box needs its own SHA, even above a covered ancestor."""
        plan = self.plan(
            f"- [x] Task 1.1: Do the work — `{SHA}`\n"
            "  - [ ] Add the first sub-step\n"
            "    - [x] Check an edge case\n"
        )
        self.assertEqual(
            self.module.plan_closeout_feedback(plan),
            ["completed plan task lacks commit SHA: - [x] Check an edge case"],
        )

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
        """Narrow rule: the two direct boxes stay ignored; the third-level box fails."""
        plan = self.plan(
            "- [x] Task 2.3: Migrate the parser options — `commit 45c95cec`\n"
            "  - [ ] Confirm the spanned option maps\n"
            "  - [ ] Drop the folded rule\n"
            "    - [ ] Check the quoted edge case\n"
        )
        self.assertEqual(
            self.module.plan_closeout_feedback(plan),
            ["plan task is not complete: - [ ] Check the quoted edge case"],
        )

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

    def test_case_19_f1_sibling_does_not_hide_covered_ancestor(self) -> None:
        """Narrow rule: the [x] child of an ignored [ ] sibling needs its own SHA."""
        plan = self.plan(
            f"- [x] Task 1.1: Do the work {SHA}\n"
            f"  - [ ] A (deferred) {SHA}\n"
            "  - [ ] B\n"
            "    - [x] Done B\n"
        )
        self.assertEqual(
            self.module.plan_closeout_feedback(plan),
            ["completed plan task lacks commit SHA: - [x] Done B"],
        )

    def test_case_20_f1_sibling_branch_does_not_cover_missing_sha(self) -> None:
        """Narrow rule: B step fails under B, so Done B has no covered parent."""
        plan = self.plan(
            "- [x] Task 1.1: Do the work\n"
            "  - [ ] A\n"
            f"    - [x] Done A {SHA}\n"
            "  - [ ] B\n"
            "    - [ ] B step\n"
            "      - [x] Done B\n"
        )
        self.assertEqual(
            self.module.plan_closeout_feedback(plan),
            [
                "completed plan task lacks commit SHA: - [x] Task 1.1: Do the work",
                "plan task is not complete: - [ ] B step",
                "completed plan task lacks commit SHA: - [x] Done B",
            ],
        )

    def test_case_21_f2_deferred_b_boundary_through_closeout_feedback(self) -> None:
        """A [b] boundary keeps an open child from inheriting the previous task's ignore."""
        repo = Path(self.tmp) / "repo"
        archive = repo / "measure" / "archive" / "deferred-boundary"
        archive.mkdir(parents=True)
        (archive / "plan.md").write_text(
            f"- [x] Task 1.1: Do the work {SHA}\n"
            f"- [b] Pending review {SHA} deferred:owner\n"
            "  - [ ] Child of pending review\n",
            encoding="utf-8",
        )
        (archive / "metadata.json").write_text(
            '{"status": "done", "completed": "2026-11-24", "lane": "light"}\n',
            encoding="utf-8",
        )
        (archive / "automation-supervisor-closeout-manifest.json").write_text("{}\n", encoding="utf-8")
        self.assertEqual(
            self.module.closeout_feedback(repo, "deferred-boundary"),
            ["plan task is not complete: - [ ] Child of pending review"],
        )

    def test_case_22_f5_deferred_open_parent_child_needs_own_sha(self) -> None:
        """A SHA-less [x] child of a deferred [ ] parent reports its own missing SHA."""
        repo = Path(self.tmp) / "repo"
        archive = repo / "measure" / "archive" / "deferred-open-parent"
        archive.mkdir(parents=True)
        (archive / "plan.md").write_text(
            f"- [x] Root {SHA}\n"
            f"  - [ ] Parent {SHA} deferred:owner\n"
            "    - [x] Child\n",
            encoding="utf-8",
        )
        (archive / "metadata.json").write_text(
            '{"status": "done", "completed": "2026-11-24", "lane": "light"}\n',
            encoding="utf-8",
        )
        (archive / "automation-supervisor-closeout-manifest.json").write_text("{}\n", encoding="utf-8")
        self.assertEqual(
            self.module.closeout_feedback(repo, "deferred-open-parent"),
            ["completed plan task lacks commit SHA: - [x] Child"],
        )

    def test_case_23_f5_deferred_tilde_parent_child_needs_own_sha(self) -> None:
        """A SHA-less [x] child of a deferred [~] parent reports its own missing SHA."""
        repo = Path(self.tmp) / "repo"
        archive = repo / "measure" / "archive" / "deferred-tilde-parent"
        archive.mkdir(parents=True)
        (archive / "plan.md").write_text(
            f"- [x] Root {SHA}\n"
            f"  - [~] Parent {SHA} deferred:owner\n"
            "    - [x] Child\n",
            encoding="utf-8",
        )
        (archive / "metadata.json").write_text(
            '{"status": "done", "completed": "2026-11-24", "lane": "light"}\n',
            encoding="utf-8",
        )
        (archive / "automation-supervisor-closeout-manifest.json").write_text("{}\n", encoding="utf-8")
        self.assertEqual(
            self.module.closeout_feedback(repo, "deferred-tilde-parent"),
            ["completed plan task lacks commit SHA: - [x] Child"],
        )

    def test_case_26_f6_plain_item_space_marker(self) -> None:
        """F6: a plain list item ends the block; a [ ] child then fails."""
        text = (
            f"- [x] Task 1.1: Build — `{SHA}`\n"
            "- Required checks\n"
            "  - [ ] Verify output\n"
        )
        expected = ["plan task is not complete: - [ ] Verify output"]
        self.assertEqual(self.module.plan_closeout_feedback(self.plan(text)), expected)
        repo = self.archive_repo("f6-plain-space", text)
        self.assertEqual(self.module.closeout_feedback(repo, "f6-plain-space"), expected)

    def test_case_27_f6_plain_item_tilde_marker(self) -> None:
        """F6: the same plain-item boundary holds for a [~] child."""
        text = (
            f"- [x] Task 1.1: Build — `{SHA}`\n"
            "- Required checks\n"
            "  - [~] Verify output\n"
        )
        expected = ["plan task is not complete: - [~] Verify output"]
        self.assertEqual(self.module.plan_closeout_feedback(self.plan(text)), expected)
        repo = self.archive_repo("f6-plain-tilde", text)
        self.assertEqual(self.module.closeout_feedback(repo, "f6-plain-tilde"), expected)

    def test_case_28_f6_phase_heading(self) -> None:
        """F6: a phase heading ends the block; the nested open box fails."""
        text = (
            "## Phase 1: Build\n"
            f"- [x] Task 1.1: Build — `{SHA}`\n"
            "  - [x] Prepare — `b2c3d4e`\n"
            "## Phase 2: Verify\n"
            "  - [ ] Verify output\n"
        )
        expected = ["plan task is not complete: - [ ] Verify output"]
        self.assertEqual(self.module.plan_closeout_feedback(self.plan(text)), expected)
        repo = self.archive_repo("f6-heading", text)
        self.assertEqual(self.module.closeout_feedback(repo, "f6-heading"), expected)

    def test_case_29_f6_blank_line(self) -> None:
        """F6: a blank line ends the block; the nested open box fails."""
        text = (
            f"- [x] Task 1.1: Build — `{SHA}`\n"
            "\n"
            "  - [ ] Verify output\n"
        )
        expected = ["plan task is not complete: - [ ] Verify output"]
        self.assertEqual(self.module.plan_closeout_feedback(self.plan(text)), expected)
        repo = self.archive_repo("f6-blank", text)
        self.assertEqual(self.module.closeout_feedback(repo, "f6-blank"), expected)

    def test_case_32_math_real_plan_exact_feedback(self) -> None:
        """The real Math plan keeps its genuine open tasks and missing SHAs."""
        feedback = self.module.plan_closeout_feedback(MATH_PLAN)
        lines = MATH_PLAN.read_text(encoding="utf-8").splitlines()
        expected: list[str] = []
        for number in sorted(MATH_NC_SET | MATH_SHA_SET):
            content = lines[number - 1].strip()
            if number in MATH_NC_SET:
                expected.append(f"plan task is not complete: {content}")
            else:
                expected.append(f"completed plan task lacks commit SHA: {content}")
        self.assertEqual(feedback, expected)
        nested_open = {
            number
            for number, line in enumerate(lines, 1)
            if re.match(r"^(\s+)- \[ \] ", line) is not None
        }
        # The 35 itemized nested lines are the only nested open lines that
        # fail. Every other nested [ ] line yields no 'not complete' line.
        self.assertEqual(
            sorted(nested_open & MATH_NC_SET),
            sorted(MATH_NC_OPEN_PARENT + MATH_NC_PLAIN_ITEM),
        )
        self.assertTrue(nested_open - MATH_NC_SET)


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
        # The narrow rule still ignores one open box directly under a SHA'd
        # [x]. A two-level chain no longer qualifies; case 35 pins that.
        self.write(
            "nested-ok",
            f"- [x] Task 1.1: Do the work — `{SHA}`\n"
            "  - [ ] Add the first sub-step\n",
        )
        self.write("open-top", "- [ ] Task 1.1: Do the work\n")

    def write(self, track: str, text: str) -> None:
        path = self.repo / "measure" / "tracks" / track / "plan.md"
        path.write_text(text, encoding="utf-8")

    def test_case_18_candidates_hold_only_nested_ok(self) -> None:
        """closeout_candidates() returns exactly ["nested-ok"]."""
        self.assertEqual(self.module.closeout_candidates(self.repo, ""), ["nested-ok"])

    def test_case_24_f5_deferred_open_parent_blocks_candidate(self) -> None:
        """A track with a SHA-less [x] child of a deferred [ ] parent is no candidate."""
        (self.repo / "measure" / "tracks" / "deferred-open-parent").mkdir(parents=True)
        self.write(
            "deferred-open-parent",
            f"- [x] Root {SHA}\n"
            f"  - [ ] Parent {SHA} deferred:owner\n"
            "    - [x] Child\n",
        )
        self.assertEqual(self.module.closeout_candidates(self.repo, ""), ["nested-ok"])

    def test_case_25_f5_deferred_tilde_parent_blocks_candidate(self) -> None:
        """A track with a SHA-less [x] child of a deferred [~] parent is no candidate."""
        (self.repo / "measure" / "tracks" / "deferred-tilde-parent").mkdir(parents=True)
        self.write(
            "deferred-tilde-parent",
            f"- [x] Root {SHA}\n"
            f"  - [~] Parent {SHA} deferred:owner\n"
            "    - [x] Child\n",
        )
        self.assertEqual(self.module.closeout_candidates(self.repo, ""), ["nested-ok"])

    def add_track(self, name: str, text: str) -> None:
        (self.repo / "measure" / "tracks" / name).mkdir(parents=True)
        self.write(name, text)

    def test_case_30_f6_plain_item_space_blocks_candidate(self) -> None:
        """F6: a plain item before a [ ] child keeps the track off the candidate list."""
        self.add_track(
            "f6-plain-space",
            f"- [x] Task 1.1: Build — `{SHA}`\n- Required checks\n  - [ ] Verify output\n",
        )
        self.assertEqual(self.module.closeout_candidates(self.repo, ""), ["nested-ok"])

    def test_case_31_f6_plain_item_tilde_blocks_candidate(self) -> None:
        """F6: the same caller result holds for a [~] child."""
        self.add_track(
            "f6-plain-tilde",
            f"- [x] Task 1.1: Build — `{SHA}`\n- Required checks\n  - [~] Verify output\n",
        )
        self.assertEqual(self.module.closeout_candidates(self.repo, ""), ["nested-ok"])

    def test_case_33_f6_heading_blocks_candidate(self) -> None:
        """F6: a phase heading before an open box keeps the track off the list."""
        self.add_track(
            "f6-heading",
            "## Phase 1: Build\n"
            f"- [x] Task 1.1: Build — `{SHA}`\n"
            "## Phase 2: Verify\n"
            "  - [ ] Verify output\n",
        )
        self.assertEqual(self.module.closeout_candidates(self.repo, ""), ["nested-ok"])

    def test_case_34_f6_blank_line_blocks_candidate(self) -> None:
        """F6: a blank line before an open box keeps the track off the list."""
        self.add_track(
            "f6-blank",
            f"- [x] Task 1.1: Build — `{SHA}`\n\n  - [ ] Verify output\n",
        )
        self.assertEqual(self.module.closeout_candidates(self.repo, ""), ["nested-ok"])

    def test_case_35_f6_deep_chain_blocks_candidate(self) -> None:
        """Narrow rule: a two-level open chain is no longer a candidate."""
        self.add_track(
            "deep-chain",
            f"- [x] Task 1.1: Build — `{SHA}`\n"
            "  - [ ] First step\n"
            "    - [ ] Second step\n",
        )
        self.assertEqual(self.module.closeout_candidates(self.repo, ""), ["nested-ok"])


if __name__ == "__main__":
    unittest.main()
