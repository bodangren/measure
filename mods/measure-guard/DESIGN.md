# measure-guard: Design Brief

Status: approved design, not yet built. Use this brief as the input for a Measure
`new-track` (spec and plan). Agreed on 2026-10-04.

## Goal

A Claude Code mod (a plugin of function hooks) that makes the agent follow the
Measure workflow. The mod reads the Measure files of the project and stops work
that does not follow the active plan.

## Modes

The mod has a `userConfig` field `mode` with the values `advise`, `guard`, and
`strict`. The default is `guard`.

| Feature | advise | guard | strict |
| --- | --- | --- | --- |
| 1. Context section in the system prompt | yes | yes | yes |
| 2. Progress band above the prompt | yes | yes | yes |
| 3. Edit guard | no | yes | yes |
| 4. TDD guard (Red before Green) | no | no | yes |
| 5. Commit guard | no | no | yes |
| 6. Closeout guard | no | yes | yes |
| 7. End-of-turn check | band only | band, toast, reminder | turn stays open until fixed (2 attempts) |
| 8. Commands | yes | yes | yes |

## Features

1. **Context section.** At `session.start`, find `measure/index.md`. Read the
   active track and the current task. On `prompt.compose`, add a section with the
   track, the task, and the rule "follow the Task Workflow in `measure/workflow.md`".
2. **Progress band.** `AbovePrompt` shows
   `Measure · <track> · Phase 2/4 · Task 3/7 [~] <task>` and the count of `[b]`
   tasks. It updates when `plan.md` or `tracks.md` changes.
3. **Edit guard.** On `tool.call` for `Edit`, `Write`, and `NotebookEdit`, deny an
   edit outside `measure/` when no task in the active plan has `[~]`. The deny text
   tells the agent to mark the next task `[~]` or to create a track. Edits inside
   `measure/` always pass.
4. **TDD guard.** For the `[~]` task, deny edits to source files until a test file
   changed and a test command failed. Find test files by name (`*.test.ts`,
   `test_*.py`, `*_test.go`, and similar).
5. **Commit guard.** On Bash `git commit`, check the message format
   `<type>(<scope>): <description>` and check that a task has `[~]`. After the
   commit, remind the agent to add the git note and to record the SHA in `plan.md`.
6. **Closeout guard.** Deny a change of a track to `[x]` in `tracks.md` while its
   `plan.md` has open tasks. Deny the start of a new phase when the previous phase
   heading has no `[checkpoint: <sha>]`.
7. **End-of-turn check.** At turn end, find a task with `[x]` and no commit SHA, and
   find changed files while no task has `[~]`. In `strict`, use `classic.Stop` with
   `{ block: reason }` to keep the turn open. Stop after 2 attempts and report.
8. **Commands.** `/measure-status` opens a pane with the tracks and the plan
   progress. `/measure-off` turns off the guards for the session.
   `/measure-off repo` turns off the guards for the repository and keeps the
   choice in `$.store`.

## Decisions

- **Status markers.** Accept `[ ]` (pending, open), `[~]` (in progress, open),
  `[x]` (done), and `[b]` (blocked or human-gated). A `[b]` task counts as closed
  only with a trailing `deferred:<owner>` field (anti-pattern A1). Keep `[b]`: it
  lets an unattended run continue past the human checkpoint. Show the `[b]` count
  in the band and in `/measure-status`. List all `[b]` tasks at closeout.
- **No `measure/` folder.** In a git repository with no `measure/` folder, show a
  band with two buttons: `[ Set up Measure ]` and `[ Turn off for session ]`. If
  the agent edits a file before the user chooses, the edit guard denies the edit and
  tells the agent to ask the user the same question. Outside a git repository, the
  mod does nothing.
- **`/measure-off` scope.** Session-only by default. `/measure-off repo` keeps the
  choice for the repository.
- **Default mode.** `guard`.

## Parse Rules

- `measure/tracks.md` has two entry formats. Accept both:
  - `- [~] **Track: <name>**` with a next line `*Link: [./tracks/<id>/](./tracks/<id>/)*`
  - `- [x] [<name>](archive/<id>/index.md)`
- The active track is the first track with `[~]`.
- In `plan.md`, count only task lines under `## Phase ...` headings. Other `##`
  sections (for example run records) contain checkbox lines that are not tasks.
- A completed task line ends with a 7-character SHA in backticks, for example
  `` `3d4ed7e` ``.

## Known Limits

- The edit guard does not see file writes through Bash (`sed -i`, `cat >`). A Bash
  pattern check is possible but incomplete.
- Name-based rules will block some valid work. `/measure-off` is the bypass.

## Finding (separate track)

The base skill uses `[ ]` for pending tasks, and active plans use it. The regex
`^- \[([~xb])\] (.+)` in `measure/automation-supervisor.py` ignores `[ ]` lines,
so the supervisor does not count those tasks as open. Fix this mismatch in a
separate track. Note: `AGENTS.md` says not to change `automation-supervisor.py`
in this repository, because the file is centrally managed.

## Build Notes

- Load the `plugin-authoring` skill before writing the hooks module. The skill
  writes this build's type file and gives the event names.
- Files: `.claude-plugin/plugin.json`, `hooks/hooks.json`
  (`{ "modules": ["./register.tsx"] }`), `hooks/register.tsx`, and
  `types/index.d.ts` for the `$.state` contract.
- Check: `claude plugin validate mods/measure-guard`.
- Test: `claude plugin test mods/measure-guard` with `*.test.ts` files. Use this
  repository's `measure/` folder as real test data.
- Live load: `claude --plugin-dir ~/Desktop/measure/mods/measure-guard`.
