# Implementation Plan: DSH Measure evolution — strict guards, session-accurate writers, goal binding, and the setup button

Track: `dsh_measure_evolve_20261107`
Spec: [./spec.md](./spec.md)

Every phase follows the Task Workflow in `measure/workflow.md`: contract first, a
failing test recorded in the git note, then the implementation, then docs, then
the deferred manual verification. Test files are
`plugins/dsh-measure-guard/tests/*.test.js`; the gate is
`node --test plugins/dsh-measure-guard/tests/*.test.js` plus
`bash plugins/dsh-measure-guard/scripts/check-parity.sh`, and the environment
CLI contract is `bash tests/dsh/run.sh`.

## Phase S1: Strict TDD guard (Red before Green) [checkpoint: a8ce9c3]

_Story ref: spec.md#story-s1_

- [x] Task 1.1: Contract: the Red-phase seam `1baeb84`
    - [ ] `src/strict.js` (new): `redOf(state, agentId)`, `noteRedEdit(state, agentId, snapshot, paths)` (a successful test-file write sets `testChanged`), `noteRedFailure(state, agentId, snapshot, command)` (a failed test command sets `testFailed`), `strictRed(state, agentId, snapshot)` returning `redFor(...)`; re-export `taskKey`, `redFor`, `tddDecision`, `isSourceFile`, `isTestFile`, `isTestCommand` from `./core/guards.ts` so the adapter has one import surface
    - [ ] Contract note in the module header: the `tools/result` shapes used — `exec.name`, `exec.arguments.command`, `result.isError`, and `result.value.exitCode` for `bash` (a non-zero exit is a *successful* result with `value.exitCode !== 0`; a failed result carries no `value`); a successful `edit`/`write` is `result.isError === false`
- [x] Task 1.2: Red: failing tests for the strict TDD guard `1baeb84`
    - [ ] `tests/tdd.test.js`: a source edit before any Red is denied with the core's `tddDecision` text (test fails: guard not wired); a test-file edit followed by a failed test command allows the source edit; a new `[~]` task resets the Red record; `advise`/`guard` modes stay inert; a bypass stays inert; the parity check still passes
- [x] Task 1.3: Green: wire the strict TDD guard `1baeb84`
    - [ ] `src/guard.js`: in `prepareDecision()` (after the closeout guard), run `tddGuardFor` -> `tddDecision(context, red, path)` for file mutations when the mode is `strict`
    - [ ] `src/index.js` + `src/hooks.js`: a `tools/result` observer that calls `noteRedEdit` for a successful `edit`/`write` of a test file and `noteRedFailure` for a failed `bash` command whose command matches `isTestCommand`
- [x] Task 1.4: Docs: README "Modes" and "Guards" sections name the strict TDD guard `1baeb84`, with the deny example and the known limit that shell-redirect test edits are invisible; `CHANGELOG.md` Unreleased entry
- [x] Task: Measure - User Manual Verification 'Phase S1: Strict TDD guard (Red before Green)' (Protocol in workflow.md) `a8ce9c3`

## Phase S2: Strict commit guard and commit reminder [checkpoint: 67d29f1]

_Story ref: spec.md#story-s2_

- [x] Task 2.1: Contract: the commit seam `579335a`
    - [ ] `src/commit.js` (new): `stagedFiles(deps, root, takesChanges)` (`deps.io.gitLines(['diff','--cached','--name-only'], root)`, plus the changed and untracked paths when `takesChanges`), `commitShaOf(text)` (`/^\[[^\]\n]* ([0-9a-f]{7,40})\]/m`), and `commitCheck(deps, context, command)` returning `{ decision: { deny } | null, note: string | null, commitDue: boolean }` where `commitDue` is true exactly when the commit is allowed, the guards are on (`context.guardsOff === null`), and the active plan has a `[~]` task (`taskKey(context.snapshot) !== null`) — any other case is false; re-export `parseCommitCommand`, `commitDecision`, `commitReminder`
- [x] Task 2.2: Red: failing tests for the strict commit guard `579335a`
    - [ ] `tests/commit.test.js`: a bad message is denied with the core text; an unparseable message is allowed with a note; a no-task commit staging a file outside `measure/` is denied and names the file; a no-task commit staging only `measure/` files is allowed; a successful commit for a `[~]` task appends `commitReminder` with the short SHA; `advise`/`guard` stay inert; `-a`/`git add` before the commit adds changed and untracked paths
