# Implementation Plan: Guard phase start

Track: `guard_phase_start_20261109`. Spec: [spec.md](./spec.md).

## Rules for every phase

- Work on `main` in `/home/daniebo/Desktop/measure`. Never stage `extensions/`.
- Attach a git note to each task commit.
- The three plugin suites are light: run them directly. Run `tests/spec_review_gate/run.sh` only through `/home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh` with `HEAVY_PRIORITY=p2` (PM rule, 2026-11-08: leftover slot only).
- Get each subagent slot through `/home/daniebo/Desktop/advantage-pr/scripts/jobs/slot`.
- Pick each subagent model with `/home/daniebo/Desktop/advantage-pr/scripts/jobs/ra-quota pick <role> --not-family claude --why`.
- Do not write in the Workbooks repository.
- The source change lands in one commit (Task 3.1), after the Red commit. The plan and the PM line record the install step (Task 4.2).
- Push nothing without the PM's word.

## Phase 1: Spec review [checkpoint: 4a6d86e]

- [x] Task 1.1: Run `measure-spec-review` with a fresh agent of a family other than Claude. Write the result to `measure/runs/guard_phase_start_20261109/`. Record the findings and the responses in `spec-review.md`. `78d7ccf`
  - Round 1 on `5cc8604` with `deepseek/deepseek-flash#high`: pass, 0 Blocker, 3 Major, 3 Nit (`78d7ccf`). The spec-review gate passed. F1 to F6: FIX in the Phase 1 checkpoint commit.

## Phase 2: Red tests [checkpoint: fec33f5]

- [x] Task 2.1: Change the three old phase-start cases and add the AC-1 case (AC-1 to AC-4). Run the three test files against the unchanged guards. Record each failing case name as the Red evidence. The `[x]` and the checkpoint assertions guard the old behavior and pass before the change. `fffba4c`
  - Evidence: on the unchanged guards, `bun test tests/closeout.test.ts` (OpenCode) gives 4 pass, 3 fail; `claude plugin test mods/measure-guard` gives 91 pass, 1 fail; `node --test tests/closeout.test.js` (DSH) gives 17 pass, 1 fail. Log: `measure/runs/guard_phase_start_20261109/red-p2-unchanged-guards.log`.
  - Failing: OpenCode `AC-2: a task of the next phase starts with a note while the previous phase has no checkpoint`, `AC-1: Task 6.1 starts while Phase 5 has no checkpoint (guard mode)` and `(strict mode)`; mod `a task in phase N+1 can start before phase N has a checkpoint, with a note`; DSH `starting a task in phase N+1 without a checkpoint passes with a note`. Each one fails because the guard denies the `[~]` edit.

## Phase 3: Green change [checkpoint: 2b2574c]

- [x] Task 3.1: Replace `phaseStartDecision` with `phaseStartNote` in the mod source, copy `guards.ts` to the two plugins, and change the three closeout functions (FR-1 to FR-3). Run the suites of AC-5 and AC-6. `1d36e19`
  - Evidence (AC-5, AC-6): in `plugins/opencode-measure-guard`, `bun test` gives 152 pass, 1 fail (the old V18 case), `tsc` exits 0, and `check-parity.sh` prints `parity: ok`. `claude plugin test mods/measure-guard` gives 92 pass, 0 fail, and `claude plugin validate` passes. In `plugins/dsh-measure-guard`, `node --test tests/*.test.js` gives 352 pass, 0 fail, and `check-parity.sh` prints `parity: ok`. The old track-close cases pass with no change. Logs: `measure/runs/guard_phase_start_20261109/green-p3-*.log`.
  - Evidence: 4 mutants of the new lines in 5 runs (`green-p3-mutants.log`). Each mutant is killed by 1 or more suites. The checkpoint mutant survives the OpenCode file, which has no case with a checkpoint, and the DSH case `starting a task in phase N+1 with a checkpoint passes` kills it.
- [x] Task 3.2: Update the three READMEs, `mods/measure-guard/DESIGN.md`, `skills/measure-orchestrator/references/dsh.md`, and `CHANGELOG.md` (FR-4). `82411ec`
  - Evidence: `tests/dsh/test-docs.sh` passes; `test_s2_role_docs.sh` 51/51, `test_s3_dispositions_docs.sh` 98/98, `test_s4_doc_drift.sh` 34/34 (`green-p3-docs.log`).

## Phase 4: Review and distribution

- [x] Task 4.1: Run `measure-review-a-correctness` with a fresh agent of a family other than Claude. Fix each Blocker. Fix each other finding, or record the reason in the plan. `b71d38c`
  - Review A on `2b2574c` with `deepseek/deepseek-flash#high`: status pass, 0 Blocker, 0 Major, 3 Nit. Result: `measure/runs/guard_phase_start_20261109/review-a-2b2574c.json` (`20ff545`). `audit-result` passes, and the review-a gate passes. The shell permission of the reviewer denied its test commands, so it read the logs (confidence medium).
  - F1 [Nit] (the plan says each mutant run is killed): FIX in the plan (Task 3.1 evidence).
  - F2 [Nit] (the DSH `closeoutGuardFor` docstring names only the `[b]` note): FIX in `b71d38c`.
  - F3 [Nit] (the docstrings of the mod `closeout` and the DSH post-execute hook name only the `[b]` note): FIX in `b71d38c`.
  - After the fixes: DSH 352 pass, 0 fail, parity ok; OpenCode `closeout.test.ts` 7 pass, parity ok; mod 92 pass, 0 fail (`review-a-fix-suites.log`).
- [x] Task 4.2: Run `bin/install-measure-skill`, then `bin/install-measure-skill --check`. Compare the installed guard with `main` (AC-7). `65963b9`
  - Install step: `bin/install-measure-skill` from `main` `65963b9` exits 0 (`written=4`). `--check` prints "No differences: every target matches main (65963b9)." and exits 0. The installed `src/core/guards.ts` and `src/guard.ts` equal these files at the stamp commit `65963b9`, and they have no `phaseStartDecision`. The installed `references/dsh.md` equals `main`. Log: `measure/runs/guard_phase_start_20261109/green-p4-install.log`.
  - OpenCode loaded the new plugin with no restart (`loading plugin` at 2026-11-09T03:36:18Z, 3 s after the install).
  - Check of the installed code: bun imports the installed `src/guard.ts`. In a temporary git project with the Workbooks phases, the `[ ]` to `[~]` edit of Task 6.1 is allowed, and the tool output gets the phase-start note. No model call. Log: `green-p4-installed-check.log`.
- [x] Task 4.3: Send the PM one status line: the commit, the test names, and the install result. `65963b9`
  - Line: fix `1d36e19` (comments `b71d38c`), tests: the `phase start` cases of the OpenCode `closeout.test.ts` (AC-1 is the Workbooks case), the mod `closeout.test.ts`, and the DSH `closeout.test.js`; installed from `main` `65963b9` (`--check` exit 0); not pushed.
