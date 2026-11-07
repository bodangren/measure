# Implementation Plan: DSH Measure audit role contract alignment

Track: `dsh_measure_audit_contract_20261110`
Spec: [./spec.md](./spec.md)

**Each phase checkpoint is pushed to `origin/main` before the next phase.**

## Phase 1: The gate and the doc

- [x] Task 1.1: `skills/measure-orchestrator/scripts/measure_interphase_checks.py`: map `orchestrator-audit`/`measure-orchestrator-audit` in `ROLE_ALIASES` and include the role in the audit-role branch of `cmd_role_gate` `12b741c`
- [x] Task 1.2: `agents/measure-orchestrator-audit.md`: example `"schema_version": 1`; Outputs #2/#3 state the catalog entry and guard test are proposals (reported as candidates), matching the `measure/runs/**`-only edit permissions `12b741c`
- [x] Task 1.3: tests — `test_checker.py` orchestrator-audit pass/schema-2 cases; `test_s4_doc_drift.sh` schema-version and proposal-wording assertions `12b741c`
- [x] Task 1.4: run `bash tests/spec_review_gate/run.sh` (11/11), `bash tests/dsh/run.sh` (13/13), node (318/318), and both parity gates `12b741c`
- [x] Task: Measure - User Manual Verification 'Phase 1: The gate and the doc' (Protocol in workflow.md) `12b741c`

## Phase 2: Records and closeout

- [x] Task 2.1: update the Group (a) row in `measure/tech-debt.md` and add the `CHANGELOG.md` entry `12b741c`
- [x] Task 2.2: `metadata.json`, archive the track, update `measure/tracks.md`; run `closeout --track dsh_measure_audit_contract_20261110` and record the manifest-only FAIL `12b741c`
- [x] Task: Measure - User Manual Verification 'Phase 2: Records and closeout' (Protocol in workflow.md) `12b741c`
