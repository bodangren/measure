# Specification: DSH Measure mid-red record reconciliation

## Overview

The mid-red rename work shipped across two tracks, but a read-only closeout pass
found the *records* still inconsistent and the first archive not closeout-clean:

1. The archived follow-up plan's Task 2.2 and Phase 2 verification task already
   carried their SHAs (`a481293`, `da75968`); the four completed tasks that lacked
   a SHA were 1.1, 1.2, 1.3, and 2.1, so
   `measure_interphase_checks.py closeout --track dsh_measure_midred_followup_20261107`
   reports four missing-SHA lines (and a missing closeout manifest).
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

- **FR-1 (closeout-clean, defined).** Closeout-clean means: every non-deferred
  `[x]` task in the archived follow-up plan carries a commit SHA (Task 2.2 and the
  Phase 2 verification keep `a481293`/`da75968`; 1.1/1.2/1.3/2.1 get their SHAs),
  its `metadata.json` says `status: done` with a completion date, and the archived
  registry entry is `[x]`. The `automation-supervisor-closeout-manifest.json` is
  **out of scope** for a manual track and is the single expected remaining
  closeout FAIL. The exact closeout output is recorded at
  `measure/runs/dsh_measure_midred_records_20261107/closeout.txt` (the ledger,
  together with the four SHAs and both parity outputs).
- **FR-2 (the delivered assertion).** `tests/spec_review_gate/test_checker.py`'s
  mid-red rename case also asserts that `tests/a.py` does not appear in the
  report, matching its plan task and the track's FR-2.
- **FR-3 (the review records, concrete).** `measure/archive/dsh_measure_midred_followup_20261107/spec-review.md`
  holds the follow-up's Round 1 findings verbatim — F1, F2, F3 and the closeout
  observations O1–O4, each with one disposition (FIX/CONTEST/ESCALATE/DECLINE) —
  and the follow-up's `index.md` links it; this record track's own
  `spec-review.md` holds this review's findings with their dispositions, and its
  `index.md` links it.
- **FR-4 (the archived mid-red spec).** The archived mid-red spec gets a dated
  correction note covering the single-call approach and the `mkdir tests` fixture
  step (the normative text is preserved).
- **FR-5 (gates).** `bash tests/spec_review_gate/run.sh` is 10/10; the node suite
  stays 288/288; `plugins/dsh-measure-guard/scripts/check-parity.sh` and
  `plugins/opencode-measure-guard/scripts/check-parity.sh` both print `parity: ok`
  (a plan task runs them and records the output in the ledger).

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
