# Implementation Plan: DSH idle-session compaction

Track: `dsh_idle_compaction_20261110`
Spec: [./spec.md](./spec.md)

**Each phase checkpoint is pushed to `origin/main` before the next phase.**

## Phase 1: Contract, tests, and the plugin [checkpoint: PENDING]

- [ ] Task 1.0: declare the tooling exception in `measure/tech-stack.md` before the tests and implementation (node `node:test` over the pure policy plus a fake Cordis context and the live short-idle proof) — the spec's FR-12 verification layer, `909ab46`
- [ ] Task 1.1: `plugins/dsh-idle-compaction/package.json` and `README.md` contract: document the behavior, activity classification (including the ignorable-record definition), last-successful-compaction rule, idle gate, one-per-idle-window rule, settings, install (copy, exact preset row, reload, upgrade hazard), and known limits; fix the pure policy module interface: `createState(agent, events = []) -> IdleState`, `isActivityEvent(event) -> boolean`, `isSuccessfulCompactionEnd(event) -> boolean`, `observe(state, event) -> void`, `compactGate(state, { idleMs, now, status }) -> boolean`, `parseSettings(config) -> Settings`, `COMPACTION_EVENT_TYPES`, `describeError(error) -> string`; `IdleState = { agent, lastActivitySeq (-1), lastActivityAt (null), lastCompactionEndSeq (-1), lastAttemptAt (0), controller (null) }`
- [ ] Task 1.2: `plugins/dsh-idle-compaction/tests/policy.test.js` (Red): activity classification (compaction machinery, checkpoint replacement, seed boundary, ignorable record, normal events), initial scan (successful vs failed compaction end, newer activity), live observation, gate (idle boundary, running status, no new activity, no-op/failure backoff, in-flight), and settings validation
- [~] Task 1.3: implement `plugins/dsh-idle-compaction/src/policy.js` and `index.js` until the policy tests pass: preset-scoped watcher, live-root binding, one-time awaited `ctx.sessionQuery.readSession` full-event scan merged with live `session/event` events, timer tick, `ctx.compaction.compactNow` with abort/drain, logger containment
- [ ] Task 1.4: `plugins/dsh-idle-compaction/tests/plugin.test.js` (fake Cordis context): bind from `agents.list()` and `agent/created`, the async scan completing before an eligible tick, tick compacts an eligible session, second tick without activity does nothing, running agent and child agent are skipped, new activity re-arms, busy/no-op/failure containment, disposal aborts, awaits the scan, and clears the timer
- [ ] Task: Measure - User Manual Verification 'Phase 1: Contract, tests, and the plugin' (Protocol in workflow.md)

## Phase 2: Live installation and proof [checkpoint: PENDING]

- [ ] Task 2.1: install the package copy into the running Web profile (`~/.dsh/profiles/web/plugins/dsh-idle-compaction/`) and add the one row inside the preset-standard `compaction` group of the profile patch (manual copy plus edit; `bin/measure-dsh` is not extended because it owns only the Measure guard row); recompose with `bin/measure-dsh reload` and confirm the composed config carries the row
- [ ] Task 2.2: prove the behavior live with a short idle budget on a fresh session holding at least two non-system surface nodes (two prompts with tool use): one standalone idle compaction, no second compaction without new activity, exactly one more after one new activity; then restore `idleMinutes: 55` and recompose
- [ ] Task 2.3: record the install and the live evidence in `measure/runs/dsh_idle_compaction_20261110/` (`install.md`, `live-evidence.md`) and add the `CHANGELOG.md` entry (the tooling exception is Task 1.0)
- [ ] Task: Measure - User Manual Verification 'Phase 2: Live installation and proof' (Protocol in workflow.md)

## Phase 3: Records and closeout [checkpoint: PENDING]

- [ ] Task 3.1: run the new node suite, `bash tests/dsh/run.sh`, `bash tests/spec_review_gate/run.sh`, and both parity gates; record the results
- [ ] Task 3.2: finalize `metadata.json`, archive the track, update the tracks registry, run the closeout check, and record the manifest-only FAIL
- [ ] Task: Measure - User Manual Verification 'Phase 3: Records and closeout' (Protocol in workflow.md)
