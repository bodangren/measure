# Specification: DSH Measure mid-red evidence and record precision

## Overview

The record-reconciliation track closed the mid-red records, but its own review
found five precision gaps, each about the *record*, not the gate:

- **F1 (Major):** the track spec said the archived follow-up plan's Task 2.2 and
  Phase 2 verification task were still `[ ]`, but at review time they were `[x]`
  with SHAs (`a481293`, `da75968`); the four tasks that actually lacked SHAs were
  1.1, 1.2, 1.3, and 2.1.
- **F2 (Major):** "closeout-clean" was undefined and unreachable as PASS because
  `closeout_feedback()` requires `automation-supervisor-closeout-manifest.json`,
  which a manual Measure track never produces.
- **F3 (Blocker):** the plan said "record the result" of the closeout run but
  named no file or format for that evidence.
- **F4 (Major):** the record items were not concrete (F1–F3 were already named in the records spec's FR-3, but the review record lacked
  their severity and text and the four observations had no ids) and no
  disposition per finding was required.
- **F5 (Major):** FR-5 required both parity gates, but no plan task ran them or
  named the scripts.

This track fixes those five: a named closeout evidence file, the exact
"closeout-clean" definition (manifest explicitly out of scope), verbatim finding
records with one disposition each, the parity gate task, and the corrected
open-task list. It changes no checker behaviour.

## Functional Requirements

- **FR-1 (the exact closeout meaning and its ledger).** "Closeout-clean" means:
  every non-deferred `[x]` task in the archived follow-up plan carries a commit
  SHA, its `metadata.json` says `status: done` with a completion date, and the
  archived registry entry is `[x]`. The `automation-supervisor` closeout manifest
  is **out of scope** for this manual track and is the single expected remaining
  closeout FAIL. The closeout output is recorded at
  `measure/runs/dsh_measure_midred_records_20261107/closeout.txt` (the named
  ledger) and read back by the plan's verification step.
- **FR-2 (the corrected open-task list).** The archived follow-up plan's Task 2.2
  and Phase 2 verification task stay `[x]` with `a481293`/`da75968`; the four
  tasks that needed SHAs — 1.1, 1.2, 1.3, 2.1 — carry them (8a9f4aa, 8a9f4aa,
  8a9f4aa, 31835e6).
- **FR-3 (the concrete review record).** The archived record-reconciliation track
  gains a `spec-review.md` containing the five findings **verbatim** (ids,
  severities, text) and the standard's one disposition per finding
  (FIX/CONTEST/ESCALATE/DECLINE), linked from its `index.md`.
- **FR-4 (the parity gate task).** The archived record track's plan gains a
  verification task that runs
  `plugins/dsh-measure-guard/scripts/check-parity.sh` and
  `plugins/opencode-measure-guard/scripts/check-parity.sh`, with the outputs
  recorded in the same ledger area.
- **FR-5 (records).** The archived records track's spec/plan/metadata carry the
  corrections; this track's metadata, registry entry, and archive are updated.

## Non-Functional Requirements

- **NFR-1 (no behaviour change).** No checker or plugin logic changes; node
  suite 288/288; both parity gates ok; `bash tests/spec_review_gate/run.sh` 10/10.
- **NFR-2 (POSIX).** Windows stays out of scope.

## Acceptance Criteria (track level)

- Given the ledger file, Then it contains the closeout output showing only the
  expected missing-manifest FAIL, and the archive's tasks all carry SHAs.
- Given the archived record track, Then its `spec-review.md` holds the five
  verbatim findings with one disposition each and its index links it.
- Given the archived record track's plan, Then a task runs both named parity
  scripts.
- Given the gates, Then srg is 10/10, node 288/288, both parity gates ok.

## Out of Scope

- Creating an automation-supervisor closeout manifest (that is the supervisor's
  artifact, not a manual track's).
- Any checker behaviour change; the other spec_review_gate rows.
