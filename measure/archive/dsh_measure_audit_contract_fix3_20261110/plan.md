# Implementation Plan: DSH Measure audit contract fix3

Track: `dsh_measure_audit_contract_fix3_20261110`
Spec: [./spec.md](./spec.md)

**Each phase checkpoint is pushed to `origin/main` before the next phase.**

## Phase 1: Status semantics and whole-file checks [checkpoint: f3abe17]

- [x] Task 1.1: `agents/measure-orchestrator-audit.md`: state that a proposed guard which would fail is a nonblocking candidate and keeps `status: "pass"` (F1) `e0d9eac`
- [x] Task 1.2: `tests/spec_review_gate/test_s4_doc_drift.sh`: whole-file whitespace-collapsed negative checks for the two write phrases (F2) and a positive check pinning the full candidate format sentence (F3) plus the status sentence (F1) `e0d9eac`
- [x] Task 1.3: run `bash tests/spec_review_gate/run.sh` (11/11) and `bash tests/dsh/run.sh` (13/13) `e0d9eac`
- [x] Task: Measure - User Manual Verification 'Phase 1: Status semantics and whole-file checks' (Protocol in workflow.md) `f3abe17`

## Phase 2: Records and closeout

- [~] Task 2.1: write `measure/archive/dsh_measure_audit_contract_fix2_20261110/spec-review.md` (F1–F5 with dispositions), link it, add the dated correction note to its spec (F4); mark the Group (a) row `Resolved` (F5); update `CHANGELOG.md`; run the node suite (318/318) and both parity gates
- [ ] Task 2.2: `metadata.json`, archive the track, update `measure/tracks.md`; run `closeout --track dsh_measure_audit_contract_fix3_20261110` and record the manifest-only FAIL
- [ ] Task: Measure - User Manual Verification 'Phase 2: Records and closeout' (Protocol in workflow.md)
