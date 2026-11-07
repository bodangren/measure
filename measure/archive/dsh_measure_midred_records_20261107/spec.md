# Specification: DSH Measure mid-red record reconciliation

## Overview

The mid-red rename work shipped across two tracks, but a read-only closeout pass
found the *records* still inconsistent and the first archive not closeout-clean:

1. The archived follow-up plan has Task 2.2 and the Phase 2 verification task
   still `[ ]`, and its completed tasks carry no commit SHA, so
   `measure_interphase_checks.py closeout --track dsh_measure_midred_followup_20261107`
   reports missing SHAs (and a missing closeout manifest).
2. The delivered rename test asserts the message and `- src/a.py` but not that
   `tests/a.py` is absent, which Task 1.2/FR-2 named.
3. The follow-up archive has no `spec-review.md`, although its FR-3 requires the
   review and the responses there.
4. The archived mid-red `spec.md` still states the two-call union and the
   `git mv` recipe without `mkdir tests`; only its plan and metadata carry a
   correction note.

This track reconciles those records, adds the missing assertion, and makes the
follow-up track closeout-clean. It changes no gate behaviour.

## Functional Requirements

- **FR-1 (closeout-clean archived plans).** The archived follow-up plan's Task 2.2
  and Phase 2 verification task are `[x]` with their commit SHAs on the task
  lines, and every `[x]` task in that plan carries a SHA;
  `measure_interphase_checks.py closeout --track dsh_measure_midred_followup_20261107`
  then reports no completed-task-lacks-SHA item (any remaining closeout-manifest
  item is documented as the archival artifact, not a missing task).
- **FR-2 (the delivered assertion).** `tests/spec_review_gate/test_checker.py`'s
  mid-red rename case also asserts that `tests/a.py` does not appear in the
  report, matching its plan task and the track's FR-2.
- **FR-3 (the review record).** The archived follow-up track gains a
  `spec-review.md` holding the Round 1 findings (F1–F3 plus the four closeout
  observations) and the author responses, and its `index.md` links it.
- **FR-4 (the archived mid-red spec).** The archived mid-red spec gets a dated
  correction note covering the single-call approach and the `mkdir tests` fixture
  step (the normative text is preserved).
- **FR-5 (gates).** `bash tests/spec_review_gate/run.sh` is 10/10; the node suite
  stays 288/288; both parity gates print `parity: ok`.

## Non-Functional Requirements

- **NFR-1 (no behaviour change).** Only the test file and records change; no
  checker logic changes.
- **NFR-2 (POSIX).** Windows stays out of scope.

## Acceptance Criteria (track level)

- Given the archived follow-up plan, Then all tasks are `[x]` with SHAs and the
  closeout check reports no "lacks commit SHA" item.
- Given the checker tests, Then the rename case asserts the new path is absent and
  the suite still passes.
- Given the archived follow-up track, Then `spec-review.md` exists and the index
  links it; the archived mid-red spec carries the dated correction note.
- Given `bash tests/spec_review_gate/run.sh`, Then 10/10 pass; node 288/288; both
  parity gates ok.

## Out of Scope

- Any checker behaviour change; the other spec_review_gate rows.
- Windows paths and platform packaging.
