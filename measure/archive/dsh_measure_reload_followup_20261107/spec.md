# Specification: DSH Measure reload follow-up corrections

## Overview

The semantic-reload track shipped and is live-proven, but its fresh review found
that the *record* and the *edge cases* are weaker than the code:

1. **The live proof was not executable as written.** The acceptance said the
   route reports `<mode> (repository)`, but the real call needs
   `?sessionId=<live id>` (a bare route is 404) and returns
   `{"mode":{"value":…,"source":…}}`; neither the session id nor the cookie
   transport was recorded.
2. **The cleanup was not checkable.** The track mutates the real
   `~/.local/state/measure/dsh-guard/repos.json`; the plan never named the
   evidence file, the store path, the clearing command, or the pre-run value, so
   "clear the override" could delete a pre-existing entry.
3. **Three command cases are undefined:** a reload on a patch with no complete
   managed block; the nonce written by a *changed-block* install; and a
   non-integer `reloadNonce`.
4. **The contract tests are not exact:** no expected nonce values, no
   missing-nonce default case, and the exact PASS/dry-run strings are unnamed.
5. **A lesson still points at the defect:** `measure/lessons-learned.md` says
   "Toggle a marker comment line instead", which this work proved wrong.
6. **Phase 3 was ungated:** the docs/closeout edits had no verification run
   after them.

This follow-up corrects the record, pins the undefined cases in code+tests, fixes
the lesson, and adds the post-docs gate. It changes no shipped behaviour except
the defined edge cases (which the code already implements; they gain tests and
documentation).

## Functional Requirements

- **FR-1 (the executable live-proof record).** The archived reload spec's live
  proof names `GET /measure-guard/state?sessionId=<id>` (and that the router
  answers 404 without one), the JSON shape
  `{"mode":{"value":"<mode>","source":"<repository|session|config>"}}`, the
  evidence file `measure/runs/dsh_measure_reload_20261107/live-reload.md`, the
  store path `~/.local/state/measure/dsh-guard/repos.json`, the clearing command
  (delete the key; the pre-run value was "no entry"), and the restored values.
- **FR-2 (the pinned edge cases).** The archived spec/plan and the contract tests
  state and check: (a) a reload on a patch without a complete managed block
  fails (`PASS`/`FAIL` text fixed) with exit 1 and writes nothing; (b) a
  changed-block install (a new `mode`) leaves the `reloadNonce` unchanged; (c) a
  non-integer `reloadNonce` reads as 0, so the next write is 1.
- **FR-3 (the exact contract tests).** `tests/dsh/test-reload.sh` asserts the
  expected nonce values: a fresh install writes 0, the two reloads write 1 then
  2, an unchanged install writes 3, the missing-nonce patch writes 1, and a
  changed mode leaves 3; it also asserts the exact PASS/dry-run strings and the
  no-complete-block failure.
- **FR-4 (the corrected lesson).** `measure/lessons-learned.md` no longer says to
  toggle a marker comment; it records the semantic-value rule and the nonce as
  the worked example, within the 50-line budget.
- **FR-5 (the post-docs gate).** The archived reload plan's Phase 3 gains a task
  that runs `bash tests/dsh/run.sh` after the docs edits (and the track record
  notes the result), so a dangling link or a stale doc assertion cannot ship.

## Non-Functional Requirements

- **NFR-1 (no behaviour change beyond the documented cases).** The plugin is
  untouched; the node suite stays 288/288; both parity gates stay green.
- **NFR-2 (POSIX).** Windows stays out of scope.

## Acceptance Criteria (track level)

- Given the repository, When I run `bash tests/dsh/run.sh`, Then the updated
  reload/install contract tests pass (including the three pinned edge cases) and
  the doc checks pass.
- Given the plugin package, Then `node --test plugins/dsh-measure-guard/tests/*.test.js`
  is 288/288 and both parity gates print `parity: ok`.
- Given the archived reload track, Then its spec/plan carry the executable proof
  record, the edge cases, the exact evidence file, the cleanup commands and
  before/after values, and the post-docs gate task.
- Given `measure/lessons-learned.md`, Then no lesson tells the reader to toggle a
  comment marker and the file is at most 50 lines.

## Out of Scope

- Changing the reload/nonce implementation beyond the documented edge cases.
- Re-running the live proof (the evidence stands; only its record is corrected).
- Windows paths and platform packaging.
