# Implementation Plan: DSH Measure reload follow-up corrections

Track: `dsh_measure_reload_followup_20261107`
Spec: [./spec.md](./spec.md)

A bug-fix track: pin the edge cases in tests, correct the archived record and the
lesson, then the post-docs gate and closeout. Gates: `bash tests/dsh/run.sh`,
`node --test plugins/dsh-measure-guard/tests/*.test.js` (stays 288), both parity
scripts, and `bash tests/spec_review_gate/run.sh`.

## Phase 1: Pin the edge cases in the contract tests [checkpoint: e0fe6c5]

- [x] Task 1.1: `tests/dsh/test-reload.sh` asserts the exact nonce values (fresh install 0; reload 1; reload 2; unchanged install 3; missing-nonce patch 1), the changed-block install leaves the nonce unchanged (a `mode` change), the no-complete-block reload fails with exit 1 and writes nothing, a non-integer `reloadNonce` reads as 0 (next write 1), and the exact PASS/dry-run strings
- [x] Task 1.2: run `bash tests/dsh/run.sh`; the CLI suite passes with the new cases
- [x] Task: Measure - User Manual Verification 'Phase 1: Pin the edge cases in the contract tests' (Protocol in workflow.md) `e0fe6c5`

## Phase 2: Correct the record and the lesson [checkpoint: 52feb65]

- [x] Task 2.1: correct the archived reload `spec.md`/`plan.md` (FR-1's executable live-proof record: `?sessionId=`, the JSON shape, the evidence file, the store path, the clearing command and the pre-run "no entry" value; FR-2's three edge cases; the Phase 3 post-docs gate task; the Overview's "extends" wording)
- [x] Task 2.2: fix `measure/lessons-learned.md` (no "toggle a marker comment" guidance; the semantic-value rule with the nonce example) within 50 lines
- [x] Task: Measure - User Manual Verification 'Phase 2: Correct the record and the lesson' (Protocol in workflow.md) `52feb65`

## Phase 3: The post-docs gate and closeout

- [~] Task 3.1: run `bash tests/dsh/run.sh` after the docs/archive edits and record the result (the doc checks must pass)
- [ ] Task 3.2: `metadata.json`, archive the track, update `measure/tracks.md`
- [ ] Task: Measure - User Manual Verification 'Phase 3: The post-docs gate and closeout' (Protocol in workflow.md)
