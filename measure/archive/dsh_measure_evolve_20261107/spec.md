# Specification: DSH Measure evolution — strict guards, session-accurate writers, goal binding, and the setup button

## Overview

**Sprint goal:** A DeepSeek Harness session that develops a Measure track gets the rest of the guard rails: strict-mode Red-before-Green and commit checks, a writer count that names real sessions instead of subagents, a DSH goal bound to the active Measure track, and an in-band setup answer.

The DeepSeek Harness adapter `plugins/dsh-measure-guard/` shipped in `dsh_measure_guard_20261107` with the context layer (the fixed Measure rule, task notes, the second-writer warning), the edit, closeout, and end-of-turn guards, the `measure_status` tool, the three bypass commands, the band, the panel, and the one JSON state route. Its `spec.md` deferred two layers to a follow-up track: FR-13 (strict-mode TDD and commit guards) and FR-14 (subagent inheritance and goal binding). Its README's **Deferred** section repeats the same list, and `measure/tech-debt.md` records two live findings that belong to it: the second-writer record counts subagents of one root as extra sessions, and the setup offer has no in-band button.

This track closes those deferred layers on this POSIX host. Windows path support stays out of scope. The shared core already carries every decision function this track needs (`tddDecision`, `redFor`, `taskKey`, `parseCommitCommand`, `commitDecision`, `commitReminder`, `isTestFile`, `isTestCommand`, `setupBandText`); the work is adapter wiring, two DSH-native integrations (`ctx.agents.roots()` and `ctx.goals`), one write route, and the tests, docs, and live checks that prove them.

The OpenCode adapter solved the same strict guards in `opencode_plugin_20261021` Story S5. This track mirrors that contract on DSH seams (`tools/pre-execute`, `tools/post-execute`, `tools/result`) rather than inventing a new one.

Decisions made for this track (the owner chose the scope in the new-track question batch; each decision is recorded here so it can be reversed):

