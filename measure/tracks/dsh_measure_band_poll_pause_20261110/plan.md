# Implementation Plan: DSH Measure band poll pause

Track: `dsh_measure_band_poll_pause_20261110`
Spec: [./spec.md](./spec.md)

**Each phase checkpoint is pushed to `origin/main` before the next phase.**

## Phase 1: The visibility-aware poll and its tests [checkpoint: 3015bc4]

- [x] Task 1.1: `plugins/dsh-measure-guard/client.js`: `useStatusView` pauses the interval while the document is hidden, refreshes once and resumes on visibility, removes the listener in cleanup, and keeps the plain 2 s poll without a `document` `98c3b73`
- [x] Task 1.2: `plugins/dsh-measure-guard/tests/client-render.test.js`: a fake `document` with `visibilitychange` and clear-tracking stubs; assert the initial poll, the pause on hide, the resume on show (immediate fetch + new interval), and the no-document fallback `98c3b73`
- [x] Task 1.3: run `node --test plugins/dsh-measure-guard/tests/*.test.js`, both `check-parity.sh` gates, `bash tests/spec_review_gate/run.sh` (11/11), and `bash tests/dsh/run.sh` (13/13) `98c3b73`
- [x] Task: Measure - User Manual Verification 'Phase 1: The visibility-aware poll and its tests' (Protocol in workflow.md) `3015bc4`

## Phase 2: Records and closeout

- [~] Task 2.1: note the pause in the guard README, flip the band-polling tech-debt row to Resolved, add the `CHANGELOG.md` entry; install + reload the plugin, record the live check, run the gates again
- [ ] Task 2.2: `metadata.json`, archive the track, update the tracks registry; run `closeout --track dsh_measure_band_poll_pause_20261110` and record the manifest-only FAIL
- [ ] Task: Measure - User Manual Verification 'Phase 2: Records and closeout' (Protocol in workflow.md)
