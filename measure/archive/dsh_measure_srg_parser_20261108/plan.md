# Implementation Plan: DSH Measure dispositions parser hardening

Track: `dsh_measure_srg_parser_20261108`
Spec: [./spec.md](./spec.md)

**Each phase checkpoint is pushed to `origin/main` before the next phase.**

## Phase 1: The rejection and its tests [checkpoint: 0f59f4c]

- [x] Task 1.1: `skills/measure-orchestrator/scripts/measure_interphase_checks.py`: add the control/zero-width character class and, after the per-item loop when no item failed, reject a value containing it with `invalid dispositions line: control or zero-width character` `766670c`
- [x] Task 1.2: `tests/spec_review_gate/test_s3_adversarial.sh`: make the NUL-in-CONTEST probe a contract reject, and add ESC-in-CONTEST, U+200B-in-CONTEST, and U+FEFF-in-ESCALATE rejects plus a tab-in-CONTEST pass; existing cases unchanged `766670c`
- [x] Task 1.3: run `bash tests/spec_review_gate/run.sh` (10/10, including the extended S3 probes) `766670c`
- [x] Task: Measure - User Manual Verification 'Phase 1: The rejection and its tests' (Protocol in workflow.md) `0f59f4c`

## Phase 2: Records and gates [checkpoint: 4f0b623]

- [x] Task 2.1: update `measure/tech-debt.md`'s parser row (the control/zero-width parser part resolved; the scope-rule item kept) and add the `CHANGELOG.md` bug-fix entry `766670c`
- [x] Task 2.2: run the node suite (301/301) and both parity scripts; record the results with the gate run `766670c`
- [x] Task: Measure - User Manual Verification 'Phase 2: Records and gates' (Protocol in workflow.md) `4f0b623`

## Phase 3: Closeout [checkpoint: 3281395]

- [x] Task 3.1: `metadata.json`, archive the track, update `measure/tracks.md`; run `closeout --track dsh_measure_srg_parser_20261108` and record the manifest-only FAIL `ea3d382`
- [x] Task: Measure - User Manual Verification 'Phase 3: Closeout' (Protocol in workflow.md) `3281395`
