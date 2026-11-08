# Implementation Plan: DSH Measure commit global options

Track: `dsh_measure_commit_git_options_20261110`
Spec: [./spec.md](./spec.md)

**Each phase checkpoint is pushed to `origin/main` before the next phase.**

## Phase 1: The option table and the substitution scan

- [~] Task 1.1: `plugins/dsh-measure-guard/src/commit.js`: skip the bounded git global-option table before the `add`/`stage` subcommand (separate, attached, and flag arities) and fail closed on an unknown option; `commit.test.js` cases for each form and the fail-closed case
- [x] Task 1.2: the command-substitution scanner recognizes the same option run, so `$(git -c k=v add f)` still sets `all`; test `8999bbb`
- [x] Task 1.3: run `node --test plugins/dsh-measure-guard/tests/*.test.js`, both `check-parity.sh` gates, `bash tests/spec_review_gate/run.sh` (11/11), and `bash tests/dsh/run.sh` (13/13) `8999bbb`
- [~] Task: Measure - User Manual Verification 'Phase 1: The option table and the substitution scan' (Protocol in workflow.md)

## Phase 2: Records and closeout

- [ ] Task 2.1: update the guard README commit bullet and tech-debt row 45, add the `CHANGELOG.md` entry, install + reload the plugin and record the live check; run the gates again
- [ ] Task 2.2: `metadata.json`, archive the track, update `measure/tracks.md`; run `closeout --track dsh_measure_commit_git_options_20261110` and record the manifest-only FAIL
- [ ] Task: Measure - User Manual Verification 'Phase 2: Records and closeout' (Protocol in workflow.md)