- [x] Task 2.3: Green: wire the strict commit guard `579335a`
    - [ ] `src/guard.js` `prepareDecision`: for a `bash` mutation in `strict` mode call `commitCheck` (staged paths through `deps.gitLines`), and return the deny; when `commitDue` is true record the token in a `commitDue` Set in `index.js`
    - [ ] `src/hooks.js` + `src/index.js`: a dedicated `tools/post-execute` listener keyed by the `commitDue` token reads the result text (`commitShaOf`), appends `commitReminder(sha)` to the content, and drops the token; `tools/result` also clears it. (The existing note map cannot carry the reminder: it is prepared before the call, and the SHA exists only in the result.)
- [x] Task 2.4: Docs: README "Guards" section (commit format, no-task rule, reminder) `579335a`; `CHANGELOG.md` entry
- [x] Task: Measure - User Manual Verification 'Phase S2: Strict commit guard and commit reminder' (Protocol in workflow.md) `67d29f1`

## Phase S3: Session-accurate writer detection [checkpoint: de737ed]

_Story ref: spec.md#story-s3_

- [x] Task 3.1: Contract: the writer seam `6d54eca`
    - [ ] `src/roots.js`: `claim(agentId, root, isRoot = true)` documents and enforces root-only claims; `countOf(root)` counts root claims only; the second-writer warning text keeps the shared wording
    - [ ] `src/context.js` `attachAgent`: pass `deps.isRoot(agent)` as the third `claim` argument, so the one call site that claims is the attach seam; `src/index.js` computes `isRoot` from `ctx.agents.roots()` (a `deps.isRoot(agent)` seam that treats every agent as a root when `roots()` is absent or throws — the pre-fix behavior, kept for a host that lacks the method)
- [x] Task 3.2: Red: failing tests for session-accurate writers `6d54eca`
    - [ ] `tests/roots.test.js`: a child agent does not claim; two roots warn exactly once with count 2; releasing the first root lets a later root claim; `countOf` counts roots only
    - [ ] `tests/plugin.test.js`: attach a root and its child in the fixture context; assert the child gets the rule section and guards but no second-writer note, and the band count stays 1
- [x] Task 3.3: Green: implement the root-only claim `6d54eca`; the band `sessionCount` and the HTTP view read the root count; a missing `ctx.agents` keeps today's behavior (treat every agent as a root)
- [x] Task 3.4: Docs: README "State and root resolution" `6d54eca` and "Known limits" name the root-session rule; `measure/tech-debt.md` row resolved later in S6
- [x] Task: Measure - User Manual Verification 'Phase S3: Session-accurate writer detection' (Protocol in workflow.md) `de737ed`

## Phase S4: Goal binding [checkpoint: 3b96632]

_Story ref: spec.md#story-s4_

- [x] Task 4.1: Contract: the goal seam `32b7b8c`
    - [ ] `src/goal.js` (new): `goalService(ctx)` = `ctx.get('goals')` (undefined -> no goal features), `goalOf(deps, agent)` (wraps `goalService().get(agent)`, fails open to `null`), `goalSummary(goal)` = `{ objective, phase, round: goal.roundsStarted, maxRounds: goal.maxGoalRounds }` (the DSH `GoalView` names the cap `maxGoalRounds`, so the mapping is explicit; this is the state-route field), `goalLine(goal)` (English status text: `<phase> · round <n>/<max> · <objective>`), `goalProblems(goal, snapshot)` (a `complete` goal while a task is `[~]`; a current goal in phase `active`, `paused`, or `blocked` while the registry has tracks and no task is `[~]` — a `complete` goal with no open task is the normal end state and is never reported), and `measureGoalCommand(deps)`
    - [ ] Exact reply texts: created `measure-guard: created the goal "<objective>" (round 0/<max>).`; existing `measure-guard: the goal "<objective>" is <phase> (round <n>/<max>); <guidance>.` with the guidance exactly `use the goal controls to edit or clear it.` for `active`, `resume or clear it first.` for `paused`, and `clear it before creating another goal.` for `blocked`; no track `measure-guard: no Measure track is in progress, so there is no track to seed a goal from.`; no goal service `measure-guard: this DeepSeek Harness has no goal service.`; refusal `measure-guard: the goal service refused: <message>.`
    - [ ] Seed objective exact text: `Measure track "<track name>" (<track id>).`; the command creates only when there is no goal (or the goal phase is `complete`, which the goal service allows replacing), and reports without mutating for `active`/`paused`/`blocked`
