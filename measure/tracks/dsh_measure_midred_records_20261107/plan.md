# Implementation Plan: DSH Measure mid-red record reconciliation

Track: `dsh_measure_midred_records_20261107`
Spec: [./spec.md](./spec.md)

A records/bug track: closeout-clean the archived plans, add the missing test
assertion, write the review record, fix the archived spec note, then verify.

## Phase 1: Reconcile the records

- [x] Task 1.1: the archived follow-up plan (`measure/archive/dsh_measure_midred_followup_20261107/plan.md`): mark Task 2.2 and the Phase 2 verification task `[x]` with their SHAs, add the missing SHAs to every completed task, and run `measure_interphase_checks.py closeout --track dsh_measure_midred_followup_20261107` (no "lacks commit SHA" item; record the result)
- [x] Task 1.2: `tests/spec_review_gate/test_checker.py`'s mid-red rename case adds `assertNotIn("tests/a.py", out)`; the checker tests pass
- [x] Task 1.3: write `measure/archive/dsh_measure_midred_followup_20261107/spec-review.md` (Round 1 F1–F3 plus the four closeout observations, with the author responses) and link it from that track's `index.md`; add the dated correction note to the archived mid-red `spec.md`
- [~] Task 1.4: run `bash tests/spec_review_gate/run.sh` (10/10) and the node suite (288/288)
- [ ] Task: Measure - User Manual Verification 'Phase 1: Reconcile the records' (Protocol in workflow.md)

## Phase 2: Closeout

- [ ] Task 2.1: `metadata.json`, archive the track, update `measure/tracks.md`
- [ ] Task: Measure - User Manual Verification 'Phase 2: Closeout' (Protocol in workflow.md)
