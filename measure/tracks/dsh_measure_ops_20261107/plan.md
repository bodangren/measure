# Implementation Plan: DSH Measure operator controls — effective mode and on-demand verification

Track: `dsh_measure_ops_20261107`
Spec: [./spec.md](./spec.md)

Every phase follows the Task Workflow in `measure/workflow.md`: contract first,
a failing test recorded in the git note, then the implementation, then docs,
then the deferred manual verification. A **Contract** task records the exact
interface, file locations, and edge cases here and in the module header; the
**Red** task adds the failing tests; the **Green** task implements them. Test
files are `plugins/dsh-measure-guard/tests/*.test.js`; the gate is
`node --test plugins/dsh-measure-guard/tests/*.test.js` plus both parity gates,
`bash tests/dsh/run.sh`, and `bash tests/spec_review_gate/run.sh`.

## Phase S1: The effective mode and the mode command

_Story ref: spec.md#story-s1_

- [x] Task 1.1: Contract: the effective-mode seam `0741326`
    - [ ] `src/state.js` already has `Repos.modeOf(root)`/`setMode(root, mode)` (both unused); add the session store: `Modes` with `get(root)`/`set(root, mode)`/`clear(root)` in memory, and the composer `effectiveMode(deps, root)` -> `{ value, source }` (repository > session > config)
    - [ ] `src/index.js`: `deps.modeOf = async root => effectiveMode(deps, root)`; `deps.configMode` keeps the profile value; every guard path (`guardContext`, `prepareDecision`, `onTurnStopping`, `context.js` note/reminder, `status.js`) awaits the seam per call instead of reading `deps.mode`
    - [ ] `src/commands.js` + `src/modes.js` (new): `measureModeCommand(deps)` with the exact texts — report `measure-guard: mode <value> (<source>).`; set `measure-guard: mode set to <value> (<scope>).`; clear `measure-guard: mode override cleared (<scope>); effective mode <value> (<source>).`; usage error `measure-guard: usage: /measure-mode [advise|guard|strict|default] [repo]`; scope token `repo` selects the persisted override, anything else is a usage error
    - [ ] `src/client-state.js`: the view gains `mode: { value, source }`; `client.js`: the band renders a localized `mode <value>` label; `src/status.js`: `statusText` appends `Mode: <value> (<source>)` after the guards line
- [x] Task 1.2: Red: failing tests for the effective mode and the command `0741326`
    - [ ] `tests/modes.test.js` (new): the precedence matrix (`config`/`session`/`repository`), clearing both scopes, `effectiveMode` with an unreadable repository store (fail open to config), and the exact command replies/usage errors
    - [ ] `tests/commands.test.js` (extended): `measure-mode` appears with a description and handler; `measure-status` and the tool text include the mode line
    - [ ] `tests/client-state.test.js` (extended): the view keys gain `mode`; the value/source match the seam
    - [ ] `tests/edit-guard.test.js` (extended): a session mode override of `strict` turns a source edit into the strict deny; `advise` allows it; the repository override wins over the session override
- [x] Task 1.3: Green: implement the seam, the command, the wiring, and the view; the suite passes `0741326`
- [x] Task 1.4: Docs: README "Modes" (precedence, `/measure-mode`, the route field) and `docs/dsh.md` `0741326`
- [ ] Task: Measure - User Manual Verification 'Phase S1: The effective mode and the mode command' (Protocol in workflow.md)

## Phase S2: On-demand verification

_Story ref: spec.md#story-s2_

- [~] Task 2.1: Contract: the verify command
    - [ ] `src/verify.js` (new): `verifyReport(deps, agent)` -> `{ text }` composing `shaProblems` (the end-of-turn texts) and `closeoutMetadataCheck` for the active track when its plan's `[x]` count disagrees with `metadata.json`; exact replies: clean `measure-guard: verification clean (<n> tasks checked).`; problems joined by `\n`; no project `measure-guard: nothing to verify (no measure/ folder).`; no active track `measure-guard: nothing to verify (no track in progress).`; an I/O or git failure `measure-guard: nothing to verify (<reason>).` (never throws)
    - [ ] `src/commands.js`: register `measure-verify` (read-only; no state, node, or plan writes)
- [ ] Task 2.2: Red: failing tests for the verify command
    - [ ] `tests/verify.test.js` (new): clean plan, fake SHA, missing note, metadata mismatch, no project, no active track, and a throwing git seam (fail-open reply)
    - [ ] `tests/commands.test.js` (extended): `measure-verify` is registered and its reply comes from `verifyReport`
- [ ] Task 2.3: Green: implement `src/verify.js` and register the command
- [ ] Task 2.4: Docs: README "Tools and commands" (`/measure-verify`, read-only, fail-open) and `docs/dsh.md`
- [ ] Task: Measure - User Manual Verification 'Phase S2: On-demand verification' (Protocol in workflow.md)

## Phase S3: Documentation, live check, and track closeout

_Story ref: spec.md#story-s3_

- [ ] Task 3.1: Docs: README, `docs/dsh.md`, and `CHANGELOG.md` name the effective mode, `/measure-mode`, and `/measure-verify` with their precedence and limits
- [ ] Task 3.2: Live check: install + reload; `/measure-mode strict` then a source-edit probe is denied with the strict TDD text; `/measure-mode default` restores `guard`; the state route shows the mode value/source; `/measure-verify` output recorded under `measure/runs/dsh_measure_ops_20261107/`
- [ ] Task 3.3: Closeout documents: `measure/lessons-learned.md`, `measure/tech-debt.md`, `metadata.json`, archive the track, update `measure/tracks.md`
- [ ] Task: Measure - User Manual Verification 'Phase S3: Documentation, live check, and track closeout' (Protocol in workflow.md)
