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

## Phase 1: Spec review

- [ ] Task 1.1: Run `measure-spec-review` with a fresh agent of a family other than Claude. Write the result to `measure/runs/guard_phase_start_20261109/`. Record the findings and the responses in `spec-review.md`.

## Phase 2: Red tests

- [ ] Task 2.1: Change the three old phase-start cases and add the AC-1 case (AC-1 to AC-4). Run the three test files against the unchanged guards. Record each failing case name as the Red evidence.

## Phase 3: Green change

- [ ] Task 3.1: Remove `phaseStartDecision` from the mod source, copy `guards.ts` to the two plugins, and change the three closeout functions (FR-1 to FR-3). Run the suites of AC-5 and AC-6.
- [ ] Task 3.2: Update the three READMEs, `skills/measure-orchestrator/references/dsh.md`, and `CHANGELOG.md` (FR-4).

## Phase 4: Review and distribution

- [ ] Task 4.1: Run `measure-review-a-correctness` with a fresh agent of a family other than Claude. Fix each Blocker. Fix each other finding, or record the reason in the plan.
- [ ] Task 4.2: Run `bin/install-measure-skill`, then `bin/install-measure-skill --check`. Compare the installed guard with `main` (AC-7).
- [ ] Task 4.3: Send the PM one status line: the commit, the test names, and the install result.