- [x] Task 4.2: Red: failing tests for goal binding `32b7b8c`
    - [ ] `tests/goal.test.js`: `/measure-goal` creates the exact objective when there is no goal; reports without mutating for `active`, `paused`, and `blocked`; replaces a `complete` goal; replies the no-track text with no goal; replies the no-service text when `ctx.get('goals')` is undefined; `goalProblems` flags a complete goal with a `[~]` task and any current goal with no `[~]` track; the status text carries the goal line
    - [ ] `tests/client-state.test.js` (existing): the view keys gain `goal` and `setup`; the goal summary matches `{ objective, phase, round, maxRounds }`; the band suffix still uses root sessions
- [x] Task 4.3: Green: wire goal binding `32b7b8c`
    - [ ] `src/index.js`: read the goal service per call as an optional capability with `ctx.get('goals')` behind a `deps.goals` getter (`Object.defineProperty`; never add it to `inject`: a required entry would leave the plugin fiber inactive on a build without goals). A value captured at apply time is wrong: Cordis does not order a service that is not injected, so a later registration must still be seen; `tests/plugin.test.js` covers the later-registration case
    - [ ] `src/commands.js`: register `measure-goal`
    - [ ] `src/status.js`, `src/client-state.js`, `client.js`: the goal line in the status text and panel, the `goal` field in the state route, the localized goal row in the band; update `tests/client-state.test.js` for the new view keys
    - [ ] `src/guard.js` (end-of-turn): append the two `goalProblems` to the turn problems
- [x] Task 4.4: Docs: README "Context"/"Tools and commands" `32b7b8c` (goal line, `/measure-goal`), `docs/dsh.md` (goal section), `CHANGELOG.md` entry
- [x] Task: Measure - User Manual Verification 'Phase S4: Goal binding' (Protocol in workflow.md) `3b96632`

## Phase S5: In-band setup answer [checkpoint: 4b667fc]

_Story ref: spec.md#story-s5_

- [x] Task 5.1: Contract: the setup route and the band actions `a94c3bf`
    - [ ] `src/client-state.js`: the view gains `setup: { choice: 'off' | 'setup' | null, text: string | null }` built from the agent's `setupChoice`, but only where the setup question applies: `text` is `setupBandText(choice)` when the snapshot has `needsSetup` (a git repository without `measure/`), else `null`, so a project with `measure/` never shows the offer text or the actions; plus a second exact route `POST /measure-guard/setup` with `{ sessionId, choice }`. Responses: 404 unknown session; 400 malformed body *and* a well-formed body whose `choice` is not `off` or `setup`; 405 for a non-POST method; 200 `{ choice }` on success. Both choices are stored with `resolveSetupChoice` in agent state (the core then treats the question as answered, so `off` makes edits pass and the view's `setup.choice` becomes `off`, which hides the actions and the offer text); `setup` additionally injects the setup instruction message exactly once (a repeat POST does not inject again)
    - [ ] `client.js`: the two band actions (shown while `setup.choice` is null) and their POSTs; renders `setup.text` for the `off` and `setup` variants; the labels are localized in both dictionaries, and `tests/client-bundle.test.js` asserts the en/zh dictionaries have the same keys (dictionary parity)
- [x] Task 5.2: Red: failing tests for the setup answer `a94c3bf`
    - [ ] `tests/setup-route.test.js`: a POST records `off` and `setup`, injects once for `setup`, an unknown session (404), a malformed body (400), an unknown choice (400), a non-POST method (405), and a second POST does not inject twice
    - [ ] `tests/client-state.test.js`: `setup` is `{ choice: null, text: null }` before an answer, and the `off`/`setup` variants carry `setupBandText` text
    - [ ] `tests/client-bundle.test.js`: the bundle carries both action labels and the POST path, and no new page-module import
