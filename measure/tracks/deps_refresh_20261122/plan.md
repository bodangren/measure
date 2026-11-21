# Implementation Plan: Dependency refresh for measure-status and opencode-measure-guard

Track: `deps_refresh_20261122`
Spec: [./spec.md](./spec.md)

**All commits go on chore/deps-refresh. Push only to origin/chore/deps-refresh, never to main. Only the PM or Daniel merges.**

Test commands: `cd extensions/measure-status && bunx tsc -p . --noEmit && bunx vitest run`; `cd plugins/opencode-measure-guard && bun test && bun x tsc --noEmit -p . && bash scripts/check-parity.sh`. Build command: `cd extensions/measure-status && bunx esbuild panel/main.ts --bundle --format=iife --platform=browser --outfile=panel/main.js`. Run each long command through `/home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh` with `HEAVY_MIN_AVAIL_MB=1500`. Repo gates: `measure/gates.json` PROJECT_LINT and PROJECT_CHECKS.

Peer range rule: opencode-measure-guard keeps `@opencode/plugin >=2.0.0` and the other current floors. A floor rises only when the installed major drops the OpenCode 2 API the plugin uses.

## Phase 1: Critical and high advisories

- [ ] Task 1.1: Red failing check for critical and high advisories (a script or test that runs `bun audit` in both folders and fails on any critical or high), with the before counts recorded (measure-status 21: 4 critical, 5 high, 11 moderate, 1 low; opencode-measure-guard 8: 1 critical, 4 high, 3 moderate)
- [ ] Task 1.2: Green package updates and code fixes for breaking changes, with the rebuilt `panel/main.js` bundle committed
- [ ] Task 1.3: records (audit output at 0 critical and 0 high, or a written reason per remaining item; all command exits; the bundle equality check)

## Phase 2: Remaining updates and the moderate/low list

- [ ] Task 2.1: latest working versions for the rest, with all commands green and the rebuilt bundle
- [ ] Task 2.2: records (the moderate/low list with a reason per item, the peer range statement, closeout)
