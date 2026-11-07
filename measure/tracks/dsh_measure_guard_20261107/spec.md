# Specification: DSH measure-guard

Track: `dsh_measure_guard_20261107`
Type: feature · Spec mode: classic FR list
Author model: deepseek-flash · Date: 2026-11-07
Review: three independent reviewers (MiniMax-M3.1-Flash, MiMo-V2.6-Pro, Kimi
K3.1-Pro); findings and dispositions in [spec-review.md](./spec-review.md).
Design decisions: [design.md](./design.md).

## Overview

Measure enforces its workflow in two harnesses today: a Claude Code mod
(`mods/measure-guard/`) and an OpenCode plugin
(`plugins/opencode-measure-guard/`). Both share one pure decision core —
`parse.ts` and `guards.ts` — copied with a parity gate. Neither can run on the
DeepSeek Harness (DSH), whose plugin runtime is Cordis-based.

This track adds the third adapter: `plugins/dsh-measure-guard/`, a DSH bundle
that reads the project's `measure/` files, keeps the agent oriented on the
active task, and denies work the active plan does not cover. The shared core is
reused by copy with a parity gate; every harness call stays in a thin adapter.

`design.md` fixes the file layout, the module boundaries, the exact platform
APIs, the Host→Client channel, and the normal and edge test case of every
phase. This specification stays at the requirement level; `design.md` closes
every choice the implementer would otherwise make.

## Functional Requirements

### Context (L1)

**FR-1 — Rule section.** One fixed system-prompt section through
`ctx.systemPrompt.section({ name: 'measure:rule', order: 5000, text:
ruleSection() })`, where `ruleSection` is the shared core's fixed text. The text
never changes during a session, so the prompt cache stays valid. The section is
registered once for the profile, and only while the project has a `measure/`
folder.

**FR-2 — Task note.** When the active track or current task changes, the agent
receives a short note with the shared core's `taskNote()` text. Delivery is
exactly once: the note is returned from `agent/pre-step` as
`{ kind: 'enter', messages }`, because `agent.inject()` may miss a step. The
note is sent again after compaction (`compaction/end`) and after an external
edit invalidates the cached snapshot. `agent.inject()` is used only for one-shot
notices (the end-of-turn reminder and the second-writer warning), never for the
task note.

**FR-3 — Status tool.** A `measure_status` tool returns the shared core's
`statusLines()` text: the track list, the active track, the position
(`Phase p/P`, `Task t/T`), the `[b]` count, the next action, and the resolved
Specification path. It must not inject the whole specification.

**FR-4 — Commands.** Three `ctx.commands.register` definitions, each one
lowercase name with the rest of the line left to its own grammar:
`measure-off` (optional argument `repo`), `measure-on` (optional `repo`), and
`measure-status`. A host handler returns `{ kind: 'success', text }` built from
the shared core. The Client half hangs a `ctx.commandUi.decorate` action on
`measure-status` that opens the Measure panel (FR-16); a bare invocation spends
the command line and submits nothing to the model.

**FR-15 — Client data channel.** The Host serves the current status as JSON from
one exact HTTP resource, `GET /measure-guard/state?sessionId=<id>`
(`ctx.webServer.register`), with
`{ band, status, guardsOff, problems, updatedAt }`. An unknown session id is
404. No session projection, no Typert Remote, and no codegen: the API-remotes
service forwards only its fixed event allowlist, so a custom remote would need
generated artifacts.

### Guard (L2)

**FR-5 — Decision preparation.** For every guarded call the plugin computes the
decision in `tools/pre-execute` (async; it may read files and run git), stores
it by the execution token (`exec.token`), and clears it on `tools/result`.
`ctx.tools.guard` only returns the stored denial; no guard may await. A
throwing preparation defaults to allow.

