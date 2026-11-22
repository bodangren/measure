# Implementation Plan: Guard spec-review route

Track: `guard_spec_review_route_20261123`
Spec: [./spec.md](./spec.md)

**All commits go on fix/guard_spec_review_route. Push only to origin/fix/guard_spec_review_route, never to main. Only the PM or Daniel merges.**

Test commands: `bash tests/spec_review_gate/run.sh`; `bash tests/dsh/run.sh` (from `measure/gates.json`). Run each long command through `/home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh` with `HEAVY_MIN_AVAIL_MB=1500 HEAVY_PRIORITY=p1`.

## Phase 1: Spec-review agent uses the spec-review route list (due 2026-11-24)

- [ ] Task 1.1 Red (new-behavior): in each of the three role-spawn test files (`mods/measure-guard/tests/role-spawn.test.ts`, `plugins/opencode-measure-guard/tests/role-spawn.test.ts`, `plugins/dsh-measure-guard/tests/role-spawn.test.js`) add one test: `ROLE_OF_AGENT['measure-spec-review']` is `'spec-review'` and `ROLE_OF_AGENT['measure-strategy']` stays `'strategy'`; in `mods/measure-guard` add one `roleSpawnDecision`/`approvedRoutes` test that a spec-review spawn is judged on the spec-review route list (follow the existing phase-acceptance test pattern). The new tests must fail before the change.
- [ ] Task 1.2 Green: apply the three one-line mapping changes (`'measure-spec-review': 'strategy'` to `'measure-spec-review': 'spec-review'` in the three `guards.ts` copies at line 204), then run the parity checks and the plugin test commands that exist (`bun test` in `mods/measure-guard` and `plugins/opencode-measure-guard`, `node --test` in `plugins/dsh-measure-guard`); record known failures as tech-debt rows, do not fix them.
- [ ] Task 1.3 Records: record the gate results in this plan; pre-merge rule: `bash tests/spec_review_gate/run.sh` and `bash tests/dsh/run.sh` both exit 0 before the merge.
