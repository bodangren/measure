# Implementation Plan: Board keeps focus and shows a plain reason per card

Track: `board_focus_reasons_20261121`
Spec: [./spec.md](./spec.md)

**All commits go on fix/board-focus-reasons. Push only to origin/fix/board-focus-reasons, never to main. Only the PM or Daniel merges.**

Test command: `cd extensions/measure-status && bunx tsc -p . --noEmit && bunx vitest run`. Build command: `cd extensions/measure-status && bunx esbuild panel/main.ts --bundle --format=iife --platform=browser --outfile=panel/main.js`.

## Phase 1: Focus survives a refresh

- [x] Task 1.1: Red DOM tests for held data paints, focus, caret, and draft text (`extensions/measure-status/src/painter.test.ts`, `extensions/measure-status/src/painter-dom.test.ts`, `package.json` plus `bun.lock`) — f56902a
  - Red evidence: `tsc` fails only on the missing `./painter` module (2 errors). `vitest run` fails 2 new suites on the missing module. It passes 21 suites (308 tests). Log: `measure/runs/board_focus_reasons_20261121/red-p1.log`.
- [x] Task 1.2: painter module, panel and preview wiring, rebuilt panel/main.js, README Refresh text — 5858bad, 1fff4f4
  - Green evidence: `bunx tsc -p . --noEmit` and `bunx vitest run` each exit 0. The bundle rebuild exits 0. Mid Red fixed the DOM fixture at 99ecd2e. The F1 fix at 1fff4f4 moves the hold rule to `src/painter.ts` and keeps every paint route. Log: `measure/runs/board_focus_reasons_20261121/green-p1.log`.
- [x] Task 1.3: live browser check on the OpenChamber panel — 8dafa77
  - Live evidence: the UX browser check on 8dafa77 passed all four checks (timer 268 samples, host reply 230 samples, Escape, reopen draft). The browser closed. Result: `measure/runs/board_focus_reasons_20261121/ux-browser-8dafa77.json`.
## Phase 2: One state and one reason per card

- [x] Task 2.1: Red fixtures for each state, gate word, the continuation-line tag, and the two User Manual Verification rows (open deferred row gives Waits for PM, closed D1 row gives no Daniel item) (`extensions/measure-status/src/card-state.test.ts`) — 6bc2f45
  - Red evidence: `bunx tsc -p . --noEmit` fails only on the missing `gateForOwner`, `Card.state`, and `Card.reason`. `bunx vitest run` fails 65 new tests in `card-state.test.ts`; 23 other suites pass with 351 existing tests. Log: `measure/runs/board_focus_reasons_20261121/red-p2.log`.
- [x] Task 2.2: parser tag rule, card states, column names, Comment rule, badge, rebuilt panel/main.js, README and fixtures — 5dfd496, fa92063, 97ad7b8
  - Green evidence: `bunx tsc -p . --noEmit` and `bunx vitest run` each exit 0. The `panel/main.js` rebuild exits 0. The rail badge counts Waits for Daniel cards. Log: `measure/runs/board_focus_reasons_20261121/green-p2.log`.
  - Review A evidence: F1 semicolon separators, F2 regenerated fixture reasons and gate cards, and F3 Next in line with a current task are fixed at fa92063. `bunx tsc -p . --noEmit` and `bunx vitest run` each exit 0. Log: `measure/runs/board_focus_reasons_20261121/green-p2-r2.log`.
  - Review A round 2 evidence: F4 fixture columns now come from `classifyTrack`, so all seven state and column contradictions are gone. A fixture test fails on 643912a and passes at 97ad7b8. `bunx tsc -p . --noEmit` and `bunx vitest run` each exit 0. Log: `measure/runs/board_focus_reasons_20261121/green-p2-r3.log`.
- [x] Task 2.3: live browser check of the reason lines on the board — e410fd1
  - Live evidence: the UX browser check on e410fd1 passed on the live board. All 242 open cards show one state with a plain reason. lending-desk-bench domain_trust shows Running. Workbooks deps_refresh_20261121 D3 shows Waits for PM with no Comment button. Result: `measure/runs/board_focus_reasons_20261121/ux-browser-e410fd1.json`.
  - Fixture evidence: the live board held zero Waits for Daniel cards, and the phone panel target was absent. These checks ran on a read-only fixture page with the committed bundle and `mockup/fixtures.json`: Comment button only on Waits for Daniel, the Reason field, the badge count, the focus check, and the 390 px layout. The PM accepted fixture proof for these checks (2026-11-22).
  - PM condition: after the panel deploy, the PM checks the first real Waits for Daniel card on the live board (Comment button and Reason field) and logs it. A fault there opens a bug track. It does not reopen this phase.
- [x] Task 2.4: records and closeout — e410fd1
  - FR-8 record: the live browser checks in Phase 1 (8dafa77) and Phase 2 (e410fd1) saw no host focus fault. The track reports no OpenChamber fault.
  - Track closeout follows final acceptance through the closeout role.
