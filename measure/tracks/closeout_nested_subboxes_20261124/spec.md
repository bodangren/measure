# Specification: Closeout ignores nested sub-boxes

## Overview

Math (`track eslint-to-oxlint-migration_20260820`, read-only reference) mixes finished checklist work with open tasks. Its plan holds 25 top-level `[x]` lines, 10 of them with a SHA, 4 top-level `[ ]` lines, 1 top-level `[~]` line, and 226 nested `[ ]` lines. After this fix the plan still has genuine blockers. They are 15 SHA-less top-level `[x]` lines, 5 top-level open tasks, 56 nested `[x]` lines without usable SHA coverage, 26 nested open lines under open parents, and 9 nested open lines after a plain list item that ends a checkbox block. The fix removes nested-checklist noise under `[x]` blocks only. The Math plan is not fully covered by this fix. Math must tick or defer its genuine open tasks. This track does not claim that Math's check passes after the fix.

Source: chore track, light lane, created 2026-11-24.

## Functional Requirements

- **FR-0 (Rationale).** `plan_closeout_feedback` appended `plan task is not complete` for every non-`[x]` line before the parent-cover rule ran. Finished checklist sub-boxes therefore block closeout. The fix keys the ignore off the nearest shallower checkbox line inside one contiguous checkbox block. It scans every line, so a plain item, a heading, or a blank line ends the block.
- **FR-1 (Ignore rule).** An open box (`[ ]` or `[~]`, indent greater than 0) gives no `plan task is not complete` line only when it sits directly under a non-deferred `[x]` line in one contiguous checkbox block. The block starts at an `[x]` line and continues over the immediately following checkbox lines with deeper indent. A plain list item or text line, a heading, a blank line, a line at the same or shallower indent, a `[b]` line, or a deferred line ends the block. "Directly under" means the open box's nearest shallower-indent checkbox line is that `[x]` line. An open box under another open box is not ignored and fails. There is no any-depth rule and no ignored chain. A top-level open box always fails. A SHA-less `[x]` parent still reports its own `completed plan task lacks commit SHA` line. Its nested open boxes add none when they sit directly under it in the block.
- **FR-2 (Boundaries; wins over FR-1).** An open box whose nearest shallower checkbox line is an open box fails. A parent line that carries the word `deferred` never grants the ignore. A nested open box under a `deferred` parent, `[x]` or `[ ]`, keeps its feedback. A `[b]` line is a deferred boundary: it gives no feedback of its own, never grants the ignore, never covers a child, and stands as the nearest parent of its children. `deferred` handling is otherwise unchanged.
- **FR-3 (Records and `[x]` coverage).** An ignored box is recorded in `processed` as `(indent, status, covered=False, ignored=True)`. Every `processed` entry carries the same four values, with `ignored=False` elsewhere, plus one marker for a deferred or `[b]` line: the fifth value is `'deferred'` for that line and empty otherwise. The stack holds one contiguous checkbox block. The checker clears it at every non-checkbox line and every blank line. It pops entries at the same or a deeper indent before each checkbox line. A nested `[x]` box takes coverage from its own SHA or from its direct `[x]` parent when that parent is covered. An `[x]` under an open parent needs its own SHA. The coverage lookup does not skip ignored boxes. A deferred `[x]` with a SHA covers a completed child but does not hide an open child.
- **FR-4 (Other functions).** `phase_counts`, `track_incomplete`, and the jr-green branch stay unchanged. `track_incomplete` uses `TASK_LINE_RE` anchored at column 0, so it already ignores nested boxes; a Red case proves it. `closeout_feedback` and `closeout_candidates` both call `plan_closeout_feedback`, so both change by design.
- **FR-5 (Change set).** The change set is exactly: the checker script, the test file `tests/spec_review_gate/test_closeout_nested_subboxes.py`, its fixture `tests/spec_review_gate/fixtures/math_real_plan.md`, the bounded edit of `tests/spec_review_gate/test_subbox_sha.py` from an earlier round, the README.md Status sentence, the CHANGELOG.md sub-box entry, and the track files with their plan records. The install of the fixed script into `~/.agents/skills` is orchestrator work after the merge with `bin/install-measure-skill` and `--check`; it is not part of the change set. The closeout of this track also changes `measure/tracks.md` and the archive folder, as every closeout does; these are not part of the implementation change set.
- **FR-6 (Contract test).** The test uses the style of the other `tests/spec_review_gate` Python tests. The runner `run.sh` discovers it with no edit of `run.sh`. One case calls `closeout_candidates` on a temporary repository, as Class 2 of `test_subbox_sha.py` does.

## Acceptance Criteria

- The Math lines 38-50 shape with a third-level box gives one `plan task is not complete` line for that box; the two direct boxes give none.
- Math line 52 plus lines 53-60 give exactly one line: `completed plan task lacks commit SHA` for the line-52 task; the eight nested boxes add none.
- A top-level `[ ]` task gives exactly one `plan task is not complete` line.
- A top-level `[~]` task gives exactly one `plan task is not complete` line.
- A nested `[~]` box directly under a covered `[x]` parent gives `[]`.
- A `[ ]` box two levels under covered `[x]` boxes gives `[]`.
- A `[ ]` box under a top-level `[~]` gives two `plan task is not complete` lines: one for the parent, one for the box.
- A tab-indented sub-box under a covered `[x]` parent gives `[]`.
- A `[ ]` box under an ignored `[ ]` box, grandchild of a covered `[x]`, gives one `plan task is not complete` line for that box.
- A `[x]` box with a SHA under an ignored `[ ]` box gives `[]`.
- A `[x]` box without a SHA under an open box gives one `completed plan task lacks commit SHA` line for that box. An uncovered `[x]` ancestor adds its own line.
- An open box under a `[x]` box that sits under an open top-level task is ignored; the feedback holds only the top-level task line.
- A nested `[ ]` box under a `deferred` `[x]` parent and one under a `deferred` `[ ]` parent each keep today's `plan task is not complete` line.
- A plain list item, a phase heading, and a blank line each end the block. An open box after any of them gives one `plan task is not complete` line through `plan_closeout_feedback` and through `closeout_feedback`, and its track is not a `closeout_candidates` candidate.
- A plan with only nested `[ ]` boxes gives `track_incomplete` zero.
- A `closeout_candidates` case with tracks `nested-ok` and `open-top` returns exactly `["nested-ok"]`.
- A two-level open box chain is not a `closeout_candidates` candidate.
- The real Math plan gives exactly the itemized feedback: 40 `plan task is not complete` lines and 71 `completed plan task lacks commit SHA` lines. Of the 40 lines, 5 are top-level open tasks and 35 are nested open tasks of Math's plan. The plan is not fully covered by this fix.

## Out of Scope

- Letter-suffix and other task ids.
- No change to `phase_counts`, `track_incomplete`, the jr-green branch, or any other gate.
- No tech-debt change: this track adds no tech-debt row and changes no existing row.

## Open Questions

None.
