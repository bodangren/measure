# Implementation Plan: DSH Measure A11 recipe fix2

Track: `dsh_measure_a11_recipe_fix2_20261108`
Spec: [./spec.md](./spec.md)

**Each phase checkpoint is pushed to `origin/main` before the next phase.**

## Phase 1: The command skip and the pinned space rule [checkpoint: c13fddc]

- [x] Task 1.1: update the A11 bash block in both catalog copies: pin the pattern to one space (`^[A-Za-z0-9_.-]+/[A-Za-z0-9_./-]*( [A-Za-z0-9_./-]+)?$`) and skip a span whose first word is an existing executable file when the full span is not a path `2f55b31`
- [x] Task 1.2: `tests/spec_review_gate/test_s4_adversarial.sh`: add G2 rows for the executable command (silent), double-space, leading-space, trailing-space, and executable-command-missing-argument spans; make the unreadable-document row report-only under root; retarget the G6 mutants and add the executable-skip and multiple-space mutants `2f55b31`
- [x] Task 1.3: run `bash tests/spec_review_gate/test_s4_adversarial.sh` and `bash tests/spec_review_gate/run.sh` (10/10); check the live A11 output returns to 3 candidates `2f55b31`
- [x] Task: Measure - User Manual Verification 'Phase 1: The command skip and the pinned space rule' (Protocol in workflow.md) `c13fddc`

## Phase 2: Records and gates [checkpoint: dd2b5a0]

- [x] Task 2.1: write `measure/archive/dsh_measure_a11_recipe_20261108/spec-review.md` (F1–F8 with dispositions), link it from its index, add the dated correction note to its spec; correct the tech-debt Group (e) row (keep `..` paths and the candidate-count item open); update the CHANGELOG `2f55b31`
- [x] Task 2.2: run the node suite (301/301), both parity scripts, and `bash tests/dsh/run.sh` (11/11); record the results `2f55b31`
- [x] Task: Measure - User Manual Verification 'Phase 2: Records and gates' (Protocol in workflow.md) `dd2b5a0`

## Phase 3: Closeout [checkpoint: 297ce22]

- [x] Task 3.1: `metadata.json`, archive the track, update `measure/tracks.md`; run `closeout --track dsh_measure_a11_recipe_fix2_20261108` and record the manifest-only FAIL `7c5190a`
- [x] Task: Measure - User Manual Verification 'Phase 3: Closeout' (Protocol in workflow.md) `297ce22`
