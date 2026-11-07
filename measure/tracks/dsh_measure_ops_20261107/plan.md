# Implementation Plan: DSH Measure operator controls — effective mode and on-demand verification

Track: `dsh_measure_ops_20261107`
Spec: [./spec.md](./spec.md)

Every phase follows the Task Workflow in `measure/workflow.md`: contract first,
a failing test recorded in the git note, then the implementation, then docs,
then the deferred manual verification. A **Contract** task records the exact
interface, file locations, and edge cases here and in the module header; the
**Red** task adds the failing tests; the **Green** task implements them. Test
files are `plugins/dsh-measure-guard/tests/*.test.js`; the gate is
`node --test plugins/dsh-measure-guard/tests/*.test.js` plus
`plugins/dsh-measure-guard/scripts/check-parity.sh` and
`plugins/opencode-measure-guard/scripts/check-parity.sh`,
`bash tests/dsh/run.sh`, and `bash tests/spec_review_gate/run.sh`.

## Phase S1: The effective mode and the mode command [checkpoint: 2d54132]

_Story ref: spec.md#story-s1_

- [x] Task 1.1: Contract: the effective-mode seam `0741326`
    - [ ] `src/modes.js` (new) holds everything: `SessionModes` (in-memory `get(root)`/`set(root, mode)`/`clear(root)`; an unknown mode throws a TypeError) and `effectiveMode(deps, root)` -> `{ value, source }` (repository via `deps.state.repos.modeOf`, then the session store, then `deps.configMode`). `src/state.js` keeps its existing `Repos.modeOf`/`setMode`; no new store is added there
    - [ ] `src/index.js`: `deps.modeOf = root => effectiveMode(deps, root)`, `deps.sessionModes = new SessionModes()`, `deps.configMode` keeps the profile value; `deps.mode` is **kept** as the config-value fallback for tests/embedders but no production path reads it. Every consumer awaits the seam per call: `guardContext` (so `tddGuardFor`, `commitGuardFor`, and `shellGuardFor` inherit it), `prepareDecision` (the advise gate), `onTurnStopping` (the strict hold), `context.js` (task note + reminder), `strict.js` `recordRed`, `status.js`, and `commands.js`
    - [ ] `src/modes.js`: `measureModeCommand(deps)`, registered from `src/commands.js`, with the exact texts — report `measure-guard: mode <value> (<source>).`; set `measure-guard: mode set to <requested> (<scope>); effective mode <value> (<source>).`; clear `measure-guard: mode override cleared (<scope>); effective mode <value> (<source>).`; usage `measure-guard: usage: /measure-mode [advise|guard|strict|default] [repo]`. `<scope>` is exactly `session` or `repository`; the scope token is `repo`; a third token, an unknown scope token, or an unknown mode produces the usage text and changes nothing. The set reply always carries the effective mode, so a set shadowed by a repository override is visible
    - [ ] `src/client-state.js`: `clientView` keeps its synchronous signature and accepts `mode` as either the seam's `{ value, source }` object or a legacy mode string (normalised to `{ value, source: 'config' }`); `clientStateResponse` awaits `deps.modeOf(root)` (fallback `{ value: deps.configMode ?? deps.mode ?? 'guard', source: 'config' }`) and the view gains `mode`; `registerClientState` receives a `modeOf` function, not the static string. `client.js`: the band renders `Mode: <value> (<source>)` with a localized label (en/zh). `src/status.js`: `statusText` appends `Mode: <value> (<source>)` after the guards line. `SessionModes` is deliberately separate from `Bypass`: Bypass's value domain is `'repo'|'session'|null`, its persistence key is `off`, and its precedence merges the repository bypass — only the plain Map primitive overlaps (CONTEST F13)
- [x] Task 1.2: Red: failing tests for the effective mode and the command `0741326`
    - [ ] `tests/modes.test.js` (new): the precedence matrix (`config`/`session`/`repository`), clearing both scopes, `effectiveMode` with an unreadable repository store (fail open to config), and the exact command replies/usage errors
    - [ ] `tests/commands.test.js` (extended): `measure-mode` appears with a description and handler; `measure-status` and the tool text include the mode line
    - [ ] `tests/client-state.test.js` (extended): the view keys gain `mode`; the value/source match the seam; a legacy `mode: 'guard'` renders `{ value: 'guard', source: 'config' }`
    - [ ] `tests/client-bundle.test.js` (extended): both dictionaries carry the `mode` label and the band renders `view.mode.value`/`view.mode.source`
    - [ ] `tests/context.test.js` and `tests/end-of-turn.test.js` (extended): with `deps.modeOf` returning `strict` while `deps.mode` is `guard`, the task note says `(Mode: strict)` and the end-of-turn reminder is armed at the block limit
    - [ ] `tests/edit-guard.test.js` (extended): a session mode override of `strict` turns a source edit into the strict deny; `advise` allows it; the repository override wins over the session override
