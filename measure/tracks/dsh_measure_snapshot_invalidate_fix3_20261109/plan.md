# Implementation Plan: DSH Measure snapshot invalidation fix3

Track: `dsh_measure_snapshot_invalidate_fix3_20261109`
Spec: [./spec.md](./spec.md)

**Each phase checkpoint is pushed to `origin/main` before the next phase.**

## Phase 1: The complete records

- [x] Task 1.1: make the fix2 spec note carry all four corrections (test files, counts 317/318, cost including the rev-parse, within-step window); fix the original track's note to state its own 317/317; dual-attribute the CHANGELOG bullet; add the rev-parse cost; correct the F4 wording; consolidate the perf row to one 2026-11-10 resolution clause
- [x] Task 1.2: write `measure/archive/dsh_measure_snapshot_invalidate_fix2_20261109/spec-review.md` (F1–F5 with dispositions), link it from that index; run `bash tests/dsh/run.sh` (13/13) and `bash tests/spec_review_gate/run.sh` (11/11)
- [ ] Task: Measure - User Manual Verification 'Phase 1: The complete records' (Protocol in workflow.md)

## Phase 2: Closeout

- [ ] Task 2.1: `metadata.json`, archive the track, update `measure/tracks.md`; run `closeout --track dsh_measure_snapshot_invalidate_fix3_20261109` and record the manifest-only FAIL
- [ ] Task: Measure - User Manual Verification 'Phase 2: Closeout' (Protocol in workflow.md)
