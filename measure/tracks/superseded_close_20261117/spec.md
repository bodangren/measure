# Specification: Superseded closeout

## Overview

The Measure guard refuses a registry change to `[x]` when the plan of that track has an open task. A superseded track keeps its open tasks. It closes under a new owner, not under its own last task. The guard must accept such a close.

This track adds a superseded closeout rule to the shared Measure core. It fills the metadata text in three adapters. It skips the DSH metadata count check for a superseded track. The real archived tracks of another project give the shape of a superseded close.

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

`grep -l "Superseded by" measure/archive/*/plan.md` finds seven such plans in that repository. The other six use the same line shape.

## Decided design (recorded here; do not choose another design)

### 1. New pure code in the shared core

Add to `mods/measure-guard/hooks/guards.ts`:

```ts
/** The target of a superseded plan; null unless the plan says `Superseded by` and the metadata status is `superseded`. */
export const supersededTarget = (plan: string, metadataText: string | null): string | null => {
  const match = plan.match(/^Superseded by (\S+?)[,.]?(\s|$)/m)
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

The function returns the target only when both conditions hold. The first condition is a line of the plan that matches `/^Superseded by (\S+?)[,.]?(\s|$)/`. The target is the first group. A trailing comma or full stop is removed. The second condition is a metadata text that parses as JSON with `status === "superseded"`. Every other case gives `null`. Bad JSON and a null metadata text give `null`.

A plan names its line at the start of a line. A multi-target line, such as `Superseded by the open apps/... tracks (...)`, returns its first word. The design stays as ordered.

`ClosingTrack` gains an optional field `metadata?: string | null`. The type is in the types file of each adapter. All parity rules stay.

`trackCloseDecision` changes for a closing track whose `supersededTarget(plan, metadata ?? null)` is not null. That track skips the open-task check. The allow note gains this line:

```
  - "<name>" closes as superseded by <target>; its open tasks stay open.
```

Every other track keeps today's rule.

### 2. Adapter sites that fill the metadata text

Each adapter fills `metadata` with the text of `<track folder>/metadata.json`, or `null` when the file is missing. The sites that build `ClosingTrack`:

| File | Line | What the line does |
| --- | --- | --- |
| `plugins/opencode-measure-guard/src/guard.ts` | 286 | `const closing: ClosingTrack[] = []` |
| `plugins/opencode-measure-guard/src/guard.ts` | 289 | pushes `{ entry, plan }` for one closed track |
| `mods/measure-guard/hooks/register.tsx` | 225 | `const closing: ClosingTrack[] = []` |
| `mods/measure-guard/hooks/register.tsx` | 228 | pushes `{ entry, plan }` for one closed track |
| `plugins/dsh-measure-guard/src/guard.js` | 132 | `const closing = []` |
| `plugins/dsh-measure-guard/src/guard.js` | 135 | pushes `{ entry, plan }` for one closed track |

The three `ClosingTrack` type definitions:

| File | Line |
| --- | --- |
| `mods/measure-guard/types/index.d.ts` | 125 |
| `plugins/opencode-measure-guard/src/types.ts` | 126 |
| `plugins/dsh-measure-guard/src/types.ts` | 127 |

### 3. DSH metadata check

`metadataProblem` in `plugins/dsh-measure-guard/src/git-verification.js` line 45 must skip the `actual_tasks` equality check (line 65) when `supersededTarget(plan, metadata text)` is not null. The file already reads the metadata text at line 50. The other checks stay.

### 4. Out of scope

- The checker script `skills/measure-orchestrator/scripts/measure_interphase_checks.py`.
- The registry format.
- The role files.
- Any change to how a superseded track is archived.

## Tests (Red first)

The core unit tests go in the existing test layout of each package that has `trackCloseDecision` tests:

- `plugins/opencode-measure-guard/tests/closeout.test.ts`
- `mods/measure-guard/tests/closeout.test.ts`
- `plugins/dsh-measure-guard/tests/closeout.test.js`

The cases:

- (a) Open task boxes, a `Superseded by` line, and metadata status `superseded` give an allow. The note names the target.
- (b) Open task boxes, no line, and metadata status `superseded` give a deny, as today.
- (c) Open task boxes, a line, and metadata status `done` give a deny.
- (d) The `supersededTarget` unit cases. `"Superseded by foo_20261116, PM 2026-11-16."` gives `foo_20261116`. Bad JSON gives `null`.

The DSH test goes in `plugins/dsh-measure-guard/tests/git-verification.test.js`:

- A superseded track with `actual_tasks` not equal to the completed count gives no metadata deny.
- The same track without the line gives a deny, as today.

No test count is pinned.

## Gates

- `cd plugins/opencode-measure-guard && bun test`
- `cd mods/measure-guard && bun test`
- `cd plugins/dsh-measure-guard && node --test tests/*.test.js`
- `bash plugins/opencode-measure-guard/scripts/check-parity.sh`
- `bash plugins/dsh-measure-guard/scripts/check-parity.sh`
- `HEAVY_PRIORITY=p2 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh bash tests/spec_review_gate/run.sh`, with no shell redirection
- `HEAVY_PRIORITY=p2 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh bash tests/dsh/test-registry.sh`, with no shell redirection

Record a pre-existing failure without a fix. V18 of `allow-adversarial` fails on main.

## Out of scope

See section 4 of the design.
