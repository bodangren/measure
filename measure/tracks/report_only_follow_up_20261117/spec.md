# Specification: Report-only follow-up

## Overview

The measure-guard end-of-turn check sends a follow-up prompt or a reminder. The follow-up text tells the agent to fix the problems now. On 2026-11-17 such a prompt started a new turn in a finished build session. The session then edited plan.md, committed, and pushed with no orchestrator check. This track makes the follow-up text report-only. The text names the open problems. It tells the agent to write them in its reply. It never asks the agent to edit, commit, or push. The OpenCode plugin also stops sending the synthetic reminder. Only a real user prompt carries the reminder now.

Source: PM order, 2026-11-17, light lane. Date needed 2026-11-19. One PR; the PM merges.

## The order (PM, verbatim)

> "WHAT: a measure-guard hook prompt started a new turn in a FINISHED build session (mastery-advantage, ses_e15f26f46ffe, 2026-11-17 ~23:13). With no message from its orchestrator, the session edited plan.md ("Both guard problems are fixed"), committed ed7b9b0, and pushed. WHY: a hook must never make a role act outside its brief; a commit and a push with no orchestrator check breaks the role chain. DONE-WHEN: the guard's follow-up prompt only reports the problem to the session's orchestrator (or asks the role to report), and never asks it to edit, commit, or push; a test pins this."

## Evidence

### The incident

- Repository: `/home/daniebo/Desktop/mastery-advantage`, branch `main`.
- Session: `ses_e15f26f46ffelPzyisVzeIud0m` (the PM order gives the short id `ses_e15f26f46ffe`). Its title is "Build · plans · Phase 4 step 0 checkpoint and push".
- The commit `ed7b9b0` is "docs(measure): record the Step 0 task commit SHAs", 2026-11-17 23:12:46 +0700. Its stat shows one file, `measure/tracks/math_us_hs_merged_domain_20261114/plan.md`, with 2 insertions and 2 deletions.
- The push command in the session transcript is `git push origin ed7b9b04ec5a481d6c953819c4a19e38c268500a:main`.
- The session had no message from its orchestrator before that push.

### The guard mode of that repository

The plugin reads the mode in `plugins/opencode-measure-guard/src/options.ts:8-11`:

```ts
/** The guard mode: the `mode` option, else the environment variable, else `guard`. */
export const modeFrom = (options: Readonly<Record<string, unknown>>, env: Readonly<Record<string, string | undefined>>): Mode => {
  if (known(options.mode)) return options.mode
  return parseMode(env.MEASURE_GUARD_MODE)
}
```

The plugin writes the mode to a state file per root. The path is `~/.local/state/measure/opencode-guard/<sha1 of root>.json` (`src/state.ts:102-106`). For this repository the file is `/home/daniebo/.local/state/measure/opencode-guard/9ba2fec39fbaef17.json`:

```json
{
  "root": "/home/daniebo/Desktop/mastery-advantage",
  "mode": "guard",
  "guardsOff": null,
  "problems": [],
  "updatedAt": "2026-11-17T16:22:33.224Z"
}
```

The repository holds no mode file of its own. Its `measure/config.json` holds only `{"measure_zone": "english/cefr-vocabulary"}`.

### The path that fired

The path that fired is the **guard-mode synthetic reminder**, not the strict follow-up prompt. The evidence:

1. The mode is `guard`. `stopAction` in `mods/measure-guard/hooks/guards.ts:337-346` returns a block only when the mode is `strict`. Guard mode returns `report: true` only.
2. The session message at seq 156 has type `synthetic` and description `measure-guard reminder`. Its text starts with `measure-guard: at the end of the last turn, these problems were open:`. The strict follow-up text starts with `measure-guard (strict): do not end the turn yet.` That text is absent from the transcript.
3. The synthetic message sits at 23:10:47. The assistant message follows at 23:10:47, 8 ms later. No user message sits between them. The synthetic message started the agent turn.
4. The plugin sends the synthetic with `resume: false` (`src/index.ts:102`). That argument did not stop the new turn.
5. The synthetic message follows a manual compaction at 23:10:28 (seq 152). The previous turn ended at 22:10:26 (seq 145). The plugin reads `session.execution.*` events, not `session.idle`. The check therefore ran after the compaction, while the turn of the first user prompt was still open.

Only the OpenCode adapter can start a turn with a reminder. The Claude Code mod delivers its reminder as `additionalContext` (`register.tsx:318-321`). The DSH adapter delivers its reminder with the next pre-step (`context.js:72-75`).

### The current texts

