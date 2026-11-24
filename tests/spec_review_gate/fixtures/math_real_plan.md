# ESLint to Oxlint Migration Plan

Superseded by vinext-oxc-toolchain_20261114 Phase S2 (PM 2026-11-18). S2 confirms and records the rest of the oxlint move.

## Execution Rules

Complete the phases and tasks in order. Follow the task and phase protocols in
`measure/workflow.md`. Mark one task `[~]` before work starts. Write or update
tests before implementation. Commit each task. Attach the required Git note.
Update this plan in the required follow-up commit.

Phase 1 contract and baseline artifacts are in commit `d20b6e88`. Dependency
installation and the initial cutover are in commit `6dd1f551` after explicit
owner approval.
Phase 2 test artifacts and expected Red evidence are in commit `6a7f275b`.

Start implementation in the main worktree at one recorded commit, as directed
by the repository owner. The worktree at track creation contains unrelated
changes in migration targets. These targets include `measure/tracks.md`,
`package-lock.json`, generated architecture data, and several workspace
manifests. Do not use this dirty state as clean parity evidence. Preserve
unrelated edits and stage exact paths or hunks.

Before each edit, run `git diff -- <target>`. Stop when an unrelated change
overlaps the required hunk and cannot be preserved. Stage exact paths or exact
hunks. Do not run `git add .`, `git add -A`, `git reset --hard`,
`git checkout -- <file>`, a force push, an automatic lint fix, or an audit fix.

Do not edit application or package source to hide a lint difference. Do not add
a suppression. Do not reduce a severity. Do not broaden an ignore. Do not use
`--quiet`. Do not increase the warning limit.

The standard lint gate must be Green. The anti-slop command can remain Red
because its source backlog is outside this track.

## Phase 1: Contract & Schema Definition

- [x] Task: Complete the main-worktree and runtime preflight (commit `45c95cec`)
  - [x] Use the main worktree and preserve unrelated live-agent changes, per owner direction.
  - [ ] Run `git status --short`.
  - [ ] Record the migration start commit with `git rev-parse HEAD` in `baseline.md`.
  - [ ] Run `node --version` and record the result.
  - [ ] Run `npm --version` and record the result.
  - [ ] Run `./node_modules/.bin/oxlint --version` and record the result.
  - [ ] Run `./node_modules/.bin/eslint --version` and record the result.
  - [ ] Run `npm ls --workspaces --depth=0` and require exit status 0.
  - [ ] Run `npm audit --json` and record the existing advisory counts.
  - [ ] Do not run `npm audit fix`.
  - [ ] Record all pre-existing Red quality gates separately from the migration.
  - [ ] Stop if the worktree state cannot identify migration changes against one commit.

- [x] Task: Capture the pre-migration command and result baseline (dirty-worktree diagnostics recorded; pre-existing failures are listed)
  - [ ] Create `measure/tracks/eslint-to-oxlint-migration_20260820/baseline.md`.
  - [ ] Record the 6 application and 20 package workspace names from `scripts/architecture/architecture.manifest.json`.
  - [ ] Confirm that `packages/_template` is not one of the 26 governed workspaces.
  - [ ] Run `CI=true npm run lint` and record each package result.
  - [ ] Run `CI=true npm run ws:bm2:lint` and record the result.
  - [ ] Run `CI=true npm run ws:danielson:lint` and record the result.
  - [ ] Run `CI=true npm run ws:im1:lint` and record the result.
  - [ ] Run `CI=true npm run ws:im2:lint` and record the result.
  - [ ] Run `CI=true npm run ws:im3:lint` and record the result.
  - [ ] Run `CI=true npm run ws:pc:lint` and record the result.
  - [ ] Run `CI=true npm run test` and record the 20-package result.
  - [ ] Run `CI=true npm run typecheck` and record the 20-package result.
  - [ ] Run `CI=true npm run build` and record the 20-package result.
  - [ ] Run `CI=true npm run ws:bm2:test` and record the result.
  - [ ] Run `CI=true npm run ws:bm2:typecheck` and record the result.
  - [ ] Run `CI=true npm run ws:bm2:build` and record the result.
  - [ ] Run `CI=true npm run ws:danielson:test` and record the result.
  - [ ] Run `CI=true npm run ws:danielson:typecheck` and record the result.
  - [ ] Run `CI=true npm run ws:danielson:build` and record the result.
  - [ ] Run `CI=true npm run ws:im1:test` and record the result.
  - [ ] Run `CI=true npm run ws:im1:typecheck` and record the result.
  - [ ] Run `CI=true npm run ws:im1:build` and record the result.
  - [ ] Run `CI=true npm run ws:im2:test` and record the result.
  - [ ] Run `CI=true npm run ws:im2:typecheck` and record the result.
  - [ ] Run `CI=true npm run ws:im2:build` and record the result.
  - [ ] Run `CI=true npm run ws:im3:test` and record the result.
  - [ ] Run `CI=true npm run ws:im3:typecheck` and record the result.
  - [ ] Run `CI=true npm run ws:im3:build` and record the result.
  - [ ] Run `CI=true npm run ws:pc:test` and record the result.
  - [ ] Run `CI=true npm run ws:pc:typecheck` and record the result.
  - [ ] Run `CI=true npm run ws:pc:build` and record the result.
  - [ ] Record the elapsed time and exit status for each command.
  - [ ] Record an exact pre-existing failure. Do not repair it in this track.
  - [ ] Stop if an unexplained ESLint failure prevents a valid baseline.
  - [ ] Do not add a hash, checksum, or source-tree manifest to `baseline.md`.

