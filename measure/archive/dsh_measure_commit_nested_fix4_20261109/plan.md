# Implementation Plan: DSH Measure commit guard nested fix4

Track: `dsh_measure_commit_nested_fix4_20261109`
Spec: [./spec.md](./spec.md)

**Each phase checkpoint is pushed to `origin/main` before the next phase.**

## Phase 1: Option arguments by behavior and `--` semantics [checkpoint: 7ad9de8]

- [x] Task 1.1: `plugins/dsh-measure-guard/src/commit.js`: step over the argument of `-o`/`-O`, a short cluster ending in `o`/`O`, `--rcfile`, and `--init-file`; a `--` after `-c` is skipped while a `--` before any `-c` stops the scan `b75bbd7`
- [x] Task 1.2: `plugins/dsh-measure-guard/tests/commit.test.js`: cases for `bash -euo pipefail -c`, `bash --rcfile FILE -c`, `bash -c -- <string>`, and `bash -- -c <string>` `b75bbd7`
- [x] Task 1.3: run `node --test plugins/dsh-measure-guard/tests/*.test.js` and both parity scripts `b75bbd7`
- [x] Task: Measure - User Manual Verification 'Phase 1: Option arguments by behavior and `--` semantics' (Protocol in workflow.md) `7ad9de8`

## Phase 2: Records and gates [checkpoint: f99aaef]

- [x] Task 2.1: record the fix3 review in `measure/tracks/dsh_measure_commit_nested_fix4_20261109/spec-review.md`; write `measure/archive/dsh_measure_commit_nested_fix2_20261109/spec-review.md`, link it and add the fix2 spec correction; append a dated correction to the fix1 review's F5 finding; correct the fix2 spec's "depth 5 and beyond" sentence; update the tech-debt residual and the CHANGELOG count (`node 312 tests`) `b75bbd7`
- [x] Task 2.2: run `bash tests/dsh/run.sh` (13/13) and `bash tests/spec_review_gate/run.sh` (11/11) `b75bbd7`
- [x] Task: Measure - User Manual Verification 'Phase 2: Records and gates' (Protocol in workflow.md) `f99aaef`

## Phase 3: Closeout

- [x] Task 3.1: `metadata.json`, archive the track, update `measure/tracks.md`; run `closeout --track dsh_measure_commit_nested_fix4_20261109` and record the manifest-only FAIL `d4ca811`
- [x] Task: Measure - User Manual Verification 'Phase 3: Closeout' (Protocol in workflow.md)
