# Specification: DSH Measure closeout registry-description guard

## Overview

Twice this session the CLI suite failed because an archived track's
`metadata.json` `description` had drifted from its `measure/tracks.md` entry
(the registry check compares them exactly). The drift happened *after* the track
was archived, and `closeout` — the check that is supposed to verify a finished
track's records — does not look at the registry entry's description at all: it
only rejects an active-section mention.

This track makes `closeout` compare the archived track's registry entry with its
metadata: the entry must exist once, directly after its link line, and its
description line must equal the collapsed `metadata.json` description. That
turns the recurring post-archive drift into a closeout FAIL instead of a
surprise CLI failure later.

## Functional Requirements

- **FR-1 (the comparison).** `closeout_feedback()` gains a registry check: look
  up `measure/tracks.md`; find the line holding `./archive/<track>/`; when there is
  none, report `missing registry entry for <track>`; when the following line is
  not a `*...*` description, report `registry entry has no description for
  <track>`; when the description (stripped of `  *` and the trailing `*`) differs
  from the collapsed `metadata.json` `description`, report
  `registry description differs from metadata for <track>`.
- **FR-2 (always on).** The check runs for every `closeout` invocation, with no
  new flag, and reports at most one registry problem per track.
- **FR-3 (the test).** `tests/dsh/test-closeout-registry.sh` builds a temporary
  Measure repo with an archived track (plan with `[x]` tasks carrying SHAs,
  metadata `status: done` with a date, matching registry entry) and runs
  `closeout --repo <tmp> --track <id>`: the matching fixture produces none of the
  three messages; a metadata-description change produces `differs from metadata`;
  a removed description line produces `has no description`; a removed entry
  produces `missing registry entry`. The expected manifest FAIL is present in all
  cases.
- **FR-4 (the record).** The closeout section of
  `skills/measure-orchestrator/references/checks.md` (or the file that documents
  the closeout checks) lists the registry-description check; `CHANGELOG.md` has a
  bug-fix entry; `measure/tech-debt.md` stays at or below 50 lines.
- **FR-5 (verification).** `bash tests/dsh/run.sh` is 12/12 (the new script joins
  the suite), node 301/301, both parity gates ok, srg 10/10; the real archived
  tracks produce no new closeout FAIL beyond the expected manifest.

## Non-Functional Requirements

- **NFR-1 (bounded).** One registry read per closeout; no new dependency.
- **NFR-2 (contract preserved).** All existing closeout messages and exit codes
  stay; a missing registry file is not a new FAIL (the existing archive checks
  still apply).

## Acceptance Criteria (track level)

- Given a drifted registry description, Then `closeout` reports `registry
  description differs from metadata for <track>` and exits 1.
- Given a missing entry or description, Then the matching message is reported.
- Given matching records, Then none of the three messages appears.
- Given the gates, Then CLI 12/12, node 301/301, parity ok, srg 10/10; each phase
  checkpoint is pushed.

## Out of Scope

- The parser scope rule, the MKTEMP suite residual, the commit staged-read race,
  and the opencode rows.

> **Correction (2026-11-09, after the review):** "collapsed" means
> `" ".join(str(description).split())` (whitespace runs become one space), and
> when the metadata description is empty the expected text is the entry's
> label-stripped bold title — the same rule as `tests/dsh/test-registry.sh`, so
> `visual_refresh_20260425` does not produce a new FAIL. The guard reports at most
> one registry problem; the duplicate-entry rule stays with the registry test,
> not closeout. The documentation target is
> `skills/measure-orchestrator/SKILL.md` under `## Closeout Standard`.