- [x] Task: Capture the legacy rule and profile contract
  - [ ] Create `scripts/architecture/fixtures/oxlint-migration/legacy-policy.schema.json` from the exact schema contract in `spec.md`.
  - [ ] Create `scripts/architecture/fixtures/oxlint-migration/cases.schema.json` from the exact schema contract in `spec.md`.
  - [ ] Create `scripts/architecture/fixtures/oxlint-migration/legacy-policy.json`.
  - [ ] Run ESLint `--print-config` for one application production TSX file.
  - [ ] Run ESLint `--print-config` for one application test TSX file.
  - [ ] Run ESLint `--print-config` for one Integrated Math 3 test TSX file.
  - [ ] Run ESLint `--print-config` for one normal package production file.
  - [ ] Run ESLint `--print-config` for one normal package test file.
  - [ ] Run ESLint `--print-config` for one shared-config package test file.
  - [ ] Run ESLint `--print-config` for the lesson renderer special test profile.
  - [ ] Run ESLint `--print-config` for the math content production and test profiles.
  - [ ] Add one entry for each unique `(legacyRule, profile)` pair.
  - [ ] Add a separate entry when a severity, option, workspace glob, or file glob differs.
  - [ ] Record explicit `off` entries for profile overrides.
  - [ ] Record all required fields from `legacy-policy.schema.json`.
  - [ ] Validate `legacy-policy.json` against its schema.
  - [ ] Use only `native`, `javascript-plugin`, and `remove-obsolete` dispositions.
  - [ ] Use `remove-obsolete` only for `react/jsx-uses-react` and `react/jsx-uses-vars`.
  - [ ] Map `no-octal` to the approved `eslint-js` compatibility provider.
  - [ ] Map `react/no-deprecated` to the approved `react-js` compatibility provider.
  - [ ] Map `react-hooks/rules-of-hooks` and `react-hooks/exhaustive-deps` to their native Oxlint React rules.
  - [ ] Map the other 14 React Hooks rules named in `spec.md` to `react-hooks-js`.
  - [ ] Record all 21 enabled Next.js rules and their native `nextjs/*` mappings.
  - [ ] Record every override and ignore from the 23 ESLint configs.
  - [ ] Stop if one retained rule needs an `unsupported` disposition.

- [x] Task: Define the configuration, command, and dependency contract
  - [ ] Use `.oxlintrc.json` as the root blocking configuration.
  - [ ] Set `$schema` to `./node_modules/oxlint/configuration_schema.json`.
  - [ ] Use `oxlint.anti-slop.config.ts` as the separate anti-slop configuration.
  - [ ] Define `lint:anti-slop` as the only anti-slop command.
  - [ ] Remove `lint:oxlint` so one command name does not have two meanings.
  - [ ] Keep root `npm run lint` as the 20-package architecture dispatcher.
  - [ ] Keep all 26 workspace script names as `lint`.
  - [ ] Define application scripts as `oxlint --config ../../.oxlintrc.json . --max-warnings 0`.
  - [ ] Define package scripts as `oxlint --config ../../.oxlintrc.json src --max-warnings 0`.
  - [ ] Define `typescript`, `react`, `import`, `jsx-a11y`, and `nextjs` as explicit native plugins.
  - [ ] Disable Oxlint category defaults that add a rule outside `legacy-policy.json`.
  - [ ] Define `oxlint-plugin-eslint`, `eslint-plugin-react`, and `eslint-plugin-react-hooks` as the only approved compatibility plugin candidates.
  - [ ] Record registry versions and peer ranges with `npm view <package> version peerDependencies --json`.
  - [ ] Require `oxlint-plugin-eslint` to match the installed Oxlint version.
  - [ ] Record that `eslint-plugin-react` 7.37.5 does not accept ESLint 10 as a peer.
  - [ ] Define `oxlint-tsgolint` and type-aware Oxlint as prohibited in this track.
  - [ ] Define the peer-only ESLint exception from the specification.
  - [ ] Define that no final command, config, test, or API call can execute ESLint.

