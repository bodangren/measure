# Implementation Plan: DSH measure-guard

Track: `dsh_measure_guard_20261107`
Spec: [./spec.md](./spec.md)

## Phase 1: Shared core and package skeleton

- [ ] Task: Record the plugin runtime in the tech stack
    - [ ] Add one dated line to `measure/tech-stack.md` for the plain-JS, no-build DSH bundle
- [ ] Task: Scaffold the bundle package
    - [ ] `package.json` with `dsh.bundle.patch`, exports, files, locale, icon
    - [ ] `cordis.patch.yml` inserting the host row
    - [ ] `index.js` exporting `apply()` and `Config`
- [ ] Task: Copy the shared core with parity
    - [ ] Copy `parse.ts`, `guards.ts`, and the transformed `types.ts` from `mods/measure-guard/`
    - [ ] Extend `check-parity.sh` to the DSH package (three files)
    - [ ] Run parity from the package test command
- [ ] Task: Test harness
    - [ ] In-memory project fixture (Measure files as strings)
    - [ ] Core smoke test: parse a fixture, assert the active task and band line
- [ ] Task: Measure - User Manual Verification 'Phase 1: Shared core and package skeleton' (Protocol in workflow.md)

## Phase 2: Context layer

- [ ] Task: State model
    - [ ] Repository config store (mode override, repo bypass) on `ctx.storageDomain`
    - [ ] Agent state (note key, session bypass) keyed by agent
    - [ ] Turn state keyed by `(agent.id, turn)`
- [ ] Task: Snapshot service
    - [ ] Canonical root via `git rev-parse --show-toplevel` + `realpath`
    - [ ] Read and cache `index.md`, `tracks.md`, active plans, `guard-allow`
    - [ ] Invalidate on `tools/result`, `agent/pre-step`, and compaction
- [ ] Task: Rule section and task note
    - [ ] `ctx.systemPrompt.section` with fixed text
    - [ ] `agent.inject` note when the track/task key changes, and after compaction
    - [ ] Attach existing agents via `ctx.agents.list()`, then `agent/created`
- [ ] Task: `measure_status` tool
    - [ ] Return tracks, active track, position, `[b]` count, next action, spec path
- [ ] Task: Commands
    - [ ] `/measure-off [repo]`, `/measure-on [repo]`
    - [ ] `/measure-status` returning the status text
- [ ] Task: Measure - User Manual Verification 'Phase 2: Context layer' (Protocol in workflow.md)

## Phase 3: Guard layer

- [ ] Task: Decision preparation
    - [ ] `tools/pre-execute` computes decisions and stores them by execution token
    - [ ] `tools/result` clears the entry
    - [ ] `ctx.tools.guard` returns the stored denial
- [ ] Task: Tool mutation normalization
    - [ ] `edit`, `write`, `apply_patch`, `str_replace_editor`, `bash`, `pwsh`
    - [ ] Deny the whole call when one path is denied
- [ ] Task: Edit guard
    - [ ] Outside `measure/`, no `[~]` → deny with the next task and the bypass
    - [ ] Allow list and parse-error pass-through
- [ ] Task: Closeout guard
    - [ ] Track close with open tasks → deny
    - [ ] Phase start without the previous checkpoint → deny
- [ ] Task: End-of-turn check
    - [ ] Baseline at the first `agent/pre-step` of the turn
    - [ ] Problems computed at `agent/turn-stopping`
    - [ ] Guard mode: reminder after `session/event` → `turn/end`
- [ ] Task: Measure - User Manual Verification 'Phase 3: Guard layer' (Protocol in workflow.md)

## Phase 4: Client surface

- [ ] Task: Band
    - [ ] Register in `conversation.input.dock`
    - [ ] Host stream method; theme tokens only
- [ ] Task: Panel and command action
    - [ ] Panel body in the keyed `main` slot, icon in `sidebar.panellist`
    - [ ] Client `commandUi` action selects the panel
- [ ] Task: Measure - User Manual Verification 'Phase 4: Client surface' (Protocol in workflow.md)

## Phase 5: Distribution and docs

- [ ] Task: Documentation and display resources
    - [ ] `README.md`, `locale/en.json`, `locale/zh.json`, `icon.svg`
- [ ] Task: Distribution
    - [ ] Installer target row in `bin/install-targets.tsv`
    - [ ] Parity and tests wired into the documented check command
- [ ] Task: Measure - User Manual Verification 'Phase 5: Distribution and docs' (Protocol in workflow.md)

## Deferred to a follow-up track

- Strict-mode TDD and commit guards (FR-13)
- Subagent inheritance and goal binding (FR-14)
- Validators for SHA existence, git notes, and checkpoint evidence in the shared core
