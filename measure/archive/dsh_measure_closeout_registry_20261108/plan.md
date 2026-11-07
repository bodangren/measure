# Implementation Plan: DSH Measure closeout registry-description guard

Track: `dsh_measure_closeout_registry_20261108`
Spec: [./spec.md](./spec.md)

**Each phase checkpoint is pushed to `origin/main` before the next phase.**

## Phase 1: The guard and its test [checkpoint: 41b4b82]

- [x] Task 1.1: `skills/measure-orchestrator/scripts/measure_interphase_checks.py`: add `registry_description_feedback()` and call it from `closeout_feedback()` — missing entry, missing description, and description differing from the collapsed `metadata.json` description (at most one message) `9315324`
- [x] Task 1.2: `tests/dsh/test-closeout-registry.sh`: temporary Measure repo with an archived track; matching fixture silent, metadata change → `differs from metadata`, removed description → `has no description`, removed entry → `missing registry entry`; the expected manifest FAIL is present in all four `9315324`
- [x] Task 1.3: run `bash tests/dsh/test-closeout-registry.sh` and `bash tests/dsh/run.sh` (12/12); confirm a real archived track shows no new closeout FAIL `9315324`
- [x] Task: Measure - User Manual Verification 'Phase 1: The guard and its test' (Protocol in workflow.md) `41b4b82`

## Phase 2: Records and gates [checkpoint: 14cba2a]

- [x] Task 2.1: document the check in the closeout reference (`skills/measure-orchestrator/references/checks.md` or the equivalent) and add the `CHANGELOG.md` bug-fix entry `9315324`
- [x] Task 2.2: run the node suite (301/301), both parity scripts, and `bash tests/spec_review_gate/run.sh` (10/10) `9315324`
- [x] Task: Measure - User Manual Verification 'Phase 2: Records and gates' (Protocol in workflow.md) `14cba2a`

## Phase 3: Closeout [checkpoint: d4e6119]

- [x] Task 3.1: `metadata.json`, archive the track, update `measure/tracks.md`; run `closeout --track dsh_measure_closeout_registry_20261108` and record the manifest-only FAIL `cad9bde`
- [x] Task: Measure - User Manual Verification 'Phase 3: Closeout' (Protocol in workflow.md) `d4e6119`
