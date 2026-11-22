# Specification: Test S2 subagent pin matches the orchestrator subagent rules

## Overview

This chore track updates the stale subagent pin in `tests/spec_review_gate/test_s2_role_docs.sh`. Main fails the check "subagent rules: the orchestrator role allows the four global subagents in order" with "the subagent rules differ from the eight pairs". PR #39 (f208c55) added the `www-publisher` allow row to `agents/measure-orchestrator.md`. The agent file is right. The test pin is stale. This track updates the pin to the nine pairs now in the file. The agent file does not change.

Source: PM request, 2026-11-22. Type chore, lane light. Due 2026-11-22. Main must not stay red overnight.

## Scope

- `tests/spec_review_gate/test_s2_role_docs.sh`: the check title and the expected subagent list only.
- No other files change. `agents/measure-orchestrator.md` does not change.

## Functional requirements

- FR-1: The check title names the five global subagents. The expected list holds the nine pairs in this order: `"*"|deny`, `"measure-*"|allow`, `"coder"|allow`, `"www-publisher"|allow`, `"copywriter"|allow`, `"fact-gate-checker"|allow`, `"thai-writer"|allow`, `"print-proof-auditor"|allow`, `"change-quality-reviewer"|allow`. The pass message names the nine pairs. The fail message names the nine pairs.
- FR-2: The Red breakage proof uses file copies only. The check fails on a copy of the orchestrator file without the `www-publisher` row. The check fails on a copy with the rows reordered. The live agent file does not change at Red or at Green.
- FR-3: Both gate commands exit 0 before the merge: `bash tests/spec_review_gate/run.sh` and `bash tests/dsh/run.sh`. Each command runs through `/home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh` with `HEAVY_MIN_AVAIL_MB=1500` and `HEAVY_PRIORITY=p1`.
- FR-4: Work is pushed to `origin/fix/test-s2-subagent-pin` only. Only the PM or Daniel merges. No push to main happens from this track.

## Commands

- `bash tests/spec_review_gate/run.sh`
- PROJECT_CHECKS: `bash tests/dsh/run.sh` (from `measure/gates.json`)
- Each long command runs through `/home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh` with `HEAVY_MIN_AVAIL_MB=1500 HEAVY_PRIORITY=p1`.

## Acceptance criteria

- The updated check passes against the live `agents/measure-orchestrator.md`.
- The Red breakage proof fails on both file copies.
- `bash tests/spec_review_gate/run.sh` and `bash tests/dsh/run.sh` both exit 0.
- `agents/measure-orchestrator.md` is byte-identical before and after.

## Out of scope

- Changes to `agents/measure-orchestrator.md` stay out of scope.
- Changes to any other check in `test_s2_role_docs.sh` stay out of scope.
- Merges to main stay out of scope. Only the PM or Daniel merges.
