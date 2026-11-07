# Implementation Plan: DSH Measure audit contract fix2

Track: `dsh_measure_audit_contract_fix2_20261110`
Spec: [./spec.md](./spec.md)

**Each phase checkpoint is pushed to `origin/main` before the next phase.**

## Phase 1: The remaining instructions and the format

- [x] Task 1.1: `agents/measure-orchestrator-audit.md`: Inputs #1 and Detectors item 3 become proposals; Outputs defines the `PROPOSAL:` candidate format (catalog entry or guard test, proposed path and assertion, applied by the orchestrator or a track) `08c9102`
- [x] Task 1.2: `tests/spec_review_gate/test_checker.py`: `measure-orchestrator-audit` alias case; `tests/spec_review_gate/test_s4_doc_drift.sh`: the `PROPOSAL:` sentence exists and the old phrases are absent `08c9102`
- [x] Task 1.3: run `bash tests/spec_review_gate/run.sh` (11/11) and `bash tests/dsh/run.sh` (13/13) `08c9102`
- [ ] Task: Measure - User Manual Verification 'Phase 1: The remaining instructions and the format' (Protocol in workflow.md)

## Phase 2: Records and closeout

- [x] Task 2.1: write `measure/archive/dsh_measure_audit_contract_20261110/spec-review.md` (F1–F8 with dispositions), link it, add the dated correction note to its spec; update the Group (a) row and `CHANGELOG.md`; run the node suite (318/318) and both parity gates `08c9102`
- [x] Task 2.2: `metadata.json`, archive the track, update `measure/tracks.md`; run `closeout --track dsh_measure_audit_contract_fix2_20261110` and record the manifest-only FAIL `08c9102`
- [ ] Task: Measure - User Manual Verification 'Phase 2: Records and closeout' (Protocol in workflow.md)
