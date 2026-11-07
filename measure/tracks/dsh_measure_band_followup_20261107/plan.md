# Implementation Plan: DSH Measure band follow-up corrections

Track: `dsh_measure_band_followup_20261107`
Spec: [./spec.md](./spec.md)

A bug-fix track: contract and tests first, then the documentation corrections,
then the live cap proof and closeout. The gate is
`node --test plugins/dsh-measure-guard/tests/*.test.js` plus
`plugins/dsh-measure-guard/scripts/check-parity.sh` and
`plugins/opencode-measure-guard/scripts/check-parity.sh`,
`bash tests/dsh/run.sh`, and `bash tests/spec_review_gate/run.sh`.

## Phase 1: Pin the compaction contract with tests [checkpoint: 9fb1e86]

- [x] Task 1.1: Contract: record the exact `compactBand` rule in the module header: an input of length at most `max` is unchanged; a longer input is cut at the last space at or before `max - 1` (the space is not kept), a trailing ` ·` is stripped, and `…` is appended; with no such space the first `max - 1` characters are kept; the result is at most `max`; non-string/empty returns null
- [x] Task 1.2: Red: the missing cases in `tests/client-state.test.js` — the trailing ` ·` strip (a line whose cut lands just after the separator), the 160/161 boundary (160 unchanged, 161 capped), and a no-space single token (kept range `[0, max - 1)`); confirm they fail against a deliberately wrong assumption before the Green pass
- [x] Task 1.3: Green: the current implementation already satisfies the pinned rule; the tests pass without a behaviour change (a failing case means the code, not the test, is wrong)
- [x] Task: Measure - User Manual Verification 'Phase 1: Pin the compaction contract with tests' (Protocol in workflow.md) `9fb1e86`

## Phase 2: Correct the documentation

- [x] Task 2.1: README: the band bullet says the full text is available through `bandFull`/the hover title and `measure_status` (the sidebar panel keeps only the status lines plus the goal line); the "Data route" bullet lists the current view fields (`band`, `bandFull`, `status`, `guardsOff`, `problems`, `updatedAt`, `goal`, `mode`, `setup`)
- [x] Task 2.2: `docs/dsh.md` "Status band" and the `CHANGELOG.md` entry repeat the corrected full-text statement; a dated correction note is added to the archived band track's `spec.md`, and the archived `plan.md` Task 1.2 notes that the exact-key assertion necessarily changes
- [ ] Task: Measure - User Manual Verification 'Phase 2: Correct the documentation' (Protocol in workflow.md)

## Phase 3: Live cap proof and closeout

- [ ] Task 3.1: Live: temporarily lengthen the active task title in this track's plan (so the route band exceeds `BAND_MAX`), reload with `bin/measure-dsh install --no-skills`, read `GET /measure-guard/state` and record `band.length` at most 160 ending in `…` and `bandFull.length` greater than 160 under `measure/runs/dsh_measure_band_followup_20261107/`; revert the title and reload again
- [ ] Task 3.2: Closeout documents: `measure/lessons-learned.md`, `measure/tech-debt.md`, `metadata.json`, archive the track, update `measure/tracks.md`
- [ ] Task: Measure - User Manual Verification 'Phase 3: Live cap proof and closeout' (Protocol in workflow.md)