**FR-6 — Mutation normalization.** One `ToolMutation` contract covers `edit`
(`file_path`, `old_string`, `new_string`), `write`, `apply_patch` (`input`,
disabled by default in the base profile), and `str_replace_editor`
(`create`/`str_replace`/`insert`). Each yields absolute paths; a call that
touches several paths is denied when any path is denied, and the deny names
every denied path. `bash` and `pwsh` are classified as shell calls with unknown
paths: the edit guard does not path-check them, and the end-of-turn check is
their backstop. No shell path extraction is invented in this track.

**FR-7 — Edit guard.** In `guard` and `strict` modes, a write inside the project
root and outside `measure/` is denied when no task in the active plan has
`[~]`. Edits inside `measure/` always pass; paths on the allow list pass; a
parse error allows everything.

**FR-8 — Closeout guard.** A track may change to `[x]` only when its plan has no
open task. A task in phase N+1 may change to `[~]` only when phase N's heading
carries `[checkpoint: <sha>]`.

**FR-9 — End-of-turn check.** At the end of a turn the plugin reports a `[x]`
task with no SHA and files changed outside `measure/` while no task is `[~]`.
The baseline is `git status` at the first `agent/pre-step` of the turn; the
problems are computed at `agent/turn-stopping`. `advise` shows them in the band
only; `guard` adds a UI notice and an agent reminder delivered by the next
`agent/pre-step`; `strict` holds the turn open by steering at
`agent/turn-stopping`, at most `MAX_BLOCKS` (2) times. **The band** is the
`conversation.input.dock` strip; it shows `bandLine()`, the setup offer, the
`[b]` count, the open problems, and the guard bypass state.

**FR-10 — Allow list.** `measure/guard-allow` names folders treated as Measure
work, with the same parse rules and reasons as the existing implementations
(`parseAllowList`, `isAllowed`).

### State

**FR-11 — Four state classes.** The plugin separates repository configuration
(persisted mode override, repo bypass), root snapshot (cached files keyed by the
canonical worktree root), agent state (noted task key, setup answer, session
bypass, Red state, pending reminder), and turn state (baseline status, SHA-less
tasks, block count), the last keyed by `(agent.id, turn)`. Repository
configuration persists in `~/.local/state/measure/dsh-guard/repos.json`. This
track does not use `ctx.storageDomain`: its record schemas require a zod
dependency, which NFR-2 forbids.

**FR-12 — Root resolution.** The project root is the agent's working directory
(`ctx.workingDirectory.get`) resolved with `ctx.fs.resolve` (the fs provider
realpaths), then `git rev-parse --show-toplevel` through `ctx.subprocess`.
Linked worktrees are independent. The plugin detects a second agent that edits
the same root and warns it once (one note and a band suffix); it does not
arbitrate.

### Client surface (L4)

**FR-16 — Band and panel.** The band is the `conversation.input.dock` entry of
FR-9. The panel is the root-scoped `main` keyed slot `measure` with the
`sidebar.panellist` icon `measure`; it lists the sessions from
`ctx.sessions.list` and shows the selected session's status text from FR-15.
All visible text is localized (en, zh) through `ctx.locale`; styles use theme
tokens only. The Client half is the documented hand-written Lazy-CJS
`client.js`; it requires only `react` from the page module table.

### Later layers (specified, not built in this track)

**FR-13 — Strict guards.** The TDD Red-before-Green and commit-message checks
are deferred to a follow-up track. `strict` already keeps the FR-9 end-of-turn
hold; apart from that hold it behaves as `guard`.

**FR-14 — Subagent inheritance and goal binding.** Deferred to a follow-up
track.

## Non-Functional Requirements

- **NFR-1** The plugin is inert outside a git work tree and in a repository with
  no `measure/` folder. In such a git repository it offers setup through the
  band (FR-9) and denies writes with the shared core's setup text until the user
  answers; outside a git work tree it does nothing.
