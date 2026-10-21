# Specification: OpenCode plugin for Measure (measure-guard, agents, commands, TUI band)

## Overview

**Sprint goal:** An OpenCode user gets the same Measure guard rails as a Claude Code user: the plan state is visible, work outside the active plan is stopped, the Measure commands and roles are one keystroke away, and the installer keeps every copy current.

The Claude Code mod `mods/measure-guard/` reads the Measure files of a project, shows the plan position, sends the active task to the agent, and denies edits, commits, and closeouts that the plan does not cover. OpenCode 2 has the extension points for the same behavior: server plugins (`@opencode/plugin`, `Plugin.define`), terminal plugins (`@opencode/plugin/tui`, slots and slash commands), markdown agents, markdown commands, and skills read from `~/.agents/skills`. This track builds `plugins/opencode-measure-guard/`, an OpenCode 2 plugin package with a server part and a terminal part, plus the agents, commands, installer targets, and documents that make the OpenCode experience complete.

Decisions made for this track (the owner set the goal with `/goal` and was not available for questions; each decision is recorded here so the owner can reverse it):

1. **The rule lives in the `measure-orchestrator` agent.** The owner decided "rule in measure-orchestrator". The fixed Measure rule paragraph goes into the prompt body of `agents/measure-orchestrator.md`. The plugin adds the same rule to the system prompt of every other agent through the session `context` hook, and skips the `measure-orchestrator` agent, so the rule is never doubled.
2. **Spec format:** story-shaped (feature track).
3. **Package name and ids:** folder `plugins/opencode-measure-guard/`, npm-style name `opencode-measure-guard`, plugin ids `measure.guard` (server) and `measure.guard.tui` (terminal).
4. **Shared logic by copy with a parity gate.** The pure modules of the Claude Code mod (`hooks/parse.ts`, `hooks/guards.ts`, `types/index.d.ts`) are copied into `plugins/opencode-measure-guard/src/core/`. A parity script fails when a copy differs from its source (the types copy omits the `declare module 'claude-code'` block). The Claude Code mod stays unchanged.
5. **Verification tooling:** `bun test` for the plugin tests (OpenCode itself runs plugins under Bun, so no new runtime is added), `bun x tsc --noEmit` against the published `@opencode/plugin` types for the type check, and the running OpenCode service for the load checks. The exception is declared in `tech-stack.md` before the first test is written.
6. **Mode option:** `advise`, `guard`, `strict` (default `guard`), read from the plugin options in `opencode.json` (`plugins: [{ "package": "...", "options": { "mode": "strict" } }]`), else from the environment variable `MEASURE_GUARD_MODE`.
7. **Strict end-of-turn check:** OpenCode has no hook that keeps a turn open. In `strict` mode the plugin sends a follow-up prompt to the session with the open problems, at most 2 times per user turn. In `guard` mode it sends a synthetic reminder message that the next turn sees.
8. **Installed agents are not overwritten.** `~/.config/opencode/agents/measure-*.md` on this machine differ from `agents/` in the repo (local edits, newer than the repo). The installer gets the target, and its stamp protection keeps the local files and warns; the owner runs `--adopt` when they want the repo versions.
9. **Entry file in the plugins folder.** OpenCode 2.0.32 loads the direct `.ts` files of `~/.config/opencode/plugins/`; a package folder with a `package.json` there is not loaded (live check, Task 4.4). The installer copies the package to `~/.config/opencode/plugins/opencode-measure-guard/` and the file `entry/measure-guard.ts` to `~/.config/opencode/plugins/measure-guard.ts`; the entry file re-exports the server plugin. The live checks go through the service HTTP API (`POST /api/session`, `POST /api/session/<id>/prompt`) because `opencode run` hung on this machine during the check with and without the plugin.
10. **Turn end by `session.execution.*`.** The plugin subscription of OpenCode 2.0.32 delivers the durable `session.execution.succeeded|failed|interrupted` events; the ephemeral `session.idle` event never arrived in the live check (Task 6.3). The end-of-turn check runs on the execution-end events, accepts `session.idle` too, and treats two events within one second as one. Every plugin instance (one per project directory) sees every event; the check does nothing for a session whose prompt hook did not run in that instance.