`plugins/opencode-measure-guard/src/hooks/turn.ts:39-50`:

```ts
/** The first line of a follow-up prompt; the prompt hook keeps the turn open when it sees it. */
export const FOLLOW_UP_HEAD = 'measure-guard (strict): do not end the turn yet.'

/** True for a prompt the plugin sent itself as a follow-up (strict mode). */
export const isFollowUp = (text: string): boolean => text.startsWith(FOLLOW_UP_HEAD)

/** The follow-up prompt text (strict mode): the problems and the instruction to fix them now. */
export const followUpText = (problems: readonly string[]): string =>
  [`${FOLLOW_UP_HEAD} Fix these problems first:`, ...problems.map(one => `- ${one}`)].join('\n')

/** The reminder text for the synthetic message and the next prompt (guard mode, or strict after the follow-ups). */
export const reminderText = (problems: readonly string[]): string =>
  ['measure-guard: at the end of the last turn, these problems were open:', ...problems.map(one => `- ${one}`), 'Fix them before you continue.'].join('\n')
```

`plugins/opencode-measure-guard/src/index.ts:101-106`:

```ts
      if (action.kind === 'remind') {
        await ctx.session.synthetic({ sessionID, text: action.text, description: 'measure-guard reminder', resume: false })
        // The synthetic message reaches the agent with the next prompt; the prompt rider would double it.
        guard.session(sessionID).reminder = null
      }
      else if (action.kind === 'follow-up') await ctx.session.prompt({ sessionID, text: action.text })
```

`mods/measure-guard/hooks/guards.ts:320` and `:326` hold the two problem texts:

```ts
      problems.push(`"${text}" is [x] but has no commit SHA. Commit the task, and add the 7-character SHA to its line in plan.md.`)
```

```ts
    problems.push(`Files changed outside measure/ while no task is in progress: ${listed}. Mark the task [~] in plan.md (or create a track), or revert the changes.`)
```

`mods/measure-guard/hooks/guards.ts:341` holds the stop block:

```ts
      block: ['measure-guard (strict): do not end the turn yet. Fix these problems first:', ...problems.map(one => `- ${one}`)].join('\n'),
```

`mods/measure-guard/hooks/register.tsx:342` and `plugins/dsh-measure-guard/src/context.js:35` hold the reminder text:

```ts
        ['measure-guard: at the end of the last turn, these problems were open:', ...problems.map(one => `- ${one}`), 'Fix them before you continue.'].join('\n'),
```

```js
    'Fix them before you continue.',
```

## Decided design (record it; do not choose another)

### 1. Shared core

Add this block to `mods/measure-guard/hooks/guards.ts`, above the doc comment that starts at line 309. That comment belongs to `turnProblems()`.

```ts
/** The report-only line: the problems are information, never an order. */
export const REPORT_ONLY = 'Do not edit, commit, or push because of this message. Write these problems in your reply to your orchestrator or the user, and act on them only when they tell you to.'

/** The report text: a head, the problems as list items, and the report-only line. */
export const reportText = (head: string, problems: readonly string[]): string => [head, ...problems.map(one => `- ${one}`), REPORT_ONLY].join('\n')
```

The two problem texts state the fact and the usual fix as information, not as an order:

```ts
      problems.push(`"${text}" is [x] but has no commit SHA. The usual fix is a commit of the task and its 7-character SHA on its line in plan.md.`)
```

```ts
    problems.push(`Files changed outside measure/ while no task is in progress: ${listed}. The usual fix is a [~] task in plan.md (or a new track), or a revert of the changes.`)
```

The stop block becomes:

```ts
      block: reportText('measure-guard (strict): report these problems before you end the turn.', problems),
```

The strict head of the core and the strict head of the plugin hold the same string. The core stop block starts with `measure-guard (strict): report these problems before you end the turn.`

### 2. Parity copies

The plugin check scripts require byte equality with the new core.

- `plugins/opencode-measure-guard/src/core/guards.ts` is a byte copy of `mods/measure-guard/hooks/guards.ts`.
- `plugins/dsh-measure-guard/src/core/guards.ts` is the same copy with the one transform `from './parse'` to `from './parse.ts'`.

Write the two copies with these commands. Do not edit the two files by hand.

```bash
cp mods/measure-guard/hooks/guards.ts plugins/opencode-measure-guard/src/core/guards.ts
sed "s|from './parse'|from './parse.ts'|" mods/measure-guard/hooks/guards.ts > plugins/dsh-measure-guard/src/core/guards.ts
```

