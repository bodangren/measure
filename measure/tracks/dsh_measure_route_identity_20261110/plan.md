# Implementation Plan: DSH Measure route identity

Track: `dsh_measure_route_identity_20261110`
Spec: [./spec.md](./spec.md)

**Each phase checkpoint is pushed to `origin/main` before the next phase.**

## Phase 1: Identity on every response [checkpoint: 0dff921]

- [x] Task 1.1: `plugins/dsh-measure-guard/src/client-state.js`: a `respond`/`textResponse` pair attaches `moduleIdentity(deps)` to every state- and setup-route response (200, 400, 404, 405, 500), keeping the statuses and bodies unchanged `6166091`
- [x] Task 1.2: `plugins/dsh-measure-guard/tests/client-state.test.js`: assert the identity headers on the state 404/500 and setup 400/404/405/500, and their absence without identity deps `6166091`
- [x] Task 1.3: run `node --test plugins/dsh-measure-guard/tests/*.test.js`, both `check-parity.sh` gates, `bash tests/spec_review_gate/run.sh` (11/11), and `bash tests/dsh/run.sh` (13/13) `6166091`
- [x] Task: Measure - User Manual Verification 'Phase 1: Identity on every response' (Protocol in workflow.md) `0dff921`

## Phase 2: Records and closeout

- [~] Task 2.1: note the every-response identity in the guard README, flip tech-debt row 43 to Resolved, add the `CHANGELOG.md` entry; install + reload the plugin, record the live check, run the gates again
- [ ] Task 2.2: `metadata.json`, archive the track, update the tracks registry; run `closeout --track dsh_measure_route_identity_20261110` and record the manifest-only FAIL
- [ ] Task: Measure - User Manual Verification 'Phase 2: Records and closeout' (Protocol in workflow.md)