## Stories

### Story S1: Package skeleton and shared core
**As a** Measure maintainer
**I want** one plugin package folder with the shared Measure parse and guard logic
**So that** the OpenCode plugin and the Claude Code mod decide the same way from the same rules

**Acceptance Criteria:**
- Given the repo, When I list `plugins/opencode-measure-guard/`, Then it has `package.json` (type module, exports `.` → `src/index.ts`, `./tui` → `src/tui.tsx`), `src/core/{parse.ts,guards.ts,types.ts}`, `src/index.ts`, `src/tui.tsx`, `commands/`, `tests/`, `scripts/check-parity.sh`, `README.md`.
- Given `scripts/check-parity.sh`, When `src/core/parse.ts` equals `mods/measure-guard/hooks/parse.ts` and `src/core/guards.ts` equals `mods/measure-guard/hooks/guards.ts` and `src/core/types.ts` equals `mods/measure-guard/types/index.d.ts` without its `declare module` block, Then the script exits 0; When one differs, Then it exits 1 and names the file.
- Given `tech-stack.md`, When I read the Tooling Exceptions table, Then a row for this track names `bun test`, `bun x tsc --noEmit`, and the OpenCode service load check, with the reason.
- Given `bun test plugins/opencode-measure-guard`, When the tests run, Then the parse tests of the core pass against the real `measure/` files of this repository.

**Estimate:** M
**Priority:** Must

### Story S2: Project snapshot and plugin state
**As a** plugin
**I want** a snapshot of the Measure files of the project and a store for my state
**So that** every hook reads one consistent view of the tracks, the active plan, and the bypass

**Acceptance Criteria:**
- Given a project root with `measure/index.md`, `measure/tracks.md`, and the plans of the `[~]` tracks, When `loadSnapshot(root)` runs, Then it returns the same `Snapshot` fields as the mod (`root`, `hasMeasure`, `isRepo`, `tracksPath`, `tracks`, `active`, `inProgressCount`, `parseError`) read with Node file APIs.
- Given a root without `measure/`, When `loadSnapshot` runs, Then `hasMeasure` is false and no error is thrown.
- Given the state module, When a guard asks for the session state (`turn`, `red`, `noted`, `reminder`, `problems`, `blocks`), Then it gets a per-session record keyed by `sessionID`, created on first use.
- Given `/measure-off repo`, When the bypass is stored, Then it is kept in the plugin storage under `off:<root>` and survives a server restart; `/measure-on repo` removes it.
- Given the state file `~/.local/state/measure/opencode-guard/<root hash>.json`, When the server writes `{ root, mode, guardsOff, problems, updatedAt }`, Then the terminal plugin reads it to show the bypass and the end-of-turn problems.

**Estimate:** M
**Priority:** Must

### Story S3: Rule and task note
**As an** OpenCode agent
**I want** the Measure rule in my system prompt and the active task in my context
**So that** I follow the Task Workflow without reading the plan files myself

**Acceptance Criteria:**
- Given `agents/measure-orchestrator.md`, When I read its prompt body, Then it has the section "Measure rule" with the same text as `ruleSection()` of the core.
- Given a session whose agent is not `measure-orchestrator` and a project with `measure/`, When the session `context` hook runs, Then one system part with `ruleSection()` is appended to `system`; When the agent is `measure-orchestrator`, Then nothing is appended.
- Given a project without `measure/`, When the `context` hook runs, Then `system` is unchanged.
- Given a new user prompt, When the track or the task changed since the last note, Then the `prompt` hook appends the task note (`taskNote()`) to the prompt text under a `measure-guard:` marker; When nothing changed, Then the prompt is unchanged.
- Given an `edit`, `write`, or `bash` tool call that changes the plan, When the `execute.after` hook runs, Then the note rides on the tool output.
- Given a compaction, When the `compaction` hook runs, Then the task note is appended to the compaction context, and the next prompt gets the note again.

**Estimate:** M
**Priority:** Must

### Story S4: Edit guard and closeout guard
**As a** Measure maintainer
**I want** edits outside the plan and premature closeouts stopped
**So that** the plan stays the source of truth