No `types/index.d.ts` file changes. The new exports live in `guards.ts`.

### 3. OpenCode plugin

In `plugins/opencode-measure-guard/src/hooks/turn.ts`:

- `FOLLOW_UP_HEAD` becomes `'measure-guard (strict): report these problems before you end the turn.'`. `isFollowUp` keeps using the constant.
- `followUpText` becomes `reportText(FOLLOW_UP_HEAD, problems)`.
- `reminderText` becomes `reportText('measure-guard: at the end of the last turn, these problems were open:', problems)`.
- The comment at line 12 becomes `/** Guard mode, or strict mode after MAX_BLOCKS follow-ups: a reminder that rides on the next prompt. */`.
- The comment at line 14 becomes `/** Strict mode: a follow-up prompt that asks the agent to report the problems. */`.
- The comment at line 44 becomes `/** The follow-up prompt text (strict mode): the problems and the report-only line. */`.
- The comment at line 48 becomes `/** The reminder text for the next prompt (guard mode, or strict after the follow-ups). */`.
- The header comment at line 4 becomes `// (the follow-up prompt) through ctx.session.`.

Lines 13 and 15 hold the union members of `IdleAction`. They stay unchanged.

The plugin adds `reportText` to the import from `../core/guards` at line 5.

In `plugins/opencode-measure-guard/src/index.ts`:

- The `remind` branch of the turn-end watch is removed. The plugin sends no synthetic message at the turn end.
- The line that clears `guard.session(sessionID).reminder` is removed. The reminder stays in the session state.
- The watch keeps the follow-up branch. It sends `ctx.session.prompt` with the report-only text.
- `watchIdle` becomes a named export. The host still loads the default export only. The named export changes no runtime behavior.
- The comment at line 12 becomes `// The host accepts the default export only. The named export of watchIdle serves the tests.`

The doc comment of `watchIdle` at lines 84-88 becomes:

```ts
/**
 * Runs the end-of-turn check when a session's execution ends: a follow-up
 * prompt (strict), or a reminder that rides on the next prompt (guard mode,
 * or strict after the follow-ups). The loop ends when the instance disposes
 * the subscription.
 */
```

The turn-end watch becomes:

```ts
      const action = await guard.onIdle(sessionID)
      // The guard mode reminder rides on the next real prompt. A synthetic message starts a turn in a finished session.
      if (action.kind === 'follow-up') await ctx.session.prompt({ sessionID, text: action.text })
```

`src/guard.ts` stays unchanged. Its prompt rider (`src/guard.ts:144-146`) sends the reminder with the next user prompt. The state file keeps the problems (`src/guard.ts:163`), so the band still shows them.

`plugins/opencode-measure-guard/README.md` holds three text changes in the "## End-of-turn check" section:

- The bullet at line 111 becomes:

  ```
  - **guard**: no message goes into the session at the turn end. The reminder stays in the session state and rides on the next user prompt. A synthetic message would start a new turn in a finished session.
  ```

- The bullet at line 112 becomes:

  ```
  - **strict**: a follow-up prompt with the problems (`ctx.session.prompt`) asks the agent to report them, at most `MAX_BLOCKS` (2) times per user turn; then the reminder as in guard mode.
  ```

- The live-check paragraph at line 116 keeps its record and gains this last sentence: `After 2026-11-17 the guard mode sends no synthetic message, because the synthetic message started a turn in a finished session after a compaction.`

The root `README.md:159` holds one text change in the plugin list:

```
- **End-of-turn check:** after each turn, a follow-up prompt (strict mode, at most 2 per turn) or a reminder that rides on the next prompt (guard mode) lists done tasks with no SHA and changed files that no task covers.
```

### 4. Claude Code mod

In `mods/measure-guard/hooks/register.tsx:342`, the reminder text uses `reportText('measure-guard: at the end of the last turn, these problems were open:', problems)`.

The mod adds `reportText` to the import from `./guards` at line 45.

The mod delivers the reminder as `additionalContext` (`register.tsx:318-321`). It never starts a turn. No other mod file changes.

### 5. DSH adapter

In `plugins/dsh-measure-guard/src/context.js:31-37`, `reminderText` uses the same call.

The adapter adds `reportText` to the import from `./core/guards.ts` at line 6.

The adapter delivers the reminder with the next pre-step (`context.js:72-75`). It never starts a turn. No other adapter file changes.

### 6. What stays

- No change to when the strict follow-up is sent. `MAX_BLOCKS` stays 2. Strict mode can ask for the report up to `MAX_BLOCKS` times per user turn. Each ask costs one model turn and gives no new information.
- No change to the modes `advise`, `guard`, and `strict`.
- No change to any other guard.

