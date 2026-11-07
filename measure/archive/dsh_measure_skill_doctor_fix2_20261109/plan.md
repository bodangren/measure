# Implementation Plan: DSH Measure skill-doc check fix2

Track: `dsh_measure_skill_doctor_fix2_20261109`
Spec: [./spec.md](./spec.md)

**Each phase checkpoint is pushed to `origin/main` before the next phase.**

## Phase 1: The real folder-link rule and the fixtures [checkpoint: f3067f1]

- [x] Task 1.1: `tests/dsh/test-skill-docs.sh`: add the Markdown folder-link rule (target empty/scheme/trailing slash/or resolves to a directory relative to the SKILL.md folder), keep the bundle symlink rule separately named, and report a missing description `8be4295`
- [x] Task 1.2: add fixtures — directory link, trailing-slash target, bundle symlink, missing description, 1024 pass / 1025 fail, `|` block parse (1025 fails), `<`-only and `>`-only, and a file link pass `8be4295`
- [x] Task 1.3: run `bash tests/dsh/test-skill-docs.sh` and `bash tests/dsh/run.sh` (13/13) `8be4295`
- [x] Task: Measure - User Manual Verification 'Phase 1: The real folder-link rule and the fixtures' (Protocol in workflow.md) `f3067f1`

## Phase 2: Records and gates [checkpoint: 515ffc9]

- [x] Task 2.1: write `measure/archive/dsh_measure_skill_doctor_check_20261109/spec-review.md` (F1–F8 with dispositions), link it from its index, and add the dated correction note to its spec `8be4295`
- [x] Task 2.2: run the node suite (301/301), both parity scripts, and `bash tests/spec_review_gate/run.sh` (11/11) `8be4295`
- [x] Task: Measure - User Manual Verification 'Phase 2: Records and gates' (Protocol in workflow.md) `515ffc9`

## Phase 3: Closeout

- [x] Task 3.1: `metadata.json`, archive the track, update `measure/tracks.md`; run `closeout --track dsh_measure_skill_doctor_fix2_20261109` and record the manifest-only FAIL
- [x] Task: Measure - User Manual Verification 'Phase 3: Closeout' (Protocol in workflow.md)
