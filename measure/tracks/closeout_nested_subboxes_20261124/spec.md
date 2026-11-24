# Specification: Closeout ignores nested sub-boxes

## Overview

`plan_closeout_feedback` fails every nested sub-box with `plan task is not complete`. Math (`track eslint-to-oxlint-migration_20260820`) has top-level `- [x]` lines with a SHA and indented `- [ ]` checklist sub-boxes. The file holds 226 nested `[ ]` lines. Every top-level task is `[x]` with a SHA, yet the closeout check fails.

Source: chore track, light lane, created 2026-11-24.

## Functional Requirements

- **FR-0 (Root cause).** `plan_closeout_feedback` lives in `skills/measure-orchestrator/scripts/measure_interphase_checks.py` (lines 1093-1144). Line 1133 appends `plan task is not complete` for every line whose status is not `x`. This fires before the parent-cover rule runs. The `processed` list holds `(indent, status, covered)` for each line. A parent covers a sub-box when the parent is an `[x]` line that is itself covered. A nested `[ ]` line never reaches that rule.
- **FR-1 (Ignore rule).** An indented box (indent greater than 0) with status `[ ]` or `[~]` gives no `plan task is not complete` feedback when its nearest shallower-indent parent is an `[x]` line that is itself covered. The parent lookup stays the nearest `processed` entry with a smaller indent.
- **FR-2 (Boundaries).** A top-level (indent 0) `[ ]` or `[~]` task still fails. A nested `[ ]` or `[~]` box under a non-`[x]` parent still fails; the parent already fails, and the sub-box feedback stays. A nested box under a `deferred` parent keeps today's behaviour. A nested `[x]` sub-box keeps today's SHA-coverage rule. `deferred` handling is unchanged.
- **FR-3 (Processed record).** An ignored nested `[ ]` or `[~]` box is recorded in `processed` as not covered. It never becomes a covering parent for deeper boxes. A deeper box under it still fails unless its own nearest shallower covered `[x]` parent covers it.
- **FR-4 (Other functions unchanged).** `phase_counts`, `track_incomplete` (used by final-acceptance), and the jr-green branch stay unchanged. `track_incomplete` (line 431) uses `TASK_LINE_RE` (line 104, `^- \[([ ~x])\] (.+)`), which is anchored at column 0. It already ignores nested boxes. A Red case proves this.
- **FR-5 (Change set).** The change set is exactly: the checker script, the new test file `tests/spec_review_gate/test_closeout_nested_subboxes.py`, one `CHANGELOG.md` entry, and the track files with their plan records. The install of the fixed script into `~/.agents/skills` is orchestrator work after the merge with `bin/install-measure-skill` and `--check`. It is not part of the change set.
- **FR-6 (Contract test).** The test uses the style of the other `tests/spec_review_gate` Python tests. The runner `run.sh` discovers it with no edit of `run.sh`.

## Acceptance Criteria

- The Math shape passes: top-level `[x]` tasks with SHAs and nested `[ ]` sub-boxes give no closeout feedback.
- A top-level `[ ]` task fails with `plan task is not complete`.
- A top-level `[~]` task fails with `plan task is not complete`.
- A nested `[ ]` box under an `[x]` parent without a SHA fails with `completed plan task lacks commit SHA`.
- A nested `[ ]` box under a `[ ]` parent fails with `plan task is not complete`.
- A nested `[x]` box without a SHA under an uncovered parent fails with the SHA message.
- A nested `[ ]` box under a `deferred` parent keeps today's result.
- The real-shape fixture copied from Math plan lines 36-60 passes.
- `track_incomplete` still ignores nested boxes.

## Out of Scope

- Letter-suffix and other task ids.
- No change to `phase_counts`, `track_incomplete`, the jr-green branch, or any other gate.
- No tech-debt change: this track adds no tech-debt row and changes no existing row.

## Open Questions

None.