- [x] Task: Record the technology decision before implementation
  - [ ] Update the static analysis section of `measure/tech-stack.md`.
  - [ ] Define Oxlint as the standard lint engine.
  - [ ] Define the compatibility plugins as temporary adapters for verified gaps.
  - [ ] Define `npm run lint:anti-slop` as separate and non-blocking.
  - [ ] Define `tsc --noEmit` as a separate blocking type gate.
  - [ ] Record that this track does not add type-aware Oxlint.
  - [ ] Record that the cutover can retain a peer-only ESLint package but cannot execute it.
  - [ ] Keep the open Integrated Math 3 React Hooks debt item separate.
  - [ ] Keep the open application quality debt for Integrated Math 1, Integrated Math 2, and Precalculus separate.

- [ ] Task: Measure - User Manual Verification 'Phase 1: Contract & Schema Definition' (Protocol in workflow.md)
  - [ ] Run the automated tests required by the phase protocol.
  - [ ] Present `baseline.md` and `legacy-policy.json`.
  - [ ] Present all pre-existing Red gates.
  - [ ] Present the dependency and peer-only limits.
  - [ ] Ask the user to confirm the phase.
  - [ ] Pause until the user gives explicit confirmation.

## Phase 2: Test

- [x] Task: Create the executable Oxlint behavior harness
  - [ ] Create `scripts/architecture/__tests__/oxlint-migration.test.mjs`.
  - [ ] Use `node:test`, `node:assert/strict`, `node:child_process`, `node:fs`, and `node:path`.
  - [ ] Create only these repository-root temporary fixture directories: `apps/danielson/.oxlint-migration-fixtures/`, `apps/integrated-math-1/.oxlint-migration-fixtures/`, `apps/integrated-math-3/.oxlint-migration-fixtures/`, `packages/activity-runtime/src/.oxlint-migration-fixtures/`, `packages/activity-components/src/.oxlint-migration-fixtures/`, `packages/ai-tutoring/src/.oxlint-migration-fixtures/`, `packages/lesson-renderer/src/.oxlint-migration-fixtures/`, and `packages/math-content/src/.oxlint-migration-fixtures/`.
  - [ ] Map `app-production` and `app-test` cases to the Integrated Math 1 temporary directory.
  - [ ] Map `im3-test` cases to the Integrated Math 3 temporary directory.
  - [ ] Map normal package cases to the activity runtime temporary directory.
  - [ ] Map shared-config cases to the activity components temporary directory.
  - [ ] Map TypeScript-only override cases to the AI tutoring temporary directory.
  - [ ] Map lesson renderer and math content cases to their matching temporary directories.
  - [ ] Map Danielson-only `.convex` and coverage ignore cases to the Danielson temporary directory.
  - [ ] Put test-profile cases below an `__tests__/` segment so the real root override matches.
  - [ ] Add `**/.oxlint-migration-fixtures/**` to the standard lint ignores.
  - [ ] Invoke controlled fixtures with `--no-ignore` and an exact file path.
  - [ ] Stop before the test when one exact test-owned directory already exists.
  - [ ] Delete only the eight exact test-owned directories in a `finally` block.
  - [ ] Assert after each test that its test-owned directory does not remain.
  - [ ] Run the repository binary at `node_modules/.bin/oxlint`.
  - [ ] Pass `--format json` to Oxlint.
  - [ ] Parse the JSON diagnostics.
  - [ ] Assert the rule code, severity, relative file path, and line number.
  - [ ] Do not assert complete diagnostic text.
  - [ ] Do not use source-text matching as the only behavior proof.
  - [ ] Use `oxlint --print-config` only as a secondary profile check.
  - [ ] Add a helper that fails with the complete command, exit status, stdout, and stderr when JSON parsing fails.
  - [ ] Confirm that a valid source file produces no unexpected diagnostic.