## Tests (Red first)

Add the cases to each existing end-of-turn suite. Each package holds one helper:

| Package | Test file | Helper |
|---|---|---|
| OpenCode | `plugins/opencode-measure-guard/tests/end-of-turn.test.ts` | `assertReportOnly(text)` |
| Claude Code mod | `mods/measure-guard/tests/end-of-turn.test.ts` | `assertReportOnly(text)` |
| DSH | `plugins/dsh-measure-guard/tests/end-of-turn.test.js` | `assertReportOnly(text)` |

Each package holds this test constant:

```ts
const REPORT_ONLY_TEXT = 'Do not edit, commit, or push because of this message. Write these problems in your reply to your orchestrator or the user, and act on them only when they tell you to.'
```

A case asserts that `REPORT_ONLY` equals `REPORT_ONLY_TEXT`. The import comes from the package core. A missing export fails the suite to load.

Each package uses the real `turnProblems()` output as the test input. The two inputs are the problem kinds of the incident:

- a `[x]` task with no SHA that appeared during the turn;
- files changed outside `measure/` while no task has `[~]`.

The OpenCode package calls `turnProblems` of `../src/core/guards` with the snapshot of its temp project. The DSH package calls `turnProblems` of `../src/core/guards.ts` with its `snapshotOf()` helper. The mod package reads the problem text from its own stop block and its own reminder.

Each package asserts that its follow-up prompt, stop block, or reminder text:

- contains `REPORT_ONLY`;
- contains none of these words as an order: `/\bfix (these|them)\b/i`, `/\bcommit the\b/i`, `/\bpush\b(?! because)/i`, `/\brevert the\b/i`, `/\bmark the task\b/i`.

The OpenCode package adds one case for the turn end of a guard-mode turn with problems. The file is `plugins/opencode-measure-guard/tests/end-of-turn.test.ts`.

The case drives the exported `watchIdle` with a fake context:

- `ctx.event.subscribe()` yields one event of type `session.execution.succeeded` with the session id of the test.
- `ctx.session.synthetic` and `ctx.session.prompt` are spies that count their calls.
- The guard is the real `makeGuard(root, 'guard')` of the temp project. A prompt starts the turn and a stray file gives real problems.

The case asserts:

- both spies have zero calls;
- `guard.session('ses_1').reminder` holds the report-only text;
- the next `onPrompt` carries that reminder in the prompt text.

The case reads `watchIdle` with a dynamic import in the case body: `const { watchIdle } = await import('../src/index')`. A failed load fails that case only. The fake context uses the type `Parameters<typeof watchIdle>[0]` and one cast.

The case loads `src/index.ts`, which imports `@opencode/plugin`. The package has no `node_modules` folder, and Bun does not auto-install a bare import for a project file. The test therefore registers a virtual module for `@opencode/plugin` with `Bun.plugin` before the import. The stub holds `export const Plugin = { define: (x) => x };`. The case needs no install and no network. The install cache holds `@opencode/plugin` at `/home/daniebo/.bun/install/cache/@opencode/plugin@2.3.0`. If the load still fails, the worker records the failure as an infrastructure failure in `package-test.log`. The worker never records the case as a pass.

The OpenCode package adds one case that the core stop block starts with `FOLLOW_UP_HEAD`. The two heads stay equal.

The tests that pin the old head change:

- The OpenCode suite pins `followUpText(['p1'])` with `toContain('do not end the turn yet')`. It changes to the new head.
- The DSH suite pins the steered text with `assert.match(agent.steered[0].content[0].text, /do not end the turn yet/)`. It changes to the new head.

The other existing pins stay valid:

- The DSH suite pins the first problem with `/"Task: Done no sha" is \[x\] but has no commit SHA/`. The new problem text keeps that prefix.
- The mod suite pins the stop block with `toContain('Task: Current')`. The new block keeps the problem list.

Red: before the change, every new case fails. Green: every case passes. Keep the Red and Green outputs in `measure/runs/report_only_follow_up_20261117/`. The runs folder is gitignored.

## Gates

Each gate writes its output to its named log file under `measure/runs/report_only_follow_up_20261117/`.

