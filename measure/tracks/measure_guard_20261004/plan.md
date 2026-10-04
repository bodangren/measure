# Implementation Plan: measure-guard Mod

> Source: `spec.md` (story-shaped). Design brief: `mods/measure-guard/DESIGN.md`.
> Red evidence: each Test task runs `claude plugin test mods/measure-guard`, and the git note of the commit records the failure output.
> Plugin names: Task 1.2 confirms the event and API names in the `plugin-authoring` skill. If a name is different, use the skill's name and record the difference in the git note.

## Phase S1: Plan context for the agent [checkpoint: ea3ed16]
_Story ref: spec.md#story-s1_

- [x] Task 1.1: Declare the mod in the tech stack (before any test) `b3f3056`
    - [x] Add a Tooling Exceptions row to `measure/tech-stack.md` for `measure_guard_20261004`: TypeScript mod, `claude plugin test` (`*.test.ts`), `claude plugin validate`
    - [x] Add a Distribution Formats row for `mods/measure-guard/` (Claude Code mod, loaded with `--plugin-dir`)
    - [x] Add the mod to the Distribution list in `measure/product.md`
- [x] Task 1.2: Scaffold the mod `539e99d`
    - [x] Load the `plugin-authoring` skill. Confirm `session.start`, `prompt.compose`, `tool.call`, the tool-result event, `AbovePrompt`, `classic.Stop`, `$.state`, `$.store`, toast, pane, and command registration
    - [x] Confirm that `register.tsx` can import a sibling module. If not, keep all functions in `register.tsx`
    - [x] Create `.claude-plugin/plugin.json` with the `userConfig` field `mode` (`advise | guard | strict`, default `guard`)
    - [x] Create `hooks/hooks.json` (`{ "modules": ["./register.tsx"] }`) and an empty `hooks/register.tsx`
    - [x] Run `claude plugin validate mods/measure-guard`
- [x] Task 1.3: Contract — parser and state types `1d265a8`
    - [x] Lock the S1 acceptance criteria in the task note
    - [x] In `types/index.d.ts`, define `Marker`, `Task`, `Phase`, `Plan`, `TrackEntry`, and the `$.state` fields `root`, `mode`, `active`, `inProgressCount`, `parseError`
    - [x] Declare `parseTracks`, `parsePlan`, `selectActive`, `isClosed`, and `contextSection` in `hooks/parse.ts`
    - [x] `selectActive` rule: the first `[~]` track whose plan has a `[~]` task, else the first `[~]` track
- [x] Task 1.4: Test (Red) — parser, rule section, and task note `7f6cdec`
    - [x] Update the contract for the design change (2026-10-04, prompt cache): a fixed `ruleSection`, `noteKey` and `taskNote` in place of `contextSection`, and the `$.state` field `notedKey`
    - [x] Generate `test/fixtures/real.ts` from this repository's `measure/` files with `test/fixtures/sync-real.sh` (the test environment has no file access, so fixtures are `.ts` modules; this replaces the live smoke test)
    - [x] Add small fixture plans: `[b]` with and without `deferred:<owner>`, SHA with and without backticks, indented sub-tasks, `[checkpoint: <sha>]` headings
    - [x] Add a fixture `tracks.md` with 2 `[~]` tracks, where only the second plan has a `[~]` task
    - [x] Write tests for both `tracks.md` formats, active-track selection (one `[~]` track, 2 `[~]` tracks, no `[~]` task in any plan), phase-only counting, the `[b]` rule, SHA parse, and default mode
    - [x] Write tests: the rule section text is the same for 2 different tasks; a note at prompt submit when the task changed, and no note when it did not; a note in the tool result when an edit changes the task; a note again after a compaction
    - [x] Run `claude plugin test mods/measure-guard` and record the failure
