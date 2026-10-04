# measure-guard

measure-guard is a Claude Code mod (a plugin of function hooks). It makes the agent follow the Measure workflow. The mod reads the Measure files of the project, tells the agent the active task, and stops work that the active plan does not cover.

Source of the design: [DESIGN.md](./DESIGN.md). Track: `measure/tracks/measure_guard_20261004/`.

## Load the mod

For one session:

```bash
claude --plugin-dir ~/Desktop/measure/mods/measure-guard
```

To set the mode, open `/config` and change the `measure-guard` row `Guard mode`. You can also set the value in `settings.json`:

```json
{ "pluginConfigs": { "measure-guard": { "options": { "mode": "strict" } } } }
```

## Modes

The `mode` option has the values `advise`, `guard`, and `strict`. The default is `guard`.

| Feature | advise | guard | strict |
| --- | --- | --- | --- |
| Rule section and task note | yes | yes | yes |
| Progress band | yes | yes | yes |
| Edit guard | no | yes | yes |
| No `measure/` folder prompt | band only | yes | yes |
| Commands | yes | yes | yes |
| Closeout guard | no | yes | yes |
| End-of-turn check | band only | band, toast, reminder | turn stays open (2 attempts) |
| TDD guard | no | no | yes |
| Commit guard | no | no | yes |

## Rule section and task note

The mod adds one fixed section to the system prompt, `measure-guard:rule`. The section tells the agent to follow the Task Workflow in `measure/workflow.md`. Its text never changes, so the prompt cache stays valid.

The active track and the current task change often, so the mod sends them as notes in the conversation:

- When the user submits a prompt, the mod adds a note (`additionalContext`) if the track or the task changed since the last note.
- When an `Edit`, `Write`, or `NotebookEdit` call in `measure/`, or a `Bash` call, changes the task, the note rides on that tool result.
- After a compaction, the next prompt gets the note again.

## Progress band

The band above the prompt shows the position in the active plan:

```text
Measure · <track> · Phase 2/4 · Task 3/7 [~] <task> · [b] 2 · 2 tracks in progress
```

- `Phase p/P` is the phase of the `[~]` task. If no task has `[~]`, it is the phase of the first open task, and the band adds `no task in progress`.
- `Task t/T` counts the top-level tasks in that phase.
- `[b] n` is the count of `[b]` tasks in the plan.
- `n tracks in progress` shows when 2 or more tracks have `[~]`.
- If the mod cannot read the Measure files, the band shows the error in yellow, and the guards allow all calls.

The band reads the plan again at each prompt and after each `Edit`, `Write`, or `NotebookEdit` call in `measure/` and each `Bash` call. An edit in an outside editor shows at the next prompt.

## Edit guard

In `guard` and `strict` mode, the mod denies an `Edit`, `Write`, or `NotebookEdit` call when all of these are true:

- The file is inside the project root and outside `measure/`.
- No track has `[~]`, or the active plan has no `[~]` task.

The deny text tells the agent the next action: mark the next task `[~]` (with the plan path and the task), or create a track. Edits inside `measure/` always pass, so the agent can always update the plan. Files outside the project root (for example a scratch folder) also pass. If the mod cannot read the Measure files, all edits pass.

Limit: the guard does not see file writes through `Bash` (`sed -i`, `cat >`). The end-of-turn check finds these changes.

## Projects with no measure/ folder

In a git repository with no `measure/` folder, the band asks a question with 2 buttons:

- `[ Set up Measure ]` sends a prompt to the agent to run the Measure `setup` workflow. The guards then allow all edits, so the setup can write its files.
- `[ Turn off for session ]` turns off the mod for the session, and the band hides.

Before the user answers, in `guard` and `strict` mode, the mod denies an edit inside the project and tells the agent to ask the user the same question. In `advise` mode, the band shows the question and the mod denies nothing.

Outside a git repository, the mod does nothing.

## Parse rules

- Status markers: `[ ]` pending, `[~]` in progress, `[x]` done, `[b]` blocked or human-gated. A `[b]` task is closed only when its line has a `deferred:<owner>` field.
- `measure/tracks.md` entries can have two formats:
  - `- [~] **Track: <name>**` with a next line `*Link: [./tracks/<id>/](./tracks/<id>/)*`
  - `- [x] [<name>](archive/<id>/index.md)`
- The active track is the first `[~]` track whose plan has a `[~]` task. If no plan has a `[~]` task, the active track is the first `[~]` track.
- In `plan.md`, a task is a checkbox line with no indent under a `## Phase ...` heading. Indented lines are sub-tasks. Checkbox lines in other `##` sections are not tasks.
- A completed task line ends with a 7-character SHA, with or without backticks.
- A phase is checkpointed when its heading has `[checkpoint: <sha>]`.
- The mod finds `tracks.md` through the **Tracks Registry** link in `measure/index.md`, and a plan through the plan link in the track's `index.md`. If a link is missing, the mod uses the default paths.
- If the mod cannot read the Measure files, it reports the error and the guards allow all calls.

## Development

```bash
claude plugin validate mods/measure-guard
claude plugin test mods/measure-guard
```

- The test environment has no file access. `test/world.ts` gives the mod a project folder in memory.
- `test/fixtures/real.ts` holds copies of this repository's Measure files. To refresh the copies, run `test/fixtures/sync-real.sh`.
- A function that uses `$` must be in `hooks/register.tsx`. The engine does not follow `$` across an import. `hooks/parse.ts` holds only pure functions.
