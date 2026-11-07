# Specification: DSH measure-guard

Track: `dsh_measure_guard_20261107`
Type: feature · Spec mode: classic FR list
Author model: deepseek-flash · Date: 2026-11-07

## Overview

Measure enforces its workflow in two harnesses today: a Claude Code mod
(`mods/measure-guard/`) and an OpenCode plugin
(`plugins/opencode-measure-guard/`). Both share one pure decision core —
`parse.ts` and `guards.ts` — copied byte-for-byte with a parity gate. Neither can
run on the DeepSeek Harness, whose plugin runtime is Cordis-based.

This track adds the third adapter: a DSH bundle that reads the project's
`measure/` files, keeps the agent oriented on the active task, and denies work
the active plan does not cover. The shared core is reused, not rewritten.

The design was reviewed before implementation by an external reviewer
(`gpt-6.1-sol`) whose Blockers and Majors are incorporated below. The review's
central correction: a `ToolGuard` is synchronous
(`(execution) => string | undefined`), so all state preparation must happen in
the asynchronous `tools/pre-execute` waterfall, keyed by the call's token.

## Functional Requirements

### Context (L1)

**FR-1 — Rule section.** The plugin adds one fixed system-prompt section via
`ctx.systemPrompt.section`. Its text never changes during a session, so the
prompt cache stays valid. It tells the agent to follow the Task Workflow in
`measure/workflow.md`.

**FR-2 — Task note.** When the active track or current task changes, the plugin
sends a short note through `agent.inject()`. The note is re-sent after
compaction, after the user changes task state outside the agent, and after an
external edit makes the cached snapshot stale.

**FR-3 — Status tool.** A `measure_status` tool returns the track list, the
active track, the position (`Phase p/P`, `Task t/T`), the `[b]` count, the
next action, and the resolved Specification path. It must not inject the whole
specification.

**FR-4 — Commands.** `/measure-off`, `/measure-off repo`, `/measure-on`,
`/measure-on repo`, and `/measure-status` are registered through
`ctx.commands.register`. `/measure-status` opens the panel through the Client
command action; the Host command returns text only.

### Guard (L2)

**FR-5 — Decision preparation.** For every guarded call, the plugin computes the
decision in `tools/pre-execute` (async, may read files and run git), stores it
by the execution token, and clears it on `tools/result`. `ctx.tools.guard` only
returns the stored denial. No guard may await.

**FR-6 — Mutation normalization.** One `ToolMutation` contract covers `edit`
(`file_path`, `old_string`, `new_string`), `write`, `apply_patch` (`input`,
disabled by default in the base profile), `str_replace_editor`
(`create`/`str_replace`/`insert`), `bash`, and `pwsh`. A call that touches
several paths is denied when any path is denied.

**FR-7 — Edit guard.** In `guard` and `strict` modes, a write inside the
project root and outside `measure/` is denied when no task in the active plan
has `[~]`. Edits inside `measure/` always pass; paths on the allow list pass; a
parse error allows everything.

**FR-8 — Closeout guard.** A track may change to `[x]` only when its plan has no
open task. A task in phase N+1 may change to `[~]` only when phase N's heading
carries `[checkpoint: <sha>]`.

**FR-9 — End-of-turn check.** At turn end the plugin reports a `[x]` task with
no SHA and files changed outside `measure/` while no task is `[~]`. `advise`
shows it in the band; `guard` adds a UI notice and an agent reminder delivered
after `session/event` → `turn/end`; `strict` holds the turn open, at most twice,
by injecting at `agent/turn-stopping`.

**FR-10 — Allow list.** `measure/guard-allow` names folders treated as Measure
work, with the same parse rules and reasons as the existing implementations.

### State

**FR-11 — Four state classes.** The plugin separates repository configuration
(persisted mode override, repo bypass), root snapshot (cached files keyed by the
canonical worktree root), agent state (noted task key, session bypass, Red
state, pending reminder), and turn state (baseline status, SHA-less tasks,
block count), the last keyed by `(agent.id, turn)`.

**FR-12 — Root resolution.** The project root is `git rev-parse --show-toplevel`
resolved with `realpath`. Linked worktrees are independent. The first release
declares one writer per worktree and warns when a second is detected.

### Later layers (specified, not built in this track)

**FR-13 — Strict guards.** TDD Red-before-Green and commit-message checks.
Deferred to a follow-up track; the mode value is accepted and behaves as `guard`.

**FR-14 — Subagent inheritance and goal binding.** Deferred to a follow-up track.

## Non-Functional Requirements

- **NFR-1** The plugin is inert outside a git work tree and in a repository with
  no `measure/` folder (it then offers setup through the band only).
- **NFR-2** No new runtime dependency: the Host half is plain ESM JavaScript; the
  Client half is plain JavaScript. No build step is added to this repository.
- **NFR-3** The shared core stays byte-identical with the Claude mod. Parity
  covers `parse.ts`, `guards.ts`, and the transformed `types.ts`, and runs from
  the DSH package's own test command.
- **NFR-4** POSIX paths only in this release. The shared path helpers split on
  `/`; Windows containment fails open and is out of scope.
- **NFR-5** Every user-visible string is localized (en, zh) and uses theme tokens
  only.

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
  turn ends, then `guard` mode records the problem and delivers a reminder at the
  next step.
- Given a task change, when the next step is admitted, then a note naming the new
  task is present exactly once.
- Given the same inputs, the DSH adapter's decisions equal the shared core's, and
  all shared tests pass.

## Out of Scope

- Full workflow enforcement: fabricated SHAs, missing git notes, checkpoint
  evidence, `metadata.json` updates, generated-doc checks, and archival steps are
  **not** verified. This plugin enforces the existing measure-guard marker
  semantics and nothing more.
- Strict-mode guards (FR-13) and the DSH extras (FR-14).
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

## Accepted Risks

- **Marker-only enforcement** (review finding 8): accepted; the boundary is
  documented above and will be fixture-tested.
- **One writer per worktree** (review finding 2): accepted for the first
  release; concurrent sessions in one worktree are detected, not arbitrated.
- **POSIX only** (review finding 12): accepted.
