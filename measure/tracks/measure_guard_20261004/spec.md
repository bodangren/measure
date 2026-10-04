# Specification: measure-guard Mod

## Overview

**Sprint Goal:** Claude Code follows the Measure Task Workflow, because a mod shows the plan state and stops work that the active plan does not cover.

measure-guard is a Claude Code mod (a plugin of function hooks) in `mods/measure-guard/`. The mod reads the Measure files of the project. It adds the active task to the system prompt, shows the plan progress above the prompt, and denies tool calls that skip the Task Workflow. The source of this spec is the approved design brief `mods/measure-guard/DESIGN.md` (2026-10-04).

The mod has a `userConfig` field `mode` with the values `advise`, `guard`, and `strict`. The default is `guard`.

| Feature | Story | advise | guard | strict |
| --- | --- | --- | --- | --- |
| Context section | S1 | yes | yes | yes |
| Progress band | S2 | yes | yes | yes |
| Edit guard | S3 | no | yes | yes |
| No `measure/` folder prompt | S4 | band only | yes | yes |
| Commands | S5 | yes | yes | yes |
| Closeout guard | S6 | no | yes | yes |
| End-of-turn check | S7 | band only | band, toast, reminder | turn stays open (2 attempts) |
| TDD guard | S8 | no | no | yes |
| Commit guard | S9 | no | no | yes |

## Parse Rules

All stories use these rules.

- Status markers: `[ ]` (pending, open), `[~]` (in progress, open), `[x]` (done), `[b]` (blocked or human-gated). A `[b]` task is closed only when its line ends with a `deferred:<owner>` field.
- `measure/tracks.md` has two entry formats. The mod accepts both:
  - `- [~] **Track: <name>**` with a next line `*Link: [./tracks/<id>/](./tracks/<id>/)*`
  - `- [x] [<name>](archive/<id>/index.md)`
- The active track is the first `[~]` track whose plan has a `[~]` task. If no plan of a `[~]` track has a `[~]` task, the active track is the first `[~]` track.
  - This rule replaces the brief's rule "the first track with `[~]`". Reason: in this repository, the first `[~]` track (`agent_performance_benchmarking_20260527`) has no `[~]` task. With the brief's rule, the edit guard denies all edits for work on a second track.
- In `plan.md`, a task is a checkbox line with no indent under a `## Phase ...` heading. An indented checkbox line is a sub-task. Checkbox lines in other `##` sections are not tasks.
- A completed task line ends with a 7-character SHA, with or without backticks (`` `3d4ed7e` `` or `3d4ed7e`). Reason: `workflow.md` step 9 does not require backticks, and the archived plans use no backticks.
- A phase is checkpointed when its heading contains `[checkpoint: <sha>]`.

## Stories

### Story S1: Plan context in every prompt
**As a** developer who uses Claude Code in a Measure project
**I want** the agent to see the active track and the current task in its system prompt
**So that** the agent continues the planned task after a restart or a compaction

**Acceptance Criteria:**
- Given `tracks.md` has entries in both formats, When the session starts, Then the mod reads all entries.
- Given 2 `[~]` tracks and only the plan of the second track has a `[~]` task, When the mod selects the active track, Then it selects the second track.
- Given a `plan.md` with checkbox lines in a `## Red run record` section, indented sub-tasks, and a `[b]` task with no `deferred:<owner>` field, When the mod counts open tasks, Then it counts only the top-level lines under `## Phase ...` headings, and the `[b]` task counts as open.
- Given an active track with a `[~]` task, When the prompt is composed, Then the system prompt has a section with the track, the task, and the rule "follow the Task Workflow in `measure/workflow.md`".
- Given no `mode` value in `userConfig`, When the mod loads, Then the mode is `guard`.

**Estimate:** L
**Priority:** Must

### Story S2: Progress band above the prompt
**As a** developer who uses Claude Code in a Measure project
**I want** a band above the prompt that shows the plan position
**So that** I see the active task and the blocked tasks without opening `plan.md`

