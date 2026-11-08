# Implementation Plan: DSH Measure agent tools

Track: `dsh_measure_agent_tools_20261110`
Spec: [./spec.md](./spec.md)

**Each phase checkpoint is pushed to `origin/main` before the next phase.**

## Phase 1: The two read-only tools and their tests

- [x] Task 1.1: `plugins/dsh-measure-guard/src/verify.js` `measureVerifyTool(deps)` and `src/modes.js` `measureModeTool(deps)`; register both in `index.js` beside `measure_status` `5f61bf5`
- [x] Task 1.2: `tests/plugin.test.js` (three tools, names), `tests/verify.test.js` (shape, clean and problem output), `tests/modes.test.js` (shape, repo/session/config sources) `5f61bf5`
- [x] Task 1.3: run `node --test plugins/dsh-measure-guard/tests/*.test.js`, both `check-parity.sh` gates, `bash tests/spec_review_gate/run.sh` (11/11), and `bash tests/dsh/run.sh` (13/13) `5f61bf5`
- [~] Task: Measure - User Manual Verification 'Phase 1: The two read-only tools and their tests' (Protocol in workflow.md)

## Phase 2: Records and closeout

- [ ] Task 2.1: document both tools in the guard README, update the GUI-only-commands tech-debt row, add the `CHANGELOG.md` entry; install + reload the plugin, record the live check, run the gates again
- [ ] Task 2.2: `metadata.json`, archive the track, update the tracks registry; run `closeout --track dsh_measure_agent_tools_20261110` and record the manifest-only FAIL
- [ ] Task: Measure - User Manual Verification 'Phase 2: Records and closeout' (Protocol in workflow.md)
