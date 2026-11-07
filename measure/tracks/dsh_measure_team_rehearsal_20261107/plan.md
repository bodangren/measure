# Implementation Plan: DSH Measure agent-team rehearsal

Track: `dsh_measure_team_rehearsal_20261107`
Spec: [./spec.md](./spec.md)

Classic FR phases: fixture and contract test, protocol docs, the executed
rehearsal, then closeout. The gate is
`node --test plugins/dsh-measure-guard/tests/*.test.js` plus both parity scripts,
`bash tests/dsh/run.sh`, and `bash tests/spec_review_gate/run.sh`.

## Phase 1: Fixture builder and contract test [checkpoint: 0640bb8]

- [x] Task 1.1: `tests/dsh/rehearsal/make-project.sh` (test-only): build a temp git repo with `measure/index.md`, `measure/tracks.md` (one `[~]` track), `measure/tracks/<id>/plan.md` (one phase, one `[~]` task), `measure/tracks/<id>/metadata.json` (`actual_tasks: 0`), commit it, print the canonical root; `--cleanup <dir>` removes a temp-only project
- [x] Task 1.2: `tests/dsh/test-rehearsal-fixture.sh`: build and assert the files and commit, load the fixture through the plugin's real `loadSnapshot` (node), assert `hasMeasure`, `parseError === null`, the active track id, and one `[~]` task, then clean up
- [x] Task 1.3: run `bash tests/dsh/run.sh`; the new contract test passes with the existing ones
- [x] Task: Measure - User Manual Verification 'Phase 1: Fixture builder and contract test' (Protocol in workflow.md) `0640bb8`

## Phase 2: Rehearsal protocol docs

- [~] Task 2.1: add a "Rehearsal" section to `skills/measure-orchestrator/references/dsh.md`: the three spawns with `cwd`, the strict mode override for the fixture root, the per-agent Red record rule (Green must run the failing test itself), the always-allowed `measure/` writes, the evidence to capture, and the cleanup
- [ ] Task: Measure - User Manual Verification 'Phase 2: Rehearsal protocol docs' (Protocol in workflow.md)

## Phase 3: Executed rehearsal

- [ ] Task 3.1: build a fixture, set its repository mode override to `strict` through the same `repos.json` seam, and spawn the Red subagent (`cwd` = fixture) to write and run a failing test; capture the target and the failure
- [ ] Task 3.2: spawn the Green subagent (`cwd` = fixture) to run the failing test itself, implement until green, and commit with a git note; capture the guard behaviour and the commit; check whether a first source edit before the Green's own Red is denied as predicted
- [ ] Task 3.3: clear the mode override, remove the fixture, and record the evidence (fixture path, subagent targets, guard denies/notes, test fail/pass, commit) under `measure/runs/dsh_measure_team_rehearsal_20261107/`
- [ ] Task: Measure - User Manual Verification 'Phase 3: Executed rehearsal' (Protocol in workflow.md)

## Phase 4: Documentation and closeout

- [ ] Task 4.1: README, `docs/dsh.md`, `CHANGELOG.md`, `measure/lessons-learned.md`, `measure/tech-debt.md` updates; `metadata.json`; archive the track and update `measure/tracks.md`
- [ ] Task: Measure - User Manual Verification 'Phase 4: Documentation and closeout' (Protocol in workflow.md)
