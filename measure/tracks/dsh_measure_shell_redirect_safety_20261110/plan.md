# Implementation Plan: DSH Measure shell redirect safety

Track: `dsh_measure_shell_redirect_safety_20261110`
Spec: [./spec.md](./spec.md)

**Each phase checkpoint is pushed to `origin/main` before the next phase.**

## Phase 1: The `>|` redirect and the `ln` destination

- [x] Task 1.1: `plugins/dsh-measure-guard/src/shell.js`: recognize `>|` as a redirect (stream-device/fd exclusions unchanged) and add `ln` to the destination family; `shell.test.js` cases for both and for the masking rules `cb638fa`
- [x] Task 1.2: run `node --test plugins/dsh-measure-guard/tests/*.test.js`, both `check-parity.sh` gates, `bash tests/spec_review_gate/run.sh` (11/11), and `bash tests/dsh/run.sh` (13/13) `cb638fa`
- [~] Task: Measure - User Manual Verification 'Phase 1: The `>|` redirect and the `ln` destination' (Protocol in workflow.md)

## Phase 2: Records and closeout

- [ ] Task 2.1: update the guard README and the DSH guide, the tech-debt shell row, and `CHANGELOG.md`; install + reload the plugin and record the live check; run the gates again
- [ ] Task 2.2: `metadata.json`, archive the track, update `measure/tracks.md`; run `closeout --track dsh_measure_shell_redirect_safety_20261110` and record the manifest-only FAIL
- [ ] Task: Measure - User Manual Verification 'Phase 2: Records and closeout' (Protocol in workflow.md)
