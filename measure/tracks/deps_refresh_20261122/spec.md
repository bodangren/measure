# Specification: Dependency refresh for measure-status and opencode-measure-guard

## Overview

Both JS folders carry known advisories. This track updates every package to the latest working version. It fixes all critical and high advisories. It records each remaining moderate or low advisory with a reason.

Source: PM P3 order, 2026-11-21. Type chore, lane light. Due dates: critical and high fixed by 2026-11-23; the moderate/low list done by 2026-11-25.

## Scope

- `extensions/measure-status` (has `package.json` and `bun.lock`).
- `plugins/opencode-measure-guard` (has `package.json` and `bun.lock`).
- `tests/deps_audit/` (the audit check, its tests, fixtures and allow file) and `measure/tracks/deps_refresh_20261122/advisories.md` (the record file) are the only other changes. No feature work. No behavior change except what a package update forces.

## Before counts (bun audit, 2026-11-22)

- extensions/measure-status: 21 (4 critical, 5 high, 11 moderate, 1 low). Paths: vitest <3.2.6, happy-dom <20, tinypool via vitest, zod <4.6.6 via @openchamber/sdk, launch-editor/vite/esbuild via vitest, @vitest/mocker.
- plugins/opencode-measure-guard: 8 (1 critical, 4 high, 3 moderate). Paths: seroval via solid-js, minimatch and glob via @opencode/plugin and @opentui/solid.

## Functional requirements

- FR-1: Every package in both folders moves to the latest working version. A working version passes all commands in the Commands section.
- FR-2: `bun audit` shows 0 critical and 0 high advisories in both folders. When no fixed version exists for an advisory, the track records a written reason per remaining item in `measure/tracks/deps_refresh_20261122/advisories.md`. The PM accepts each reason.
- FR-3: The track lists each remaining moderate or low advisory with its reason in the same file. Examples: no fixed version, Windows-only, dev-server only.
- FR-4: Peer floors in opencode-measure-guard stay (`@opencode/plugin >=2.0.0`, `@opentui/* >=0.6.6`, `solid-js >=1.9.0`). A floor rises only when the installed major drops the OpenCode 2 API the plugin uses. The plugin takes solid-js 2 only when it still loads with the OpenCode 2.0.x host. The plan states this rule.
- FR-5: The committed bundle `extensions/measure-status/panel/main.js` equals a fresh build from the updated sources.
- FR-6: Work is pushed to `origin/chore/deps-refresh` only. Only the PM or Daniel merges.

## Commands

- measure-status: `bunx tsc -p . --noEmit`, `bunx vitest run`, `bunx esbuild panel/main.ts --bundle --format=iife --platform=browser --outfile=panel/main.js`.
- opencode-measure-guard: `bun test`, `bun x tsc --noEmit -p .`, `bash scripts/check-parity.sh`.
- Each long command runs through `/home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh` with `HEAVY_MIN_AVAIL_MB=1500`.
- Repo gates: `measure/gates.json` PROJECT_LINT and PROJECT_CHECKS.

## Acceptance criteria

- `bun audit` shows 0 critical and 0 high in both folders, or a written reason per remaining item exists which the PM accepts.
- All commands above exit 0.
- The moderate/low list is in `measure/tracks/deps_refresh_20261122/advisories.md`.

## Out of scope

- Package updates outside the two folders stay out of scope.
- Feature work and behavior changes stay out of scope.
- Merges to main stay out of scope. Only the PM or Daniel merges.