- [x] Task 5.3: Green: implement the route, the client actions, and the band variant `a94c3bf`; a denied edit still records `off` once when no button is used
- [x] Task 5.4: Docs: README "Client surface" and "Known limits" `a94c3bf` (the setup answer is no longer fire-once); `CHANGELOG.md` entry
- [x] Task: Measure - User Manual Verification 'Phase S5: In-band setup answer' (Protocol in workflow.md) `4b667fc`

## Phase S6: Documentation, live check, and track closeout [checkpoint: 5bdcedb]

_Story ref: spec.md#story-s6_

- [x] Task 6.1: Docs: README "Modes", "Guards", "Known limits", and a "Deferred" section that keeps only Windows path support (the other items are closed); `docs/dsh.md`; `CHANGELOG.md`; `measure/tech-stack.md` if a row is missing `b396420`
- [x] Task 6.2: Live check: install the built copy into the running web profile with `bin/measure-dsh install`, verify the state route carries the goal summary and root session count, and record one strict-mode deny, one `/measure-goal` reply, and one child-agent attach that produces no second-writer note under `measure/runs/dsh_measure_evolve_20261107/`
- [x] Task 6.3: Closeout documents: `measure/lessons-learned.md`, `measure/tech-debt.md` (resolve the second-writer and setup-button rows, add the new findings), `metadata.json`, archive the track, update `measure/tracks.md` `a6b3b16`
- [x] Task: Measure - User Manual Verification 'Phase S6: Documentation, live check, and track closeout' (Protocol in workflow.md) `5bdcedb`

## Phase S7: Registry format tolerance for real projects [checkpoint: a893b3b]

_Story ref: spec.md#story-s7_

This phase executes before S1 as a documented deviation: it fixes a live
user-blocking defect (the installed guard cannot read the Mediarr registry), and
the fix touches only the shared parser and the two adapter detectors, so it does
not overlap the S1–S6 write scopes.

- [x] Task 7.1: Contract: the registry-format rules `92d088e`
    - [ ] `mods/measure-guard/hooks/parse.ts`: `TRACK_BOLD` and `TRACK_LINKED` accept an optional ordered-list prefix (`1. `); the bold branch tests `LINK_LINE` on the same line first, then the following three; `ENTRY` accepts the numbered form too; the header comment names the two live shapes
    - [ ] The adapter detectors in `plugins/dsh-measure-guard/src/snapshot.js` and `plugins/opencode-measure-guard/src/snapshot.ts` accept `^(?:\d+\.\s+)?- \[[ ~xb]\] ` when they decide "no known format"
    - [ ] A fixture of the Mediarr shape in `mods/measure-guard/tests/fixtures/plans.ts` and in the DSH and OpenCode snapshot tests
- [x] Task 7.2: Red: failing tests `92d088e`
    - [ ] `mods/measure-guard/tests/parse.test.ts`: numbered active entries parse (marker, name, folder, line); a same-line `*Link:*` parses; the classic formats keep the current results
    - [ ] `plugins/dsh-measure-guard/tests/snapshot.test.js`: a Mediarr-shaped registry yields the active track and no parseError; a registry with a numbered `[~]` line and nothing parseable still reports the parse error
    - [ ] `plugins/opencode-measure-guard/tests/snapshot.test.ts`: the same two cases
- [x] Task 7.3: Green: change the canonical mod parser, copy it byte-identically into the OpenCode and DSH core folders, update both detectors, and run the parity gates `92d088e`
    - [ ] `node --test plugins/dsh-measure-guard/tests/*.test.js` passes and both parity scripts print ok; the mod suite (`claude plugin test mods/measure-guard`) and the OpenCode suite (`bun test plugins/opencode-measure-guard`) pass where those runners exist — this host has neither, so the parity gates plus the shared DSH suite are the recorded substitute evidence
- [x] Task 7.4: Docs: README known-limits note (both registry shapes are read), `CHANGELOG.md` entry; record the live Mediarr parse evidence under `measure/runs/dsh_measure_evolve_20261107/` `a754361`
- [x] Task: Measure - User Manual Verification 'Phase S7: Registry format tolerance for real projects' (Protocol in workflow.md) `a893b3b`
