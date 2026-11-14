# Implementation Plan: Status link window and guards typing

Track: `status_link_window_20261115`
Spec: [./spec.md](./spec.md)

**All commits go on fix/status-link-window. Push only to origin/fix/status-link-window, never to main. Only Daniel merges the pull request.**

## Phase 1: Status link window and guards typing

- [ ] Task 1.1: D1 (the status Link window). Add the three cases (a), (b), and (c) to `extensions/measure-status/src/parse.test.ts`, and show that cases (a) and (c) fail before the change (Red, keep the output in `measure/runs/status_link_window_20261115/`). Run `bun install` in `extensions/measure-status`. Replace the 3-line window in `extensions/measure-status/src/parse.ts` with the scan rule of FR-1 (Green). Run `bunx tsc -p . --noEmit` and `bunx vitest run` there. Rebuild `panel/main.js` with the build command of the README ("## Build"), check that the bundle contains the new loop and no `slice(i + 1, i + 4)`, and commit the bundle. Update the "Parse rules" bullet of `extensions/measure-status/README.md` as FR-4 says. Never commit `node_modules`.
- [ ] Task 1.2: D2 (the guards.ts type annotations). Run `bun x tsc --noEmit -p .` in `plugins/opencode-measure-guard`, and keep its output with the implicit-any errors in `measure/runs/status_link_window_20261115/` (Red). Add explicit type annotations in `mods/measure-guard/hooks/guards.ts` at the places that tsc names, with no runtime change. Copy `guards.ts` to `plugins/opencode-measure-guard/src/core/guards.ts` byte for byte, and to `plugins/dsh-measure-guard/src/core/guards.ts` after the transform `sed "s|from './parse'|from './parse.ts'|"`; run both `scripts/check-parity.sh` scripts (`parity: ok`). Run `bun install` in `plugins/opencode-measure-guard`, then `bun test` (the only allowed failure is the known V18 case in `measure/tech-debt.md`), `bun x tsc --noEmit -p .` (exit 0), and `bash scripts/check-parity.sh` there. Run `claude plugin test mods/measure-guard` and `claude plugin validate mods/measure-guard`. Run `node --test tests/*.test.js` and `bash scripts/check-parity.sh` in `plugins/dsh-measure-guard`. Keep the outputs in `measure/runs/status_link_window_20261115/`. Never commit `node_modules`.
- [ ] Task 1.3: finalize `metadata.json` (status done, `actual_tasks`, the `completed` key, `"lane": "light"`); update `CHANGELOG.md` (one entry per defect at the top of "## Unreleased" / "### Bug Fixes") and `README.md` line 33; archive the track; after the plan tasks close, move the registry entry from Active Tracks to the end of Archived Tracks with `[x]` and the metadata description; run `bash tests/spec_review_gate/run.sh`; run `bash tests/dsh/test-registry.sh` (long timeout) and the closeout check, in this order; record the results
- [ ] Task: Measure - User Manual Verification 'Phase 1: Status link window and guards typing' (Protocol in workflow.md)

After the last commit of this phase, push fix/status-link-window to origin and open a PR to main. Never merge the PR.
