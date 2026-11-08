# Implementation Plan: DSH Measure gate timing

Track: `dsh_measure_gate_timing_20261110`
Spec: [./spec.md](./spec.md)

**Each phase checkpoint is pushed to `origin/main` before the next phase.**

## Phase 1: The tolerant budgets and the load proof [checkpoint: 6f19da5]

- [x] Task 1.1: `tests/spec_review_gate/test_s4_adversarial.sh`: calibrate the G5 budget from a tenth-size run (x5 allowance, 20 s floor) and print it; `tests/spec_review_gate/test_s3_adversarial.sh`: the G18 budget becomes 30 s with the observed-flake comment `c81f051`
- [x] Task 1.2: load proof: run the S4 suite with four busy loops beside it (G5 time above 5 s, suite green) and show a quadratic-stub recipe still fails the G5 check `c81f051`
- [x] Task 1.3: run `bash tests/spec_review_gate/run.sh` (11/11), `bash tests/dsh/run.sh` (13/13), the node suite, and both parity gates `c81f051`
- [x] Task: Measure - User Manual Verification 'Phase 1: The tolerant budgets and the load proof' (Protocol in workflow.md) `6f19da5`

## Phase 2: Records and closeout

- [x] Task 2.1: resolve the gate-timing tech-debt row, add the `CHANGELOG.md` entry; prune generated `__pycache__`/`*.pyc` from `bin/measure-dsh --check`'s skill file list (a closeout run recreated it and made `--check --live` red) with a `test-check.sh` pin; record the live check, run the gates again `e1cdaec`
- [x] Task 2.2: `metadata.json`, archive the track, update the tracks registry; run `closeout --track dsh_measure_gate_timing_20261110` and record the manifest-only FAIL `2b16e9d`
- [~] Task: Measure - User Manual Verification 'Phase 2: Records and closeout' (Protocol in workflow.md)
