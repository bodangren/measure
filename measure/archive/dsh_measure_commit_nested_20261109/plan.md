# Implementation Plan: DSH Measure commit guard nested-command coverage

Track: `dsh_measure_commit_nested_20261109`
Spec: [./spec.md](./spec.md)

**Each phase checkpoint is pushed to `origin/main` before the next phase.**

## Phase 1: The nested scan and `git stage` [checkpoint: 7d34840]

- [x] Task 1.1: `plugins/dsh-measure-guard/src/commit.js`: treat a command-position `git stage` like `git add`, and recursively scan `bash -c`/`sh -c`/`zsh -c`/`eval` inner commands (depth-capped, merging `all`/`trackedOnly`/`paths`; unreadable inner text fails closed) `76b5f65`
- [x] Task 1.2: `plugins/dsh-measure-guard/tests/commit.test.js`: add `git stage`, `bash -c`, `eval`, doubly nested, no-add inner, and a commitCheck integration case with a conforming message `76b5f65`
- [x] Task 1.3: run `node --test plugins/dsh-measure-guard/tests/*.test.js` and both parity scripts `76b5f65`
- [x] Task: Measure - User Manual Verification 'Phase 1: The nested scan and `git stage`' (Protocol in workflow.md) `7d34840`

## Phase 2: Records and gates [checkpoint: cff253e]

- [x] Task 2.1: narrow the commit-race residual in `measure/tech-debt.md` to arbitrary wrapper scripts and add the `CHANGELOG.md` bug-fix entry `76b5f65`
- [x] Task 2.2: run `bash tests/dsh/run.sh` (13/13) and `bash tests/spec_review_gate/run.sh` (11/11) `76b5f65`
- [x] Task: Measure - User Manual Verification 'Phase 2: Records and gates' (Protocol in workflow.md) `cff253e`

## Phase 3: Closeout [checkpoint: 1cfceb2]

- [x] Task 3.1: `metadata.json`, archive the track, update `measure/tracks.md`; run `closeout --track dsh_measure_commit_nested_20261109` and record the manifest-only FAIL `8326ecf`
- [x] Task: Measure - User Manual Verification 'Phase 3: Closeout' (Protocol in workflow.md) `1cfceb2`
