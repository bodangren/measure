# Specification: Board keeps focus and shows a plain reason per card

## Overview

The Measure board steals text focus during refresh. The board also shows a wrong blocked line on some cards. This track fixes both faults in the measure-status extension.

Source: Daniel's feedback on his first use of the Measure board (extension extensions/measure-status), 2026-11-21. Type fix, lane light.

Daniel said:

(1) "the text focus gets stolen while I'm trying to type. I'm not sure where it goes. I think it may come back into the main session when you respond to a previous comment."

(2) "there's no obvious reason that something's blocked. It doesn't need my input ... It's just behind another task, right?"

## Root causes

The orchestrator verified both causes.

Cause 1 sits in `panel/main.ts`. `paint()` sets `root.innerHTML` on every repaint. `loadBoard()` repaints once at start, once per repo result (8 repos), and once at the end, every 60 s and on Refresh. `host.onReady` also calls `paint()` each time the host sends a ready context. Each repaint destroys the focused textarea. `restoreComment()` puts the text back but not the focus, the caret, or an IME composition.

Cause 2 sits in `src/board.ts` and `src/parse.ts`. `classifyTrack` in `src/board.ts` treats any open [b] task anywhere in the plan as the card blocker, with that task text as the line, even when an earlier task is [~]. `src/parse.ts` reads the `deferred:<owner>` tag only from the first line of a task.

In `~/Desktop/lending-desk-bench/measure/tracks/domain_trust/plan.md` task 2.1 has "— deferred:mid-red" on a wrapped continuation line, so the parser misses the tag. The task counts as an open blocker. The card shows "Blocker: 2.1 Test file ..." while task 1.3 is [~].

## Functional requirements

### Phase 1: focus survives a refresh

- FR-1: New module `src/painter.ts` exports `createPainter`. It owns the paint scheduling. `panel/main.ts` and `preview/preview.ts` use it.
- FR-2: Two paint kinds exist. A data paint covers load start, each repo result, load end, timer, Refresh button, and host ready context. A user paint covers any click action, Escape, send start, and send end.
- FR-3: A data paint is held while the open comment box has focus or holds text. Held text means a visible or invisible character. A held data paint sets a pending flag and changes no DOM node. The pending paint runs when the box closes (Escape, send end). It also runs when the box loses focus with empty text.
- FR-4: The rail badge update runs on every data result. It is never held.
- FR-5: A user paint runs at once. After it, the open box gets its text back. When the box had focus before the paint, it gets focus back with preventScroll. It also gets its selection start and end back.
- FR-6: Draft text stays per card key across every paint. It uses the existing `commentState.texts`.
- FR-7: DOM tests run in `happy-dom` through the devDependency `happy-dom`. Each test file carries `// @vitest-environment happy-dom`. A test opens a box, types text, and sets a caret. It then triggers a data refresh and a host ready event. It asserts the same textarea node, `document.activeElement` on that node, and unchanged value and selection. After Escape the pending paint runs and the board shows the new data.
- FR-8: Focus that leaves the panel frame on a PM session message with no repaint is an OpenChamber host fault. The browser check records it and the track reports it. The track does not change OpenChamber.

### Phase 2: one state and one reason per card

Open tracks only. Done is unchanged.

- FR-9: The `deferred:<owner>` tag counts in the first line of a task. It also counts in wrapped continuation lines. A continuation line is indented and is not a sub-bullet. The tag search stops at the first sub-bullet or the next task.
- FR-10: Human gate words map an owner token to a gate. The match uses the lowercase owner token split on `-`, `_`, `.`, and `;`. One word matches. The map: `deploy`, `traffic` give gate "deploy"; `paid`, `spend` give gate "paid spend"; `delete`, `deletion` give gate "deletion"; `public` (as in public-date) gives gate "public date"; `look`, `manual` give gate "look"; `thai` gives gate "Thai check"; `proof` gives gate "proof"; `sudo`, `login` give gate "sudo or login".
- FR-11: State rules. The first match wins.
  - a. Waits for Daniel: the first not-done task in plan order is a [b] task whose owner token holds a human gate word. Or the current task is a gate text under rule R3a, with gate "look". The 14-day age rule stays. Reason line: "Waits for Daniel: \<gate> — \<task label>".
  - b. Running: a task is [~]. Reason line: "Running: \<task label>".
  - c. Waits for PM: the first not-done task is a [b] task with any other owner token (pm, mid-red, later-track, daniel with no gate word, and so on) or no token. Or the registry marker is [b] with no plan reason. Reason line: "Waits for PM: \<task label>" or "Waits for PM: registry marker [b]".
  - d. Next in line: every other open track. Reason line: "Next in line: \<task label>". No input is needed.
- FR-12: Columns stay five, in the same order. Planned and In progress keep their current rules for Next in line cards. A Next in line card goes to In progress when a task is [x] or the registry marker is [~]. A Running card goes to In progress. The column "Blocked" becomes "Waits for PM". The column "Waiting on Daniel" becomes "Waits for Daniel".
- FR-13: The labels BLOCKER, GATE, and MANUAL CHECK go away. The card shows the reason line in place of "Blocker: ...".
- FR-14: Only a Waits for Daniel card shows the Comment button. The message field "Blocker" becomes "Reason". It carries the reason line.
- FR-15: The rail badge counts Waits for Daniel cards.
- FR-16: Fixtures cover one card per state. They cover one card per gate word group. They cover the lending-desk-bench shape (tag on a continuation line, earlier [~] task), which gives Running. `deferred:pm` and `deferred:mid-red` give Waits for PM when first not-done. The Comment button shows only on Waits for Daniel.
- FR-17: README.md sections "The board" and "Refresh" follow the new rules. `mockup/fixtures.json` follows the new rules.

## Acceptance criteria

- The comment box keeps focus, caret, and draft text across a data refresh and a host ready event. Escape applies the pending paint.
- Each open card shows one state and one reason line. The lending-desk-bench card shows Running, not a blocker.
- The board keeps five columns with the new names and rules. Only Waits for Daniel cards show the Comment button.
- The rail badge counts Waits for Daniel cards.

## Out of scope

- Changes to OpenChamber stay out of scope. A host fault is recorded and reported only.
- Done cards stay unchanged.

## Build commands

From `extensions/measure-status`: `bun install`, `bunx tsc -p . --noEmit`, `bunx vitest run`, `bunx esbuild panel/main.ts --bundle --format=iife --platform=browser --outfile=panel/main.js`.
