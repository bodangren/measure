# Implementation Plan: DSH Measure band width

Track: `dsh_measure_band_width_20261110`
Spec: [./spec.md](./spec.md)

**Each phase checkpoint is pushed to `origin/main` before the next phase.**

## Phase 1: The column cap and its tests [checkpoint: 87f624e]

- [x] Task 1.1: `plugins/dsh-measure-guard/src/client-state.js`: `compactBand` caps by terminal columns (wide/fullwidth 2, combining 0, else 1) with the same cut/trim/ellipsis contract; the docstring states `max` is columns `7633d89`
- [x] Task 1.2: `plugins/dsh-measure-guard/tests/client-state.test.js`: the CJK, mixed, combining-mark, and 160-column boundary cases; the existing ASCII tests stay unchanged `7633d89`
- [x] Task 1.3: run `node --test plugins/dsh-measure-guard/tests/*.test.js`, both `check-parity.sh` gates, `bash tests/spec_review_gate/run.sh`, and `bash tests/dsh/run.sh` (14/14) `7633d89`
- [x] Task: Measure - User Manual Verification 'Phase 1: The column cap and its tests' (Protocol in workflow.md) `87f624e`

## Phase 2: Records and closeout

- [x] Task 2.1: resolve the band-width tech-debt row, update the guard README and `CHANGELOG.md`; install + reload the plugin, record the live check, run the gates again; the secondary chips get the shared never-wrap/ellipsize style with bounded widths (the goal chip 40%) `2e305bc`
- [~] Task 2.2: `metadata.json`, archive the track, update the tracks registry; run `closeout --track dsh_measure_band_width_20261110` and record the manifest-only FAIL
- [ ] Task: Measure - User Manual Verification 'Phase 2: Records and closeout' (Protocol in workflow.md)