**Acceptance Criteria:**
- Given mode `guard` or `strict` and no `[~]` task in the active plan, When the agent calls `edit`, `write`, `apply_patch`, or `multiedit` on a file outside `measure/`, Then the `execute.before` hook throws an error whose message is `editDecision().deny` (the next action and the bypass line); in mode `advise` the call passes.
- Given a `[~]` task, When the agent edits a file outside `measure/`, Then the call passes.
- Given an edit of `measure/tracks.md` that changes a track to `[x]` while its plan has open tasks, When the hook runs, Then the call is denied with `trackCloseDecision().deny`; When the plan has no open task and `[b]` tasks exist, Then the call passes and the `[b]` list rides on the output.
- Given an edit of a `plan.md` that starts a new phase while the previous phase heading has no `[checkpoint: <sha>]`, When the hook runs, Then the call is denied with `phaseStartDecision().deny`.
- Given a git repository without `measure/`, When the agent edits a file, Then the call is denied with `SETUP_DENY` once per session, and `/measure-off` lifts it.
- Given the live OpenCode service, When the plugin is installed and an agent is asked to edit a file in a test project with no `[~]` task, Then the tool result shows the deny text (end-to-end check, one model call).

**Estimate:** L
**Priority:** Must

### Story S5: TDD guard and commit guard (strict)
**As a** Measure maintainer
**I want** Red before Green and well-formed commits in strict mode
**So that** the workflow steps are mechanical, not optional

**Acceptance Criteria:**
- Given mode `strict` and a `[~]` task, When the agent edits a source file before a test file changed and a test command failed, Then the edit is denied with `tddDecision().deny`; When a test file changed and a test command failed (recorded from `execute.after` of `bash`/`shell` with a non-zero result), Then the edit passes.
- Given mode `strict`, When the agent runs `git commit` with a message that does not match `<type>(<scope>): <description>`, or with no `[~]` task, Then the command is denied with `commitDecision().deny`.
- Given an allowed commit, When it succeeds, Then the output gets `commitReminder(sha)` (git note and SHA in `plan.md`).
- Given mode `guard`, When the agent commits, Then no check runs.

**Estimate:** M
**Priority:** Must

### Story S6: End-of-turn check
**As a** Measure maintainer
**I want** a check when the agent stops
**So that** a `[x]` task without a SHA or a changed file without a `[~]` task is caught

**Acceptance Criteria:**
- Given a user prompt, When the `prompt` hook runs, Then the plugin records the `git status --porcelain` lines and the `[x]` tasks without SHA at the turn start.
- Given a `session.idle` event for that session, When the check runs, Then `turnProblems()` is computed from the status lines at idle and the snapshot, written to the state file, and: in `advise` nothing more happens; in `guard` a synthetic reminder message with the problems is added to the session; in `strict` a follow-up prompt with the problems is sent, at most `MAX_BLOCKS` (2) times per user turn, then a reminder.
- Given the bypass is on, When the session goes idle, Then no check runs.
- Given no problems, When the session goes idle, Then the state file has an empty `problems` list.

**Estimate:** M
**Priority:** Must

### Story S7: Commands and the status tool
**As an** OpenCode user
**I want** the Measure workflows and the guard switches as slash commands, and a status tool for the agent
**So that** I run Measure without typing prompts

**Acceptance Criteria:**
- Given the server plugin, When OpenCode lists commands, Then `measure-off`, `measure-on`, and `measure-guard` exist (added through `command.transform`); `/measure-off [repo]` and `/measure-on [repo]` set or clear the bypass and answer with a synthetic message; `/measure-guard` answers with `statusLines()` (tracks, position, `[b]` count, bypass).
- Given `plugins/opencode-measure-guard/commands/`, When I list it, Then it has `measure-setup.md`, `measure-new-track.md`, `measure-implement.md`, `measure-review.md`, `measure-status.md`, `measure-revert.md`, `measure-doctor.md`, and `measure-orchestrate.md`; each has a `description` and a body that loads the `measure` (or `measure-orchestrator`) skill and runs the named workflow with `$ARGUMENTS`.
- Given the server plugin, When OpenCode lists tools, Then `measure_status` exists (added through `tool.transform`) and returns the status lines and the task note as text, so an agent can ask for the plan position instead of reading the files.

