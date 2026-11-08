# Implementation Plan: DSH Measure setup route transport

Track: `dsh_measure_setup_route_transport_20261110`
Spec: [./spec.md](./spec.md)

**Each phase checkpoint is pushed to `origin/main` before the next phase.**

## Phase 1: The handler route and its tests [checkpoint: 65db0de]

- [x] Task 1.1: `plugins/dsh-measure-guard/src/client-state.js`: `setupHandler(deps)` (bounded body read, Fetch Request, `setupResponse`, status/headers/body write, 413 and 500 edges) and register `SETUP_PATH` as a `handler`; `client-state.test.js` covers POST 200, malformed 400, unknown session 404, GET 405, oversized 413, identity headers, and the handler registration `925e44f`
- [x] Task 1.2: run `node --test plugins/dsh-measure-guard/tests/*.test.js`, both `check-parity.sh` gates, `bash tests/spec_review_gate/run.sh` (11/11), and `bash tests/dsh/run.sh` (13/13) `925e44f`
- [x] Task: Measure - User Manual Verification 'Phase 1: The handler route and its tests' (Protocol in workflow.md) `65db0de`

## Phase 2: Live proof, records, and closeout

- [x] Task 2.1: install + reload, prove the live POST transport with curl (400/404 with identity), record the evidence; update the README route paragraph, resolve the tech-debt row, add the `CHANGELOG.md` entry; run the gates again `c074654`
- [~] Task 2.2: `metadata.json`, archive the track, update the tracks registry; run `closeout --track dsh_measure_setup_route_transport_20261110` and record the manifest-only FAIL
- [ ] Task: Measure - User Manual Verification 'Phase 2: Live proof, records, and closeout' (Protocol in workflow.md)
