# Specification: Heavy-run guard refuses heavy commands outside heavy-run

## Overview

Five heavy runs passed outside `scripts/jobs/heavy-run.sh` in eight hours: build-graph, a decoy dev server, tsc, vite with Playwright, and Playwright. The role briefs state the rule, but role sessions drop it. A guard in measure-guard now refuses such commands with one line that names the heavy-run form.

Source: PM assignment A-new2, due 2026-11-26, light lane, feature track.

## Functional Requirements

- **FR-1 (Pure matcher).** `heavyRunDecision(agent, command)` lives in `mods/measure-guard/hooks/guards.ts`. It takes the session agent (`string | null`) and the shell command (`string`). It returns `null` (allow) or `{ deny }` with the FR-4 text. The parity copies follow: `plugins/opencode-measure-guard/src/core/guards.ts` stays byte-identical, and `plugins/dsh-measure-guard/src/core/guards.ts` keeps its `./parse.ts` transform. Both `check-parity.sh` scripts pin the copies.
- **FR-2 (Orchestrator exemption).** An agent whose name contains `orchestrator` (case-insensitive) is exempt. The names in `agents/` confirm the set: `measure-orchestrator` and `measure-orchestrator-audit`. A null, empty, or unknown agent gets no exemption: the guard applies.
- **FR-3 (Patterns).** The matcher splits the command into segments (FR-5) and tests each segment by its argv[0] basename after it strips one runner prefix (`npx`, `bunx`, or the pair `bun x`). A segment is heavy when one rule fires:
  - Dev server: basename in {`vite`, `http-server`, `serve`}; or basename `next` with first subcommand `dev` or `start`; or `node -e` / `node --eval` whose code contains `listen(`.
  - Capture: basename `playwright` (any args); or basename in {`google-chrome`, `chrome`, `chromium`, `chromium-browser`} with `--headless` and one of `--screenshot`, `--print-to-pdf`, `--dump-dom`.
  - Full tsc: basename `tsc` with `--noEmit` and no positional file operand.
  - Full suite: `bun test`, `npm test`, `yarn test`, `pnpm test`, `vitest` (or `vitest run`), `jest`, `pytest`, or `playwright test`, each with no positional file operand.
  - Render: basename `ffmpeg`; or basename `remotion` with first subcommand `render` or `still`.
  - Build-graph: basename `build-graph` (any args).
  - The heavy-run form passes: the command contains the path `scripts/jobs/heavy-run.sh` at any prefix (for example `/home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh`), with or without `HEAVY_*` assignments before it. The whole command then passes.
- **FR-4 (Deny text).** The deny is one line with this exact shape:
  `measure-guard: heavy <class> runs only through heavy-run: HEAVY_PRIORITY=p1 HEAVY_MIN_AVAIL_MB=1500 /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c '<part>'. If this block is wrong, the user can run /measure-off.`
  `<class>` is one of `dev-server`, `capture`, `tsc-full`, `test-suite`, `render`, `build-graph`. `<part>` is the offending segment (the full command when it has one segment). The segment keeps no newline.
- **FR-5 (Compounds).** The matcher splits on `&&`, `||`, `;`, `|`, and newlines outside single and double quotes. It checks each part alone. A heavy part outside the heavy-run form refuses the command. The deny names the offending part.
- **FR-6 (Allowed).** Commands whose argv[0] is not a FR-3 tool pass: `git`, `grep`, `ls`, `cat`. `bun test` or `node --test` with exactly one named file passes. `tsc` with one or more file operands is not full and passes. `bun install` stays under the existing brief rule and is out of scope.
- **FR-7 (False positives).** These pass because matching reads argv[0] and flags, not substrings: `grep vite`, `echo vite`, `git commit -m "vite"`, `echo "npx playwright test"`, `cat vite.config.ts`. Each has a test.
- **FR-8 (Hook wiring).** `Guard.onToolBefore` in `plugins/opencode-measure-guard/src/guard.ts` calls `heavyRunDecision(event.agent, command)` when the tool is a shell tool (`isShellTool`), the command (`commandOf`) is not null, the mode is `guard` or `strict`, and no bypass is set. A deny throws `Error(decision.deny)` through the existing `deny` path. Only the OpenCode hook wires the guard. The dsh plugin keeps its core copy in parity and gains no hook.
- **FR-9 (Installer).** `bin/install-measure-skill` already ships `plugins/opencode-measure-guard` (minus `tests/`) to `~/.config/opencode/plugins/opencode-measure-guard` through `bin/install-targets.tsv`. No installer change is needed. Task 1.3 verifies the installed copy with `--check`.

## Acceptance Criteria

- Each FR-3 class outside heavy-run is refused with the one-line FR-4 deny.
- Each FR-7 command passes.
- The heavy-run form (any prefix, with or without `HEAVY_` assignments) passes.
- Agents with `orchestrator` in the name pass; a null or unknown agent is guarded.
- Both parity checks pass, CI (job checks) is green, and the installer `--check` is clean.

## Out of Scope

- No change to `bun install` handling.
- No hook wiring in the dsh plugin.
- No change to role brief text; the guard is the backstop.
- No new test suite beyond the matcher tests and the hook deny tests.

## Open Questions

- None. This spec fixes the matcher, the exemption, the patterns, the deny text, the compound rule, the allow-list, the false positives, and the wiring.
