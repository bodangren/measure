# Implementation Plan: Guard session track

Track: `guard_session_track_20261109`. Spec: [spec.md](./spec.md).

## Rules for every phase

- Work on `main` in `/home/daniebo/Desktop/measure`. Never stage `extensions/`.
- Attach a git note to each task commit.
- The plugin suite is light: run `bun test` in `plugins/opencode-measure-guard` directly. Run `tests/spec_review_gate/run.sh` only through `/home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh` with `HEAVY_PRIORITY=p2` (PM rule, 2026-11-08: leftover slot only).
- Get each subagent slot through `/home/daniebo/Desktop/advantage-pr/scripts/jobs/slot`.
- Pick each subagent model with `/home/daniebo/Desktop/advantage-pr/scripts/jobs/ra-quota pick <role> --not-family claude --why`.
- Do not change `src/core/`, `src/types.ts`, or `mods/measure-guard/` (D7).
- The plugin source change lands in one commit (Task 3.1). The Red tests land in the Red commit before it, as the TDD workflow needs. The plan and the PM line record the install step (Task 4.2). A Review A fix is one more commit, and the PM line names it.
- Push nothing without the PM's word.

## Phase 1: Spec review [checkpoint: f04e8af]

- [x] Task 1.1: Run `measure-spec-review` with a fresh agent of a family other than Claude. Write the result to `measure/runs/guard_session_track_20261109/`. Record the findings and the responses in `spec-review.md`. `5ab36a9`
  - Round 1 on `79140c0` with `deepseek/deepseek-flash#high`: pass, 0 Blocker, 4 Major, 3 Nit (`c4fc3bd`, log block `5ab36a9`). The spec-review gate passed. F1, F3 to F7: FIX in the Phase 1 checkpoint commit. F2: KEEP, with the reason in D6.

## Phase 2: Red tests [checkpoint: 8882405]

- [x] Task 2.1: Write `plugins/opencode-measure-guard/tests/session-track.test.ts` with the cases of AC-1 to AC-16 and AC-20 to AC-22. Run the file against the unchanged plugin. Record each failing case name as the Red evidence. `36319a2`
  - Evidence: `bun test tests/session-track.test.ts` on the unchanged plugin gives `19 tests`, `2 pass`, `17 fail`, exit 1. Log: `measure/runs/guard_session_track_20261109/red-p2-unchanged-plugin.log`.
  - Failing: AC-1 to AC-12, AC-14, AC-15, AC-16, AC-21, AC-22. The old note names Alpha, the session record has no `track`, or `src/track.ts` does not exist.
  - Passing (guards of the old behavior): AC-13 (one working track), AC-20 (the parse-error note).

## Phase 3: Green change [checkpoint: bfd6dc2]

- [x] Task 3.1: Add `src/track.ts`, and change `src/state.ts`, `src/snapshot.ts`, `src/guard.ts`, and `src/index.ts` (FR-1 to FR-7). Run the new test file, `bun test`, `tsc`, and the parity check (AC-17). `f9db4ac`
  - Evidence: `tests/session-track.test.ts` gives `19 pass`, `0 fail`. `tsc` exits 0, and `check-parity.sh` prints `parity: ok`. Logs: `measure/runs/guard_session_track_20261109/green-p3-*.log`.
  - Evidence: 19 mutants of the new lines, each killed by 1 or more cases (`green-p3-mutants.log`). The first run left 5 survivors, so AC-7, AC-11, AC-12, AC-20, and AC-22 each got one more step in the same commit, and the spec states each step.
  - Deviation (AC-17): `bun test` gives `150 pass`, `1 fail`. The failure is V18 of `allow-adversarial.test.ts`. It fails the same way on a clean copy of `8882405` (`green-p3-v18-preexisting.log`): `6d2fdcf` changed V6 and V7 for its control-character rule and missed V18. This track does not change the old test file. The tech-debt registry records the case.
- [x] Task 3.2: Update the plugin `README.md` and `CHANGELOG.md` (FR-8). `aac6755`
  - Evidence: `tests/dsh/test-docs.sh` exits 0.

## Phase 4: Review and distribution [checkpoint: 96a75a5]

- [x] Task 4.1: Run `measure-review-a-correctness` with a fresh agent of a family other than Claude. Fix each Blocker. Fix each other finding, or record the reason in the plan. `83e099a`
  - Review A on `bfd6dc2` with `deepseek/deepseek-flash#high`: status pass, 0 Blocker, 1 Major, 1 Nit. Result: `measure/runs/guard_session_track_20261109/review-a-bfd6dc2.json` (`952368d`). The reviewer reached its step limit in its first message; a second message in the same session made it write and validate the file itself. `audit-result` passes, and the review-a gate passes.
  - F1 [Major] (a parse error keeps `inProgress`, against FR-3): FIX in `83e099a`. AC-20 asserts an empty `inProgress` and kills the mutant (`review-a-f1-mutant.log`).
  - F2 [Nit] (the README rule for the project-wide note is not exact): FIX in `83e099a`.
  - After the fixes: `session-track.test.ts` 19 pass; `bun test` 150 pass, 1 fail (V18, pre-existing); `tsc` exit 0; `parity: ok` (`review-a-fix-bun-test.log`).
- [x] Task 4.2: Run `bin/install-measure-skill`, then `bin/install-measure-skill --check`. Compare the installed `src` with `main` (AC-18). `902e729`
  - Install step: `bin/install-measure-skill` from `main` `902e729` exits 0 (`written=6`). `bin/install-measure-skill --check` prints "No differences: every target matches main (902e729)." and exits 0. `diff -r` of `plugins/opencode-measure-guard/src` and the installed `src` shows no difference. The install has no `tests/` folder. Log: `measure/runs/guard_session_track_20261109/green-p4-install.log`.
  - OpenCode loaded the new plugin with no restart: `loading plugin` at 2026-11-08T18:36:24Z, 5 s after the install.
- [x] Task 4.3: Run the live check of AC-19 through the OpenCode service HTTP API. Record the stored user messages. `902e729`
  - The service password is in the environment of the OpenChamber-managed server, so the check used the OpenChamber session tool on the same server (port 39005) in place of direct HTTP calls.
  - Evidence: in `/tmp/gst-live-20261109` (3 `[~]` tracks), session `ses_e438c7909ffeW1aQOEdS2OdZ4Z` names `beta_20261109`, and its stored user message holds `Active track: Beta (measure/tracks/beta_20261109/).` and `Current task: [~] Task 1.1: Beta work`. Session `ses_e438c6f7cffeoAiGqiF5auYXZw` names no track, and its stored user message holds the work list with the 3 tracks. Log: `green-p4-live-check.log`.
- [x] Task 4.4: Send the PM one line: the commit, the test name, the install result, and the live result. `04173f0`
  - Line: fix `f9db4ac` (and the Review A fix `83e099a`), test `plugins/opencode-measure-guard/tests/session-track.test.ts` (19 cases; the PM cases are AC-1 and AC-2), installed from `main` `902e729` (`--check` exit 0), live sessions show the Beta note and the 3-track list, not pushed.
