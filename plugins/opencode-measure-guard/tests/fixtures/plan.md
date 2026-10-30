# Implementation Plan: OpenCode plugin for Measure

Track: `opencode_plugin_20261021`. Spec: [spec.md](./spec.md). Each story-phase follows the Contract-First pipeline: acceptance criteria and contract, Red (failing test), Green (implementation), Docs, deferred manual verification.

## Phase S1: Package skeleton and shared core [checkpoint: eef6f8f]
_Story ref: spec.md#story-s1_

- [x] Task 1.1: Declare the verification tooling in `measure/tech-stack.md` (Tooling Exceptions row) and add `plugins/opencode-measure-guard/` to the Architecture tree `d7544db`
- [x] Task 1.2: Contract: `package.json`, `tsconfig.json`, `.gitignore` (node_modules), `src/core/types.ts` (copy without the `declare module` block), `scripts/check-parity.sh` `0d5f935`
- [x] Task 1.3: Red: `tests/core.test.ts` imports `parse.ts` and `guards.ts` from `src/core/` and parses this repo's `measure/` files (fails: files missing) `2cb19df`
- [x] Task 1.4: Green: copy `parse.ts` and `guards.ts` into `src/core/`; `check-parity.sh` exits 0; `bun test` passes `a3b0ed5`
- [x] Task 1.5: Docs: `plugins/opencode-measure-guard/README.md` skeleton (layout, parity rule, test commands) `1dd67d2`
- [b] Task: Measure - User Manual Verification 'Phase S1: Package skeleton and shared core' (Protocol in workflow.md) deferred:owner

## Phase S2: Project snapshot and plugin state [checkpoint: 1f6a55e]
_Story ref: spec.md#story-s2_

- [x] Task 2.1: Contract: `src/snapshot.ts` (`loadSnapshot(root)`, `planPathOf`, `gitStatus(root)`), `src/state.ts` (session records, bypass store, state file path and writer), `src/options.ts` (`modeFrom(options, env)`) `73760f5`
- [x] Task 2.2: Red: `tests/snapshot.test.ts` (temp project from the real fixtures; no `measure/`; parse error) and `tests/state.test.ts` (session record, bypass, state file round trip) `054aa2d`
- [x] Task 2.3: Green: implement snapshot, state, and options `fd45481`
- [x] Task 2.4: Docs: README sections "Snapshot" and "State file" `63b4500`
- [b] Task: Measure - User Manual Verification 'Phase S2: Project snapshot and plugin state' (Protocol in workflow.md) deferred:owner

## Phase S3: Rule and task note [checkpoint: 7fb76d1]
_Story ref: spec.md#story-s3_

- [x] Task 3.1: Contract: `src/hooks/context.ts` (`contextHook`, `promptHook`, `compactionHook`, `afterToolNote`) with a fake context type `tests/fake.ts`; the "Measure rule" section text in `agents/measure-orchestrator.md` `db1bd1b`
- [x] Task 3.2: Red: `tests/context.test.ts` (rule appended for `build`, skipped for `measure-orchestrator`, nothing without `measure/`; note on changed task; note after compaction) `5017d25`
- [x] Task 3.3: Green: implement the hooks and wire them in `src/index.ts`; add the rule section to `agents/measure-orchestrator.md` `999f073`
- [x] Task 3.4: Docs: README "Context" section; CHANGELOG entry for the agent prompt change `25302c8`
- [b] Task: Measure - User Manual Verification 'Phase S3: Rule and task note' (Protocol in workflow.md) deferred:owner

## Phase S4: Edit guard and closeout guard [checkpoint: 4cb7746]
_Story ref: spec.md#story-s4_

- [x] Task 4.1: Contract: `src/hooks/tools.ts` (`writtenPath(tool, input)`, `applyEditInput`, `beforeTool`, `afterTool`), deny by throwing `Error(deny)`; the tool names and input fields (`edit`: `filePath`, `oldString`, `newString`; `write`: `filePath`, `content`; `apply_patch`: `patchText`; `multiedit`: `filePath`, `edits`) `93fb41b`
- [x] Task 4.2: Red: `tests/edit-guard.test.ts` (deny without `[~]`, pass with `[~]`, pass in advise, pass inside `measure/`, setup deny without `measure/`, bypass) and `tests/closeout.test.ts` (track close deny and pass with `[b]` note, phase start deny) `107a583`
- [x] Task 4.3: Green: implement `beforeTool` for the edit and closeout guards; wire `tool.hook("execute.before")` `ea997e1`
- [x] Task 4.4: Live check: install the plugin into `~/.config/opencode/plugins/`, run one `opencode run` in a temp project without a `[~]` task, record the deny text from the tool result in the git note `faff85c`
- [x] Task 4.5: Docs: README "Guards" section (edit, closeout) `e9a5e5d`
- [b] Task: Measure - User Manual Verification 'Phase S4: Edit guard and closeout guard' (Protocol in workflow.md) deferred:owner

