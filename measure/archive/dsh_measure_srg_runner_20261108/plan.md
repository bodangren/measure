# Implementation Plan: DSH Measure spec-review-gate runner hardening

Track: `dsh_measure_srg_runner_20261108`
Spec: [./spec.md](./spec.md)

**Each phase checkpoint is pushed to `origin/main` before the next phase.**

## Phase 1: Harden the runner [checkpoint: 992eabf]

- [x] Task 1.1: `tests/spec_review_gate/run.sh`: skip the runner itself, skip a selected symbolic link with `ignored suite (symbolic link): <name>`, refuse a suite name containing `*`/`?`/`[` with `refusing a suite name with a glob metacharacter: <name>` and exit 1, and capture `.py` suite output so a `Ran 0 tests` line makes the suite FAIL `47342ef`
- [x] Task 1.2: `tests/spec_review_gate/test_s1_adversarial.sh`: add the five runner probes (self-selection alone, self-selection beside a real suite, symlink skipped, glob-metacharacter refused, zero-test `.py` suite FAIL); existing probes unchanged `47342ef`
- [x] Task 1.3: run `bash tests/spec_review_gate/run.sh` (10/10) and the new probes `47342ef`
- [x] Task: Measure - User Manual Verification 'Phase 1: Harden the runner' (Protocol in workflow.md) `992eabf`

## Phase 2: Records and gates [checkpoint: 419fe1a]

- [x] Task 2.1: update `measure/tech-debt.md`'s srg-runner row (SELF/SYMLINK/PYGLOB/PYZERO resolved; the MKTEMP residual named) and add the `CHANGELOG.md` bug-fix entry `47342ef`
- [x] Task 2.2: run the node suite (301/301), both parity scripts, and `bash tests/spec_review_gate/run.sh`; record the results `47342ef`
- [x] Task: Measure - User Manual Verification 'Phase 2: Records and gates' (Protocol in workflow.md) `419fe1a`

## Phase 3: Closeout

- [x] Task 3.1: `metadata.json`, archive the track, update `measure/tracks.md`; run `closeout --track dsh_measure_srg_runner_20261108` and record the manifest-only FAIL
- [x] Task: Measure - User Manual Verification 'Phase 3: Closeout' (Protocol in workflow.md)
