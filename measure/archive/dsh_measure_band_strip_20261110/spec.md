# Specification: DSH Measure band strip

## Overview

**Reported symptom (owner, 2026-11-10, live Web GUI):** the Measure band above the
composer renders the whole "Problems" list inline. On a real project (the Mediarr
workspace) the host view carries eleven end-of-turn problems, the band's problems
column wraps every one of them, the flex row grows to **1079 x 503 px** against a
559 px viewport, and the position line is squeezed to about 60 px of ellipsis. The
band also offers "Set up Measure" / "Turn off for session" in a project that already
has a `measure/` folder, because the buttons render whenever the setup answer is not
recorded.

The band's contract from `dsh_measure_band_20261107` is one compact line; the
problems column was added without a height bound, so the contract has an uncovered
hole. This track closes it: the band is a single bounded row, the problem list
becomes a small count that opens the Measure panel (which grows a full problem
section), and the setup buttons appear only when the Host actually sends the setup
offer.

## Functional Requirements

- **FR-1 (one row, bounded).** The band container is a single flex row with a fixed
  bounded height (`maxHeight` ~28 px) and `overflow: hidden`, `whiteSpace: nowrap`;
  no child may increase the band height. The primary span keeps the pinned
  ellipsis behavior and its `title = bandFull`.
- **FR-2 (problems as a count).** The band never renders problem text inline.
  When the host sends problems it renders one chip `Problems: <n>` whose `title` is
  the full problem list (one per line) and whose click opens the Measure panel
  (`ctx.layout.selectPanel('measure')`). The chip stays inside the one-row bound.
- **FR-3 (panel problem section).** The Measure panel renders the complete problem
  list under a localized heading, one problem per row, so the count is actionable.
- **FR-4 (setup actions only for the offer).** The "Set up Measure" / "Turn off for
  session" buttons render only when the host view carries the setup offer text
  (`setup.text !== null`) and the offer is unanswered (`setup.choice === null`). A
  project with a `measure/` folder shows no setup buttons.
- **FR-5 (unchanged contract).** The band still polls the state route every 2 s,
  pauses while the page is hidden, keeps the last good view on a failed poll, renders
  the guards/mode/goal chips with the never-wrap styles, keeps `bandFull` on the
  primary title, and stays localized; the shared core and the state route are not
  changed.
- **FR-6 (tests).** `tests/client-render.test.js` pins the one-row height style
  (`maxHeight`/`overflow: hidden`/`whiteSpace: nowrap` on the container), the
  problem-count chip (text, title, click-to-panel), the absence of setup buttons in a
  normal session, the presence of the buttons and their POST for the setup offer, and
  the panel problem section. The existing state tests stay unchanged.
- **FR-7 (live proof).** Install the plugin copy into the running Web profile,
  reload with `bin/measure-dsh reload`, and prove on the real GUI that the band is at
  most ~32 px tall with the problem count chip on the session that reported the bug;
  record the measured box and a screenshot path in `measure/runs/`.
- **FR-8 (records).** Update the guard README, `docs/dsh.md`, and `CHANGELOG.md`; the
  track is archived with real `actual_tasks`.

## Non-Functional Requirements

- **NFR-1 (no dependency, no build).** Theme-token styles and the existing
  hand-written Lazy-CJS bundle only; no new module request.
- **NFR-2 (no core/parity change).** `src/client-state.js` and the shared core keep
  their exports; both parity gates print `parity: ok`.
- **NFR-3 (localization).** The new labels (`Problems` count, panel section) go
  through the `measure-guard` namespace in `en`/`zh`.
- **NFR-4 (fail open).** A missing/malformed problems array renders no chip; a
  non-string problem is stringified for display only; no throw reaches the slot.
- **NFR-5 (containment).** The band keeps its `SlotBoundary`, so a render failure
  still blanks only this entry.

## Acceptance Criteria (track level)

- Given the live Mediarr session with eleven problems, Then the band's rendered
  height is at most 32 px and its problem area is a single `Problems: 11` chip.
- Given a normal session in a project with `measure/`, Then the band shows no setup
  buttons.
- Given a project without `measure/`, Then the band shows the setup sentence and both
  buttons, and a click POSTs the answer and refetches.
- Given the Measure panel, Then it shows every problem under the localized heading.
- Given the full suite, Then `node --test plugins/dsh-measure-guard/tests/*.test.js`
  passes (354 baseline plus the new band assertions), both parity gates are ok, and
  the dsh/srg gates pass.
- Given the archive, Then the closeout check reports only the missing-closeout-manifest
  FAIL.

## Out of Scope

- The shared band line wording or the status route.
- The sidebar panel's layout beyond the added problem section.
- Redesigning the goal chip or the poll cadence.
- Windows paths and platform packaging.
