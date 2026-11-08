# Implementation Plan: DSH Measure commit wrapper closure

Track: `dsh_measure_commit_wrapper_20261110`
Spec: [./spec.md](./spec.md)

**Each phase checkpoint is pushed to `origin/main` before the next phase.**

## Phase 1: The fail-closed wrapper forms and their tests

- [x] Task 1.1: `plugins/dsh-measure-guard/src/commit.js`: a nested shell with no `-c` string but a script argument fails closed; a command-position `.sh`/`./`/`../` token and a `source`/`.` command fail closed; `-c`/`eval`/option handling unchanged `0ec46a3`
- [x] Task 1.2: `plugins/dsh-measure-guard/tests/commit.test.js`: the wrapper forms (all true), the unchanged forms (paths), and the negatives `0ec46a3`
- [x] Task 1.3: run `node --test plugins/dsh-measure-guard/tests/*.test.js`, both `check-parity.sh` gates, `bash tests/spec_review_gate/run.sh` (11/11), and `bash tests/dsh/run.sh` (13/13) `0ec46a3`
- [~] Task: Measure - User Manual Verification 'Phase 1: The fail-closed wrapper forms and their tests' (Protocol in workflow.md)

## Phase 2: Records and closeout

- [ ] Task 2.1: update the guard README commit bullet and the commit-guard tech-debt row, add the `CHANGELOG.md` entry; install + reload the plugin, record the live check, run the gates again
- [ ] Task 2.2: `metadata.json`, archive the track, update the tracks registry; run `closeout --track dsh_measure_commit_wrapper_20261110` and record the manifest-only FAIL
- [ ] Task: Measure - User Manual Verification 'Phase 2: Records and closeout' (Protocol in workflow.md)