- [x] Task 1.5: Implement (Green) — parser, session start, rule section, task note `4f02889`
    - [x] Implement the functions in `hooks/parse.ts`
    - [x] On `session.start`, find `measure/index.md`, resolve the Tracks Registry through the index (default paths as fallback), parse, and keep the result in `$.state`
    - [x] On `prompt.compose`, add the fixed rule section
    - [x] On `classic.UserPromptSubmit`, add the task note as `additionalContext` when `noteKey` differs from `notedKey`
    - [x] After an `Edit`, `Write`, or `NotebookEdit` call on a Measure file, read the files again and add the task note to the result `context` when the key changed
    - [x] After `session.compact`, clear `notedKey`
    - [x] Run the tests to Green
- [x] Task 1.6: Validate & Docs `80bd0a2`
    - [x] Run `claude plugin validate` and the full test suite
    - [x] Create `mods/measure-guard/README.md` with the mode table, the live-load command, the parse rules, and the prompt-cache design
- [b] Task: Measure - User Manual Verification 'Phase S1: Plan context for the agent' (Protocol in workflow.md) deferred:user

## Phase S2: Progress band above the prompt [checkpoint: 7dd90c1]
_Story ref: spec.md#story-s2_

- [x] Task 2.1: Contract — band model `1b61020`
    - [x] Lock the S2 acceptance criteria
    - [x] Declare `bandText(state)`. The current phase is the phase with the `[~]` task, else the first phase with an open task. `Task t/T` counts top-level tasks in the current phase
    - [x] Define the band text for a parse error, for an active track with no `[~]` task, and for the warning when 2 or more tracks have `[~]`
- [x] Task 2.2: Test (Red) — band `878739b`
    - [x] Write tests for mid-plan text, the `[b]` count, the 2-or-more `[~]` tracks warning, no `[~]` task, all tasks done, and a parse error
    - [x] Write a test that a change to `plan.md` or `tracks.md` updates `$.state`
    - [x] Run the tests and record the failure
- [x] Task 2.3: Implement (Green) — band `76c78a7`
    - [x] Render `bandText` in `AbovePrompt`
    - [x] Parse again when `plan.md` or `tracks.md` changes (use the trigger from the `plugin-authoring` skill)
    - [x] On a parse error, show the error and set `parseError`, so that all guards fail open
- [x] Task 2.4: Validate & Docs `3b5232d`
    - [x] Run validate and the full test suite
    - [x] Add the band section to the README
- [b] Task: Measure - User Manual Verification 'Phase S2: Progress band above the prompt' (Protocol in workflow.md) deferred:user

## Phase S3: Edit guard [checkpoint: b4fddf2]
_Story ref: spec.md#story-s3_

- [x] Task 3.1: Contract — edit decision `d2eabf9`
    - [x] Lock the S3 acceptance criteria
    - [x] Declare `editDecision(state, path)`, which returns allow or deny with text. Paths resolve relative to the project root
    - [x] Write the deny text: one next action (mark the next task `[~]`, or create a track) and `/measure-off` as the bypass
- [x] Task 3.2: Test (Red) — edit guard `9574e90`
    - [x] Write tests: deny outside `measure/` with no `[~]` task, deny with no active track, allow inside `measure/`, allow with a `[~]` task, allow in `advise`, allow on `parseError`
    - [x] Run the tests and record the failure
- [x] Task 3.3: Implement (Green) — edit guard `efeace3`
    - [x] Hook `tool.call` for `Edit`, `Write`, and `NotebookEdit`, and apply `editDecision`
    - [x] Run the tests to Green
- [x] Task 3.4: Validate & Docs `b47f8b5`
    - [x] Run validate and the full test suite
    - [x] Add the edit guard section and the Bash limit to the README
- [b] Task: Measure - User Manual Verification 'Phase S3: Edit guard' (Protocol in workflow.md) deferred:user

## Phase S4: Projects with no measure folder
_Story ref: spec.md#story-s4_

- [~] Task 4.1: Contract — setup prompt state
    - [ ] Lock the S4 acceptance criteria
    - [ ] Add `$.state.setupChoice` (`pending | off | setup`) and the git-repository check (`git rev-parse --show-toplevel`)
    - [ ] Write the deny text that tells the agent to ask the user the same question
