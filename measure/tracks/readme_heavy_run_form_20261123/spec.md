# Specification: README uses the heavy-run form

## Overview

The README of `plugins/opencode-measure-guard` shows bare `bun test` and bare `bun x tsc --noEmit -p .`. The heavy-run guard refuses these forms in a role session. Roles read the README and copy its commands. This track fixes the README and lists the guard.

Source: PM order (route 1), light lane, chore track, due 2026-11-26. It closes the README tech-debt row of 2026-11-23.

## Functional Requirements

- **FR-1 (Checks block).** Section `## Checks` shows two commands in the heavy-run form. Each line starts with `HEAVY_PRIORITY=p1 HEAVY_MIN_AVAIL_MB=1500 /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c '<cmd>'`. The test command is `'bun test'`. The type command is `'timeout 120 bun install && bun x tsc --noEmit -p .'`. One new sentence follows the code block: "The heavy-run guard refuses a bare suite or a bare `tsc --noEmit` in a role session; run both through `scripts/jobs/heavy-run.sh` as shown."
- **FR-2 (Guards bullet).** Section `## Guards` gains one bullet after the Edit guard bullet. The bullet title is `**Heavy-run guard.**`. It names mode `guard` or `strict`. It names role sessions (an agent name without `orchestrator`). It lists the refused classes outside `scripts/jobs/heavy-run.sh`: a dev server, a Playwright or Chrome capture, a full `tsc --noEmit` or `tsc -b`, a full test suite, a render, or `build-graph`. It names the matcher `heavyRunDecision` in `src/core/guards`. It states the matcher reads the first word of each part after `NAME=value` assignments and one `npx`/`bunx` prefix. It states the deny is one line and names the heavy-run form. It states version 1 checks direct commands only. It states a wrapper (`env`, `timeout`, `sudo`) or a `bash -c` string is not checked.
- **FR-3 (Guards intro).** The Guards intro sentence changes at most one clause. The new text covers the shell tools. No other meaning changes.
- **FR-4 (Nothing else moves).** No other line of the README changes. Line breaks and spacing stay the same outside FR-1 through FR-3.
- **FR-5 (Contract test).** The test `tests/readme/test-readme-heavy-run.sh` with runner `tests/readme/run.sh` checks the README. The runner has the same shape as `tests/ci/run.sh`. The test is local only and never runs in CI. It checks that the Checks block holds no line that starts a bare `bun test` or `bun x tsc` outside the heavy-run form. It checks both heavy-run lines with the exact prefix. It checks the new sentence. It checks the Heavy-run guard bullet mentions `heavyRunDecision` and `direct commands only`. It checks every other README line is unchanged against `git show cd3c41b:plugins/opencode-measure-guard/README.md`. It allows only the changed block, the new bullet, and one clause on line 68. The test fails before the README edit.

## Acceptance Criteria

- The Checks block uses the heavy-run form for both commands.
- The Guards section lists the heavy-run guard.
- The contract test passes after the edit and fails before it.
- The README tech-debt row closes at closeout.

## Out of Scope

- No code change.
- No CI wiring for the new test.
- No change to the other tech-debt rows.
