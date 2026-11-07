# Implementation Plan: DSH Measure intermediate-commit scope coverage

Track: `dsh_measure_scope_intermediate_20261109`
Spec: [./spec.md](./spec.md)

**Each phase checkpoint is pushed to `origin/main` before the next phase.**

## Phase 1: Intermediate paths and the probe [checkpoint: da6de25]

- [x] Task 1.1: `skills/measure-orchestrator/scripts/measure_interphase_checks.py`: union `git log --no-renames --name-only --pretty=format: baseline..HEAD` paths into `changed_files()` and `committed_files()`, keeping the existing tree/staged/working diffs and the sorted deduplicated output `061d6a3`
- [x] Task 1.2: `tests/spec_review_gate/test_s2_adversarial.sh`: add the intermediate add-then-delete probe (mid-red reports `Mid Red changed non-test/non-Measure files`) and the test-only intermediate probe (no such message) `061d6a3`
- [x] Task 1.3: run `bash tests/spec_review_gate/run.sh` (11/11) and record the probe results `061d6a3`
- [x] Task: Measure - User Manual Verification 'Phase 1: Intermediate paths and the probe' (Protocol in workflow.md) `da6de25`

## Phase 2: Records and gates [checkpoint: 5a4c841]

- [x] Task 2.1: resolve the parser row in `measure/tech-debt.md` (its last residual is closed) and add the `CHANGELOG.md` bug-fix entry `061d6a3`
- [x] Task 2.2: run the node suite (301/301), both parity scripts, and `bash tests/dsh/run.sh` (12/12) `061d6a3`
- [x] Task: Measure - User Manual Verification 'Phase 2: Records and gates' (Protocol in workflow.md) `5a4c841`

## Phase 3: Closeout [checkpoint: c8709e6]

- [x] Task 3.1: `metadata.json`, archive the track, update `measure/tracks.md`; run `closeout --track dsh_measure_scope_intermediate_20261109` and record the manifest-only FAIL `caf5b9c`
- [x] Task: Measure - User Manual Verification 'Phase 3: Closeout' (Protocol in workflow.md) `c8709e6`
