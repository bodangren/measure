# Specification: Superseded closeout

## Overview

The Measure guard refuses a registry change to `[x]` when the plan of that track has an open task. A superseded track keeps its open tasks. It closes under a new owner, not under its own last task. The guard must accept such a close.

This track adds a superseded closeout rule to the shared Measure core. The three adapters compute the target of a superseded plan. The DSH metadata check skips its task count for such a track. The real archived tracks of another project give the shape.

Source: PM order, 2026-11-17, light lane. One PR. The PM or Daniel merges.

## The order (PM, verbatim)

> "measure-guard must accept a registry [x] for a plan with open task boxes when the plan has a "Superseded by <target>" line and metadata.json status "superseded". Test: pass (line + status) and fail (open boxes, no line). One PR."

## The real shape (read-only example)

`/home/daniebo/Desktop/ra-math-advantage/measure/archive/app-platform-consolidation_20260710/` holds this real example.

`plan.md` line 1 to line 3:

```markdown
# Implementation Plan: App and Platform Consolidation

Superseded by math-app-base_20261114, PM 2026-11-16.
```

`metadata.json` of the same folder holds these fields:

```json
{
  "track_id": "app-platform-consolidation_20260710",
  "type": "refactor",
  "status": "superseded",
  "superseded_by": "math-app-base_20261114",
  "supersession_reason": "The Daniel sync closed this track on 2026-11-16. The one app with the four courses as data replaces the four math apps. The Unified Math App Base App track now owns the consolidation scope.",
  "estimated_tasks": 21,
  "actual_tasks": null
}
```

The plan holds an open task (`- [~] Reconcile the current package dependency direction ...`) at the time of the close.

`grep -l "Superseded by" measure/archive/*/plan.md` finds eight plans in that repository. Seven of them carry the line at the start of a line. The eighth, `skill-graph-deprecation_20260509`, quotes the words inside a task line. The regex of section 1 rejects that plan.

Two of the seven plans give the target `the`. They are `danielson-app-import_20261114` and `worktree-atomic-integration_20260917`. Their line reads `Superseded by the open apps/...` or `Superseded by the sync merge ...`. The first group is a word, not a track id. The note shows the captured word as it is. The status check is the real guard. The regex does not change.

## Decided design (recorded here; do not choose another design)

### 1. New pure code in the shared core

`supersededTarget(planText: string, metadataText: string | null): string | null` is an export of `mods/measure-guard/hooks/guards.ts`. It is pure. It reads text, not a parsed plan.

Add it directly after `trackCloseDecision()`:

```ts
/** The target of a superseded plan; null unless the plan says `Superseded by` and the metadata status is `superseded`. */
export const supersededTarget = (planText: string, metadataText: string | null): string | null => {
  const match = planText.match(/^Superseded by (\S+?)[,.]?(\s|$)/m)
  if (match === null) return null
  if (metadataText === null) return null
  let metadata: unknown
  try {
    metadata = JSON.parse(metadataText)
  } catch {
    return null
  }
  if (metadata === null || typeof metadata !== 'object') return null
  if ((metadata as { status?: unknown }).status !== 'superseded') return null
  return match[1]
}
```

The function returns the target only when both conditions hold. The first condition is a line of the plan that matches `/^Superseded by (\S+?)[,.]?(\s|$)/`. The target is the first group. A trailing comma or full stop is removed. The second condition is a metadata text that parses as JSON with `status === "superseded"`. Every other case gives `null`. Bad JSON gives `null`. A null metadata text gives `null`.

The modifier `m` lets the line stand at the start of any line. A line with leading spaces, a lower-case line, a blockquote line, a heading line, a task line, and a line with no target give `null`. A quoted or backticked target gives a non-null target. The metadata status still gates such a plan.

### 2. The data path from each adapter to the core

A parsed `Plan` keeps only phases and tasks. It does not keep the plan text. The adapters therefore compute the target, and the core reads the result.

`ClosingTrack` gains an optional field `supersededBy?: string | null`. It does not gain the metadata text. The three type definitions are:

| File | Line |
| --- | --- |
| `mods/measure-guard/types/index.d.ts` | 125 |
| `plugins/opencode-measure-guard/src/types.ts` | 126 |
| `plugins/dsh-measure-guard/src/types.ts` | 127 |

Each adapter, at the site that builds `ClosingTrack`, does two reads. It reads the plan text that it already reads for `parsePlan`. It reads `<track folder>/metadata.json` with its existing read helper, and uses `null` when the file is missing. It sets `supersededBy = supersededTarget(planText, metadataText)`.

The sites:

| File | Line | What the line does |
| --- | --- | --- |
| `plugins/opencode-measure-guard/src/guard.ts` | 286 | `const closing: ClosingTrack[] = []` |
| `plugins/opencode-measure-guard/src/guard.ts` | 289 | pushes `{ entry, plan }` for one closed track |
| `mods/measure-guard/hooks/register.tsx` | 225 | `const closing: ClosingTrack[] = []` |
| `mods/measure-guard/hooks/register.tsx` | 228 | pushes `{ entry, plan }` for one closed track |
| `plugins/dsh-measure-guard/src/guard.js` | 132 | `const closing = []` |
| `plugins/dsh-measure-guard/src/guard.js` | 135 | pushes `{ entry, plan }` for one closed track |

`trackCloseDecision` skips the open-task check for a track whose `supersededBy` is a non-empty string. Every other track keeps today's rule. The skip is per track. The function must not set one shared flag for the whole call.

### 3. The allow note

The allow note keeps the existing `[b]` list as it is. A superseded plan's `[b]` tasks still appear in that list. The note then gains a separate block. The full note, in order:

```
measure-guard: the closed track has these [b] tasks. List them for the user in your report:
  - [b] <task text>
Superseded tracks:
  - "<name>" closes as superseded by <target>; its open tasks stay open.
```

The `[b]` header and its items exist only when a closed plan has `[b]` tasks. The `Superseded tracks:` header and its items exist only when a closing track has a non-empty `supersededBy`. Each superseded closing track gets one item. A superseded track with no open task gets the same item. The two parts join with a newline. The note is `null` when both parts are absent. The deny path keeps no note.

### 4. DSH metadata check

`metadataProblem` in `plugins/dsh-measure-guard/src/git-verification.js` line 45 skips the `actual_tasks` equality check (line 65) when `closing.supersededBy` is a non-empty string. The function already reads the metadata text at line 50. It imports nothing new. The other checks stay: a missing file, bad JSON, and every non-superseded track.

### 5. Parity

`guards.ts` is one source with two copies. `plugins/opencode-measure-guard/src/core/guards.ts` is a byte copy. `plugins/dsh-measure-guard/src/core/guards.ts` is a copy after one transform: the import `from './parse'` becomes `from './parse.ts'`.

The `ClosingTrack` line must read the same in all three types files. The two `types.ts` files start with a different header note. Each header note stays as it is. Both `check-parity.sh` scripts must print `parity: ok`.

### 6. Out of scope

- The checker script `skills/measure-orchestrator/scripts/measure_interphase_checks.py`.
- The registry format.
- The role files.
- Any change to how a superseded track is archived.

## Tests (Red first)

Cases (a) to (c) run through each adapter. They do not call `trackCloseDecision` directly. The adapters are:

- the OpenCode plugin, through `Guard.onToolBefore` in `plugins/opencode-measure-guard/tests/closeout.test.ts`
- the Claude Code mod, through `$.tool.call` in `mods/measure-guard/tests/closeout.test.ts`
- the DSH adapter, through `closeoutGuardFor` in `plugins/dsh-measure-guard/tests/closeout.test.js`

Each temp project holds a real `metadata.json` beside its `plan.md`. An adapter that skips the fill then fails case (a).

The cases:

- (a) Open task boxes, a `Superseded by` line, and metadata status `superseded` give an allow. The note names the target. This is a Red case.
- (b) Open task boxes, no line, and metadata status `superseded` give a deny. This is a control.
- (c) Open task boxes, a line, and metadata status `done` give a deny. This is a control.
- (d) The pure `supersededTarget` unit cases: `"Superseded by foo_20261116, PM 2026-11-16."` gives `foo_20261116`, and bad JSON gives `null`. This is a Red case.
- (e) A superseded track that has no open task gives an allow and the same note item.
- (f) Near-miss plan lines give a deny: a lower-case line, a line with leading spaces, a blockquote line, a heading line, a task line, and a line with no target.
- (g) A null metadata text gives `null`, and so does a status other than `superseded` (`done`, `Superseded`, and `"superseded "`).
- (h) One registry edit closes a superseded track and an open non-superseded track together. The edit is denied, and the deny names only the open track.
- (i) A `Superseded by` line in a plan whose own `metadata.json` says `done` gives a deny.

The DSH metadata case goes in `plugins/dsh-measure-guard/tests/git-verification.test.js`:

- A superseded track with `actual_tasks` not equal to the completed count gives no metadata deny. This is a Red case.
- The same track without the line gives a deny, as today. This is a control.

No test count is pinned.

## Gates

- `cd plugins/opencode-measure-guard && bun test`
- `claude plugin test mods/measure-guard`
- `cd plugins/dsh-measure-guard && node --test tests/*.test.js`
- `bash plugins/opencode-measure-guard/scripts/check-parity.sh`
- `bash plugins/dsh-measure-guard/scripts/check-parity.sh`
- `HEAVY_PRIORITY=p2 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh bash tests/spec_review_gate/run.sh`, with no shell redirection
- `HEAVY_PRIORITY=p2 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh bash tests/dsh/test-registry.sh`, with no shell redirection

The mod gate is the command of `measure/tech-stack.md` line 40. It runs in this repository. At HEAD `d9fa504` it exited 0 with 97 pass and 0 fail. The earlier command `cd mods/measure-guard && bun test` cannot pass here. It stops with `Cannot find module 'claude-code/testing'`.

Record a pre-existing failure without a fix. V18 of `allow-adversarial` fails on main.

## Documentation text

Task 1.2 writes these texts word for word.

CHANGELOG entry, first of the list under the first `### Features` heading of `## Unreleased`:

```
* **superseded closeout:** measure-guard now accepts a registry `[x]` for a track with open task boxes. The plan must carry a `Superseded by <target>` line, and `metadata.json` must have status `superseded`. The shared core gains `supersededTarget`. `ClosingTrack` gains `supersededBy`, and the OpenCode plugin, the Claude Code mod, and the DSH adapter fill it. A second closing track with open tasks is still denied. The DSH metadata check also skips its `actual_tasks` count for a superseded track. Cause: six archived tracks in ra-math-advantage closed as superseded with open tasks. Track `superseded_close_20261117`.
```

Sentence for the Closeout guard bullet of `plugins/opencode-measure-guard/README.md` line 71:

```
A track with open tasks also closes when its plan has a `Superseded by <target>` line at the start of a line and its `metadata.json` has `"status": "superseded"`; the note names the target, and the open tasks stay open.
```

Sentence for the Track close item of `mods/measure-guard/README.md` near line 89:

```
A track with open tasks also closes as superseded when its plan has a `Superseded by <target>` line at the start of a line and its `metadata.json` has `"status": "superseded"`; the note names the target, and the open tasks stay open.
```

Sentence for the Closeout guard bullet of `plugins/dsh-measure-guard/README.md` near line 158:

```
A track with open tasks also closes when its plan has a `Superseded by <target>` line and its `metadata.json` has `"status": "superseded"`; the `actual_tasks` count is not checked for it, the note names the target, and the open tasks stay open.
```

First sentence of `README.md` line 33:

```
As of 2026-11-17, the latest archived track is Superseded closeout (measure-guard accepts a registry `[x]` for a plan with open task boxes when the plan has a superseded-by line and `metadata.json` has status `superseded`).
```

## Out of scope

See section 6 of the design.
