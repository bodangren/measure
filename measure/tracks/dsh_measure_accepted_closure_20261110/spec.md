# Specification: DSH Measure accepted-risk closure

## Overview

Five tech-debt rows have been open as accepted design decisions or as rows whose residual is
already covered by a pin; they are the last rows that can honestly be closed without
changing a design constraint (a published core package needs build tools, a cron writer
would race the CLI, a YAML re-serialization would rewrite the user's file, the strict
commit guard's before-command staged read is compensated by the in-command add scan, and
giving the guarded agent a mode setter would let it loosen its own guard).

This track closes them with recorded rationale plus two pins for the claims that were not
pinned yet: the strict commit guard's in-command `git add` is included in the decision when
the staged set is empty (a test), and the agent tool surface is read-only — none of
`measure_status`, `measure_verify`, `measure_mode` takes a parameter, so an agent cannot set
the guard mode (a schema assertion in the plugin test). The stale-plugin check and the
parity gates already pin the other two claims (a stale stamped plugin file fails the CLI
check; a diverged core copy fails a parity gate).

## Functional Requirements

- **FR-1 (commit union pin).** The plugin test proves the commit guard denies `git add
  src/app.js && git commit …` with an empty staged set and names `src/app.js` (the
  in-command add is part of the decision); the existing "in-command git add contributes
  exactly its paths" test is the local evidence for this row.
- **FR-2 (read-only surface pin).** The plugin registration test asserts that every
  registered tool's `parameters.properties` is empty, so adding a parameter (in particular
  a mode setter) turns the gate red and needs a design decision.
- **FR-3 (rows closed).** The rows for the three-adapter core duplication, the managed
  block's textual edit, the cron plugin sync, the commit guard's pre-run staged read, and
  the GUI-only mode setting become `Resolved` with their rationale (the remaining
  constraint is named, not hidden).
- **FR-4 (records).** `CHANGELOG.md` records the closures; the live check passes (no plugin
  code change, only the test and the docs).
- **FR-5 (verification).** node 355/355 (the schema assertion rides the existing test),
  both parity gates, srg 12/12, CLI 14/14; the track is archived with a manifest-only
  closeout FAIL.

## Non-Functional Requirements

- **NFR-1 (no behavior change).** Only a test assertion and records change; the guard, the
  CLI, and the tool surface are untouched.

## Acceptance Criteria (track level)

- Given a stale installed plugin file, Then `--check` reports it (the cron-free writer is
  detectable) — already pinned by `test-check.sh`.
- Given any registered agent tool, Then it accepts no parameter.