**Estimate:** M
**Priority:** Must

### Story S8: Terminal band and status pane
**As an** OpenCode terminal user
**I want** the plan position above the prompt and the full status in the sidebar
**So that** I see where the work stands without a command

**Acceptance Criteria:**
- Given `src/tui.tsx`, When the terminal plugin loads, Then it appends to `prompt.footer.status` a one-line band `bandLine(snapshot, guardsOff)` (dim; yellow when `parseError` is set), and below it the end-of-turn problems from the state file when there are any.
- Given the sidebar, When a session is open, Then `sidebar.content` gets a "Measure" block with `statusLines()`.
- Given the keymap layer, When I type `/measure-guard` in the terminal, Then a select dialog shows the status lines; the command is also in the palette.
- Given a `file.edited` or `session.idle` event, or 5 s of time, When the Measure files or the state file changed (mtime), Then the band and the sidebar refresh.
- Given a git repository without `measure/`, When the band renders, Then it shows `setupBandText('pending')` and a `/measure-off` hint instead of buttons.
- Given the installed plugin, When the terminal starts, Then the log has no `failed to load plugin` line for `measure.guard.tui` (load check through the running service).

**Estimate:** L
**Priority:** Must

### Story S9: Installer targets and documents
**As a** Measure user
**I want** the installer to put the plugin, commands, and agents where OpenCode reads them
**So that** every machine gets the same version from `main`

**Acceptance Criteria:**
- Given `bin/install-targets.tsv`, When I read it, Then it has rows `plugins/opencode-measure-guard → ~/.config/opencode/plugins/opencode-measure-guard` (files `*`, without `tests/` and `node_modules/`), `plugins/opencode-measure-guard/commands → ~/.config/opencode/commands` (`measure-*.md`), and `agents → ~/.config/opencode/agents` (`measure-*.md`).
- Given a machine with the existing local agent edits, When the installer runs without `--adopt`, Then those files are kept and a warning names them (stamp rule of the installer); the installer tests cover the new rows.
- Given `README.md`, `measure/tech-stack.md`, and `CHANGELOG.md`, When I read them, Then they describe the OpenCode plugin, its install, its modes, its commands, and the limits (no held turn, the band in the terminal only).
- Given `plugins/opencode-measure-guard/README.md`, When I read it, Then it documents the plugin ids, options, the hooks used, the state file, the commands, the tool, the tests, and the parity rule.

**Estimate:** M
**Priority:** Must

## Non-Functional Requirements

- The plugin has no bundled dependencies: it imports `@opencode/plugin`, `@opencode/plugin/tui`, `solid-js`, `bun`, and Node built-ins only. The host provides the first four at runtime.
- The system prompt addition is fixed text, so the prompt cache stays valid; changing state travels as notes.
- All guards fail open on a parse error or when the Measure files are unreadable, as in the mod.
- Every deny text ends with the bypass line (`BYPASS` of the core).
- The plugin never writes into the project except through the agent's own tools; its only files are the state file under `~/.local/state/measure/opencode-guard/` and its plugin storage.

## Acceptance Criteria (track level)

1. `bash plugins/opencode-measure-guard/scripts/check-parity.sh` exits 0.
2. `bun test plugins/opencode-measure-guard` passes.
3. `bun x tsc --noEmit -p plugins/opencode-measure-guard` passes after `bun install` in that folder.
4. With the plugin installed, the OpenCode service log shows `loading plugin` for the package and no `failed to load plugin` for it; a live edit without a `[~]` task is denied with the deny text.
5. `bin/install-measure-skill --check` lists the new targets.
6. The Claude Code mod is byte-identical to `main` (`git diff main -- mods/measure-guard` is empty).

## Out of Scope

- A desktop-app band (OpenCode desktop has no terminal plugin support).
- Changes to the Claude Code mod, the Pi harness, or the OpenChamber extension.
- Converting the repo agents to the V2 `permissions` list format, or adopting the local agent edits of this machine into the repo.
- Foley-level polish of the band (colors beyond dim and yellow).