- [x] Task 1.3: Green: implement the seam, the command, the wiring, and the view; the suite passes `0741326`
- [x] Task 1.4: Docs: README "Modes" (precedence, `/measure-mode`, the route field) and `docs/dsh.md` `0741326`
- [x] Task: Measure - User Manual Verification 'Phase S1: The effective mode and the mode command' (Protocol in workflow.md) `2d54132`

## Phase S2: On-demand verification [checkpoint: 9d41923]

_Story ref: spec.md#story-s2_

- [x] Task 2.1: Contract: the verify command `a20077d`
    - [ ] `src/verify.js` (new): `verifyReport(deps, agent)` returns a **string**. It refreshes the snapshot (`deps.refreshSnapshot` when present, else `invalidate` + `get`), probes git availability once (`rev-parse --verify --quiet HEAD^{commit}`: `error` -> `measure-guard: nothing to verify (git could not answer).`; `missing` -> `measure-guard: nothing to verify (not a git work tree).`), then composes `shaProblems` and a metadata verdict read directly from `<plan dir>/metadata.json` (no `closeoutMetadataCheck` and no `ClosingTrack`): `actual_tasks` that is a number and differs from the `[x]` count -> the closeout mismatch text with both numbers; a missing file -> no verdict (clean in-progress); malformed JSON -> the path text. Exact replies: clean `measure-guard: verification clean (<n> tasks checked).` with `<n>` = `[x]` tasks that carry a SHA; problems joined by `\n`; no project `measure-guard: nothing to verify (no measure/ folder).`; no active track `measure-guard: nothing to verify (no track in progress).`; any other failure `measure-guard: nothing to verify (<reason>).` (never throws)
    - [ ] `src/commands.js`: register `measure-verify`; its handler wraps the report string as `{ kind: 'success', text }` and performs no state, node, plan, repository, or metadata write
- [x] Task 2.2: Red: failing tests for the verify command `a20077d`
    - [ ] `tests/verify.test.js` (new): clean plan (count = `[x]`+SHA tasks), fake SHA, missing note, metadata mismatch, `actual_tasks: null` on an open track (clean), missing metadata file (clean), malformed metadata, no project, no active track, a non-work-tree, a git `error`, a throwing git seam, snapshot refresh, and the read-only case
    - [ ] `tests/commands.test.js` (extended): `measure-verify` is registered and its reply comes from `verifyReport`
    - [ ] `tests/verify.test.js` (read-only case): a write spy on the io and the repository state stays untouched and the metadata file content is unchanged after the report
- [x] Task 2.3: Green: implement `src/verify.js` and register the command `a20077d`
- [x] Task 2.4: Docs: README "Tools and commands" (`/measure-verify`, read-only, fail-open) and `docs/dsh.md` `a20077d`
- [x] Task: Measure - User Manual Verification 'Phase S2: On-demand verification' (Protocol in workflow.md) `9d41923`

## Phase S3: Documentation, live check, and track closeout

_Story ref: spec.md#story-s3_

- [~] Task 3.1: Docs: README, `docs/dsh.md`, and `CHANGELOG.md` name the effective mode, `/measure-mode`, and `/measure-verify` with their precedence and limits
- [ ] Task 3.2: Live check: install + reload; `/measure-mode strict` then a source-edit probe is denied with the strict TDD text; `/measure-mode default` restores `guard`; the state route shows the mode value/source; `/measure-verify` output recorded under `measure/runs/dsh_measure_ops_20261107/`
- [ ] Task 3.3: Closeout documents: `measure/lessons-learned.md`, `measure/tech-debt.md`, `metadata.json`, archive the track, update `measure/tracks.md`
- [ ] Task: Measure - User Manual Verification 'Phase S3: Documentation, live check, and track closeout' (Protocol in workflow.md)
