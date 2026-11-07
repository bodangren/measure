# Implementation Plan: DSH Measure compact status band

Track: `dsh_measure_band_20261107`
Spec: [./spec.md](./spec.md)

Every phase follows the Task Workflow in `measure/workflow.md`: contract first,
a failing test recorded in the git note, then the implementation, then docs,
then the deferred manual verification. A **Contract** task records the exact
interface and edge cases; the **Red** task adds the failing tests; the **Green**
task implements them. Test files are `plugins/dsh-measure-guard/tests/*.test.js`;
the gate is `node --test plugins/dsh-measure-guard/tests/*.test.js` plus
`plugins/dsh-measure-guard/scripts/check-parity.sh` and
`plugins/opencode-measure-guard/scripts/check-parity.sh`,
`bash tests/dsh/run.sh`, and `bash tests/spec_review_gate/run.sh`.

## Phase S1: The band is one compact line [checkpoint: 1d974b9]

_Story ref: spec.md#story-s1_

- [x] Task 1.1: Contract: the band view `f052cd7`
    - [ ] `src/client-state.js`: `BAND_MAX = 160`; `compactBand(text, max = BAND_MAX)` -> the input when `text.length <= max`, else the input cut at the last space at or before `max - 1`, a trailing ` ·` stripped, and `…` appended (non-string or empty input returns null); `clientView` builds `band` with the session suffix applied first, then compacts, and adds `bandFull` with the complete suffix line (or null)
    - [ ] `client.js`: the band container is `flexWrap: 'nowrap'` + `overflow: 'hidden'`; the primary span gets `whiteSpace: 'nowrap'`, `overflow: 'hidden'`, `textOverflow: 'ellipsis'`, `minWidth: 0`, `flex: '1 1 auto'`, and `title: view.bandFull`
    - [ ] The view keeps its existing fields; `bandFull` is additive
- [x] Task 1.2: Red: failing tests for the compaction `f052cd7`
    - [ ] `tests/client-state.test.js`: a 500-character task line yields `band.length <= 160`, `band` ends with `…`, `bandFull` equals the full line; a short line is unchanged; a long line with a `sessions` suffix truncates inside it; a null band keeps both null; a non-string returns null from `compactBand`
    - [ ] `tests/client-bundle.test.js`: the bundle uses `view.bandFull` as the title, and carries the nowrap/ellipsis styles
- [x] Task 1.3: Green: implement `compactBand`, the view fields, and the Client styles; the suite passes `f052cd7`
- [x] Task 1.4: Docs: README "Client surface" (compact band, `bandFull`, one-line rule) and `docs/dsh.md` `f052cd7`
- [x] Task: Measure - User Manual Verification 'Phase S1: The band is one compact line' (Protocol in workflow.md) `1d974b9`

## Phase S2: Documentation, live check, and track closeout [checkpoint: b312c98]

_Story ref: spec.md#story-s2_

- [x] Task 2.1: Docs: README, `docs/dsh.md`, and `CHANGELOG.md` name the compact band and its `BAND_MAX`/`bandFull` limits `f052cd7`
- [x] Task 2.2: Live check: install + reload; read the state route and record `band` (<= 160 characters, one line) and the presence of `bandFull` under `measure/runs/dsh_measure_band_20261107/`
- [x] Task 2.3: Closeout documents: `measure/lessons-learned.md`, `measure/tech-debt.md`, `metadata.json`, archive the track, update `measure/tracks.md` `890034c`
- [x] Task: Measure - User Manual Verification 'Phase S2: Documentation, live check, and track closeout' (Protocol in workflow.md) `b312c98`
