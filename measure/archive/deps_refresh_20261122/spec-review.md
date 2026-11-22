Author model: opencode-go/muse-spark-1.3-contributor

# Spec review round 1 (audited head 166b501, verdict FAIL)

## What this track proposes

This chore track updates every package in extensions/measure-status and plugins/opencode-measure-guard to the latest working version. It removes all critical and high advisories, or records a PM-accepted reason for any advisory with no fixed version. It lists each remaining moderate or low advisory with a reason by 2026-11-25. Phase 1 clears critical and high advisories by 2026-11-23; Phase 2 updates the rest and closes the track. All work stays on chore/deps-refresh and is pushed only to origin/chore/deps-refresh.

## How the current system works, per this spec

Per the spec, extensions/measure-status is an OpenChamber 2.7.1 and newer panel extension with five dev dependencies and a committed esbuild bundle at panel/main.js. plugins/opencode-measure-guard is a Bun-loaded OpenCode 2 plugin with pinned dev dependencies and peer floors of @opencode/plugin >=2.0.0, @opentui/core >=0.6.6, @opentui/solid >=0.6.6 and solid-js >=1.9.0. The 2026-11-22 bun audit recorded 21 advisories in measure-status (4 critical, 5 high, 11 moderate, 1 low) and 8 in the guard (1 critical, 4 high, 3 moderate). Verification uses tsc, vitest, bun test, check-parity.sh and heavy-run.sh, with the bundle rebuilt by esbuild.

## Findings

- F1 [Blocker] plan.md Task 1.1: The red audit check has no named file, command, or exit-code contract, and Task 1.3 names no bundle equality command.
- F2 [Blocker] plan.md Tasks 1.2 and 2.1: No target versions and no rule for a major upgrade that breaks tests.
- F3 [Blocker] plan.md Tasks 1.2 and 2.1: Neither phase names the files to create or change.
- F4 [Blocker] plan.md Tasks 1.3 and 2.2: The record destinations are unnamed.
- F5 [Major] plan.md Phase 1 and Phase 2: No normal or edge test cases are named.
- F6 [Nit] spec.md Overview: The PM dates 2026-11-23 and 2026-11-25 appear in the spec but are not attached to plan tasks.

## Round 1 disposition

- F1 FIX: named `tests/deps_audit/run.sh` with the exit-code contract, the allow file, the fixture env var, and the bundle equality command.
- F2 FIX: named Phase 1 minimum versions, the Phase 2 latest rule, the major-step rule, and the peer rule with the solid-js 2 condition.
- F3 FIX: named the per-phase file lists (package.json, bun.lock, bundle, folder-scoped fixes, `tests/deps_audit/*`, advisories.md).
- F4 FIX: named `measure/tracks/deps_refresh_20261122/advisories.md` with its contents; Task 1.3 and Task 2.2 write to it.
- F5 FIX: named the Red cases in `tests/deps_audit/test.sh` with fixtures plus the Phase 2 live case.
- F6 FIX: put the due date on each task (Phase 1 by 2026-11-23; Phase 2 by 2026-11-25).

# Spec review round 2 (audited head 3372b1b, verdict FAIL)

Reviewer: measure-spec-review subagent (opencode-go/hy4-flash-free).

## What this track proposes

This chore track updates every package in extensions/measure-status and plugins/opencode-measure-guard to the latest working version. Phase 1 takes the smallest version steps that clear all critical and high advisories by 2026-11-23, using bun overrides where a parent has no fixed release. Phase 2 takes the latest working versions for the rest and writes the reasoned moderate and low list by 2026-11-25. A new audit check under tests/deps_audit/ fails on unapproved critical or high advisories, and the record file is advisories.md. All work stays on chore/deps-refresh and is pushed only to origin/chore/deps-refresh.

## How the current system works, per this spec

Per the spec, extensions/measure-status is an OpenChamber 2.7.1 and newer panel extension with five dev dependencies and a committed esbuild bundle at panel/main.js. plugins/opencode-measure-guard is a Bun-loaded OpenCode 2 plugin with pinned dev dependencies and peer floors of @opencode/plugin >=2.0.0, @opentui/* >=0.6.6 and solid-js >=1.9.0. The 2026-11-22 bun audit recorded 21 advisories in measure-status (4 critical, 5 high, 11 moderate, 1 low) and 8 in the guard (1 critical, 4 high, 3 moderate). Verification uses tsc, vitest, bun test, check-parity.sh and heavy-run.sh, with the bundle rebuilt by esbuild.

## Findings

- F7 [Blocker] plan.md Version rule: The seroval floor >=1.6.1 leaves four high advisories in place. Rationale: bun audit --json lists seroval highs at <=1.6.2 and <=1.6.7, so the smallest version that clears them is 1.6.8, and the npm registry confirms 1.8.2 exists; FR-2 and the acceptance criteria require 0 high, which contradicts the same line's promise of the smallest change that clears every critical and high.
- F8 [Major] spec.md Scope: The line 'No other folder changes' contradicts the amended record file and audit-check folder. Rationale: FR-2, FR-3 and the acceptance criteria now name measure/tracks/deps_refresh_20261122/advisories.md, and the plan creates tests/deps_audit/test.sh, run.sh, allow.txt and fixtures/; the scope line must name these exceptions.
- F9 [Major] plan.md Ownership and Task 1.1: Red owns test.sh and fixtures while Green owns run.sh, but Task 1.1 asks Red to prove a live run exits 1. Rationale: run.sh does not exist at Red time, so the live case cannot return exit 1 then; the plan should name who creates run.sh before the live proof and when that proof is recorded.

## Round 2 disposition

- F7 FIX: raised the seroval floor to >=1.6.8 and stated the floors are minimums read from `bun audit --json` at Green time.
- F8 FIX: named `tests/deps_audit/` and `measure/tracks/deps_refresh_20261122/advisories.md` as the only scope exceptions.
- F9 FIX: stated the Red and Green ownership of `run.sh`, the Red state, and the live-case timing.
