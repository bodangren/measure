# Implementation Plan: Waits for Daniel only for the four gates with a Task id

Track: `measure_status_daniel_gate_20261127`

**Work on main. Push to origin/main only. Light card: no spec, no gates.**

## Phase 1: Daniel cards only for the four gates with a Task id

- [x] Task 1 Rule: delete the R3a branch; Daniel branch only for thai/spend/deletion/public owners with a Task id; id-without-task reason text; README rewritten; bundle left for step 3. — 80077b4
- [x] Task 2 Tests: parse/board/card-state/comment-box/painter-dom/adversarial/green-r2 expectations updated to the new rule; Task-id helper tests added; mockup Daniel fixtures updated (4 look cards to next-in-line, 3 non-gate cards to Waits for PM, 4 four-gate cards gain Task ids); fail-before evidence recorded (23 new tests fail on old source, 441 pass on new). — 80077b4
- [~] Task 3 Push: commit, plain push, ls-remote verify, sha on the card line.
- [x] Task 4 Shelved rule and bundle rebuild (PM, 2026-11-27): a track under "## Shelved Tracks" shows in Planned as "Shelved: <status>", never In progress or Done; panel/main.js rebuilt so Daniel's panel carries 80077b4 and the Shelved rule. Evidence: bunx vitest run 444 passed (25 files); tsc --noEmit clean; this commit.
