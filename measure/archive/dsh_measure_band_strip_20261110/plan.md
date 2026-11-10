# Implementation Plan: DSH Measure band strip

Track: `dsh_measure_band_strip_20261110`
Spec: [./spec.md](./spec.md)

**Each phase checkpoint is pushed to `origin/main` before the next phase.**

## Phase 1: The bounded band and the panel problems [checkpoint: 18908b6]

- [x] Task 1.1: `plugins/dsh-measure-guard/tests/client-render.test.js` (Red): pin the bounded one-row container style, the `Problems: <n>` count chip (title with the full list, click opens the panel), setup buttons only when the host sends the offer text, and the panel problem section `1bad2d8`
- [x] Task 1.2: `plugins/dsh-measure-guard/client.js` (Green): one bounded row, problem count chip that opens the panel, panel problem section, setup actions gated on `setup.text`, localized labels; no state-route or core change `8fd25b7`
- [x] Task 1.3: run `node --test plugins/dsh-measure-guard/tests/*.test.js`, both parity gates, `bash tests/dsh/run.sh` (14/14), and `bash tests/spec_review_gate/run.sh` (13 suites); record the results `8e2968c`
- [x] Task: Measure - User Manual Verification 'Phase 1: The bounded band and the panel problems' (Protocol in workflow.md) `18908b6`

## Phase 2: Install, live proof, and records [checkpoint: f7e645c]

- [x] Task 2.1: copy the package into the running Web profile, reload with `bin/measure-dsh reload`, and prove the band height (<= 32 px) and the problem-count chip on the session that reported the bug; record the box and a screenshot in `measure/runs/dsh_measure_band_strip_20261110/` `a2a853b`
- [x] Task 2.2: update the guard README, `docs/dsh.md`, and `CHANGELOG.md`; record `install.md` and `live.md` `4796d9f`
- [x] Task 2.3: finalize `metadata.json` (status done, actual tasks), archive the track, update the tracks registry and the README status line, run the closeout check, and record the manifest-only FAIL `5397566`
- [x] Task: Measure - User Manual Verification 'Phase 2: Install, live proof, and records' (Protocol in workflow.md) `f7e645c`
