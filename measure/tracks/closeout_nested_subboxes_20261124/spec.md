# Specification: Closeout ignores nested sub-boxes

## Overview

Math (`track eslint-to-oxlint-migration_20260820`, read-only reference) mixes finished checklist work with open tasks. Its plan holds 25 top-level `[x]` lines (10 with a SHA), 4 top-level `[ ]` lines, 1 top-level `[~]` line, and 226 nested `[ ]` lines. That plan still fails closeout after this fix for genuine reasons: SHA-less top-level `[x]` lines, top-level `[ ]` lines, and the top-level `[~]` line. This track removes only the nested-box noise. Math's own plan still has to close or defer its open tasks. This track does not claim that Math's check passes after the fix.

Source: chore track, light lane, created 2026-11-24.

## Functional Requirements

- **FR-0 (Rationale).** `plan_closeout_feedback` appends `plan task is not complete` for every non-`[x]` line before the parent-cover rule runs. Finished checklist sub-boxes therefore block closeout. The `processed` list already tracks each line, so the fix keys the ignore off the nearest shallower parent in `processed`.
- **FR-1 (Ignore rule).** An indented open box (`[ ]` or `[~]`, indent greater than 0) gives no `plan task is not complete` line when its nearest shallower-indent parent in `processed` is (a) an `[x]` line, covered or not, or (b) itself an ignored nested open box. A SHA-less `[x]` parent still reports its own `completed plan task lacks commit SHA` line; its nested open boxes add no second line, while a nested `[x]` box without a SHA keeps its own SHA line. The ignore reaches any depth along a chain rooted at an `[x]` ancestor.
- **FR-2 (Boundaries; wins over FR-1).** A top-level (indent 0) `[ ]` or `[~]` box always fails. An open box whose nearest parent is an open box that is not ignored still fails; this holds under a top-level `[ ]` or `[~]`. A parent line that carries the word `deferred` never grants the ignore. A nested open box under a `deferred` parent (`[x]` or `[ ]`) keeps today's feedback. A nested `[x]` sub-box keeps today's SHA-coverage rule. `deferred` handling is otherwise unchanged.
- **FR-3 (Records and `[x]` coverage).** An ignored box is recorded in `processed` as `(indent, status, covered=False, ignored=True)`. Every `processed` entry carries the same four values, with `ignored=False` elsewhere, plus one marker for a `deferred` line: the fifth value is `'deferred'` for a deferred line and empty otherwise, so a deferred `[x]` parent stays distinguishable and never grants the ignore. A `[x]` box under an ignored box takes coverage from its own SHA, else from the nearest shallower `[x]` ancestor that is covered, skipping ignored boxes.
- **FR-4 (Other functions).** `phase_counts`, `track_incomplete`, and the jr-green branch stay unchanged. `track_incomplete` uses `TASK_LINE_RE` anchored at column 0, so it already ignores nested boxes; a Red case proves it. `closeout_feedback` and `closeout_candidates` both call `plan_closeout_feedback`, so both change by design.
- **FR-5 (Change set).** The change set is exactly: the checker script, the new test file `tests/spec_review_gate/test_closeout_nested_subboxes.py`, the bounded edit of `tests/spec_review_gate/test_subbox_sha.py` (case 3 rewritten to the new rule, docstring fixed), the README.md Status sentence, one new CHANGELOG.md entry, and the track files with their plan records. The install of the fixed script into `~/.agents/skills` is orchestrator work after the merge with `bin/install-measure-skill` and `--check`; it is not part of the change set. The closeout of this track also changes `measure/tracks.md` and the archive folder, as every closeout does; these are not part of the implementation change set.
- **FR-6 (Contract test).** The test uses the style of the other `tests/spec_review_gate` Python tests. The runner `run.sh` discovers it with no edit of `run.sh`. One case calls `closeout_candidates` on a temporary repository, as Class 2 of `test_subbox_sha.py` does.

## Acceptance Criteria

- Math lines 38-50 (the SHA'd task `commit 45c95cec` with nested boxes) give exactly `[]`.
- Math line 52 plus lines 53-60 give exactly one line: `completed plan task lacks commit SHA` for the line-52 task; the eight nested boxes add none.
- A top-level `[ ]` task gives exactly one `plan task is not complete` line.
- A top-level `[~]` task gives exactly one `plan task is not complete` line.
- A nested `[~]` box under a covered `[x]` parent gives `[]`.
- A `[ ]` box two levels under covered `[x]` boxes gives `[]`.
- A `[ ]` box under a top-level `[~]` gives two `plan task is not complete` lines: one for the parent, one for the box.
- A tab-indented sub-box under a covered `[x]` parent gives `[]`.
- A `[ ]` box under an ignored `[ ]` box (grandchild of a covered `[x]`) gives `[]`.
- A `[x]` box with a SHA under an ignored `[ ]` box gives `[]`.
- A `[x]` box without a SHA under an ignored `[ ]` box gives `[]` when a covered `[x]` ancestor stands above, and exactly two lines when the ancestor is uncovered: the ancestor's `completed plan task lacks commit SHA` line and the box's own SHA line.
- An open box under a `[x]` box that sits under an open top-level task is ignored; the feedback holds only the top-level task line.
- A nested `[ ]` box under a `deferred` `[x]` parent and one under a `deferred` `[ ]` parent each keep today's `plan task is not complete` line.
- A plan with only nested `[ ]` boxes gives `track_incomplete` zero.
- A `closeout_candidates` case with tracks `nested-ok` and `open-top` returns exactly `["nested-ok"]`.

## Out of Scope

- Letter-suffix and other task ids.
- No change to `phase_counts`, `track_incomplete`, the jr-green branch, or any other gate.
- No tech-debt change: this track adds no tech-debt row and changes no existing row.

## Open Questions

None.
