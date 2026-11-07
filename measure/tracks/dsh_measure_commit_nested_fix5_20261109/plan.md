# Implementation Plan: DSH Measure commit guard nested fix5

Track: `dsh_measure_commit_nested_fix5_20261109`
Spec: [./spec.md](./spec.md)

**Each phase checkpoint is pushed to `origin/main` before the next phase.**

## Phase 1: Short-cluster `-c` and the missing cases

- [x] Task 1.1: `plugins/dsh-measure-guard/src/commit.js`: set `takesCommand` only for a short option cluster containing `c` (not a long option such as `--norc`) `a79d5d9`
- [x] Task 1.2: `plugins/dsh-measure-guard/tests/commit.test.js`: `bash --init-file FILE -c` (path) and `bash --norc -- -c` (no path) `a79d5d9`
- [x] Task 1.3: run `node --test plugins/dsh-measure-guard/tests/*.test.js` and both parity scripts `a79d5d9`
- [ ] Task: Measure - User Manual Verification 'Phase 1: Short-cluster `-c` and the missing cases' (Protocol in workflow.md)

## Phase 2: Records and gates

- [x] Task 2.1: record the fix4 review in `measure/archive/dsh_measure_commit_nested_fix4_20261109/spec-review.md` and link it; correct the fix4 spec's wrong review-target note and its 312 count; add dated `--` corrections to the fix2 and fix3 specs; confirm the fix3 review lives in its own archive; update the CHANGELOG count (313) and keep the residual precise `a79d5d9`
- [x] Task 2.2: run `bash tests/dsh/run.sh` (13/13) and `bash tests/spec_review_gate/run.sh` (11/11) `a79d5d9`
- [ ] Task: Measure - User Manual Verification 'Phase 2: Records and gates' (Protocol in workflow.md)

## Phase 3: Closeout

- [ ] Task 3.1: `metadata.json`, archive the track, update `measure/tracks.md`; run `closeout --track dsh_measure_commit_nested_fix5_20261109` and record the manifest-only FAIL
- [ ] Task: Measure - User Manual Verification 'Phase 3: Closeout' (Protocol in workflow.md)
