# Implementation Plan: DSH Measure commit global detection

Track: `dsh_measure_commit_global_detect_20261110`
Spec: [./spec.md](./spec.md)

**Each phase checkpoint is pushed to `origin/main` before the next phase.**

## Phase 1: The core detector and the adapter `-a` scan [checkpoint: d290dbd]

- [~] Task 1.1: `mods/measure-guard/hooks/guards.ts`: `GIT_GLOBAL_OPTION` and the `GIT_COMMIT`/`GIT_ADD` detectors recognize the documented git global options before the subcommand; sync the DSH and OpenCode core copies
- [x] Task 1.2: `plugins/dsh-measure-guard/src/commit.js`: `commitTakesAll` uses the same option run; `commit.test.js` cases for each parse form, a `git log` control, the strict no-task deny through a global option, and `-a` through a global option `ab8029e`
- [x] Task 1.3: run `node --test plugins/dsh-measure-guard/tests/*.test.js`, both `check-parity.sh` gates, `bash tests/spec_review_gate/run.sh` (11/11), and `bash tests/dsh/run.sh` (13/13) `ab8029e`
- [x] Task: Measure - User Manual Verification 'Phase 1: The core detector and the adapter `-a` scan' (Protocol in workflow.md) `d290dbd`

## Phase 2: Records and closeout

- [~] Task 2.1: update the guard README commit bullet and tech-debt row 45, note the detector in `contracts.md`, add the `CHANGELOG.md` entry, install + reload the plugin and record the live check; run the gates again
- [ ] Task 2.2: `metadata.json`, archive the track, update `measure/tracks.md`; run `closeout --track dsh_measure_commit_global_detect_20261110` and record the manifest-only FAIL
- [ ] Task: Measure - User Manual Verification 'Phase 2: Records and closeout' (Protocol in workflow.md)