**Acceptance Criteria:**
- Given the `[~]` task is task 3 of 7 in phase 2 of 4, When the band renders, Then it shows `Measure · <track> · Phase 2/4 · Task 3/7 [~] <task>`.
- Given the active plan has 2 `[b]` tasks, When the band renders, Then it shows the `[b]` count 2.
- Given 2 or more tracks have `[~]`, When the band renders, Then it shows a warning with the count of in-progress tracks.
- Given the agent edits `plan.md` or `tracks.md`, When the file changes, Then the band shows the new state.
- Given `plan.md` or `tracks.md` has a format that the mod cannot parse, When the band renders, Then it shows the parse error, and all guards allow all calls.

**Estimate:** M
**Priority:** Must

### Story S3: Edit guard
**As a** developer who uses Claude Code in a Measure project
**I want** the mod to deny file edits when no task is in progress
**So that** the agent marks a task `[~]` before it changes project files

**Acceptance Criteria:**
- Given mode `guard` and no active track, or an active plan with no `[~]` task, When the agent calls `Edit`, `Write`, or `NotebookEdit` on a file outside `measure/`, Then the mod denies the call.
- Given the mod denies an edit, When the agent reads the deny text, Then the text tells the agent to mark the next task `[~]` or to create a track.
- Given any mode, When the agent edits a file inside `measure/`, Then the call passes.
- Given a `[~]` task in the active plan, When the agent edits a file outside `measure/`, Then the call passes.
- Given mode `advise`, When the agent edits a file and no task has `[~]`, Then the call passes.

**Estimate:** M
**Priority:** Must

### Story S4: Projects with no measure folder
**As a** developer in a git repository that does not use Measure
**I want** the mod to ask me once if I want to set up Measure
**So that** the mod does not block work in a project with no plan

**Acceptance Criteria:**
- Given a git repository with no `measure/` folder, When the session starts, Then the band shows `[ Set up Measure ]` and `[ Turn off for session ]`.
- Given the user did not select a button and mode is `guard` or `strict`, When the agent edits a file, Then the mod denies the edit and tells the agent to ask the user the same question.
- Given the user selects `[ Set up Measure ]`, When the button runs, Then the mod sends a prompt to the agent to run the Measure `setup` workflow.
- Given the user selects `[ Turn off for session ]`, When the agent edits a file, Then the call passes for the rest of the session.
- Given a folder that is not in a git repository, When the session starts, Then the mod shows no band and denies no call.

**Estimate:** M
**Priority:** Must

### Story S5: Status and bypass commands
**As a** developer who uses Claude Code in a Measure project
**I want** the commands `/measure-status`, `/measure-off`, and `/measure-on`
**So that** I can see all tracks, bypass a guard that blocks valid work, and turn the guards on again

**Acceptance Criteria:**
- When the user runs `/measure-status`, Then a pane shows all tracks with their status, the phase and task progress of the active plan, and all `[b]` tasks.
- Given mode `guard`, When the user runs `/measure-off`, Then all guards allow all calls for the rest of the session, and the band shows that the guards are off.
- Given the user ran `/measure-off` in an earlier session, When a new session starts, Then the guards are on.
- Given the user runs `/measure-off repo`, When a new session starts in the same repository, Then the guards stay off, because the mod keeps the choice in `$.store`.
- Given the guards are off, When the user runs `/measure-on` or `/measure-on repo`, Then the guards are on again, and `/measure-on repo` removes the choice from `$.store`.

**Estimate:** M
**Priority:** Must

### Story S6: Closeout guard
**As a** developer who uses Claude Code in a Measure project
**I want** the mod to deny a track or phase closeout that skips open work
**So that** a track is done only when its plan is done

**Acceptance Criteria:**
- Given mode `guard` and a plan with an open task, When the agent changes the track line to `[x]` in `tracks.md`, Then the mod denies the edit and lists the open tasks.
- Given all tasks are `[x]` or `[b]` with `deferred:<owner>`, When the agent changes the track line to `[x]`, Then the edit passes, and the mod lists all `[b]` tasks to the agent.
- Given the heading of phase N has no `[checkpoint: <sha>]`, When the agent marks a task in phase N+1 `[~]`, Then the mod denies the edit.
- Given mode `advise`, When the agent closes a track with open tasks, Then the edit passes.

