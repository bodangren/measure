# Implementation Plan: DSH Measure semantic reload

Track: `dsh_measure_reload_20261107`
Spec: [./spec.md](./spec.md)

A bug-fix track: the semantic nonce in the CLI, its contract tests, the live
proof, then docs/closeout. Gates: `bash tests/dsh/run.sh`,
`node --test plugins/dsh-measure-guard/tests/*.test.js` (stays 288), both parity
scripts, and `bash tests/spec_review_gate/run.sh`.

## Phase 1: The semantic nonce [checkpoint: 4378e90]

- [x] Task 1.1: `bin/measure-dsh`: write the managed entry config with `reloadNonce: <n>`, increment it on `reload` and on an unchanged-block `install`, drop the comment marker, tolerate a missing nonce (default 0), and keep every other entry byte-equal with the existing atomic edit
- [x] Task 1.2: `tests/dsh/test-reload.sh` asserts the change is the `reloadNonce` config value (not a comment), increments twice, and leaves every other entry byte-equal; `tests/dsh/test-install.sh` asserts the unchanged-block install also increments it and writes no plugin file
- [x] Task 1.3: run `bash tests/dsh/run.sh`; the CLI suite passes
- [x] Task: Measure - User Manual Verification 'Phase 1: The semantic nonce' (Protocol in workflow.md) `4378e90`

## Phase 2: The live proof [checkpoint: acfe0f9]

- [x] Task 2.1: with a temporary `strict` override for this repository in `repos.json`, run `bin/measure-dsh reload` and read `GET /measure-guard/state` (expect `strict`/`repository`); clear the override, reload again, and read `guard`/`config`; record both reads, the installed digest, and the CLI output
- [x] Task 2.2: cleanup (no override, config mode restored, live check PASS) and write the evidence under `measure/runs/dsh_measure_reload_20261107/`
- [x] Task: Measure - User Manual Verification 'Phase 2: The live proof' (Protocol in workflow.md) `acfe0f9`

## Phase 3: Documentation and closeout [checkpoint: 6165747]

- [x] Task 3.1: update `bin/measure-dsh`'s help/usage text, the plugin README, `docs/dsh.md`, `CHANGELOG.md`, `measure/lessons-learned.md`, and `measure/tech-debt.md` (the Medium reload row resolves)
- [x] Task 3.2: `metadata.json`, archive the track, update `measure/tracks.md` `d4465d8`
- [x] Task: Measure - User Manual Verification 'Phase 3: Documentation and closeout' (Protocol in workflow.md) `6165747`
