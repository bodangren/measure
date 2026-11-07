# Implementation Plan: DSH Measure A11 recipe hardening

Track: `dsh_measure_a11_recipe_20261108`
Spec: [./spec.md](./spec.md)

**Each phase checkpoint is pushed to `origin/main` before the next phase.**

## Phase 1: The hardened recipe [checkpoint: f903c37]

- [x] Task 1.1: update the A11 bash block in `skills/measure-orchestrator/references/anti-pattern-catalog.md` and the identical copy in `measure/anti-patterns.md`: `grep -a` text mode; the path pattern accepts a space after the first segment (commands stay out because the first segment cannot contain a space); distinct `does not exist` / `is not a regular file` / `cannot be read` document messages `57e29b2`
- [x] Task 1.2: `tests/spec_review_gate/test_s4_adversarial.sh`: add the G2 contract cases (NUL and invalid UTF-8 reports, space path reported/silent, directory and unreadable documents, commands silent) and keep the report rows `57e29b2`
- [x] Task 1.3: run `bash tests/spec_review_gate/test_s4_adversarial.sh` and `bash tests/spec_review_gate/run.sh` (10/10) `57e29b2`
- [x] Task: Measure - User Manual Verification 'Phase 1: The hardened recipe' (Protocol in workflow.md) `f903c37`

## Phase 2: Records and gates [checkpoint: bb6619f]

- [x] Task 2.1: update the tech-debt Group (e) row (NUL, space-path, and message items resolved; residual if any named) and add the `CHANGELOG.md` bug-fix entry `57e29b2`
- [x] Task 2.2: run the node suite (301/301) and both parity scripts; record the results with the gate run `57e29b2`
- [x] Task: Measure - User Manual Verification 'Phase 2: Records and gates' (Protocol in workflow.md) `bb6619f`

## Phase 3: Closeout [checkpoint: ffed391]

- [x] Task 3.1: `metadata.json`, archive the track, update `measure/tracks.md`; run `closeout --track dsh_measure_a11_recipe_20261108` and record the manifest-only FAIL `d077701`
- [x] Task: Measure - User Manual Verification 'Phase 3: Closeout' (Protocol in workflow.md) `ffed391`
