# Specification: Guard link window and S1 helpers

## Overview

Two defects, one track:

**D1 (from the Graph project).** measure-guard reads a bold track entry only
when its `*Link:*` line is within 3 lines below the track line: `parseTracks`
in `mods/measure-guard/hooks/parse.ts` line 110 uses
`lines.slice(i + 1, i + 4)`. An entry with a longer description does not get
parsed, so the guard block does not clear. The Graph project used a
`measure/guard-allow` work-around.

**D2 (found by the orchestrator on 2026-11-14).**
`tests/spec_review_gate/test_s1_new_track.sh` lines 59 and 60 call `in_text`
and `in_flat`, but the file does not define them. Bash prints "command not
found", the two checks never run, and the suite still passes. The file defines
`pass` and `fail` (lines 19 to 20) and `in_block` (line 48), but not `in_text`,
`in_flat`, `blank`, or `flat`. The two labels of the broken calls are
"new-track §2.5: project metadata keys rule" and "new-track §2.5: only the
common extra keys are copied".

Source: PM request, 2026-11-15.

## Functional Requirements

- **FR-1 (the parser window).** In `parseTracks` of
  `mods/measure-guard/hooks/parse.ts`, replace the 3-line window. Scan the
  lines after the bold track line, in order, until the first line that matches
  ENTRY (the next track line), the first markdown heading line (`/^#{1,6} /`),
  or the end of the text. Take the first line in that range that matches
  LINK_LINE. The same-line Mediarr shape (the existing `same` branch) stays
  unchanged. The comment at lines 5 to 8, which says "on one of the next three
  lines", describes the new rule.

- **FR-2 (the parity copies).** `plugins/opencode-measure-guard/src/core/parse.ts`
  and `plugins/dsh-measure-guard/src/core/parse.ts` are byte-for-byte copies
  of `mods/measure-guard/hooks/parse.ts`. Copy the changed file to both. Each
  `scripts/check-parity.sh` prints `parity: ok`.

- **FR-3 (the README text).** The text that describes the old window changes.
  `plugins/dsh-measure-guard/README.md` line 173 says "on one of the next
  three lines". `mods/measure-guard/README.md` line 168 says "with a next
  line", which describes the same window in a narrower form. Both lines
  describe the new rule.

- **FR-4 (the parser tests).** `mods/measure-guard/tests/parse.test.ts`
  (describe `parseTracks`) gets these cases:

  (a) a bold track line, then three description lines, then the `*Link:*`
  line: one entry with the right id and marker. This case must fail before
  the parser change (Red).
  (b) a bold track line with no Link line, then a second bold track with its
  Link on the next line: the first track gives no entry, and the second entry
  has its own id (the first track does not take the second track's link).
  (c) a bold track line with no Link line, then a heading line, then a
  `*Link:*` line: no entry for that track.

- **FR-5 (the S1 helpers).** `tests/spec_review_gate/test_s1_new_track.sh`
  defines `in_text` and `in_flat` with the same bodies as in
  `tests/spec_review_gate/test_s2_role_docs.sh`, with the `blank` and `flat`
  helpers that they use, near the existing `in_block` helper. Before the fix,
  the S1 output shows the "command not found" lines and no PASS line for the
  two labels (Red).

- **FR-6 (the mutation proof).** A temporary copy of the fixed test, with each
  expected string changed, at `tests/spec_review_gate/mut_s1.sh` (the name
  does not match the runner's `test_*` pattern) fails for both labels. The
  copy runs with `bash`, its output is kept, and the copy is deleted before
  the commit.

## Acceptance Criteria

- `bash tests/spec_review_gate/run.sh` exits 0, and the S1 output has a PASS
  line for both labels and no "command not found".
- `claude plugin test mods/measure-guard` passes, and
  `claude plugin validate mods/measure-guard` passes (the commands that
  `measure/archive/guard_phase_start_20261109` used).
- In `plugins/opencode-measure-guard`: `bun test` passes (the only allowed
  failure is the known V18 case in `measure/tech-debt.md`), `bun x tsc
  --noEmit -p .` passes, and `bash scripts/check-parity.sh` prints
  `parity: ok`.
- In `plugins/dsh-measure-guard`: `node --test tests/*.test.js` passes, and
  `bash scripts/check-parity.sh` prints `parity: ok`.
- `bash tests/dsh/test-registry.sh` exits 0 (it is slow; use a long timeout),
  and the closeout check fails only on the missing closeout manifest.
- `CHANGELOG.md` gets entries at the top of "## Unreleased" / "### Bug Fixes",
  and `README.md` line 33 names this track as the latest archived track
  (2026-11-15).

## Out of scope

`extensions/measure-status` (it has the same 3-line window but is a separate
bundle; the PM gets a separate proposal); the install of the Claude mod and
the DSH plugin; the Graph repository; the interphase checker and
`tests/dsh/test-registry.sh` (they check the registry format, not this
parser); a merge into main.