- [ ] Task 4.2: Test (Red) — no measure folder
    - [ ] Write tests: band with 2 buttons, deny before a choice in `guard`, no deny in `advise`, pass after `[ Turn off for session ]`, prompt sent after `[ Set up Measure ]`, no band outside git
    - [ ] Run the tests and record the failure
- [ ] Task 4.3: Implement (Green) — no measure folder
    - [ ] Detect the git repository and the missing folder at `session.start`
    - [ ] Add the 2 band buttons. `[ Set up Measure ]` sends a prompt to run the Measure `setup` workflow
    - [ ] Add the `pending` branch to `editDecision`
- [ ] Task 4.4: Validate & Docs
    - [ ] Run validate and the full test suite
    - [ ] Add the no-folder section to the README
- [ ] Task: Measure - User Manual Verification 'Phase S4: Projects with no measure folder' (Protocol in workflow.md)

## Phase S5: Status and bypass commands
_Story ref: spec.md#story-s5_

- [ ] Task 5.1: Contract — commands and bypass state
    - [ ] Lock the S5 acceptance criteria
    - [ ] Add `$.state.guardsOff` (`null | session | repo`) and a `$.store` key for each repository root
    - [ ] Declare `/measure-status`, `/measure-off [repo]`, `/measure-on [repo]`, and `statusPane(state)`
- [ ] Task 5.2: Test (Red) — commands
    - [ ] Write tests: session off, a new session turns the guards on, `repo` off stays off in a new session, `/measure-on` turns the guards on, `/measure-on repo` clears the store, pane content (tracks, progress, `[b]` list)
    - [ ] Run the tests and record the failure
- [ ] Task 5.3: Implement (Green) — commands
    - [ ] Register the 3 commands and the status pane
    - [ ] Make every guard check `guardsOff` first. Show "guards off" in the band
- [ ] Task 5.4: Validate & Docs
    - [ ] Run validate and the full test suite
    - [ ] Add the commands section to the README
- [ ] Task: Measure - User Manual Verification 'Phase S5: Status and bypass commands' (Protocol in workflow.md)

## Phase S6: Closeout guard
_Story ref: spec.md#story-s6_

- [ ] Task 6.1: Contract — closeout decision
    - [ ] Lock the S6 acceptance criteria
    - [ ] Declare `applyEdit(toolInput, currentText)`, which gives the new file text for `Edit` and `Write`
    - [ ] Declare `closeoutDecision(state, path, before, after)` for `tracks.md` (a track changes to `[x]`) and `plan.md` (a task in phase N+1 changes to `[~]`)
- [ ] Task 6.2: Test (Red) — closeout guard
    - [ ] Write tests: deny `[x]` with open tasks (the text lists them), allow with `[b]` + `deferred:<owner>` (the text lists the `[b]` tasks), deny `[b]` with no owner, deny a phase start with no checkpoint, allow in `advise`, a `Write` that replaces the full file
    - [ ] Run the tests and record the failure
- [ ] Task 6.3: Implement (Green) — closeout guard
    - [ ] Hook edits to `tracks.md` and to each linked `plan.md`. Find the plan of the closed track through its link (the closed track can be different from the active track)
    - [ ] Send the `[b]` list to the agent through the channel from the `plugin-authoring` skill
- [ ] Task 6.4: Validate & Docs
    - [ ] Run validate and the full test suite
    - [ ] Add the closeout section to the README
- [ ] Task: Measure - User Manual Verification 'Phase S6: Closeout guard' (Protocol in workflow.md)

## Phase S7: End-of-turn check
_Story ref: spec.md#story-s7_

- [ ] Task 7.1: Contract — turn problems
    - [ ] Lock the S7 acceptance criteria
    - [ ] Declare `turnProblems(state, changedFiles)` for 2 problems: a `[x]` task with no SHA, and changed files outside `measure/` with no `[~]` task
    - [ ] Add `$.state.turn` (the `git status --porcelain` snapshot at turn start, and the strict block count, max 2)
