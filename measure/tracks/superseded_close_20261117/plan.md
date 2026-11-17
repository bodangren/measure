# Implementation Plan: Superseded closeout

Track: `superseded_close_20261117`
Spec: [./spec.md](./spec.md)

**All commits go on chore/superseded-close. Push only to origin/chore/superseded-close, never to main. Only the PM or Daniel merges.**

## Documentation text

CHANGELOG entry, first of the list under the first `### Features` heading of `## Unreleased`:

```
* **superseded closeout:** measure-guard now accepts a registry `[x]` for a track with open task boxes. The plan must carry a `Superseded by <target>` line, and `metadata.json` must have status `superseded`. The shared core gains `supersededTarget`. `ClosingTrack` gains `supersededBy`, and the OpenCode plugin, the Claude Code mod, and the DSH adapter fill it. A second closing track with open tasks is still denied. The DSH metadata check also skips its `actual_tasks` count for a superseded track. Cause: six archived tracks in ra-math-advantage closed as superseded with open tasks. Track `superseded_close_20261117`.
```

Append to the Closeout guard bullet of `plugins/opencode-measure-guard/README.md` line 71:

```
A track with open tasks also closes when its plan has a `Superseded by <target>` line at the start of a line and its `metadata.json` has `"status": "superseded"`; the note names the target, and the open tasks stay open.
```

Append to the Track close item of `mods/measure-guard/README.md` near line 89:

```
A track with open tasks also closes as superseded when its plan has a `Superseded by <target>` line at the start of a line and its `metadata.json` has `"status": "superseded"`; the note names the target, and the open tasks stay open.
```

Append to the Closeout guard bullet of `plugins/dsh-measure-guard/README.md` near line 158:

```
A track with open tasks also closes when its plan has a `Superseded by <target>` line and its `metadata.json` has `"status": "superseded"`; the `actual_tasks` count is not checked for it, the note names the target, and the open tasks stay open.
```

First sentence of `README.md` line 33:

```
As of 2026-11-17, the latest archived track is Superseded closeout (measure-guard accepts a registry `[x]` for a plan with open task boxes when the plan has a superseded-by line and `metadata.json` has status `superseded`).
```

## Phase 1: Superseded closeout

- [ ] Task 1.1: Red first and Green. Add cases (a) to (i) of the Tests section of spec.md to `plugins/opencode-measure-guard/tests/closeout.test.ts`, `mods/measure-guard/tests/closeout.test.ts`, and `plugins/dsh-measure-guard/tests/closeout.test.js`. Add the two metadata cases to `plugins/dsh-measure-guard/tests/git-verification.test.js`. Each temp project gets a real `metadata.json` beside its `plan.md`. Run the three suites and the DSH file before the change. Keep the failing output in `measure/runs/superseded_close_20261117/red-closeout.log`. Then add `supersededTarget` of spec.md section 1 after `trackCloseDecision()` in `mods/measure-guard/hooks/guards.ts`. Add `supersededBy?: string | null` to `ClosingTrack` in `mods/measure-guard/types/index.d.ts`, `plugins/opencode-measure-guard/src/types.ts`, and `plugins/dsh-measure-guard/src/types.ts`. Change `trackCloseDecision` as spec.md sections 2 and 3 say: a per-track skip for a non-empty `supersededBy`, and the note block after the `[b]` list. At each adapter site of spec.md section 2, read the plan text once and read `<track folder>/metadata.json`. Set `supersededBy = supersededTarget(planText, metadataText)`, with `null` for a missing file. The sites are `plugins/opencode-measure-guard/src/guard.ts:286`, `mods/measure-guard/hooks/register.tsx:225`, and `plugins/dsh-measure-guard/src/guard.js:132`. In `metadataProblem` of `plugins/dsh-measure-guard/src/git-verification.js` line 45, skip the `actual_tasks` check when `closing.supersededBy` is a non-empty string. Write the two parity copies of `guards.ts`: `cp mods/measure-guard/hooks/guards.ts plugins/opencode-measure-guard/src/core/guards.ts`, and `sed "s|from './parse'|from './parse.ts'|" mods/measure-guard/hooks/guards.ts > plugins/dsh-measure-guard/src/core/guards.ts`. Keep the `ClosingTrack` line identical in the three types files and keep each header note of the two `types.ts` files. Run the suites again. Keep the passing outputs in `measure/runs/superseded_close_20261117/green-closeout.log`. Run `cd plugins/opencode-measure-guard && bun test`. Run `claude plugin test mods/measure-guard`. Run `cd plugins/dsh-measure-guard && node --test tests/*.test.js`. Run `bash plugins/opencode-measure-guard/scripts/check-parity.sh` and `bash plugins/dsh-measure-guard/scripts/check-parity.sh`. Run the two heavy-run gates of spec.md with `HEAVY_PRIORITY=p2 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh` and no shell redirection. Keep the outputs in `measure/runs/superseded_close_20261117/`. Record each failure and whether it already fails on origin/main. Do not fix a pre-existing failure. Commit `feat(guard): Close a superseded track with open tasks`.
- [ ] Task 1.2: records and closeout, with the commit flow of `measure/archive/role_spawn_route_20261117/plan.md`. Finalize `metadata.json`: status done, actual_tasks 3, completed "2026-11-17", lane light, and deviation_notes with the gate and closeout results. Add the five documentation texts of the Documentation text section, word for word. The CHANGELOG entry goes first under the first `### Features` heading of `## Unreleased`. The OpenCode sentence goes at the end of the Closeout guard bullet of `plugins/opencode-measure-guard/README.md` line 71. The mod sentence goes at the end of the Track close item of `mods/measure-guard/README.md` near line 89. The DSH sentence goes at the end of the Closeout guard bullet of `plugins/dsh-measure-guard/README.md` near line 158. The new first sentence replaces the old first sentence of `README.md` line 33, up to and including its closing bracket and full stop, and the rest of the line stays. Commit `chore(measure): Archive track 'Superseded closeout'` holds these record changes, the git mv of the track folder to `measure/archive/superseded_close_20261117/`, the finalized metadata.json, and the removal of the Active Tracks entry. Then the workflow commits run before the registry commit: `measure(plan): Mark task 'Task 1.2: records and closeout' as complete`, `measure(checkpoint): Checkpoint end of Phase 1 (superseded closeout)`, and `measure(plan): Mark phase 'Phase 1: Superseded closeout' as complete`. Then commit `chore(measure): Add the archived track 'Superseded closeout' to the registry` with the Archived Tracks entry at the end, [x], and the metadata description. Run `HEAVY_PRIORITY=p2 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh bash tests/dsh/test-registry.sh` with no shell redirection after the registry commit. Keep the output in `measure/runs/superseded_close_20261117/test-registry.log`. Then run `python3 skills/measure-orchestrator/scripts/measure_interphase_checks.py closeout --repo . --track superseded_close_20261117`. Keep the output in `measure/runs/superseded_close_20261117/closeout-check.log`. The closeout check is expected to exit 1. Only the missing closeout manifest is a FAIL, and the light lane adds one INFO line. Record the results in the plan and in metadata.json deviation_notes, in a `chore(measure): Record the closeout checks of 'Superseded closeout'` commit.
- [ ] Task: Measure - User Manual Verification 'Phase 1: Superseded closeout' (Protocol in workflow.md)

After the last commit of this phase, push chore/superseded-close to origin and open the pull request. Never merge the pull request.
