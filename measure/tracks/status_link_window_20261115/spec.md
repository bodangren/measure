# Specification: Status link window and guards typing

## Overview

Two defects, one track:

**D1 (PM check, 2026-11-15).** The OpenChamber status extension still has the
old 3-line Link window. `parseTracks` in `extensions/measure-status/src/parse.ts`
line 57 uses `lines.slice(i + 1, i + 4)`. The built bundle
`extensions/measure-status/panel/main.js` has the same loop (near line 2043).
A bold track entry with a longer description does not get parsed, so the band
misses the track. The guard fixed the same window in PR #14 (track
`guard_link_window_20261115`, main `b78377b`). The band and the guard must
agree.

**D2 (PM check, 2026-11-15).** `bun x tsc --noEmit -p .` in
`plugins/opencode-measure-guard` exits 2 at `b78377b`. The errors are
implicit-any errors (TS7006, TS7034, TS7005), and all of them sit in
`src/core/guards.ts`, lines 422 to 587. `src/core/parse.ts` has no errors.
`src/core/guards.ts` is a copy of `mods/measure-guard/hooks/guards.ts`.

Source: PM request, 2026-11-15.

## Functional Requirements

- **FR-1 (the status parser window).** In `parseTracks` of
  `extensions/measure-status/src/parse.ts`, replace the 3-line window with the
  scan rule of `mods/measure-guard/hooks/parse.ts` (lines 111 to 123 at
  `b78377b`). Scan the lines after the bold track line, in order, until the
  first line that matches ENTRY (the next entry line), the first markdown
  heading line (`/^#{1,6} /`), or the end of the text. Take the first line in
  that range that matches LINK_LINE. The other parts of this parser stay
  unchanged. The parser has no Mediarr shape, and this track does not add it.

- **FR-2 (the parser tests).** `extensions/measure-status/src/parse.test.ts`
  (describe `parseTracks`) gets the same three cases (a), (b), and (c) as
  `mods/measure-guard/tests/parse.test.ts`:

  (a) a bold track line, then three description lines, then the `*Link:*`
  line: one entry with the right id and marker. This case fails before the
  parser change (Red).
  (b) a bold track line with no Link line, then a second bold track with its
  Link on the next line: the first track gives no entry, and the second entry
  has its own id.
  (c) a bold track line with no Link line, then a heading line, then a
  `*Link:*` line: no entry for that track. This case fails before the parser
  change (Red), because the old window reads the Link line past the heading.

- **FR-3 (the bundle).** Rebuild `extensions/measure-status/panel/main.js`
  with the build command of `extensions/measure-status/README.md`
  ("## Build"), and commit the bundle. The bundle contains the new loop. It
  does not contain `slice(i + 1, i + 4)`.

- **FR-4 (the README text).** The "Parse rules" bullet of
  `extensions/measure-status/README.md` says where the `*Link:` line can be:
  after the title line, until the next entry line, the next markdown heading,
  or the end of the file.

- **FR-5 (the guards.ts type annotations).** Add explicit type annotations in
  `mods/measure-guard/hooks/guards.ts` (the source) at the places that `tsc`
  names. Type annotations only. No runtime behavior change. The two copies
  follow: `plugins/opencode-measure-guard/src/core/guards.ts` is a
  byte-for-byte copy (its `scripts/check-parity.sh` uses `diff`), and
  `plugins/dsh-measure-guard/src/core/guards.ts` is the source after the
  transform `sed "s|from './parse'|from './parse.ts'|"` (its
  `scripts/check-parity.sh`). Both checks print `parity: ok`.

## Acceptance Criteria

- Red evidence: the failing vitest output of cases (a) and (c), and the
  `bun x tsc --noEmit -p .` output of `plugins/opencode-measure-guard` with
  its implicit-any errors, are kept in `measure/runs/status_link_window_20261115/`.
- In `extensions/measure-status` (after `bun install`): `bunx tsc -p .
  --noEmit` passes, and `bunx vitest run` passes.
- The rebuilt `panel/main.js` is committed, contains the new loop, and does
  not contain `slice(i + 1, i + 4)`.
- No `node_modules` folder is committed.
- In `plugins/opencode-measure-guard`: `bun test` passes (the only allowed
  failure is the known V18 case in `measure/tech-debt.md`), `bun x tsc
  --noEmit -p .` exits 0, and `bash scripts/check-parity.sh` prints
  `parity: ok`.
- `claude plugin test mods/measure-guard` passes, and
  `claude plugin validate mods/measure-guard` passes.
- In `plugins/dsh-measure-guard`: `node --test tests/*.test.js` passes, and
  `bash scripts/check-parity.sh` prints `parity: ok`.
- `bash tests/spec_review_gate/run.sh` exits 0.
- `bash tests/dsh/test-registry.sh` exits 0 (it is slow; use a long timeout).
- The closeout check fails only on the missing closeout manifest.
- `CHANGELOG.md` gets one entry per defect at the top of "## Unreleased" /
  "### Bug Fixes".
- `README.md` line 33 names this track as the latest archived track
  (2026-11-15).

## Out of scope

- Other parts of the measure-status parser. Only the `parseTracks` Link
  window changes.
- Any runtime change in `guards.ts`. Type annotations only.
- The install of the extension. OpenChamber loads it from
  `/home/daniebo/Desktop/measure`, and the hourly sync updates that install
  after the merge.
- A merge into main. Only Daniel merges the pull request.
