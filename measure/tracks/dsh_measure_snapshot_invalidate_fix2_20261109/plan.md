# Implementation Plan: DSH Measure snapshot invalidation fix2

Track: `dsh_measure_snapshot_invalidate_fix2_20261109`
Spec: [./spec.md](./spec.md)

**Each phase checkpoint is pushed to `origin/main` before the next phase.**

## Phase 1: The exported set and the disjoint test

- [x] Task 1.1: `plugins/dsh-measure-guard/src/guard.js`: export `MUTATION_TOOLS`; `plugins/dsh-measure-guard/tests/guard-prep.test.js`: assert every mutation tool is `repoMutationLikely` true and the two sets are disjoint `eabc11d`
- [x] Task 1.2: run `node --test plugins/dsh-measure-guard/tests/*.test.js` and both parity scripts `eabc11d`
- [ ] Task: Measure - User Manual Verification 'Phase 1: The exported set and the disjoint test' (Protocol in workflow.md)

## Phase 2: Records and gates

- [x] Task 2.1: write `measure/archive/dsh_measure_snapshot_invalidate_20261109/spec-review.md` (F1–F6 with dispositions) and link it; add the dated spec corrections (test files, node 318, per-result cost, within-step window) and set the perf row Status Resolved with the precise wording; update `CHANGELOG.md` `eabc11d`
- [x] Task 2.2: run `bash tests/dsh/run.sh` (13/13) and `bash tests/spec_review_gate/run.sh` (11/11) `eabc11d`
- [ ] Task: Measure - User Manual Verification 'Phase 2: Records and gates' (Protocol in workflow.md)

## Phase 3: Closeout

- [ ] Task 3.1: `metadata.json`, archive the track, update `measure/tracks.md`; run `closeout --track dsh_measure_snapshot_invalidate_fix2_20261109` and record the manifest-only FAIL
- [ ] Task: Measure - User Manual Verification 'Phase 3: Closeout' (Protocol in workflow.md)
