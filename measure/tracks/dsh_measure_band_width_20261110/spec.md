# Specification: DSH Measure band width

## Overview

The band caps its one line at `BAND_MAX = 160` **characters** (`compactBand` in
`plugins/dsh-measure-guard/src/client-state.js`). The character count is the terminal width
only for halfwidth text: an East Asian wide or fullwidth character takes two columns, a
combining mark takes none, so a Chinese track title of 100 characters is 200 columns and
overflows the band, and a line of 200 combining marks is counted as long when it renders
narrow. Row 53 of the tech-debt list records the width cap as the remaining band gap.

This track makes `compactBand` cap by **columns**: an East Asian wide/fullwidth code point
counts two, a combining mark zero, everything else one (an approximation of a terminal,
with no dependency). `max` stays 160 columns, so ASCII behavior is exactly unchanged; the
word-boundary cut, the ` ·` stripping, the trim, and the `…` rule keep their contract, the
tests keep their ASCII assertions, and new tests pin a CJK line (compacted, at most 160
columns, at most 80 characters), a mixed line, and the combining-mark case.

## Functional Requirements

- **FR-1 (column cap).** `compactBand` measures columns: wide/fullwidth ranges (CJK,
  Hangul, Hiragana/Katakana, fullwidth forms, emoji, CJK extension planes) count 2,
  combining marks count 0, other code points 1; it cuts at the last space whose prefix fits
  within `max - 1` columns, else keeps the largest prefix that fits, then trims and appends
  `…`, so the result never exceeds `max` columns and a wide-character line never exceeds
  `max` characters either.
- **FR-2 (ASCII unchanged).** For text whose code points are all width 1, the result is
  identical to the old character-based contract (the pinned tests stay green).
- **FR-2b (chips).** The secondary band chips (`Guards:`, `Mode:`, `Goal:`) get a shared chip style: `whiteSpace: nowrap`, `overflow: hidden`, `textOverflow: ellipsis`, `flexShrink: 0`, and a bounded `maxWidth` (33%, the goal chip 40%), so on a narrow viewport a chip ellipsizes instead of clipping and the primary line keeps its share. A render test pins the style on every chip and the goal bound.
- **FR-3 (tests).** `client-state.test.js` adds: an 80-wide-character line (160 columns)
  passes unchanged; a 100-wide-character line compacts to at most 80 characters with `…`;
  a mixed ASCII/CJK line compacts at the column boundary; a combining-mark line is not
  compacted when its columns fit; the pure-ASCII word-boundary test is unchanged.
- **FR-4 (records).** The band-width tech-debt row becomes `Resolved`; the guard README
  states the column cap; `CHANGELOG.md` records it; the installed plugin is reloaded and the
  live check passes.
- **FR-5 (verification).** node 352+ suite, both parity gates, srg, CLI 14/14; the track is
  archived with a manifest-only closeout FAIL.

## Non-Functional Requirements

- **NFR-1 (bounded).** One small range table and one code-point loop; no new dependency and
  no new export beyond the private helper.
- **NFR-2 (no behavior change for ASCII).** The tests and contract keep their ASCII
  results; only wide/zero-width text changes.

## Acceptance Criteria (track level)

- Given a CJK title of 100 wide characters, Then the band line is at most 80 characters and
  ends with `…`.
- Given the existing ASCII tests, Then they pass unchanged.
