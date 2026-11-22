# Specification: Guard spec-review route

## Overview

The measure-guard spawn-route guard maps each `measure-*` agent to a ra-quota role. It checks a role spawn against the approved route list of that role. The map sends the agent `measure-spec-review` to the role `strategy`. It must send it to the role `spec-review`. The `ra-quota roles` list holds the `spec-review` role. A spec-review spawn now faces the strategy route list instead of the spec-review route list.

Source: PM order, 2026-11-23, light lane, chore track. One mapping line changes in three parity copies.

## Functional Requirements

- **FR-1 (Red tests).** In each of the three role-spawn test files, add one test: `ROLE_OF_AGENT['measure-spec-review']` is `'spec-review'`, and `ROLE_OF_AGENT['measure-strategy']` stays `'strategy'`. The files are `mods/measure-guard/tests/role-spawn.test.ts`, `plugins/opencode-measure-guard/tests/role-spawn.test.ts`, and `plugins/dsh-measure-guard/tests/role-spawn.test.js`. In `mods/measure-guard`, add one `roleSpawnDecision`/`approvedRoutes` test: a spec-review spawn is judged on the spec-review route list. Follow the existing phase-acceptance test pattern. The new tests fail before the change.
- **FR-2 (Green change).** Change one mapping line in each of the three parity copies: `mods/measure-guard/hooks/guards.ts` line 204, `plugins/dsh-measure-guard/src/core/guards.ts` line 204, `plugins/opencode-measure-guard/src/core/guards.ts` line 204. Each line changes from `'measure-spec-review': 'strategy'` to `'measure-spec-review': 'spec-review'`. Run the parity checks (`plugins/*/scripts/check-parity.sh`) and the plugin test commands that exist (`bun test` in `mods/measure-guard` and `plugins/opencode-measure-guard`, `node --test` in `plugins/dsh-measure-guard`). Record known failures as tech-debt rows. Do not fix them.
- **FR-3 (Gates).** Run each long command through `/home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh` with `HEAVY_MIN_AVAIL_MB=1500 HEAVY_PRIORITY=p1`. Pre-merge rule: `bash tests/spec_review_gate/run.sh` and `bash tests/dsh/run.sh` both exit 0 before the merge.

## Acceptance Criteria

- Each new Red test fails before the mapping change and passes after it.
- `bash plugins/opencode-measure-guard/scripts/check-parity.sh` exits 0.
- `bash plugins/dsh-measure-guard/scripts/check-parity.sh` exits 0.
- `bash tests/spec_review_gate/run.sh` exits 0.
- `bash tests/dsh/run.sh` exits 0.

## Out of Scope

- No change to any other agent-to-role mapping.
- No change to ra-quota itself or to `~/.config/ra-quota/routes.json`.
- No change to any role file under `agents/`.
- No fix for known test failures; they stay as tech-debt rows.