- [x] Task: Add controlled behavior fixtures for every retained rule
  - [ ] Read `scripts/architecture/fixtures/oxlint-migration/cases.schema.json` from Phase 1.
  - [ ] Create `scripts/architecture/fixtures/oxlint-migration/cases.json`.
  - [ ] Add every required field from `cases.schema.json`.
  - [ ] Validate `cases.json` against its schema.
  - [ ] Validate every `policyId` reference against `legacy-policy.json`.
  - [ ] Add at least one behavior case for every entry in `legacy-policy.json`.
  - [ ] Use `expectedDiagnostic: false` for an `off` or `remove-obsolete` entry.
  - [ ] Make each case trigger its target rule and no unexpected rule.
  - [ ] Add one valid companion case for a rule when the invalid case can be ambiguous.
  - [ ] Test core JavaScript rules.
  - [ ] Test native TypeScript rules.
  - [ ] Test native React rules.
  - [ ] Test all 21 native Next.js rules.
  - [ ] Test all five JSX accessibility rules.
  - [ ] Test `import/no-anonymous-default-export`.
  - [ ] Test `eslint-js/no-octal`.
  - [ ] Test `react-js/no-deprecated`.
  - [ ] Test each retained classic or compiler React Hooks rule through its selected provider.
  - [ ] Use an upstream minimal trigger for a React Hooks rule with a non-obvious trigger.
  - [ ] Prove an upstream trigger with legacy ESLint before adding it to `cases.json`.
  - [ ] Test JSX without a `React` import to prove the two obsolete rule removals.
  - [ ] Test one warning rule such as `nextjs/no-img-element`.
  - [ ] Assert that `--max-warnings 0` makes the warning fixture fail.

- [x] Task: Test profiles, scopes, ignores, and suppression comments
  - [ ] Test the `app-production`, `app-test`, `im3-test`, `package-production`, `package-shared-production`, `package-test`, `lesson-renderer-test`, `math-content-production`, and `math-content-test` profiles.
  - [ ] Test that `no-explicit-any` is off only in the specified test scopes.
  - [ ] Test that the Integrated Math 3 test unused-variable rule is a warning.
  - [ ] Test that an allowed `_` argument does not produce an unused-variable diagnostic.
  - [ ] Test the shared-config test relaxations for `ban-ts-comment` and unused variables.
  - [ ] Test the TypeScript-only test globs without expanding them to TSX.
  - [ ] Test `.next/**`, `.convex/**`, `coverage/**`, `dist/**`, `node_modules/**`, `playwright-report/**`, and `convex/_generated/**` with a deliberate violation.
  - [ ] Test each agent-tooling ignore and `tools/oxlint/anti-slop/**` in the standard gate.
  - [ ] Pair every ignored violation with one active violation outside the ignored path.
  - [ ] Assert that Oxlint reports the active file and skips only the ignored file.
  - [ ] Test `eslint-disable-next-line`.
  - [ ] Test `eslint-disable-line`.
  - [ ] Test block `eslint-disable` and the matching `eslint-enable`.
  - [ ] Test `@typescript-eslint/no-explicit-any` and `@typescript-eslint/no-unused-vars` directives.
  - [ ] Test `@next/next/no-img-element` directives.
  - [ ] Test `react-hooks/rules-of-hooks` and `react-hooks/exhaustive-deps` directives.
  - [ ] Assert that each unsuppressed control produces the target diagnostic.
  - [ ] Do not bulk-rewrite suppression comments.

- [x] Task: Test workspace commands, dependencies, CI, and anti-slop separation
  - [ ] Add command and dependency cases to `scripts/architecture/__tests__/oxlint-migration.test.mjs`.
  - [ ] Parse all workspace manifests as JSON.
  - [ ] Assert that the 26 governed `lint` scripts start Oxlint and reference `.oxlintrc.json`.
  - [ ] Assert that application scripts lint `.` and package scripts lint `src`.
  - [ ] Assert that every blocking script has a zero-warning limit.
  - [ ] Assert that no script starts `eslint` or `next lint`.
  - [ ] Assert that root `npm run lint` still uses `run-workspace-quality.mjs`.
  - [ ] Assert that the CI package, application, and Cloudflare steps still use workspace `npm run lint` commands.
  - [ ] Assert that all 23 ESLint configuration files are absent in the final state.
  - [ ] Assert that applications and packages have no direct ESLint configuration dependencies.
  - [ ] Assert the complete-cutover conditions for any root peer-only exception.
  - [ ] Assert that `.oxlintrc.json` has no `anti-slop/*` rule.
  - [ ] Assert that `oxlint.anti-slop.config.ts` has all 15 anti-slop rules at error severity.
  - [ ] Add a controlled anti-slop fixture that proves the plugin loads.
  - [ ] Do not assert that a repository-wide `lint:anti-slop` run exits zero.

- [x] Task: Replace obsolete live dependency-audit assertions with forward contracts
  - [ ] Update `scripts/audit/__tests__/framework-wave-w4.test.ts` before implementation.
  - [ ] Replace live ESLint 10, `@eslint/js`, and `eslint-config-next` requirements with the Oxlint cutover contract.
  - [ ] Update `scripts/audit/__tests__/framework-wave-w4-audit.test.ts` before implementation.
  - [ ] Preserve historical React Compiler and upgrade evidence.
  - [ ] Update `scripts/audit/__tests__/in-range-wave-w3.test.ts` before implementation.
  - [ ] Preserve independent live Next.js and TypeScript range tests.
  - [ ] Update `scripts/audit/__tests__/remaining-majors-w5.test.ts` before implementation.
  - [ ] Preserve historical W3, W4, and W5 facts that do not define the live lint engine.
  - [ ] Keep all existing W3, W4, and W5 JSON fixtures unchanged.
  - [ ] Convert an obsolete live-lockfile assertion in a historical test to an assertion against its existing fixture.
  - [ ] Put the new live Oxlint command and dependency contract only in `scripts/architecture/__tests__/oxlint-migration.test.mjs`.
  - [ ] Do not delete a live dependency assertion without a forward replacement in the migration suite.

