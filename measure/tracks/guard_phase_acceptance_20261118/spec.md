# Specification: Guard phase acceptance

## Overview

The guard maps `measure-phase-acceptance` to the wrong ra-quota role. It uses `acceptance`. The routes file has a `phase-acceptance` role. The `ra-quota pick phase-acceptance` route `opencode-go/glm-5.3#high` is denied by the guard. The map must use `phase-acceptance`.

Source: PM request, 2026-11-18, light lane. One PR; the PM merges.

## Decided change

In `ROLE_OF_AGENT`, map `measure-phase-acceptance` to `phase-acceptance`. Change all three copies (line 193 in each):

- `mods/measure-guard/hooks/guards.ts`
- `plugins/dsh-measure-guard/src/core/guards.ts`
- `plugins/opencode-measure-guard/src/core/guards.ts`

## Tests

Add a guard test that fails today. The agent `measure-phase-acceptance` must resolve to the `phase-acceptance` route list of `~/.config/ra-quota/routes.json` (or the fixture the existing guard tests use). Find the existing guard tests (grep `ROLE_OF_AGENT` and `final-acceptance` in the test files of the three packages) and follow their style. Then make the change. Run each package test command (`bun test` or `bunx vitest`, as the package uses) until it passes. Keep the three copies equal where they were equal before. Run any copy-equality test.

## Records

Add a short `CHANGELOG.md` line if the repo keeps one for guard changes. No test counts in CHANGELOG, spec, or plan.
