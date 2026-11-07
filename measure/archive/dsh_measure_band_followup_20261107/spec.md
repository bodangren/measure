# Specification: DSH Measure band follow-up corrections

## Overview

The compact-band track (`dsh_measure_band_20261107`) shipped the 160-character
band cap and the one-line Client row, live-verified. Its fresh review found that
the track *claim* and the *test surface* were weaker than the behaviour:

1. **A false fallback premise.** `docs/dsh.md`, the CHANGELOG, and the archived
   band spec said the full position text is also available in the sidebar panel.
   It is not: the panel renders `clientView().status`, which is `statusLines()`
   plus the goal line, and `statusLines()` never includes the active task text.
   Only `bandFull` (the hover title) and `measure_status` carry the full text.
   The README band bullet did not make that claim (only its route field list was
   stale, FR-3); a review correction fixed this description.
2. **Two compaction rules have no tests.** The trailing ` ·` strip and the
   160/161 boundary are untested; they can regress with the suite green.
3. **The live acceptance criterion cannot prove the cap.** The recorded run
   already showed `band` 157 with `…` and `bandFull` 198, but the criterion only
   asked for `band.length` at most 160, which a short line would satisfy; the
   follow-up requires `bandFull.length` greater than 160 as well.
4. **The view-key assertion is unmentioned.** `plugins/dsh-measure-guard/tests/client-state.test.js`
   pins the exact `Object.keys(view)` list; adding `bandFull` necessarily
   updates it and the plan never says so.
5. **The contract has an undefined branch.** The cut rule does not say whether
   the space at the cut is kept and defines no result when no space exists at or
   before `max - 1`.
6. **The route field list is stale.** The README "Data route" bullet still
   documents the old five-field view.

This track corrects those. It changes no behaviour except documenting and
testing the exact contract (the fallback branch is pinned by the current code:
the space at the cut is dropped, and with no space the first `max - 1`
characters are kept).

## Functional Requirements

- **FR-1 (the true full-text escapes).** The documentation states that the
  compact band's full text is available through `bandFull`/the hover title and
  `measure_status`; the sidebar panel keeps only the status lines plus the goal
  line. README, `docs/dsh.md`, and the CHANGELOG are corrected; the archived
  band spec carries a dated correction note.
- **FR-2 (the pinned compaction contract).** `compactBand(text, max)` is
  documented and tested exactly: an input of length at most `max` is returned
  unchanged; a longer input is cut at the last space at or before `max - 1`
  (a space at index 0 is a cut too; the space is not kept), the kept prefix is
  trimmed of trailing whitespace, a trailing ` ·` is stripped, and `…` is
  appended; when no space exists at or before `max - 1`, the first `max - 1`
  characters are kept; the result is at most `max` characters; a non-string or
  empty input returns null. Tests cover the strip case, the 160/161 boundary, a
  no-space single token, and the leading-space/trailing-whitespace branch
  (the space-at-index-0 branch was a real behaviour fix found in review).
- **FR-3 (the view shape).** The README "Data route" bullet lists the current
  view fields (`band`, `bandFull`, `status`, `guardsOff`, `problems`,
  `updatedAt`, `goal`, `mode`, `setup`), and the archived band plan notes that
  `bandFull` necessarily updates the exact-key assertion.
- **FR-4 (a live cap proof).** With a task title long enough to exceed
  `BAND_MAX`, the running route (`GET /measure-guard/state?sessionId=<id>`, the
  session id from `--session`/`DSH_SESSION_ID`) returns `band.length` at most
  160 ending in `…` while `bandFull.length` is greater than 160. The executing
  track's own task title may already be long enough; only if it is not does the
  title need a temporary lengthening, reverted afterwards.

## Non-Functional Requirements

- **NFR-1 (no core change).** Both parity gates stay green.
- **NFR-2 (no new dependency, no build).**
- **NFR-3 (fail open).** A null/absent band or a non-string input never throws.
- **NFR-4 (POSIX).** Windows stays out of scope.

## Acceptance Criteria (track level)

- Given the plugin package, When I run `node --test plugins/dsh-measure-guard/tests/*.test.js`, Then every test passes and the count grows from 284 by the new boundary/strip/no-space tests.
- Given both parity gates, Then both print `parity: ok`; `bash tests/dsh/run.sh` and `bash tests/spec_review_gate/run.sh` pass.
- Given the running profile after a reload with a long task title, Then the route shows a capped band with the ellipsis and a longer `bandFull`; the evidence is under `measure/runs/dsh_measure_band_followup_20261107/`.

## Out of Scope

- Changing `BAND_MAX`, the view design, the panel, or `measure_status`.
- Width-aware layout (a DOM measurement).
- Windows paths and platform packaging.
