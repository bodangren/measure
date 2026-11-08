# Implementation Plan: Guard session track

Track: `guard_session_track_20261109`. Spec: [spec.md](./spec.md).

## Rules for every phase

- Work on `main` in `/home/daniebo/Desktop/measure`. Never stage `extensions/`.
- Attach a git note to each task commit.
- The plugin suite is light: run `bun test` in `plugins/opencode-measure-guard` directly. Run `tests/spec_review_gate/run.sh` only through `/home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh` with `HEAVY_PRIORITY=p2` (PM rule, 2026-11-08: leftover slot only).
- Get each subagent slot through `/home/daniebo/Desktop/advantage-pr/scripts/jobs/slot`.
- Pick each subagent model with `/home/daniebo/Desktop/advantage-pr/scripts/jobs/ra-quota pick <role> --not-family claude --why`.
- Do not change `src/core/`, `src/types.ts`, or `mods/measure-guard/` (D7).
- Push nothing without the PM's word.

## Phase 1: Spec review

- [ ] Task 1.1: Run `measure-spec-review` with a fresh agent of a family other than Claude. Write the result to `measure/runs/guard_session_track_20261109/`. Record the findings and the responses in `spec-review.md`.

## Phase 2: Red tests

- [ ] Task 2.1: Write `plugins/opencode-measure-guard/tests/session-track.test.ts` with the cases of AC-1 to AC-16. Run the file against the unchanged plugin. Record each failing case name as the Red evidence.

## Phase 3: Green change

- [ ] Task 3.1: Add `src/track.ts`, and change `src/state.ts`, `src/snapshot.ts`, `src/guard.ts`, and `src/index.ts` (FR-1 to FR-7). Run the new test file, `bun test`, `tsc`, and the parity check (AC-17).
- [ ] Task 3.2: Update the plugin `README.md` and `CHANGELOG.md` (FR-8).

## Phase 4: Review and distribution

- [ ] Task 4.1: Run `measure-review-a-correctness` with a fresh agent of a family other than Claude. Fix each Blocker. Fix each other finding, or record the reason in the plan.
- [ ] Task 4.2: Run `bin/install-measure-skill`, then `bin/install-measure-skill --check`. Compare the installed `src` with `main` (AC-18).
- [ ] Task 4.3: Run the live check of AC-19 through the OpenCode service HTTP API. Record the stored user messages.
- [ ] Task 4.4: Send the PM one line: the commit, the test name, the install result, and the live result.
