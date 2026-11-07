# Implementation Plan: DSH Measure A11 recipe fix3

Track: `dsh_measure_a11_recipe_fix3_20261108`
Spec: [./spec.md](./spec.md)

**Each phase checkpoint is pushed to `origin/main` before the next phase.**

## Phase 1: Record corrections [checkpoint: a6e76df]

- [x] Task 1.1: replace the old pattern string in the fix2 track's spec (FR-2), plan (Task 1.1), and correction note with `^[A-Za-z0-9_.-]+/([A-Za-z0-9_./-]+( [A-Za-z0-9_./-]+)?)?$`; update the CHANGELOG A11 bullet (92 checks, both A11 tracks, fix2 executable skip) `a245c3d`
- [x] Task 1.2: write `measure/archive/dsh_measure_a11_recipe_fix2_20261108/spec-review.md` (F1–F5 with dispositions), link it from the fix2 index, and add the root-branch / live-count wording to the fix2 spec record `a245c3d`
- [x] Task 1.3: run the gates — `bash tests/spec_review_gate/run.sh` (10/10), node (301/301), both parity scripts, `bash tests/dsh/run.sh` (11/11) `a245c3d`
- [x] Task: Measure - User Manual Verification 'Phase 1: Record corrections' (Protocol in workflow.md) `a6e76df`

## Phase 2: Closeout

- [x] Task 2.1: `metadata.json`, archive the track, update `measure/tracks.md`; run `closeout --track dsh_measure_a11_recipe_fix3_20261108` and record the manifest-only FAIL
- [x] Task: Measure - User Manual Verification 'Phase 2: Closeout' (Protocol in workflow.md)
