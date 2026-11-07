# Implementation Plan: DSH Measure commit guard nested fix3

Track: `dsh_measure_commit_nested_fix3_20261109`
Spec: [./spec.md](./spec.md)

**Each phase checkpoint is pushed to `origin/main` before the next phase.**

## Phase 1: Option arguments and the boundary

- [x] Task 1.1: `plugins/dsh-measure-guard/src/commit.js`: skip the argument of `-o`/`-O` (and `--opt=value` is one token) while looking for the `-c` cluster; skip a `--` before the command word; state `depth > 3` explicitly `0ef8886`
- [x] Task 1.2: `plugins/dsh-measure-guard/tests/commit.test.js`: `bash -o pipefail -c`, `bash -O extglob -c`, `bash -c -- <string>`, three-nested → path, four-nested → `all: true` `0ef8886`
- [x] Task 1.3: run `node --test plugins/dsh-measure-guard/tests/*.test.js` and both parity scripts `0ef8886`
- [ ] Task: Measure - User Manual Verification 'Phase 1: Option arguments and the boundary' (Protocol in workflow.md)

## Phase 2: Records and gates

- [x] Task 2.1: write `measure/archive/dsh_measure_commit_nested_fix2_20261109/spec-review.md` (F1–F5 with dispositions), link it from that index, add the dated note to the fix2 spec; correct the fix1 review's F5; update the CHANGELOG count and the residual wording `0ef8886`
- [x] Task 2.2: run `bash tests/dsh/run.sh` (13/13) and `bash tests/spec_review_gate/run.sh` (11/11) `0ef8886`
- [ ] Task: Measure - User Manual Verification 'Phase 2: Records and gates' (Protocol in workflow.md)

## Phase 3: Closeout

- [ ] Task 3.1: `metadata.json`, archive the track, update `measure/tracks.md`; run `closeout --track dsh_measure_commit_nested_fix3_20261109` and record the manifest-only FAIL
- [ ] Task: Measure - User Manual Verification 'Phase 3: Closeout' (Protocol in workflow.md)
