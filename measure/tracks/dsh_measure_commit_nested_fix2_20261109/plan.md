# Implementation Plan: DSH Measure commit guard nested fix2

Track: `dsh_measure_commit_nested_fix2_20261109`
Spec: [./spec.md](./spec.md)

**Each phase checkpoint is pushed to `origin/main` before the next phase.**

## Phase 1: The wider recognition and the tests

- [x] Task 1.1: `plugins/dsh-measure-guard/src/commit.js`: record the four-level cap, join all `eval` arguments, accept `bash`/`sh`/`zsh` by basename with any `-c`-bearing option cluster (and after `--`), and include `git stage` in the substitution pattern `c0c9efe`
- [x] Task 1.2: `plugins/dsh-measure-guard/tests/commit.test.js`: add `zsh -c`, `bash -lc`, `/bin/bash -c`, `bash -x -c`, both multi-word `eval` forms, `X=$(git stage …)`, five-level nesting (`all: true`), unreadable inner text (`all: true`), and change the integration case to an untracked `src/new.js` `c0c9efe`
- [x] Task 1.3: run `node --test plugins/dsh-measure-guard/tests/*.test.js` and both parity scripts `c0c9efe`
- [ ] Task: Measure - User Manual Verification 'Phase 1: The wider recognition and the tests' (Protocol in workflow.md)

## Phase 2: Records and gates

- [x] Task 2.1: name the precise commit-race residual in `measure/tech-debt.md`, write the fix1 review (F1–F5 with dispositions) and its spec correction note, and clarify the `CHANGELOG.md` bullet `c0c9efe`
- [x] Task 2.2: run `bash tests/dsh/run.sh` (13/13) and `bash tests/spec_review_gate/run.sh` (11/11) `c0c9efe`
- [ ] Task: Measure - User Manual Verification 'Phase 2: Records and gates' (Protocol in workflow.md)

## Phase 3: Closeout

- [ ] Task 3.1: `metadata.json`, archive the track, update `measure/tracks.md`; run `closeout --track dsh_measure_commit_nested_fix2_20261109` and record the manifest-only FAIL
- [ ] Task: Measure - User Manual Verification 'Phase 3: Closeout' (Protocol in workflow.md)