- [x] Task: Prove the expected Red state
  - Expected Red evidence: `node --test scripts/architecture/__tests__/oxlint-migration.test.mjs` reported 5 intentional failures for pre-cutover workspace scripts, remaining ESLint configuration/dependencies, missing `oxlint-plugin-eslint`, and active ESLint commands. The four focused audit suites passed 95 tests. All eight test-owned fixture directories were removed.
  - [ ] Run `CI=true node --test scripts/architecture/__tests__/oxlint-migration.test.mjs`.
  - [ ] Run `CI=true npx vitest run scripts/audit/__tests__/framework-wave-w4.test.ts scripts/audit/__tests__/framework-wave-w4-audit.test.ts scripts/audit/__tests__/in-range-wave-w3.test.ts scripts/audit/__tests__/remaining-majors-w5.test.ts`.
  - [ ] Confirm that the new assertions fail because the Oxlint contract is not implemented.
  - [ ] Confirm that no failure comes from invalid test code or a missing fixture.
  - [ ] Record each expected Red assertion in this plan.
  - [ ] Confirm that no lint implementation file changed in Phase 2.
  - [ ] Run the unaffected existing root test suite and compare it with the Phase 1 baseline.
  - [ ] Treat only the new migration assertions as intentional Red evidence.
  - [ ] Do not repair an intentional migration Red before Phase 3.

- [ ] Task: Measure - User Manual Verification 'Phase 2: Test' (Protocol in workflow.md)
  - [ ] Run `CI=true npm run test` as the unaffected automated suite required by the phase protocol.
  - [ ] Require this suite to pass or match the recorded Phase 1 baseline.
  - [ ] Present the Red test output.
  - [ ] Label the new migration-test failures as intentional Red evidence for Phase 3.
  - [ ] Map each failure to one missing implementation task.
  - [ ] Ask the user to confirm the phase.
  - [ ] Pause until the user gives explicit confirmation.

## Phase 3: Implement

- [x] Task: Obtain dependency approval and add compatibility dependencies (commit `6dd1f551`)
  - Owner approval was explicit before the dependency operation.
  - Added `oxlint-plugin-eslint@1.79.0`, `eslint-plugin-react@7.37.5`, and `eslint-plugin-react-hooks@7.1.1` as root development dependencies.
  - Removed direct ESLint declarations and the root ESLint override.
  - Kept ESLint only as an automatic peer path required by the approved compatibility plugins.
  - Ran `npm ls --workspaces --depth=0` successfully.
  - Ran `npm explain eslint`; the remaining path is peer-only.

- [x] Task: Separate the standard and anti-slop configurations (commit `6dd1f551`)
  - [x] Create `.oxlintrc.json` with no anti-slop plugin or rule.
  - [x] Rename or move `oxlint.config.ts` to `oxlint.anti-slop.config.ts`.
  - [x] Keep the local anti-slop plugin path correct after the move.
  - [x] Keep all 15 anti-slop rules at error severity.
  - [x] Keep the current agent-tooling and vendored-plugin ignores.
  - [x] Replace root `lint:oxlint` with `lint:anti-slop`.
  - [x] Set `lint:anti-slop` to `oxlint --config oxlint.anti-slop.config.ts .`.
  - [x] Confirm that no blocking command invokes `lint:anti-slop`.
  - [x] Run the controlled anti-slop fixture.
  - [x] Record the expected repository-wide nonzero anti-slop result as non-blocking.

- [x] Task: Implement the standard Oxlint policy profiles (commit `6dd1f551`)
  - [x] Disable default category rules that are absent from `legacy-policy.json`.
  - [x] Enable the native `typescript`, `react`, `import`, `jsx-a11y`, and `nextjs` plugins explicitly.
  - [x] Set React version 19.
  - [x] Load `oxlint-plugin-eslint` as `eslint-js`.
  - [x] Load `eslint-plugin-react` as `react-js`.
  - [x] Load `eslint-plugin-react-hooks` as `react-hooks-js` for the verified compiler gaps.
  - [x] Add every `native` entry from `legacy-policy.json` with its recorded severity and options.
  - [x] Add every `javascript-plugin` entry with its recorded severity and options.
  - [x] Do not add the two `remove-obsolete` entries.
  - [x] Do not configure native `react/react-compiler` in this track.
  - [x] Add the application and package root-relative overrides.
  - [x] Add the Integrated Math 3 test override.
  - [x] Add the shared-config, lesson renderer, and math content exceptions.
  - [x] Keep the TypeScript-only test globs exact.
  - [x] Add all required root-relative ignore patterns.
  - [x] Do not ignore the behavior fixtures when the test invokes them directly.
  - [x] Run every controlled behavior case and require the expected rule and severity.
  - [x] Stop if a JavaScript plugin fails to load or changes a required result.

