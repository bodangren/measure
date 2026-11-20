# Implementation Plan: Board keeps focus and shows a plain reason per card

Track: `board_focus_reasons_20261121`
Spec: [./spec.md](./spec.md)

**All commits go on fix/board-focus-reasons. Push only to origin/fix/board-focus-reasons, never to main. Only the PM or Daniel merges.**

Test command: `cd extensions/measure-status && bunx tsc -p . --noEmit && bunx vitest run`. Build command: `cd extensions/measure-status && bunx esbuild panel/main.ts --bundle --format=iife --platform=browser --outfile=panel/main.js`.

## Phase 1: Focus survives a refresh

- [ ] Task 1.1: Red DOM tests for held data paints, focus, caret, and draft text (`extensions/measure-status/src/painter.test.ts`, `extensions/measure-status/src/painter-dom.test.ts`, `package.json` plus `bun.lock`)
- [ ] Task 1.2: painter module, panel and preview wiring, rebuilt panel/main.js, README Refresh text
- [ ] Task 1.3: live browser check on the OpenChamber panel
## Phase 2: One state and one reason per card

- [ ] Task 2.1: Red fixtures for each state, gate word, and the continuation-line tag (`extensions/measure-status/src/card-state.test.ts`)
- [ ] Task 2.2: parser tag rule, card states, column names, Comment rule, badge, rebuilt panel/main.js, README and fixtures
- [ ] Task 2.3: live browser check of the reason lines on the board
- [ ] Task 2.4: records and closeout