- [ ] Task 7.2: Test (Red) — end-of-turn check
    - [ ] Write tests: each problem, changes inside `measure/` only, files that were dirty before the turn, `advise` (band), `guard` (band, toast, reminder), `strict` (block, block, then end the turn and report)
    - [ ] Run the tests and record the failure
- [ ] Task 7.3: Implement (Green) — end-of-turn check
    - [ ] Take the snapshot at turn start. Compare it at `classic.Stop`
    - [ ] Add the mode branches. In `strict`, return `{ block: reason }`. Set the block count to 0 on a new user prompt
- [ ] Task 7.4: Validate & Docs
    - [ ] Run validate and the full test suite
    - [ ] Add the end-of-turn section to the README
- [ ] Task: Measure - User Manual Verification 'Phase S7: End-of-turn check' (Protocol in workflow.md)

## Phase S8: TDD guard
_Story ref: spec.md#story-s8_

- [ ] Task 8.1: Contract — Red state
    - [ ] Lock the S8 acceptance criteria
    - [ ] Declare `isTestFile` (`*.test.ts(x)`, `*.spec.ts(x)`, `*.test.js`, `test_*.py`, `*_test.py`, `*_test.go`, and similar), `isSourceFile` (code extensions only), and `isTestCommand` (`npm test`, `vitest`, `jest`, `pytest`, `go test`, `cargo test`, `claude plugin test`, `test-*.sh`)
    - [ ] Add `$.state.red` (`taskId`, `testChanged`, `testFailed`)
- [ ] Task 8.2: Test (Red) — TDD guard
    - [ ] Write tests: deny a source edit before Red, allow a test file edit, allow after a test change and a failed test command, allow Markdown and JSON, reset on a task change, no check in `guard`
    - [ ] Run the tests and record the failure
- [ ] Task 8.3: Implement (Green) — TDD guard
    - [ ] Record test file edits from `tool.call`. Record failed test commands from the Bash tool result (exit code other than 0)
    - [ ] Reset `red` when the `[~]` task changes. Add the strict branch to `editDecision`
- [ ] Task 8.4: Validate & Docs
    - [ ] Run validate and the full test suite
    - [ ] Add the TDD guard section and the name-based limits to the README
- [ ] Task: Measure - User Manual Verification 'Phase S8: TDD guard' (Protocol in workflow.md)

## Phase S9: Commit guard
_Story ref: spec.md#story-s9_

- [ ] Task 9.1: Contract — commit decision
    - [ ] Lock the S9 acceptance criteria
    - [ ] Declare `parseCommitCommand(cmd)` for `-m "..."`, `-m '...'`, a heredoc `$(cat <<'EOF' ...)`, `-F <file>`, and `-a`
    - [ ] Declare `commitDecision(state, message, stagedFiles)` with the format `^[a-z]+\([^)]+\): .+`
- [ ] Task 9.2: Test (Red) — commit guard
    - [ ] Write tests: bad format denied, no `[~]` with files outside `measure/` denied, `measure/`-only commit allowed, reminder after a successful commit, a message the guard cannot parse is allowed with a note, no check in `guard`
    - [ ] Run the tests and record the failure
- [ ] Task 9.3: Implement (Green) — commit guard
    - [ ] Hook `tool.call` for Bash `git commit`. Get the staged files with `git diff --cached --name-only` (and the tracked changed files for `-a`)
    - [ ] Send the git-note and SHA reminder after a successful commit
- [ ] Task 9.4: Validate & Docs
    - [ ] Run validate and the full test suite
    - [ ] Add the commit guard section to the README
    - [ ] Do a live load in this repository with `claude --plugin-dir ~/Desktop/measure/mods/measure-guard` for the track acceptance criteria
- [ ] Task: Measure - User Manual Verification 'Phase S9: Commit guard' (Protocol in workflow.md)
