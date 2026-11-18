# Specification: Sub-box SHA rule

## Overview

The closeout check of the Measure orchestrator asks for a commit SHA on every completed task line in a plan. This includes indented sub-boxes. Many finished tracks use indented sub-boxes under a top-level task that carries a SHA. The check fails those tracks. The status command lists them as closeout candidates, but the closeout gate rejects them. This track changes the rule. A top-level completed task needs a SHA. An indented completed sub-box is covered when its nearest parent completed task has a SHA.

Source: PM request, 2026-11-18, light lane. Date needed 2026-11-18. Route: opencode/hy4-flash-free#high. The PM or Daniel merges; the worker does not push.

## The order (PM, verbatim)

> "in skills/measure-orchestrator/scripts/measure_interphase_checks.py, plan_closeout_feedback (line 826) asks for a commit SHA on every [x] box, indented sub-boxes too. Change it: a SHA is required on top-level task lines only. An indented [x] sub-box counts as covered when its nearest parent [x] line has a SHA. Unticked boxes ([ ] or [~]) still fail at every depth, except "deferred" lines, as today. Also make the status command's archive-candidate list use the same function, so status and the closeout gate always agree."

Why: Math has 16 finished tracks; status lists them as candidates, the gate fails 15 on sub-step lines under SHA'd Task lines.

## Decided design (record it; do not choose another)

### 1. plan_closeout_feedback

`plan_closeout_feedback(plan_path)` walks every checkbox line, matched as now with `r"^(\s*- \[([ ~x])\] (.+))$"` per line. `indent` is the length of the leading white space with tabs expanded to 4 columns.

- A line whose task text holds "deferred" (case-insensitive) gives no feedback, as today. It is still a parent for the lines below it, and it counts as covered.
- `status != "x"`: feedback `plan task is not complete: <line>` at every depth, as today.
- `status == "x"` and `indent == 0`: the line needs a SHA, matched with `\b[0-9a-f]{7,40}\b`; else `completed plan task lacks commit SHA: <line>`.
- `status == "x"` and `indent > 0`: the line is covered when it has its own SHA, or when its nearest parent is an `[x]` line that is covered. The nearest parent is the closest earlier checkbox line with a smaller indent. A sub-box with no parent line, or whose nearest parent is not `[x]` or not covered, needs its own SHA and gets the same "lacks commit SHA" text.

Keep the function signature and the feedback texts unchanged.

### 2. closeout_candidates

`closeout_candidates(repo, track_regex)` lists a track only when its plan exists and `plan_closeout_feedback(plan) == []`. Remove nothing else from status. `track_incomplete` stays for its other caller.

### 3. Scope

No other change to the checker.

## Tests (Red first)

New file `tests/spec_review_gate/test_subbox_sha.py`, in the style of `tests/spec_review_gate/test_fixture_paths.py` (importlib of the checker). Cases:

1. A SHA'd top-level `[x]` with an indented `[x]` sub-box without a SHA gives `[]`.
2. The same under a top-level `[x]` without a SHA gives two feedback lines: the parent and the child.
3. An indented `[ ]` sub-box under a SHA'd `[x]` parent gives one "not complete" line.
3b. An indented "deferred" `[ ]` sub-box gives `[]`.
3c. Two-level nesting where the middle line is covered by the top gives `[]`.
4. A temp repo fixture with `measure/tracks/` holding three tracks: one passes, one fails on a sub-box under a no-SHA parent, one has an open box. `closeout_candidates` equals the tracks whose `plan_closeout_feedback` is `[]`.

`tests/spec_review_gate/run.sh` discovers the new file through its default `test_*.py` glob.

Run the new file before the change. Keep the failing output in `measure/runs/subbox_sha_20261118/red.log`. Keep the passing output in `measure/runs/subbox_sha_20261118/green.log`.

## Gates

Each gate writes its output to its named log file under `measure/runs/subbox_sha_20261118/`.

| Gate | Command | Log file |
|---|---|---|
| Red | `python3 tests/spec_review_gate/test_subbox_sha.py` before the change | `red.log` |
| Green | `python3 tests/spec_review_gate/test_subbox_sha.py` after the change | `green.log` |
| Heavy run, spec review gate | `HEAVY_PRIORITY=p2 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh bash tests/spec_review_gate/run.sh` | `run-suites.log` |
| Heavy run, registry gate | `HEAVY_PRIORITY=p2 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh bash tests/dsh/test-registry.sh` | `test-registry.log` |
| Smoke before | `python3 skills/measure-orchestrator/scripts/measure_interphase_checks.py status --repo /home/daniebo/Desktop/ra-math-advantage` | `smoke.log` |
| Smoke after | the same status command after the change | `smoke.log` |

Run the two heavy-run gates with no shell redirection. Record the `closeout_candidates` count of both smoke runs in `smoke.log`.

## Functional Requirements

- **FR-1 (feedback).** Change `plan_closeout_feedback` as in design 1.
- **FR-2 (candidates).** Change `closeout_candidates` as in design 2. Leave `track_incomplete` in place.
- **FR-3 (tests).** Add the file of the Tests section. Run Red first. Keep `red.log` and `green.log`.
- **FR-4 (commit).** Commit on `chore/subbox-sha` with `fix(checker): Require a SHA on top-level task lines only`.
- **FR-5 (records).** `CHANGELOG.md` gets one entry as the first of the list under `### Bug Fixes` of `## Unreleased`. The entry has this exact text (one physical line):

  ```
  * **sub-box SHA rule:** the closeout check of `skills/measure-orchestrator/scripts/measure_interphase_checks.py` now requires a commit SHA on top-level task lines only. An indented `[x]` sub-box counts as covered when its nearest parent `[x]` line has a SHA. Unticked boxes still fail at every depth, except "deferred" lines. The status command's archive-candidate list uses the same function, so status and the closeout gate agree. Cause: Math has 16 finished tracks that status lists as candidates, but the closeout gate failed 15 of them on sub-step lines under SHA'd Task lines. Track `subbox_sha_20261118`.
  ```

  `README.md` line 33: replace its first sentence, up to and including its closing bracket and full stop, with:

  ```
  As of <the date of the archive commit>, the latest archived track is Sub-box SHA rule (the closeout check requires a SHA on top-level task lines only, and an indented sub-box is covered by its nearest parent's SHA).
  ```

  The worker writes the date of the archive commit in place of the placeholder. The rest of line 33 stays unchanged. The `completed` field of `metadata.json` holds that same date. Both changes ride in the Task 1.2 archive commit.
- **FR-6 (closeout).** Archive the track to `measure/archive/subbox_sha_20261118/`, move the registry entry to Archived Tracks with `[x]`, and record the gate results.

## Acceptance Criteria

- The new test file fails before the change and passes after it.
- The two heavy-run gates exit 0 with no shell redirection.
- The smoke log records the `closeout_candidates` count of both runs. The count after the change equals the number of tracks whose `plan_closeout_feedback` is `[]`.
- The closeout check fails only on the missing closeout manifest.

## Out of Scope

- No change to `track_incomplete`. Its final-acceptance caller stays.
- No change to any other checker command or to any other file in the checker.
- No change to the measure-guard hooks or plugins.
- No push. The PM or Daniel merges after the Claude review.