1. **Spec format:** story-shaped (feature track).
2. **Scope:** four deferred or recorded items in scope — strict TDD and commit guards (FR-13), session-accurate writer detection (the concrete half of FR-14's subagent inheritance), goal binding (the other half of FR-14), and the in-band setup answer (tech-debt). Windows path support is out of scope. A fifth item, the shared registry parser fix (S7), was added after a live report that the installed guard could not read the Mediarr registry; it is in scope and is the only shared-core change this track makes.
3. **Strict guards mirror the OpenCode contract.** The Red state is `redFor(red, taskKey(snapshot))` kept per agent; a successful test-file edit records `testChanged`, a failed test command records `testFailed`; `tddDecision` denies a source edit until both are true. A commit is `parseCommitCommand(command)`; `commitDecision(context, commit, staged)` uses the staged paths from `git diff --cached --name-only` (plus changed and untracked paths when the command takes changes, as the OpenCode adapter does); a finished commit for a `[~]` task earns `commitReminder(commitShaOf(output))`.
4. **Strict is the only mode that adds the guards.** `advise` and `guard` keep today's behavior. The mode list stays `advise | guard | strict` and the default stays `guard`.
5. **Root sessions own the writer slot.** `ctx.agents.roots()` names the live top-level agents; only a root claims a writer slot and only a root counts toward the band's session count and the second-writer warning. A child agent (subagent, teammate, or fork under an owner) still receives the Measure rule section, task notes, and every guard, but it never counts as a session. This closes the live false positive in `measure/tech-debt.md` that a goal-round session with one subagent produced.
6. **Goal binding takes both shapes the owner chose.** (a) A `/measure-goal` command seeds a DSH goal from the active track: it uses the active track entry's `name` and `id` for the objective when the agent has no goal, and reports the current goal otherwise; it never overwrites an active or paused/blocked goal. (b) The band, the status text, and the panel include the goal's phase and round position, and the end-of-turn check reports two consistency problems: a goal marked complete while a `[~]` task is open, and a current goal while no track is in progress. The guard never mutates the goal; it reports and the agent decides, exactly like the rest of the guard's detect-only contract.
7. **The setup answer becomes reachable in-band.** The Client band renders the two setup buttons; they `POST` to one exact route `/measure-guard/setup` with the session id and the choice. The Host records `off` or `setup` in agent state (replacing the fire-once `off` behavior for a clicked answer) and, for `setup`, injects the setup instruction message so the agent starts the `measure-setup` workflow. A denied edit still records `off` when no button is used, so today's fail-open behavior is preserved.
8. **The shared core is not forked.** All decision text and rules stay in `src/core/` with the existing parity gate. This track makes exactly one core change, the registry parser of S7, and follows the documented order: the canonical change lands in `mods/measure-guard/hooks/parse.ts` first, the OpenCode and DSH copies follow, and both parity gates pass. No other mod or OpenCode behavior changes.
9. **No new dependency and no build step (NFR-2 of the previous track).** The new surfaces are an exact HTTP route and `ctx.goals` calls. The Client half stays the hand-written lazy-CJS bundle.
10. **Verification is the previous track's gate plus one live check.** `node --test plugins/dsh-measure-guard/tests/*.test.js`, `bash plugins/dsh-measure-guard/scripts/check-parity.sh`, the environment CLI contract `bash tests/dsh/run.sh`, and a live check in the running web profile that reads the state route and exercises one strict-mode deny.
11. **The shared parser must read the real registries on this workstation.** The DSH adapter reported `cannot read the Measure files: /home/daniel-bo/Desktop/mediarr/measure/tracks.md has track lines in no known format` for the Mediarr project. Diagnosis: `parseTracks` expects every track line to start with `- [` and expects the `*Link:*` line to follow the bold title on a later line; the Mediarr registry writes active tracks as `1. - [~] **Track: …**` (ordered-list prefix) and puts `*Link:*` on the same line. The fix belongs in the shared core (the Claude Code mod is the canonical source; the OpenCode and DSH copies follow through the parity gates), and each adapter's unknown-format detector must accept the numbered form. This is one Story (S7) because the same core serves all three adapters.
12. **Story S7 executes before S1.** The plan lists the phases S1–S6 and then S7, but when implementation starts S7 runs first as a documented deviation: it is a live user-blocking defect, and its write scope (the shared parser and the two adapter detectors) is disjoint from S1–S6. The plan's Phase S7 note records the deviation.

## Stories

### Story S1: Strict TDD guard (Red before Green)
**As a** Measure developer on the DeepSeek Harness
**I want** the strict mode to stop a source edit until the active task has a failing test
**So that** Red-before-Green is enforced by the harness and not only by convention

**Acceptance Criteria:**
- Given `mode: strict` and a `[~]` task, When the agent edits a source file inside the project and outside `measure/` before any test change and test failure, Then the edit is denied with the shared core's `tddDecision` text naming the missing Red steps, and the deny carries the bypass hint.
- Given the same task, When a test-file edit succeeded and then a test command failed in this session, Then a later source edit is allowed.
- Given a new `[~]` task, When the agent tries a source edit, Then the Red record reset for the new task and the edit is denied again.
- Given `mode: advise` or `mode: guard`, When the agent edits a source file with no Red phase, Then the edit is allowed (the strict guard is inert).
- Given a bypass (`/measure-off` or the setup `off` answer), When the agent edits any file, Then the strict guard is inert.
- Given the shared core, When I run the parity check, Then the copied `guards.ts` is byte-identical apart from the documented extension transform.

**Estimate:** L
**Priority:** Must

### Story S2: Strict commit guard and commit reminder
**As a** Measure developer on the DeepSeek Harness
**I want** strict mode to check the commit message and the staged files, and to remind me of the git note and SHA steps
**So that** the per-task commit ceremony is enforced instead of remembered

**Acceptance Criteria:**
- Given `mode: strict`, When the agent runs `git commit -m "fix stuff"`, Then the commit is denied with the shared core's `<type>(<scope>): <description>` text.
- Given a commit message that cannot be parsed (`-F`, a variable, the editor), When the agent commits, Then the commit is allowed and a note asks for the format instead of denying.
- Given no `[~]` task and a commit that stages a file outside `measure/`, When the agent commits, Then the commit is denied and the deny text lists the outside files.
- Given no `[~]` task and a commit that stages only `measure/` files, Then the commit is allowed.
- Given a `[~]` task and a successful commit, When the commit finishes, Then the tool result carries `commitReminder` with the short SHA and the git note and plan.md steps.
- Given `mode: advise` or `mode: guard`, When the agent commits a bad message, Then no deny and no reminder (the strict guard is inert).

**Estimate:** L
**Priority:** Must

### Story S3: Session-accurate writer detection
**As a** Measure orchestration lead on the DeepSeek Harness
**I want** the writer warning and the band count to name only real sessions
**So that** one session that spawns a subagent does not look like two sessions writing the same worktree

**Acceptance Criteria:**
- Given one root agent and one child agent (a subagent under it) in the same worktree, When both attach, Then no second-writer note is injected and the band session count is 1.
- Given two root agents in the same worktree, When the second attaches, Then exactly one second-writer note names 2 sessions, and the band count is 2.
- Given a child agent, When it edits a file, Then the edit guard, task notes, and the Measure rule section still apply (children inherit the context and guards).
- Given the root is disposed, When the remaining agents are recounted, Then the record is released and a later root claims cleanly.

**Estimate:** S
**Priority:** Must

### Story S4: Goal binding
**As a** Measure developer on the DeepSeek Harness
**I want** the DSH goal bound to the active Measure track
**So that** a goal-round session and its track never drift apart silently

**Acceptance Criteria:**
- Given no current goal and an active Measure track, When the user runs `/measure-goal`, Then a goal is created with the objective `Measure track "<track name>" (<track id>).` and the reply is `measure-guard: created the goal "<objective>" (round 0/<max>).`
- Given a current goal in phase `active`, `paused`, or `blocked`, When the user runs `/measure-goal`, Then the command reports that goal and does not create or replace it; for `paused` and `blocked` the reply says to resume or clear it first.
- Given a current goal in phase `complete` and an active track, When the user runs `/measure-goal`, Then the goal service replaces the completed goal with the track objective and the reply is the created form.
- Given no active track (no `[~]` entry), When the user runs `/measure-goal`, Then the reply is `measure-guard: no Measure track is in progress, so there is no track to seed a goal from.` and no goal is created.
- Given any current goal, When the band, the status text, the panel, or the state route renders, Then the goal appears as phase plus round position: the state route carries `goal: { objective, phase, round, maxRounds } | null`.
- Given a goal whose phase is `complete` while a task is `[~]`, When the turn ends, Then the end-of-turn check reports a consistency problem naming the goal and the task.
- Given any current goal (`active`, `paused`, or `blocked`) and no task is `[~]` while the registry has tracks, When the turn ends, Then the end-of-turn check reports a consistency problem naming the goal.
- Given a DSH build whose `ctx.get('goals')` returns undefined, When the plugin loads and renders, Then it degrades to no goal line and no consistency problem (fail open, no crash).

**Estimate:** L
**Priority:** Should

### Story S5: In-band setup answer
**As a** user with a git repository that has no `measure/` folder
**I want** to answer the setup offer from the band instead of a denied edit
**So that** the guard's setup question is a real choice in the UI

**Acceptance Criteria:**
- Given a repository with no `measure/` folder, When the band renders, Then the state route carries `setup: { choice: 'off' | 'setup' | null, text: string | null }` where `text` is the shared core's `setupBandText(choice)`, and the band shows the two actions "Set up Measure" and "Turn off for session" while `choice` is null.
- Given the user clicks "Turn off for session", When the POST reaches `/measure-guard/setup`, Then the answer `off` is stored for that session and the guards stop denying.
- Given the user clicks "Set up Measure", When the POST reaches `/measure-guard/setup`, Then the answer `setup` is stored, the setup instruction message is delivered to the agent, the state route's `setup.choice` is `setup`, and the band shows the "setup requested" variant `setupBandText('setup')` and no buttons.
- Given an unknown session id or a malformed body, When the POST arrives, Then the response is 404 or 400 and nothing is stored.
- Given a denied edit with no button answer, Then the session still records `off` once, as today (backward compatible).
- Given the shared core, When I run the parity check, Then the setup texts and the band variant still come from `src/core/guards.ts`.

**Estimate:** M
**Priority:** Should

### Story S6: Documentation, live check, and track closeout
**As a** Measure maintainer
**I want** the new behavior documented and verified against the running harness
**So that** the next session starts from accurate docs and the deferred list is empty

**Acceptance Criteria:**
- Given `plugins/dsh-measure-guard/README.md`, When I read the modes, guards, known limits, and deferred sections, Then strict guards, session-accurate writers, goal binding, and the setup button are described accurately and the closed deferred items are gone.
- Given `docs/dsh.md`, When I read it, Then it names the strict mode, `/measure-goal`, and the setup buttons.
- Given the running web profile with the installed copy, When I run the live check, Then the state route returns the goal line and session count, and one strict-mode deny and one `/measure-goal` reply are recorded as evidence.
- Given `CHANGELOG.md`, Then one Unreleased entry names this track and its four features.
- Given `measure/lessons-learned.md` and `measure/tech-debt.md`, Then the new lessons are recorded, the two closed items are marked resolved, and both files stay at or below 50 lines.
- Given the track is complete, When I run the closeout, Then `metadata.json` records the real counts and the track is archived with a `tracks.md` update.

**Estimate:** M
**Priority:** Must

### Story S7: Registry format tolerance for real projects
**As a** Measure user whose registry follows the numbered execution-order or the same-line link form
**I want** the shared parser to read those track lines
**So that** the guard shows my plan position instead of "cannot read the Measure files"

**Acceptance Criteria:**
- Given a registry whose active entries are `1. - [~] **Track: Name** *Phases: 6 | Link: [./tracks/id/](./tracks/id/)*`, When `parseTracks` runs, Then each numbered entry is parsed with its marker, name, and folder, and the line number is the numbered line.
- Given an entry whose `*Link: …*` sits on the same bold line, When `parseTracks` runs, Then the entry is parsed (the next-line form keeps working).
- Given the repository's own `measure/tracks.md` and the existing fixtures, When `parseTracks` runs, Then the parsed entries are unchanged.
- Given a registry with numbered or same-line entries, When the DSH and OpenCode snapshots load it, Then no parse error is reported and the first `[~]` track is selected as active.
- Given the Mediarr registry at `~/Desktop/mediarr/measure/tracks.md`, When the shared parser runs, Then it returns the nine active tracks and the archived/deferred entries (recorded in the live check; the repo tests use a fixture of the same shape).
- Given the parity gates, When the core changes, Then the OpenCode and DSH copies are updated and both parity checks pass.

**Estimate:** S
**Priority:** Must

## Non-Functional Requirements

- **NFR-1 (inert outside Measure).** In a git work tree with no `measure/` folder the plugin keeps today's setup offer and denies nothing else; outside a git work tree it does nothing.
- **NFR-2 (no new dependency, no build).** The Host half keeps importing no `@deepseek-ai/*` package; the browser half stays the hand-written `window.__ModuleLoader__.load` bundle; the only new Host capability is `ctx.goals`, called through the service object, never imported.
- **NFR-3 (shared core parity).** Every decision, every deny text, and the core band line stay in `src/core/`; `scripts/check-parity.sh` keeps passing. The goal row and the setup actions are adapter chrome, not core: they are built in the Host view or the Client, never by changing `parse.ts`/`guards.ts`.
- **NFR-4 (fail open).** The goal service is read as an optional capability (`ctx.get('goals')`), so a build without it degrades to no goal line and no consistency problem. The required services (`agents`, `subprocess`, `tools`) are guaranteed by `inject`; per-call errors (unreadable git state, malformed result) degrade to "allow" with at most one note, and no new throw escapes a listener.
- **NFR-5 (localization boundary).** New plugin chrome strings (button labels, goal row) are localized in English and Chinese; core texts stay English by the existing boundary.
- **NFR-6 (POSIX).** Windows path support stays out of scope; containment fails open there, as documented.
- **NFR-7 (evidence).** Every story lands with tests that fail first (Red recorded in the git note), the gate command, and where applicable a live-check artifact under `measure/runs/dsh_measure_evolve_20261107/`.

## Acceptance Criteria (track level)

- Given the plugin package, When I run `node --test plugins/dsh-measure-guard/tests/*.test.js`, Then every test passes and the count grows from the current 157 by the new strict, writer, goal, and setup tests.
- Given the shared core, When I run `bash plugins/dsh-measure-guard/scripts/check-parity.sh`, Then it prints `parity: ok`.
- Given a temporary home, When I run `bash tests/dsh/run.sh`, Then the environment CLI's install contract still passes.
- Given the canonical mod parser and its copies, Then `mods/measure-guard/tests/parse.test.ts` names the numbered and same-line-link cases, the DSH suite (which loads the identical parser) passes, and the OpenCode suite `bun test plugins/opencode-measure-guard` and `claude plugin test mods/measure-guard` pass on a host that has those runners (this POSIX host has neither; the parity gates plus the shared DSH suite are the substitute evidence, recorded in the track note).
- Given the running web profile, When the live check runs, Then the boot graph carries the plugin, the state route returns 200 with the goal summary and the root session count, a strict-mode source edit is denied, and `/measure-goal` replies with the active track.
- Given the deferred list of `dsh_measure_guard_20261107`, When this track closes, Then FR-13, FR-14, and the setup button are done or explicitly re-scoped in `metadata.json`.

## Out of Scope

- Windows path support (deferred; POSIX host).
- A strict guard for `apply_patch` and `str_replace_editor` mutations (the closeout guard's documented fail-open limit).
- Path checks for writes performed through shell redirection (the end-of-turn check remains the backstop).
- Behavior changes to the Claude Code mod or the OpenCode plugin beyond the S7 parser rule. The shared core may only change through the documented parity order, and S7 is the only core change in this track.
- Goal round policy, auto-continuation semantics, or goal creation outside `/measure-goal`.
- Verification of git notes, SHAs, or `metadata.json` fields beyond the existing marker-only contract.