## Phase S5: TDD guard and commit guard (strict) [checkpoint: 038ebd9]
_Story ref: spec.md#story-s5_

- [x] Task 5.1: Contract: `recordRed` from `execute.after` of `bash`/`shell` (exit code from the tool result metadata, else the output text), `commitFiles(root, takesChanges)`, `commitShaOf(output)` (parse `[<branch> <sha>]` from the output) `41fefd8`
- [x] Task 5.2: Red: `tests/tdd.test.ts` and `tests/commit.test.ts` `b746c22`
- [x] Task 5.3: Green: implement the strict guards in `src/hooks/tools.ts` `4d59eb5`
- [x] Task 5.4: Docs: README "Guards" section (TDD, commit) and the known limits `3d95057`
- [b] Task: Measure - User Manual Verification 'Phase S5: TDD guard and commit guard (strict)' (Protocol in workflow.md) deferred:owner

## Phase S6: End-of-turn check [checkpoint: ffa9cba]
_Story ref: spec.md#story-s6_

- [x] Task 6.1: Contract: `src/hooks/turn.ts` (`startTurn(sessionID, snapshot)`, `endTurn(sessionID)` → `{ problems, action }`, follow-up and reminder texts), event loop over `ctx.event.subscribe()` for `session.idle` `2ec89ff`
- [x] Task 6.2: Red: `tests/end-of-turn.test.ts` (advise: no action; guard: synthetic reminder; strict: follow-up twice then reminder; bypass: nothing; state file written) `77fe1fe`
- [x] Task 6.3: Green: implement `turn.ts`, the event loop in `src/index.ts`, the synthetic message and the follow-up prompt through `ctx.session` `904c18d`
- [x] Task 6.4: Docs: README "End of turn" section with the strict-mode difference to the mod `bab2f6d`
- [b] Task: Measure - User Manual Verification 'Phase S6: End-of-turn check' (Protocol in workflow.md) deferred:owner

## Phase S7: Commands and the status tool [checkpoint: 1da03ad]
_Story ref: spec.md#story-s7_

- [x] Task 7.1: Contract: `src/commands.ts` (three command definitions and their reply texts), `src/tool.ts` (`measure_status` tool definition), the eight markdown commands in `commands/` `90955b3`
- [x] Task 7.2: Red: `tests/commands.test.ts` (off/on session and repo, status reply, tool output) and a test that every markdown command has a description and names its workflow `59331f9`
- [x] Task 7.3: Green: implement the commands and the tool; write the markdown commands; wire `command.transform` and `tool.transform` `aac69a2`
- [x] Task 7.4: Docs: README "Commands" and "Tool" sections `0496c78`
- [b] Task: Measure - User Manual Verification 'Phase S7: Commands and the status tool' (Protocol in workflow.md) deferred:owner

## Phase S8: Terminal band and status pane [checkpoint: 866a8f5]
_Story ref: spec.md#story-s8_

- [x] Task 8.1: Contract: `src/tui/model.ts` (pure: `bandModel(snapshot, state)` → lines and colors, `sidebarLines`, refresh rule by mtime) and `src/tui.tsx` (slots `prompt.footer.status`, `sidebar.content`, keymap command `/measure-guard`, refresh on events and timer) `198ab9c`
- [x] Task 8.2: Red: `tests/tui-model.test.ts` (band line, yellow on parse error, problems line, setup text without `measure/`, refresh decision) `a36a432`
- [x] Task 8.3: Green: implement `model.ts` and `tui.tsx` `31ec969`
- [x] Task 8.4: Load check: with the package installed, start the terminal through the running service under a pseudo-terminal for 20 s; the log shows `loading plugin` for the tui entry and no `failed to load plugin`; record the result in the git note `9d3a454`
- [x] Task 8.5: Docs: README "Terminal" section `cb248a2`
- [b] Task: Measure - User Manual Verification 'Phase S8: Terminal band and status pane' (Protocol in workflow.md) deferred:owner

## Phase S9: Installer targets and documents [checkpoint: 09a38e1]
_Story ref: spec.md#story-s9_

- [x] Task 9.1: Contract: the three new rows of `bin/install-targets.tsv` and the exclusion of `tests/` and `node_modules/` from the plugin bundle `5786f5c`
- [x] Task 9.2: Red: installer test `measure/archive/skill_distribution_repair_20261005/scripts/`-style script for the new rows (temp HOME, temp repo), kept at `plugins/opencode-measure-guard/tests/install.sh` `bf72b5e`
- [x] Task 9.3: Green: the rows, the installer change if the bundle needs an exclusion, `bin/install-measure-skill --check` lists the targets `9efaae4`
- [x] Task 9.4: Docs: `README.md` (repo) section "OpenCode plugin", `measure/tech-stack.md` Distribution Formats row, `CHANGELOG.md`, `measure/lessons-learned.md` and `measure/tech-debt.md` entries from the retrospective `ec20b09`
- [b] Task: Measure - User Manual Verification 'Phase S9: Installer targets and documents' (Protocol in workflow.md) deferred:owner