| Gate | Command | Log file |
|---|---|---|
| Red | the three suites before the change | `red-report-only.log` |
| Green | the three suites after the change | `green-report-only.log` |
| OpenCode package | `cd plugins/opencode-measure-guard && bun test` | `package-test.log` |
| Claude Code mod | `claude plugin test mods/measure-guard` | `mod-test.log` |
| DSH package | `node --test plugins/dsh-measure-guard/tests/*.test.js` | `dsh-test.log` |
| OpenCode parity | `bash plugins/opencode-measure-guard/scripts/check-parity.sh` | `parity-opencode.log` |
| DSH parity | `bash plugins/dsh-measure-guard/scripts/check-parity.sh` | `parity-dsh.log` |
| Heavy run, spec review gate | `HEAVY_PRIORITY=p2 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh bash tests/spec_review_gate/run.sh` | `run-suites.log` |
| Heavy run, registry gate | `HEAVY_PRIORITY=p2 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh bash tests/dsh/test-registry.sh` | `test-registry-task1.1.log` |

Run the two heavy-run gates with no shell redirection. The failure V18 of allow-adversarial is a known pre-existing failure. Record it, and do not fix it.

## Functional Requirements

- **FR-1 (the core).** Add `REPORT_ONLY` and `reportText` to `mods/measure-guard/hooks/guards.ts`, above the doc comment that starts at line 309. Change the two problem texts and the stop block as in section 1.
- **FR-2 (the copies).** Write the two parity copies with the commands of section 2.
- **FR-3 (the adapters).** Apply sections 3, 4, and 5 to the three adapters, with the three README text changes of section 3.
- **FR-4 (the tests).** Add the cases of the Tests section to the three end-of-turn suites, Red first. Keep each output in its named log file under `measure/runs/report_only_follow_up_20261117/`.
- **FR-5 (the commit).** Commit the change on `chore/report-only-follow-up` with the message `fix(guard): Make the end-of-turn follow-up report-only`.
- **FR-6 (the records).** `CHANGELOG.md` gets one entry as the first of the list under the `### Bug Fixes` heading of `## Unreleased`. The entry has this exact text (one physical line):

  ```
  * **report-only follow-up:** the measure-guard end-of-turn text now reports the open problems instead of ordering a fix. The shared core holds the line "Do not edit, commit, or push because of this message. Write these problems in your reply to your orchestrator or the user, and act on them only when they tell you to." The two problem texts state the fact and the usual fix as information. The OpenCode plugin sends no synthetic message at the turn end, so a reminder no longer starts a turn in a finished session. The strict follow-up prompt still starts a turn, up to `MAX_BLOCKS` times per user turn. The Claude Code mod and the DSH adapter use the same text. Cause: a guard prompt started a new turn in a finished build session on 2026-11-17, and the session committed and pushed with no orchestrator check. Track `report_only_follow_up_20261117`.
  ```

  `README.md` line 33: replace its first sentence, up to and including its closing bracket and full stop, with:

  ```
  As of <the date of the archive commit>, the latest archived track is Report-only follow-up (the measure-guard end-of-turn follow-up reports the open problems and never asks the agent to edit, commit, or push).
  ```

  The worker writes the date of the archive commit in place of the placeholder. The rest of line 33 stays unchanged. The `completed` field of `metadata.json` holds that same date. Both changes ride in the Task 1.2 archive commit.
- **FR-7 (the closeout).** Archive the track to `measure/archive/report_only_follow_up_20261117/`, move the registry entry to Archived Tracks with `[x]`, and record the gate results.

## Acceptance Criteria

- The three end-of-turn suites fail on the new cases before the change and pass after it.
- `cd plugins/opencode-measure-guard && bun test` records one failure, V18 of allow-adversarial. It already fails on origin/main `b2b5d08`. Do not fix it.
- `claude plugin test mods/measure-guard` exits 0.
- `node --test plugins/dsh-measure-guard/tests/*.test.js` exits 0.
- `bash plugins/opencode-measure-guard/scripts/check-parity.sh` exits 0.
- `bash plugins/dsh-measure-guard/scripts/check-parity.sh` exits 0.
- The two heavy-run gates exit 0, with no shell redirection.
- The closeout check fails only on the missing closeout manifest.

## Out of Scope

- No change to `commitReminder` (`guards.ts:495`). Its text tells the agent to add a git note and to record the SHA in plan.md. The three adapters send it.
- No change to the in-turn denies: the commit deny of `guards.ts:481`, the edit deny, the closeout deny, the setup deny, and the TDD deny.
- No change to the send timing of the strict follow-up. `MAX_BLOCKS` stays 2. Strict mode can ask for the report up to `MAX_BLOCKS` times per user turn.
- No change to the modes `advise`, `guard`, and `strict`.
- No change to any role file under `agents/`.