- [x] Task: Run the temporary dual-engine parity gate (commit `f304f670`)
  - [x] Create a temporary dual-run adapter that is not part of the final test suite.
  - [x] Run each `cases.json` fixture through legacy ESLint and Oxlint.
  - [x] Normalize only the aliases recorded in `legacy-policy.json`.
  - [x] Compare pass or fail behavior, rule identity, and severity.
  - [x] Run the 20 package ESLint commands from the clean baseline.
  - [x] Run the 6 application ESLint commands from the clean baseline.
  - [x] Run Oxlint on the same scopes.
  - [x] Confirm that both engines return the recorded workspace baseline result.
  - [x] Confirm that Oxlint adds no unapproved blocking rule.
  - [x] Record the Oxlint elapsed time in `baseline.md`.
  - [x] Record every intentional alias and the two obsolete removals.
  - [x] Stop on a behavior or severity difference.
  - [x] Do not modify source to force parity.
  - [x] Keep the temporary adapter until script cutover verification is complete.

- [x] Task: Switch all 26 workspace lint scripts (commit `6dd1f551`)
  - [x] Change the six application scripts to `oxlint --config ../../.oxlintrc.json . --max-warnings 0`.
  - [x] Change the 20 package scripts to `oxlint --config ../../.oxlintrc.json src --max-warnings 0`.
  - [x] Remove the four shared ESLint `--config` arguments.
  - [x] Keep every workspace script name as `lint`.
  - [x] Keep root `npm run lint` unchanged.
  - [x] Keep the six root `ws:*:lint` aliases unchanged.
  - [x] Keep the architecture manifest command names unchanged unless a parity test proves a required change.
  - [x] Keep `.github/workflows/ci.yml` command names unchanged.
  - [x] Keep `.github/workflows/cloudflare-deploy.yml` command names unchanged.
  - [x] Run the root package dispatcher.
  - [x] Run all six application aliases.
  - [x] Require the same Green or approved pre-existing result as the baseline.

- [x] Task: Update live audit contracts and documentation (commits `ef35552a`, `ebd0b29d`)
  - [x] Make the four focused dependency-audit test files Green with the forward Oxlint contract.
  - [x] Preserve historical fixture evidence.
  - [x] Keep the removed `typescript-eslint` package out of the historical live-lockfile assertion.
  - [x] Inspect `README.md` and `INTEGRATION.md` for live ESLint or `vinext lint` instructions.
  - [x] Update `measure/tech-stack.md` and `measure/tech-specs.md` with the final commands.
  - [x] Update product-guideline wording to `lint suppression comment` where exact syntax is not required.
  - [x] Inspect `measure/automation-supervisor.py` and keep it unchanged when `npm run lint` remains correct.
  - [x] Stop and use the peer-review protocol if `measure/automation-supervisor.py` must change.
  - [x] Do not rewrite historical records that correctly say ESLint was used at that time.

- [x] Task: Remove ESLint configurations and direct dependencies (commit `6dd1f551`)
  - [x] Delete the six application `eslint.config.mjs` files listed in the specification.
  - [x] Delete the 16 package `eslint.config.mjs` files listed in the specification.
  - [x] Delete `scripts/architecture/eslint.package.config.mjs`.
  - [x] Remove `@eslint/eslintrc`, `eslint`, and `eslint-config-next` from all six application manifests.
  - [x] Remove `@eslint/js`, `eslint`, and `typescript-eslint` from package manifests that declare them.
  - [x] Remove root `@eslint/js`.
  - [x] Remove the root ESLint override.
  - [x] Update `package-lock.json` once after the manifest edits.
  - [x] Run `npm explain eslint`.
  - [x] Confirm that each remaining ESLint path is a compatibility-plugin peer path.
  - [x] Run `npm ls eslint eslint-config-next @eslint/js @eslint/eslintrc typescript-eslint --all`.
  - [x] Confirm that no application or package declares a direct removed dependency.
  - [x] Search all scripts and CI files for active ESLint executable commands.
  - [x] Review every search result manually.
  - [x] Delete the temporary dual-run ESLint adapter.
  - [x] Assert that every retained test invokes Oxlint only.

