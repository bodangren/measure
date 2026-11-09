# Spec Review: dsh_idle_compaction_20261110

Author model: deepseek-flash

## Round 1

Date: 2026-11-10
Reviewer: fresh read-only subagent, deepseek-flash

### What this track proposes

This track adds one zero-dependency DeepSeek Harness Host plugin, `plugins/dsh-idle-compaction/`, mounted inside the standard preset's isolated `compaction` group beside `compaction-basic`, with a pure policy module and `node --test` suites. A timer-driven watcher calls the backend's own `ctx.compaction.compactNow` for a live session whose agent is idle, whose newest activity is newer than its last successful compaction, and which has gone 55 minutes (configurable) without activity, producing a standalone `turn: null` compaction transaction. A successful end seq keeps the gate closed until new activity re-arms the window; a no-op or failure records an attempt time so the plugin waits another full window. The plugin keeps in-memory state per session, binds live root agents plus `agent/created`, aborts on disposal, and skips child agents unless `includeSubagents` is set. Phase 2 installs the package into the running Web profile with one preset row under a short idle budget and records a live proof; Phase 3 runs the suites and archives the track.

### How the current system works, per this spec

The standard preset's `compaction` group is the only compaction engine a Web session's turns use, because the Web app disables the host-plane backend rows. That engine compacts automatically only for token pressure or a confirmed context overflow, and `/compact` compacts only when a person types it, so an idle session keeps its full history and the following turn pays the whole prefill. `compactNow` is the backend's standalone idle transaction, a `compaction/start`…`compaction/end` marker pair with `turn: null` whose successful end records the last compaction. A preset plugin mounts once per preset revision in a registry-owned scope shared by every session bound to that preset, so a watcher there must keep its own per-session state.

### Findings

- F1 [Blocker] spec.md FR-2 (injection list) and plan.md Task 1.3 (live-root scan): The plugin must read pre-mount history to compute FR-5's last successful compaction and FR-4's newest activity, yet the required inject list is only `compaction`, `agents`, and `timer` and neither document names a log reader. Rationale: the synchronous readers `eventAt`/`snapshotEvents`/`ownEvents` are deprecated with "new calls are prohibited" (dsh-session/lib/types/index.d.ts:212-235; dsh-session/README.md:64), seed/restored events never publish on `session/event` (dsh-session/lib/types/index.d.ts:161), and the supported reader is the async `ctx.sessionQuery.readSession`/`listEvents` (dsh-session-query/lib/types/index.d.ts:74,111), which is not injected — so the implementer must choose a dependency, a prohibited API, or different behavior, and the tick's async shape is left open.
- F2 [Blocker] spec.md FR-2 (install) and plan.md Task 2.1: The install is a required deliverable, but neither document names the writer, the exact profile patch, or the reload command. Rationale: tech-stack.md:19 makes `bin/measure-dsh` the DSH plugin writer, but it hardcodes `PATCH_FILE="$PROFILE_DIR/cordis.patch.yml"` and `PLUGIN_TARGET="$PROFILE_DIR/plugins/dsh-measure-guard"` (bin/measure-dsh:271-272), writes a top-level managed row (`BLOCK_NAME="./plugins/dsh-measure-guard/index.js"`, bin/measure-dsh:33), and reloads by bumping that entry's `reloadNonce` (bin/measure-dsh:58-60), while the required row must be nested inside the complete `preset-standard` override's `compaction` group (`~/.dsh/profiles/web/cordis.patch.yml`, override at lines 62-179); extending the CLI (new files, tests, a tech-stack row) and a hand copy plus YAML edit plus restart/recompose are both viable, and FR-2 requires the README to document the choice.
- F3 [Major] plan.md Task 2.3 (tech-stack exception): The tooling exception is scheduled after Phase 1 writes the tests and the implementation. Rationale: tech-stack.md:35 requires a new exception "before writing tests or implementation" and workflow.md:6 repeats that stack changes precede implementation; the archived precedent makes it the first task (measure/archive/dsh_measure_dev_20261107/plan.md:9-13), so Phase 1's checkpoint would record a verification layer that the stack file does not yet carry.
- F4 [Major] spec.md Acceptance Criteria (and FR-11): "Given a session idle for 55 minutes with activity after its last successful compaction, Then the backend compacts it once" is false for a sparse session. Rationale: `selectCompactableRange` retains the last surface node and returns null when the range would be empty (dsh-compaction-basic/lib/index.js:410-428), and `compactNow` passes `retainTokens: 0` and returns null in that case (id.:1009-1010), so a "fresh session" holding one prompt plus the system message yields no standalone `compaction/start`; the live proof in Task 2.2 must seed at least two non-system surface nodes, and neither the AC nor the plan says so.
- F5 [Major] spec.md FR-8/FR-9 (`includeSubagents`): The option is speculative and conflicts with the binding rule. Rationale: no requirement or acceptance case ever compacts a child session (the AC checks only the default skip), while the option adds a whole root/child branch; FR-3 also binds "every live root agent from `ctx.agents.list()`" while FR-8 makes children eligible under the flag, so a child created before mount is never bound even with the flag true (plan.md Task 1.3 narrows the scan to "live-root"), which is an undecided edge case.
- F6 [Major] plan.md Task 1.1 (policy contract): The six exported names are listed but their signatures and the state shape are not, so the API shape is still the implementer's choice. Rationale: the state (last activity seq/time, last successful compaction end seq, attempt time, in-flight flag) is the entire gate and `initialScan`/`observe`/`compactGate` determine NFR-3's pure-function testability, yet Task 1.1 only says "with the shapes the tests use" and the tests are written next, so nothing in the plan fixes the boundary; the repo's plan style names such an interface with its cases (measure/archive/dsh_measure_dev_20261107/plan.md:30-32).
- F7 [Major] spec.md FR-4 (activity classification): Comprehension gap: "an ignorable plugin record" is not defined, so a reader cannot tell which session events it covers. Rationale: the other exclusions name concrete types (`compaction/start|summary|end|prune`), the checkpoint user message, and `session/end-seed`, while this one relies on the session format's plugin-record grammar (`appendPluginRecord`/`pluginRecordOf`, dsh-session/lib/types/index.d.ts:121-130) that neither document cites; plan.md Task 1.2 repeats "ignorable record".
- F8 [Nit] spec.md FR-10 (failure containment): "busy means the agent became active again" is not true. Rationale: `compactNow` converts every synchronous `runMaintenance` failure into `ManualCompactionError("busy")` (dsh-compaction-basic/lib/index.js:1026), `runMaintenance` throws when another maintenance task already owns the agent while the public status stays `idle` (dsh-agent/lib/types/runtime-types.d.ts:115,193-198), and the engine also reports `busy` for an active compaction lock (dsh-compaction-basic/lib/index.js:538); the retry-next-tick behavior stays correct, but the stated cause will mislabel the log and the attempt record.
- F9 [Nit] plan.md Task 3.2 (`metadata.json`): The metadata's `estimated_tasks: 11` disagrees with the plan's twelve top-level tasks. Rationale: Phase 1 has 1.1-1.4 plus the verification task, Phase 2 has 2.1-2.3 plus verification, and Phase 3 has 3.1-3.2 plus verification, and skills/measure/references/new-track.md:309 says to count the top-level tasks; the record should say 12.

### Author Response

- F1: FIX
- F2: FIX
- F3: FIX
- F4: FIX
- F5: FIX
- F6: FIX
- F7: FIX
- F8: FIX
- F9: FIX