**Estimate:** M
**Priority:** Must

### Story S7: End-of-turn check
**As a** developer who uses Claude Code in a Measure project
**I want** the mod to check the plan state when a turn ends
**So that** the agent does not end a turn with a done task that has no SHA, or with changes that no task covers

**Acceptance Criteria:**
- Given a `[x]` task with no SHA, When the turn ends in mode `advise`, Then the band shows the problem.
- Given files changed in the git working tree during the turn and no `[~]` task, When the turn ends in mode `guard`, Then the band shows the problem, a toast appears, and the agent gets a reminder at the start of the next turn.
- Given a problem in mode `strict`, When the turn ends, Then `classic.Stop` returns `{ block: reason }` and the turn stays open.
- Given mode `strict` and the problem stays after 2 blocks, When the turn ends again, Then the mod lets the turn end and reports the problem.

**Estimate:** M
**Priority:** Should

### Story S8: TDD guard
**As a** developer who uses Claude Code in a Measure project
**I want** the mod to deny source edits until a failing test exists for the task
**So that** the agent does the Red phase before the Green phase

**Acceptance Criteria:**
- Given mode `strict` and a `[~]` task with no test file change and no failed test command, When the agent edits a source file, Then the mod denies the edit and tells the agent to write a failing test first.
- Given the agent edits `foo.test.ts`, `test_foo.py`, or `foo_test.go`, When the guard checks the path, Then the edit passes as a test file edit.
- Given a test file changed and a test command failed during the `[~]` task, When the agent edits a source file, Then the edit passes.
- Given the agent edits a Markdown or JSON file, When the guard checks the path, Then the edit passes, because only code files are source files.
- Given a different task changes to `[~]`, When the guard checks the next source edit, Then the Red state starts again from empty.

**Estimate:** L
**Priority:** Should

### Story S9: Commit guard
**As a** developer who uses Claude Code in a Measure project
**I want** the mod to check each `git commit`
**So that** every commit has the correct message format and belongs to a task

**Acceptance Criteria:**
- Given mode `strict`, When the agent runs `git commit -m "update stuff"`, Then the mod denies the call and shows the format `<type>(<scope>): <description>`.
- Given no `[~]` task and staged files outside `measure/`, When the agent runs `git commit` with a valid message, Then the mod denies the call.
- Given only staged files inside `measure/`, When the agent runs `git commit` with a valid message and no `[~]` task, Then the call passes.
- Given a commit for a `[~]` task succeeds, When the result returns, Then the agent gets a reminder to add the git note and to record the SHA in `plan.md`.

**Estimate:** M
**Priority:** Should

## Non-Functional Requirements

- **Fail open:** When the mod cannot parse a Measure file, the mod shows the error and allows all calls. A parse error never blocks work.
- **One next action:** Each deny text gives the agent one clear action, and names `/measure-off` as the bypass.
- **Real test data:** Parser tests use copies of this repository's `measure/` files as real data. Small fixture plans cover the edge cases.
- **Tech stack first:** `measure/tech-stack.md` declares the TypeScript mod and `claude plugin test` as a Tooling Exception before the first test commit.

## Acceptance Criteria (Track)

- `claude plugin validate mods/measure-guard` passes.
- `claude plugin test mods/measure-guard` passes, with tests for each story.
- `claude --plugin-dir ~/Desktop/measure/mods/measure-guard` loads the mod, and in this repository the band shows the active track.
- Each mode turns on only the features in the mode table.

## Out of Scope

- The fix for the `[ ]` regex mismatch in `measure/automation-supervisor.py`. This is a separate track, and the file is centrally managed.
- Detection of file writes through Bash (`sed -i`, `cat >`) in the edit guard. The end-of-turn check is the backstop.
- Distribution of the mod for Gemini CLI or Codex.
- Changes to the Measure skill reference files.