- [x] Task: Make the migration and lint suites Green (verification recorded in `f304f670` and `b93c96c2`)
  - [x] Run `CI=true node --test scripts/architecture/__tests__/oxlint-migration.test.mjs`.
  - [x] Run the four focused dependency-audit tests.
  - [x] Run `CI=true node --test scripts/architecture/__tests__/live-quality-parity.test.mjs`.
  - [x] Run `CI=true node scripts/architecture/check-quality-parity.mjs`.
  - [x] Run `CI=true npm run lint`.
  - [x] Run all six root application lint aliases.
  - [x] Confirm that every required result is Green or matches an approved pre-existing baseline.
  - [x] Attempt no more than two focused repairs for one failed gate.
  - [x] Stop after two failed repair attempts.
  - [x] Do not weaken a rule, test, warning policy, scope, or ignore.

- [ ] Task: Measure - User Manual Verification 'Phase 3: Implement' (Protocol in workflow.md)
  - [ ] Run the automated tests required by the phase protocol.
  - [ ] Present the dependency diff and peer-only exception.
  - [ ] Present the removed configuration list.
  - [ ] Present the standard and anti-slop command behavior.
  - [ ] Present the dual-engine parity result.
  - [ ] Ask the user to confirm the phase.
  - [ ] Pause until the user gives explicit confirmation.

## Phase 4: Generate Docs & Doctor

- [x] Task: Run focused migration, audit, architecture, and boundary gates
  - [x] Run `CI=true node --test scripts/architecture/__tests__/oxlint-migration.test.mjs`.
  - [x] Run `CI=true npx vitest run scripts/audit/__tests__/framework-wave-w4.test.ts scripts/audit/__tests__/framework-wave-w4-audit.test.ts scripts/audit/__tests__/in-range-wave-w3.test.ts scripts/audit/__tests__/remaining-majors-w5.test.ts`.
  - [x] Run `CI=true node --test scripts/architecture/__tests__/live-quality-parity.test.mjs scripts/architecture/__tests__/inventory-parity.test.mjs scripts/architecture/__tests__/quality-contract.test.mjs scripts/architecture/__tests__/manifest-contract.test.mjs scripts/architecture/__tests__/debt-policy.test.mjs`.
  - [x] Run `CI=true node scripts/architecture/check-quality-parity.mjs`.
  - [x] Run `CI=true node scripts/check-monorepo-boundaries.mjs`.
  - [x] Require exit status 0 from each focused gate.
  - [x] Stop after two failed repair attempts for one gate.

- [x] Task: Run all 20 package quality gates
  - [x] Run `CI=true npm run lint`.
  - [x] Run `CI=true npm run test`.
  - [x] Run `CI=true npm run typecheck`.
  - [x] Run `CI=true npm run build`.
  - [x] Confirm that the architecture runner covers all 20 governed packages.
  - [x] Confirm that each result is Green or matches an approved pre-existing baseline.
  - [x] Do not exclude a package to obtain a Green result.

- [x] Task: Run all six application quality gates
  - [x] Run `CI=true npm run ws:bm2:lint`, `CI=true npm run ws:bm2:test`, `CI=true npm run ws:bm2:typecheck`, and `CI=true npm run ws:bm2:build`.
  - [x] Run `CI=true npm run ws:danielson:lint`, `CI=true npm run ws:danielson:test`, `CI=true npm run ws:danielson:typecheck`, and `CI=true npm run ws:danielson:build`.
  - [x] Run `CI=true npm run ws:im1:lint`, `CI=true npm run ws:im1:test`, `CI=true npm run ws:im1:typecheck`, and `CI=true npm run ws:im1:build`.
  - [x] Run `CI=true npm run ws:im2:lint`, `CI=true npm run ws:im2:test`, `CI=true npm run ws:im2:typecheck`, and `CI=true npm run ws:im2:build`.
  - [x] Run `CI=true npm run ws:im3:lint`, `CI=true npm run ws:im3:test`, `CI=true npm run ws:im3:typecheck`, and `CI=true npm run ws:im3:build`.
  - [x] Run `CI=true npm run ws:pc:lint`, `CI=true npm run ws:pc:test`, `CI=true npm run ws:pc:typecheck`, and `CI=true npm run ws:pc:build`.
  - [x] Run `CI=true npx tsc --noEmit --project apps/bus-math-v2/tsconfig.json`.
  - [x] Run `CI=true npx tsc --noEmit --project apps/danielson/tsconfig.json`.
  - [x] Run `CI=true npx tsc --noEmit --project apps/integrated-math-1/tsconfig.json`.
  - [x] Run `CI=true npx tsc --noEmit --project apps/integrated-math-2/tsconfig.json`.
  - [x] Run `CI=true npx tsc --noEmit --project apps/integrated-math-3/tsconfig.json`.
  - [x] Run `CI=true npx tsc --noEmit --project apps/pre-calculus/tsconfig.json`.
  - [x] Confirm that each result is Green or matches an approved pre-existing baseline.
  - [x] Stop on an unexplained application failure.

