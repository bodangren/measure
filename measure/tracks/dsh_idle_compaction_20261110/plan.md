# Implementation Plan: DSH idle-session compaction

Track: `dsh_idle_compaction_20261110`
Spec: [./spec.md](./spec.md)

**Each phase checkpoint is pushed to `origin/main` before the next phase.**

## Phase 1: Contract, tests, and the plugin [checkpoint: PENDING]

- [~] Task 1.1: `plugins/dsh-idle-compaction/README.md`, `package.json`, and `src/policy.js` contract: document the behavior, the activity classification, the last-successful-compaction rule, the idle gate, the one-per-idle-window rule, the settings, the install, and the known limits; export the policy module interface (state factory, `isActivityEvent`, `observe`, `initialScan`, `compactGate`, `parseSettings`) with the shapes the tests use
- [ ] Task 1.2: `plugins/dsh-idle-compaction/tests/policy.test.js` (Red): activity classification (compaction machinery, checkpoint replacement, seed boundary, ignorable record, normal events), initial scan (successful vs failed compaction end, newer activity), live observation, gate (idle boundary, running status, no new activity, no-op/failure backoff, in-flight), and settings validation
- [ ] Task 1.3: implement `plugins/dsh-idle-compaction/src/policy.js` and `index.js` until the policy tests pass: preset-scoped watcher, live-root scan, `agent/created`/`agent/disposed` binding, `session/event` feed, timer tick, `ctx.compaction.compactNow` with abort and drain, logger containment
- [ ] Task 1.4: `plugins/dsh-idle-compaction/tests/plugin.test.js` (fake Cordis context): bind from `agents.list()` and `agent/created`, tick compacts an eligible session, second tick without activity does nothing, running agent and child agent are skipped, new activity re-arms, busy/no-op/failure containment, disposal aborts and clears the timer
- [ ] Task: Measure - User Manual Verification 'Phase 1: Contract, tests, and the plugin' (Protocol in workflow.md)

## Phase 2: Live installation and proof [checkpoint: PENDING]

- [ ] Task 2.1: install the package copy into the running Web profile (`~/.dsh/profiles/web/plugins/dsh-idle-compaction/`) and add the one row inside the preset-standard `compaction` group of the profile patch; recompose and confirm the composed config carries the row
- [ ] Task 2.2: prove the behavior live with a short idle budget on a fresh session: one standalone idle compaction, no second compaction without new activity, exactly one more after one new activity; then restore `idleMinutes: 55` and recompose
- [ ] Task 2.3: record the live evidence in `measure/runs/dsh_idle_compaction_20261110/live-evidence.md`; add the `measure/tech-stack.md` tooling exception, the `CHANGELOG.md` entry, and any tech-debt/known-limits row the proof requires
- [ ] Task: Measure - User Manual Verification 'Phase 2: Live installation and proof' (Protocol in workflow.md)

## Phase 3: Records and closeout [checkpoint: PENDING]

- [ ] Task 3.1: run the new node suite, `bash tests/dsh/run.sh`, `bash tests/spec_review_gate/run.sh`, and both parity gates; record the results
- [ ] Task 3.2: finalize `metadata.json`, archive the track, update the tracks registry, run the closeout check, and record the manifest-only FAIL
- [ ] Task: Measure - User Manual Verification 'Phase 3: Records and closeout' (Protocol in workflow.md)
