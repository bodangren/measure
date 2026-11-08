# Implementation Plan: Red gate track scope

Track: `red_gate_track_scope_20261108`. Spec: [spec.md](./spec.md).

## Rules for every phase

- Work on `main` in `/home/daniebo/Desktop/measure`. Never stage `extensions/`.
- Attach a git note to each task commit.
- Run each test command through `/home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh`.
- Get each subagent slot through `/home/daniebo/Desktop/advantage-pr/scripts/jobs/slot wait` in the background. Storytime roles go first.
- Push nothing without the PM's word.

## Phase 1: Spec review

- [x] Task 1.1: Run `measure-spec-review` with a fresh agent of a family other than Claude. Write the result to `measure/runs/red_gate_track_scope_20261108/`. Record the findings and the responses in `spec-review.md`.

## Phase 2: Red tests

- [ ] Task 2.1: Write `tests/spec_review_gate/test_red_track_scope.py` with the cases of AC-1 to AC-8. Run the file against the unchanged checker. Record each failing case name as the Red evidence.

## Phase 3: Green change

- [ ] Task 3.1: Change the `mid-red` branch of `measure_interphase_checks.py` (FR-1 to FR-5). Run the new test file and `tests/spec_review_gate/test_checker.py`.
- [ ] Task 3.2: Update `references/contracts.md`, `CHANGELOG.md`, and `measure/tech-debt.md` (FR-6).
- [ ] Task 3.3: Run `bash tests/spec_review_gate/run.sh` (AC-9).

## Phase 4: Review and distribution

- [ ] Task 4.1: Run `measure-review-a-correctness` with a fresh agent of a family other than Claude. Fix each Blocker. Fix each other finding, or record the reason in the plan.
- [ ] Task 4.2: Run `bin/install-measure-skill`, then `bin/install-measure-skill --check`. Compare the installed checker with `main` (AC-10).
- [ ] Task 4.3: Send the PM one line: the commit and the test name.
