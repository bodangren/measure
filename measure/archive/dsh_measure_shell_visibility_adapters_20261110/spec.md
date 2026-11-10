# Specification: DSH Measure shell visibility for every adapter

## Overview

The DSH adapter already path-checks shell writes: its bounded grammar (`src/shell.js`)
extracts `>`/`>>`/`>|`, `tee`, `sed -i`, and `cp`/`mv`/`install`/`ln` targets and runs the
edit/TDD guards on them. The Claude mod and the OpenCode adapter have the same grammar
nowhere: the mod's `tool.call` and the OpenCode `onToolBefore` inspect only the file-tool
paths, so `sed -i`, a redirect, or a copy can change a source file without the edit/TDD
guards seeing it — the known "edit guard does not see Bash writes" row, now scoped to the
two non-DSH adapters.

This track makes the grammar shared core (one implementation in `guards.ts`, so the parity
gates hold all three copies together), keeps the DSH module as a re-export, and wires the
mod and the OpenCode adapter: for a shell call, every extracted target is resolved against
the session root and goes through the edit guard and the strict TDD guard. The DSH node
suite covers the shared grammar; each adapter's own TypeScript suite gains the wiring cases
that its normal runner executes.

## Functional Requirements

- **FR-1 (shared grammar).** `shellWritePaths` and its helpers move from
  `plugins/dsh-measure-guard/src/shell.js` into the shared core
  (`mods/measure-guard/hooks/guards.ts`); the mod source is the source of truth and the DSH
  and OpenCode copies stay mechanically identical (parity gates). The DSH `src/shell.js`
  becomes a one-line re-export so its imports and tests are unchanged.
- **FR-2 (mod wiring).** `mods/measure-guard/hooks/register.tsx` `tool.call`: for `Bash`,
  each `shellWritePaths(command)` target (absolute kept, relative joined against the
  session root) goes through `editDecision` and `tddDecision`; the first denial wins. The
  commit handling is unchanged.
- **FR-3 (OpenCode wiring).** `plugins/opencode-measure-guard/src/guard.ts` `onToolBefore`:
  the same targets (relative against `this.root`) go through `editGuard` and
  `tddDecision`; the commit handling is unchanged.
- **FR-4 (tests).** The DSH node suite keeps covering the grammar through the re-export;
  `mods/measure-guard/tests/edit-guard.test.ts` and
  `plugins/opencode-measure-guard/tests/edit-guard.test.ts` gain cases: a `sed -i`/redirect
  on a source file is denied without a `[~]` task and allowed with one, a target inside
  `measure/` passes, and a strict-mode shell write is denied before the Red phase.
- **FR-5 (records).** The "edit guard does not see Bash writes" tech-debt row records the
  closure for all three adapters and the residual (the closeout guard still cannot read a
  shell write's after-text; the end-of-turn check is the backstop). The mod and OpenCode
  READMEs state the shell-write coverage; `CHANGELOG.md` records it.
- **FR-6 (verification).** node 352/352 (grammar through the re-export), both parity gates
  ok, srg 11/11, CLI 14/14; the installed plugin is reloaded and the live check passes; the
  track is archived with a manifest-only closeout FAIL. The adapter wiring cases are added
  to their TS suites; those runners are not available in this workspace, so the wiring is
  verified by review and by the shared-core tests, and that limitation is recorded.

## Non-Functional Requirements

- **NFR-1 (bounded).** No new grammar; the moved code is byte-equivalent apart from the
  export placement.
- **NFR-2 (no DSH behavior change).** The DSH adapter's results are unchanged (its own
  suite proves it).

## Acceptance Criteria (track level)

- Given a shell command writing a source file, Then the mod and OpenCode guards deny it
  without a `[~]` task, using the shared grammar.
- Given the DSH adapter, Then its shell tests pass through the re-export and parity holds.
- Given the gates, Then node/parity/srg/CLI are green and the track is archived.
