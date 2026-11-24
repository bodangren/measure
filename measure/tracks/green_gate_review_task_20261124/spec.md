# Specification: Green gate ignores the open review task

## Overview

The jr-green gate fails a plan that follows rule A12 of Lending. Rule A12 marks the review task `[~]` before Review A starts. Lending hit this at `6faaf42` with task 3.5.

Source: chore track, light lane, created 2026-11-24.

## Functional Requirements

- **FR-0 (Root cause).** `phase_counts` in `skills/measure-orchestrator/scripts/measure_interphase_checks.py` counts each non-`[x]` task without `deferred` as incomplete. The jr-green branch fails with `current phase still has N non-deferred incomplete tasks`. One open `[~]` review task of the next role triggers this failure.
- **FR-1 (Ignore rule).** The jr-green gate ignores exactly one `[~]` task whose text names a later role. The names are `review-a`, `review-b`, `review-c`, `adversarial`, and `acceptance`. The match is case-insensitive. It also matches `review a`, `review b`, `review c`, `adversarial testing`, `phase acceptance`, and `final acceptance`.
- **FR-2 (Boundaries).** Only `[~]` tasks qualify, not `[ ]`. At most one such task is ignored. A second such `[~]` task still counts as incomplete. A `[~]` task that names no later role still counts. A `[~]` task with `deferred` stays as today. The `complete > with_sha` check is unchanged. The other gates stay unchanged: mid-red, review-a, review-b, review-c, phase-acceptance, final-acceptance, closeout, and track_incomplete.
- **FR-3 (Placement).** Put the ignore logic in a helper used only by the jr-green branch. Do not change the return shape of `phase_counts` if other callers need it.
- **FR-4 (Change set).** The change set is exactly: the checker script, the new test file `tests/spec_review_gate/test_green_gate_review_task.py`, and the track files. The closeout also changes `measure/tracks.md` and the archive folder, as every closeout does.
- **FR-5 (Contract test).** The test uses the style of `tests/spec_review_gate/test_gate_track_scope.py` and `tests/spec_review_gate/test_role_gate_heavy_run.py`. The runner `run.sh` discovers it with no edit of `run.sh`.

## Acceptance Criteria

- A phase with all `[x]` tasks and one `[~]` review-role task passes jr-green.
- Two such `[~]` tasks fail jr-green.
- A `[~]` task that names no later role fails jr-green.
- A `[ ]` review task fails jr-green.
- Each named later role passes jr-green when alone as `[~]`.
- The mid-red gate and the review-a gate give the same result as before.
- The Lending shape passes jr-green: task 3.5 as `[~]` with `Review A` in its text.

## Out of Scope

- No change to the mid-red gate.
- No change to any review, acceptance, or closeout gate.
- No change to the other tech-debt rows.

## Open Questions

None.
