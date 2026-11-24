# Specification: Green gate ignores the open review task

## Overview

The jr-green gate fails a plan that follows rule A12 of Lending. Rule A12 marks the review task `[~]` before Review A starts. Lending hit this at `6faaf42` with task 3.5.

Source: chore track, light lane, created 2026-11-24.

## Functional Requirements

- **FR-0 (Root cause).** `phase_counts` in `skills/measure-orchestrator/scripts/measure_interphase_checks.py` counts each non-`[x]` task without `deferred` as incomplete. The jr-green branch fails with `current phase still has N non-deferred incomplete tasks`. One open `[~]` review task of the next role triggers this failure.
- **FR-1 (Ignore rule).** The jr-green gate ignores at most one `[~]` task whose title starts with a later-role label. The label sits at the start of the task text, after the `Task N.M` prefix and an optional colon. The labels are `Review A`, `Review B`, `Review C`, `Adversarial` (also `Adversarial testing`), and `Acceptance` (also `Phase acceptance`, `Final acceptance`). The match is case-insensitive and matches the whole phrase. A word elsewhere in the text never matches. The regex is `^(?:task\s+)?\d+(?:\.\d+)*\s*:?\s*(review a|review b|review c|adversarial(?:\s+testing)?|phase acceptance|final acceptance|acceptance)\b` with `IGNORECASE`, applied to the task text. It handles `- [~] Task 3.5 Review A ...` and `- [~] 3.5 Review A.` (the Lending shape). The ignore applies only when the phase has at least one completed `[x]` task, so a phase with no completed task still fails with the incomplete line.
- **FR-2 (Boundaries).** Only `[~]` tasks qualify, not `[ ]`. At most one such task is ignored. A second such `[~]` task still counts as incomplete. A `[~]` task that names no later role still counts. A `[~]` review task with `deferred` is not an ignore candidate. It stays as today. The `complete > with_sha` check is unchanged. The other gates stay unchanged: mid-red, review-a, review-b, review-c, phase-acceptance, final-acceptance, closeout, and track_incomplete.
- **FR-3 (Placement).** Put the ignore logic in a separate helper used only by the jr-green branch. `phase_counts` keeps its five-value return. Three callers unpack it: mid-red (line 1293), jr-green (line 1334), and the review and phase-acceptance branch (line 1359). The helper reuses `phase_blocks` (line 371) and the task-line pattern shared by `phase_counts`, `track_incomplete`, and `discover_phases`.
- **FR-4 (Change set).** The change set is exactly: the checker script, the new test file `tests/spec_review_gate/test_green_gate_review_task.py`, one `CHANGELOG.md` entry, and the track files with their plan records. The install of the fixed script into `~/.agents/skills` (the copy Lending runs) is orchestrator work after the merge with `bin/install-measure-skill` and `--check`. It is not part of the change set.
- **FR-5 (Contract test).** The test uses the style of `tests/spec_review_gate/test_gate_track_scope.py` and `tests/spec_review_gate/test_role_gate_heavy_run.py`. The runner `run.sh` discovers it with no edit of `run.sh`.

## Acceptance Criteria

- A phase with all `[x]` tasks and one `[~]` review-role task passes jr-green.
- Two such `[~]` tasks fail jr-green.
- A `[~]` task that names no later role fails jr-green.
- A `[~]` task with a later-role word only in the body still fails jr-green.
- A `[~]` task that starts with `review assignments` still fails jr-green.
- A `[~]` review task with `deferred` passes as today.
- The same plan plus an unfinished Green `[~]` task fails jr-green.
- An `[x]` task without a SHA plus a `[~]` review task fails with the SHA message.
- A `[ ]` review task fails jr-green.
- Each named later role passes jr-green when alone as `[~]`.
- The mid-red gate and the review-a gate give the same result as before.
- The Lending shape passes jr-green: task 3.5 as `[~]` with `Review A` in its text.

## Out of Scope

- No change to the mid-red gate.
- No change to any review, acceptance, or closeout gate.
- No tech-debt change: this track adds no tech-debt row and changes no existing row.
- Exception (recorded at closeout): the late-finding stop rule routes Review A F5 and F6 and phase-acceptance PA-1, PA-2, and PA-3 to `measure/tech-debt.md`. These five late findings create three new rows at closeout. The rows come from the stop rule, not from the delivered gate change.

## Open Questions

None.
