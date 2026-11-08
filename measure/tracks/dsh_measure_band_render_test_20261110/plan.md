# Implementation Plan: DSH Measure band render test

Track: `dsh_measure_band_render_test_20261110`
Spec: [./spec.md](./spec.md)

**Each phase checkpoint is pushed to `origin/main` before the next phase.**

## Phase 1: The harness and the render assertions

- [x] Task 1.1: `plugins/dsh-measure-guard/tests/client-render.test.js`: the stub module loader, the miniature React (hooks, effects, class components), and the stubbed `fetch`/`setInterval`; make the node suite import it `6c17bca`
- [x] Task 1.2: band render assertions (compact line, full title, guards/mode/goal rows, setup buttons and their POST, problem rows, no view renders nothing, 2000 ms poll), panel assertions (empty state, session select, guards and status `pre`), and the `apply(ctx)` registrations plus the zh labels `6c17bca`
- [x] Task 1.3: run `node --test plugins/dsh-measure-guard/tests/*.test.js`, both `check-parity.sh` gates, `bash tests/spec_review_gate/run.sh` (11/11), and `bash tests/dsh/run.sh` (13/13) `6c17bca`
- [~] Task: Measure - User Manual Verification 'Phase 1: The harness and the render assertions' (Protocol in workflow.md)

## Phase 2: Records and closeout

- [ ] Task 2.1: record the known-limits closure in the guard README and `measure/tech-debt.md`, add the `CHANGELOG.md` entry; install + reload the plugin, record the live check, run the gates again
- [ ] Task 2.2: `metadata.json`, archive the track, update `measure/tracks.md`; run `closeout --track dsh_measure_band_render_test_20261110` and record the manifest-only FAIL
- [ ] Task: Measure - User Manual Verification 'Phase 2: Records and closeout' (Protocol in workflow.md)
