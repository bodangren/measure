# Implementation Plan: DSH Measure mid-red evidence and record precision

Track: `dsh_measure_midred_evidence_20261107`
Spec: [./spec.md](./spec.md)

A records track: the ledger, the parity task, the verbatim review record, the
corrected archived record, then the gates and closeout.

## Phase 1: The ledger and the record [checkpoint: 548b4c8]

- [x] Task 1.1: `measure/runs/dsh_measure_midred_records_20261107/closeout.txt` write the named ledger `measure/runs/dsh_measure_midred_records_20261107/closeout.txt` holding the exact `closeout --track dsh_measure_midred_followup_20261107` output (only the expected missing-manifest FAIL) and the four task SHAs
- [x] Task 1.2: run `plugins/dsh-measure-guard/scripts/check-parity.sh` and `plugins/opencode-measure-guard/scripts/check-parity.sh`; append both outputs to the ledger; add the parity verification task (with its output location) to the archived record track's plan
- [x] Task 1.3: write `measure/archive/dsh_measure_midred_records_20261107/spec-review.md` with the five findings verbatim (ids, severities, text) and one disposition per finding; link it from that track's `index.md`
- [x] Task 1.4: correct the archived record track's spec/plan/metadata: the Overview's open-task list (Task 2.2 and Phase 2 verification were already `[x]` with `a481293`/`da75968`; the four tasks needing SHAs are 1.1/1.2/1.3/2.1), the definition of closeout-clean and the manifest-out-of-scope rule, the concrete review-record requirement, and the parity task
- [x] Task 1.5: run `bash tests/spec_review_gate/run.sh` (10/10), the node suite (288/288), and both parity gates; record the results
- [x] Task: Measure - User Manual Verification 'Phase 1: The ledger and the record' (Protocol in workflow.md) `548b4c8`

## Phase 2: Closeout

- [ ] Task 2.1: `metadata.json`, archive the track, update `measure/tracks.md`
- [ ] Task: Measure - User Manual Verification 'Phase 2: Closeout' (Protocol in workflow.md)
