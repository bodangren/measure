# Implementation Plan: Gate track scope

Track: `gate_track_scope_20261108`. Spec: [spec.md](./spec.md).

## Rules for every phase

- Work on `main` in `/home/daniebo/Desktop/measure`. Never stage `extensions/`.
- Attach a git note to each task commit.
- Run one test file directly. Run the full `tests/spec_review_gate/run.sh` through `/home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh` with `HEAVY_PRIORITY=p2` (PM rule, 2026-11-08: leftover slot only).
- Get each subagent slot through `/home/daniebo/Desktop/advantage-pr/scripts/jobs/slot wait` in the background.
- Pick each subagent model with `/home/daniebo/Desktop/advantage-pr/scripts/jobs/ra-quota pick <role> --not-family claude --why`.
- Keep each G20 mutant line of `tests/spec_review_gate/test_s2_adversarial.sh` one time in the checker.
- Push nothing without the PM's word.

## Phase 1: Spec review

- [x] Task 1.1: Run `measure-spec-review` with a fresh agent of a family other than Claude. Write the result to `measure/runs/gate_track_scope_20261108/`. Record the findings and the responses in `spec-review.md`. `1a510ee`
  - Round 1 on `9d67250`: fail, 2 Blocker, 2 Major, 3 Nit (`4fd7751`). Revision: `ab95c03`.
  - Round 2 on `ab95c03`: pass, 0 Blocker, 0 Major, 1 Nit (`1a510ee`). The spec-review gate passed. F8: FIX in the Phase 1 checkpoint commit.

## Phase 2: Red tests

- [ ] Task 2.1: Write `tests/spec_review_gate/test_gate_track_scope.py` with the cases of AC-1 to AC-18. Run the file against the unchanged checker. Record each failing case name as the Red evidence.

## Phase 3: Green change

- [ ] Task 3.1: Change `measure_interphase_checks.py` (FR-1 to FR-6). Run the new test file, `test_red_track_scope.py`, and `test_checker.py` (AC-19).
- [ ] Task 3.2: Run the Monorepo replay of AC-21 on a read-only clone. Record the old and the new output.
- [ ] Task 3.3: Update `references/contracts.md`, `CHANGELOG.md`, and `measure/tech-debt.md` (FR-7).
- [ ] Task 3.4: Run `bash tests/spec_review_gate/run.sh` through `heavy-run.sh` (AC-20).

## Phase 4: Review and distribution

- [ ] Task 4.1: Run `measure-review-a-correctness` with a fresh agent of a family other than Claude. Fix each Blocker. Fix each other finding, or record the reason in the plan.
- [ ] Task 4.2: Run `bin/install-measure-skill`, then `bin/install-measure-skill --check`. Compare the installed checker with `main` (AC-22).
- [ ] Task 4.3: Send the PM one line: the commit, the test name, and the install result.