- [x] Task: Verify dependencies, security, and the non-blocking anti-slop gate
  - [x] Run `npm ls --workspaces --depth=0` and require exit status 0.
  - [x] Run `npm ls eslint eslint-config-next @eslint/js @eslint/eslintrc typescript-eslint eslint-plugin-react eslint-plugin-react-hooks oxlint-plugin-eslint --all`.
  - [x] Document every retained ESLint peer path.
  - [x] Run `npm audit --json`.
  - [x] Compare all severity counts with the same Phase 1 command.
  - [x] Stop if the migration adds a high or critical advisory.
  - [x] Run `CI=true npm run lint:anti-slop` separately.
  - [x] Confirm that the command loads all 15 rules.
  - [x] Record the nonzero result as informational when it reports existing findings.
  - [x] Do not encode the finding count as an acceptance baseline.
  - [x] Do not fix or suppress anti-slop findings in this track.

- [x] Task: Generate repository facts, update documents, and run Measure Doctor
  - [x] Run `CI=true npm run generate`.
  - [x] Inspect every generated difference.
  - [x] Confirm that each difference describes the current repository.
  - [x] Stop if generation would overwrite unrelated user work.
  - [x] Update the track index with links to `baseline.md` and `parity-report.md`.
  - [x] Update live documentation that names ESLint as the current engine.
  - [x] Keep exact historical ESLint statements that describe a past state.
  - [x] Run `CI=true npm run doctor`.
  - [x] Require exit status 0 from Measure Doctor.
  - [x] Do not add or expand a hash, checksum, or provenance manifest.

- [x] Task: Complete the final cutover audit and parity report (commit `b93c96c2`)
  - [x] Create `measure/tracks/eslint-to-oxlint-migration_20260820/parity-report.md`.
  - [x] Record the start commit, final commit, command results, and elapsed times without source hashes.
  - [x] Record every native rule mapping.
  - [x] Record every compatibility rule and its reason.
  - [x] Record the two obsolete rule removals.
  - [x] Record any peer-only ESLint dependency path.
  - [x] Record all approved pre-existing Red gates.
  - [x] Run `rg --files | rg '(^|/)eslint\.config\.'` and require no governed configuration match.
  - [x] Run `rg -n '"lint"\s*:\s*"(?:npx )?eslint|\bnext lint\b' package.json apps packages .github scripts` and require no active command match.
  - [x] Run `rg -n '"(eslint|@eslint/js|@eslint/eslintrc|eslint-config-next|typescript-eslint)"\s*:' apps/*/package.json packages/*/package.json` and require no direct workspace dependency match.
  - [x] Confirm that final tests do not spawn ESLint.
  - [x] Confirm that `.oxlintrc.json` does not contain `anti-slop/`.
  - [x] Review the final diff for a source fix, new suppression, severity reduction, broad ignore, unrelated dependency update, or audit hash.
  - [x] Review every acceptance criterion in `spec.md`.
  - [x] Do not mark the track complete while an unapproved acceptance difference remains.

- [~] Task: Address review findings before manual completion
    - [x] Add a diagnostic-producing case for every active policy entry and rerun dual-engine parity. Nine configuration-only policy entries require explicit owner approval. PM approved the 9 exceptions on 2026-11-18.
    - [x] Correct the package-test override so its exceptions apply only to the documented shared packages.
    - [x] Revert the six authentication-page source edits from the migration cutover.
    - [x] Reconcile application typecheck and test results against a clean pre-migration baseline or record explicit owner approval. PM accepted the variances as pre-existing on 2026-11-18: vinext-oxc S1 baseline-m2 failures are bus-math-v2 7, im1 54, im3 218, pre-calculus 52.
    - [x] Add baseline and parity-report links to the track index.
    - [x] Update the review evidence and keep manual-verification tasks pending until explicit confirmation.
    - [x] Obtain owner approval for the explicit parity exceptions and the remaining application gate variances. PM 2026-11-18.

- [ ] Task: Measure - User Manual Verification 'Phase 4: Generate Docs & Doctor' (Protocol in workflow.md)
  - [ ] Run the automated tests required by the phase protocol.
  - [ ] Present `parity-report.md` and the complete gate results.
  - [ ] Present the peer-only dependency explanation when it exists.
  - [ ] Present the anti-slop result as non-blocking backlog evidence.
  - [ ] Ask whether the migration meets the user's expectations.
  - [ ] Pause until the user gives explicit confirmation.
