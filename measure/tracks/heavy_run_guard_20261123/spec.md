# Specification: Heavy-run guard refuses heavy commands outside heavy-run

## Overview

Five heavy runs passed outside `scripts/jobs/heavy-run.sh` in eight hours: build-graph, a decoy dev server, tsc, vite with Playwright, and Playwright. The role briefs state the rule, but role sessions drop it. A guard in measure-guard now refuses such commands with one line that names the heavy-run form.

Source: PM assignment A-new2, due 2026-11-26, light lane, feature track.

## Functional Requirements

- **FR-1 (Pure matcher).** `heavyRunDecision(agent, command)` lives in `mods/measure-guard/hooks/guards.ts`. It takes the session agent (`string | null`) and the shell command (`string`). It returns `null` (allow) or `{ deny }` with the FR-4 text. The parity copies follow: `plugins/opencode-measure-guard/src/core/guards.ts` stays byte-identical, and `plugins/dsh-measure-guard/src/core/guards.ts` keeps its `./parse.ts` transform. Both `check-parity.sh` scripts pin the copies.
- **FR-2 (Orchestrator exemption).** An agent whose name contains `orchestrator` (case-insensitive) is exempt. The names in `agents/` confirm the set: `measure-orchestrator` and `measure-orchestrator-audit`. A null, empty, or unknown agent gets no exemption: the guard applies.
- **FR-3 (Patterns).** The matcher splits the command into segments (FR-5) and judges each segment alone. For each segment it strips leading `NAME=value` assignments, then strips one runner prefix (`npx`, `bunx`, the pair `bun x`, or the pair `npm exec --`). It then reads argv[0] by basename. A segment is heavy when the first firing rule in this fixed order fires: dev-server, capture, tsc-full, test-suite, render, build-graph.
  - Dev server: basename in {`vite`, `http-server`, `serve`}; or basename `next` with first subcommand `dev` or `start`; or `node -e` / `node --eval` whose code contains `listen(`. `CI=1 vite` is a dev server (refused).
  - Capture: basename `playwright` with any args; or basename in {`google-chrome`, `chrome`, `chromium`, `chromium-browser`} with `--headless` and one of `--screenshot`, `--print-to-pdf`, `--dump-dom`.
  - Full tsc: basename `tsc` with `--noEmit` and no file operand; or basename `tsc` with `-b` / `--build`.
  - Full suite: each with no file operand: `bun test`, `bun run test`, `npm test`, `npm run test`, `yarn test`, `yarn run test`, `pnpm test`, `pnpm run test`, `vitest` (or `vitest run`), `jest`, `pytest`, or `node --test`. `npm run test` and bare `node --test` are refused; `node --test one-file.test.js` passes.
  - Render: basename `ffmpeg`; or basename `remotion` with first subcommand `render` or `still`.
  - Build-graph: basename `build-graph` (any args).
  - File operand: a positional operand is an argument that does not start with `-`, is not the value of a value-taking option, and is not a subcommand word (`run`, `test`, `start`). Value-taking options: for `tsc`: `-p`, `--project`, `--outDir`, `--rootDir`, `--target`, `--module`, `--lib`, `--jsx`, `--moduleResolution`, `--types`, `--typeRoots`, `--declarationDir`, `--tsBuildInfoFile`; for `vitest`, `jest`, and `bun test`: `--reporter`, `--config` / `-c`, `--project`, `--testNamePattern` / `-t`, `--timeout`, `--bail`, `--coverage-reporter`, `--shard`. An option written `--name=value` is one token and takes no separate value. So `tsc --noEmit -p tsconfig.json` has no operand and is full (refused); `vitest run --reporter verbose` is full (refused); `tsc --noEmit src/a.ts` and `bun test tests/a.test.ts` pass. Each has a test.
  - Heavy-run form: a segment passes as the heavy-run form when its argv[0], after the leading `NAME=value` assignments are stripped, has basename `heavy-run.sh`, at any path prefix. The `heavy-run -c '<cmd>'` argument is one quoted token, so the matcher never looks inside it. A segment that only mentions the path is not the form: `echo scripts/jobs/heavy-run.sh` has argv[0] `echo`. Test: `echo scripts/jobs/heavy-run.sh; vite` is refused.
- **FR-4 (Deny text).** The deny is one line with this exact shape:
  `measure-guard: heavy <class> runs only through heavy-run: HEAVY_PRIORITY=p1 HEAVY_MIN_AVAIL_MB=1500 /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c '<part>'. If this block is wrong, the user can run /measure-off.`
  `<class>` is the first firing class in the FR-3 order: `dev-server`, `capture`, `tsc-full`, `test-suite`, `render`, `build-graph`. `<part>` is the offending segment (the full command when it has one segment). The segment keeps no newline.
- **FR-5 (Compounds).** The matcher splits on `&&`, `||`, `;`, `|`, and newlines outside single and double quotes. It checks each part alone. A heavy part outside the heavy-run form refuses the command. The deny names the offending part.
- **FR-6 (Allowed).** Commands whose argv[0] is not a FR-3 tool pass: `git`, `grep`, `ls`, `cat`. `bun test` or `node --test` with exactly one named file passes (`node --test one-file.test.js`, `bun test tests/a.test.ts`). `tsc` with one or more file operands is not full and passes (`tsc --noEmit src/a.ts`). `bun install` stays under the existing brief rule and is out of scope.
- **FR-7 (False positives).** These pass because matching reads argv[0] and flags, not substrings: `grep vite`, `echo vite`, `git commit -m "vite"`, `echo "npx playwright test"`, `cat vite.config.ts`. Each has a test.
- **FR-8 (Hook wiring).** `Guard.onToolBefore` in `plugins/opencode-measure-guard/src/guard.ts` calls `heavyRunDecision(event.agent, command)` when the tool is a shell tool (`isShellTool`), the command (`commandOf`) is not null, the mode is `guard` or `strict`, and no bypass is set. A deny throws `Error(decision.deny)` through the existing `deny` path. Only the OpenCode hook wires the guard. The dsh plugin keeps its core copy in parity and gains no hook.
- **FR-9 (Installer).** `bin/install-measure-skill` stages `plugins/opencode-measure-guard` (minus `tests/`) through `bin/install-targets.tsv`. Task 1.3 checks that the targets file covers the changed plugin files (`src/guard.ts`, `src/core/guards.ts`) and that the installer staging includes them: read the installer, use its dry-run or list mode when one exists, else grep the targets file. The installer reads main, so a branch-time `--check` proves nothing about the installed copy. The installed-copy proof runs after the PM merges: the orchestrator runs `bin/install-measure-skill`, then `bin/install-measure-skill --check`, then `diff -r` of the installed plugin against the repo plugin (minus `tests/`), and reports the result to the PM.

## Acceptance Criteria

- Each FR-3 class outside heavy-run is refused with the one-line FR-4 deny.
- Each FR-7 command passes.
- The heavy-run form (per segment, any prefix, with or without `HEAVY_` assignments) passes.
- Agents with `orchestrator` in the name pass; a null or unknown agent is guarded.
- Both parity checks pass, CI (job checks) is green, and the installer `--check` is clean.
- The installed copy equals the repo copy after the post-merge run.

## Out of Scope

- No change to `bun install` handling.
- No hook wiring in the dsh plugin.
- No change to role brief text; the guard is the backstop.
- No new test suite beyond the matcher tests and the hook deny tests.

## Open Questions

- None.
