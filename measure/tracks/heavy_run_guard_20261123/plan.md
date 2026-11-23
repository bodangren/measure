# Implementation Plan: Heavy-run guard refuses heavy commands outside heavy-run

Track: `heavy_run_guard_20261123`
Spec: [./spec.md](./spec.md)

**All commits go on feat/heavy-run-guard. Push only to origin/feat/heavy-run-guard, never to main. Only the PM or Daniel merges.**

Scope cut by the PM on 2026-11-23: v1 guards direct commands only.

Test commands: `bun test` in `mods/measure-guard` and in `plugins/opencode-measure-guard`; `bash tests/spec_review_gate/run.sh`; `bash tests/dsh/run.sh`; `bash plugins/dsh-measure-guard/scripts/check-parity.sh`; `bash plugins/opencode-measure-guard/scripts/check-parity.sh`. Run each long local command through `/home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh` with `HEAVY_MIN_AVAIL_MB=1500 HEAVY_PRIORITY=p1`. This wrapper applies to local runs only.

## Phase 1: Heavy-run guard refuses heavy commands outside heavy-run (due 2026-11-26)

- [x] Task 1.1 Red: add failing tests for the pure matcher (each FR-3 pattern, the tsc `-b` / `--build` tests, the file-like operand rule, the pytest option list, the path-shaped heavy-run form, the v1 accepted gaps, the FR-7 false-positive list, the heavy-run form passing, the FR-2 orchestrator exemption and the unknown-agent case) and for the hook deny in the opencode plugin tests. — 03e0353
  - Red run 2 (v1 scope) 2026-11-23: `bun test tests/heavy-run.test.ts` in mods/measure-guard → exit 1 (heavyRunDecision not exported; wrapper, shell -c, and non-path heavy-run cases cut; v1 gaps, bare heavy-run.sh passes, and tsc -b regardless of operands added); in plugins/opencode-measure-guard → exit 1 (hook passes heavy through; v1 gap pass-through added). Rest of the plugin suite passes otherwise.
- [x] Task 1.2 Green: add `heavyRunDecision` in `mods/measure-guard/hooks/guards.ts`, copy it to both parity cores, and wire it in `Guard.onToolBefore`. All suites and both parity checks pass. — 7fa1822
  - Green run 2026-11-23 (through heavy-run, HEAVY_PRIORITY=p1 HEAVY_MIN_AVAIL_MB=1500): `bun test tests/heavy-run.test.ts` in mods/measure-guard → exit 0 (54 pass, 0 fail); the same file in plugins/opencode-measure-guard → exit 0 (8 pass, 0 fail).
  - `bun test` in plugins/opencode-measure-guard → exit 0 (195 pass, 0 fail). `bash tests/spec_review_gate/run.sh` → exit 0 (24 suites, none failed). `bash tests/dsh/run.sh` → exit 0 (15 passed, 0 failed). Both `check-parity.sh` scripts → exit 0 (parity: ok). `node --test plugins/dsh-measure-guard/tests/*.test.js` → exit 0 (384 pass, 0 fail).
  - `bun test` in mods/measure-guard → exit 1: 12 test files import 'claude-code/testing', which resolves only under the Claude Code engine. The same 12 errors happen at the baseline 03e0353. The mod suite runs under `claude plugin test mods/measure-guard`.
  - The plugin TDD test now runs its suite command through the heavy-run form. The heavy-run guard refuses a bare suite command, so the test follows the rule it now shares.
- [ ] Task 1.3 Install and CI: check that `bin/install-targets.tsv` covers the changed plugin files (`src/guard.ts`, `src/core/guards.ts`) and that the installer staging of `plugins/opencode-measure-guard` (minus `tests/`) includes them (read the installer; use its dry-run or list mode when one exists, else grep the targets file). Run the repo suites, push the branch, open the PR, and watch the `checks` run green. The build session does git.
- [ ] Task 1.4 Records: record the red proof, the green run, the parity results, and the CI state in this plan.

## Post-merge (orchestrator, after the PM merges; not a task)

- Run `bin/install-measure-skill`, then `bin/install-measure-skill --check`, then `diff -r` of the installed plugin against the repo plugin, excluding `tests/` and the `.measure-install` stamp (exclude only install-only files). Report the result to the PM.