- **NFR-2** No new runtime dependency and no build tool. The Host half is plain
  ESM JavaScript that imports no `@deepseek-ai/*` package (every capability
  comes from `ctx`); the copied core is TypeScript loaded by Node's built-in
  type stripping (Node >= 24.9, and outside `node_modules`); the Client half is
  the documented hand-written `window.__ModuleLoader__.load` bundle, which the
  Host serves as bytes without compiling.
- **NFR-3** The shared core stays the single decision source. Parity covers
  `parse.ts` (byte-identical), `guards.ts` (identical after one documented
  mechanical transform: its only extensionless value import `./parse` gains
  `.ts`), and the transformed `types.ts` (the OpenCode rule). The check runs
  from the DSH package's test command.
- **NFR-4** POSIX paths only in this release. Windows containment fails open and
  is out of scope.
- **NFR-5** Every user-visible string is localized (en, zh) and uses theme
  tokens only.

## Acceptance Criteria

- Given a repository with `measure/` and no `[~]` task, when the agent writes a
  source file, then the call is denied with the next task named and the file is
  unchanged.
- Given a `[~]` task, when the agent writes a source file, then the call passes.
- Given a plan whose phase N lacks a checkpoint, when a task in phase N+1 is set
  to `[~]`, then the call is denied and the deny text names the missing
  checkpoint.
- Given a track whose plan has an open task, when `tracks.md` marks it `[x]`,
  then the call is denied and the open tasks are listed.
- Given a turn that changed files outside `measure/` with no `[~]` task, when the
  turn ends, then `guard` mode records the problem and delivers a reminder at
  the next step, and `strict` mode holds the turn open at most twice.
- Given a task change, when the next step is admitted, then a note naming the
  new task is present exactly once.
- Given two agents working in one worktree root, when the second one starts,
  then it receives one warning note and the band names the session count.
- Given a git repository without `measure/`, when the agent writes a file, then
  the write is denied with the setup text and the band offers setup.
- Given `/measure-status` typed on the Client, when the decoration runs, then
  the Measure panel opens and no prompt is submitted.
- Given the FR-15 resource and an unknown session id, when the Client fetches
  it, then the response is 404.
- Given the same inputs, the DSH adapter's decisions equal the shared core's,
  and all shared tests pass.

## Out of Scope

- Full workflow enforcement: fabricated SHAs, missing git notes, checkpoint
  evidence, `metadata.json` updates, generated-doc checks, and archival steps are
  **not** verified. This plugin enforces the existing measure-guard marker
  semantics and nothing more.
- Shell path extraction: a write through `bash`/`pwsh` is not seen by the edit
  guard.
- Strict-mode TDD and commit guards (FR-13) and the DSH extras (FR-14).
- Replacing the `measure` skill; orchestrator role fan-out; `doctor`/`review`
  logic; Windows path support.

## Known Non-Enforcements (documented, tested as fixtures)

1. A later task may start while an earlier task is still `[ ]`.
2. A checkpoint SHA may be fabricated.
3. An `[x]` task may carry a SHA that no commit owns.
4. A commit may combine implementation and plan changes and skip `git notes`.
5. A track may close without `actual_tasks` or generated-doc verification.
6. A track may close when its plan file is missing.
7. An agent may edit `measure/guard-allow` itself.
8. A file written through the shell tool is not seen by the edit guard; only the
   end-of-turn check sees the result.

## Accepted Risks

- **Marker-only enforcement** (review finding 8): accepted; the boundary is
  documented above and fixture-tested.
- **One writer per worktree**: accepted for the first release; concurrent
  sessions in one worktree are detected and warned about, not arbitrated.
- **POSIX only**: accepted.
- **Setup answer is per agent**: the setup choice lives in agent state, so a new
  session in a repository without `measure/` asks again; accepted for this
  release.
- **Path-installed bundle shows the package id**: a profile patch row that names
  a file path has no display metadata in the Plugins page; the bundle install
  through `dsh plugin add` shows the localized title. Accepted; documented in
  `README.md`.
