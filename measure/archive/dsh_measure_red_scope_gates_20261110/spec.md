# Specification: DSH Measure track-scoped gates

## Overview

The `mid-red` role gate has the track scope since spec D8: `red_scope` sorts each commit in
`baseline..HEAD` into the gate's own commits and commits of another track, and only the own
commits are judged. The same sort does not serve the other three gates, so on a shared
branch a commit of another track can fail or pass them:

- the `spec-review` scope rule reads the full range's committed files, so another track's
  production file is reported as `spec-review committed files outside measure/runs/`;
- `ux-paths` (used by the UX review to decide whether UX-relevant files changed) reads the
  full range, so another track's UI change asks for a UX review of this track;
- `jr-green` fails only when HEAD still equals the baseline, so another track's commit
  advances HEAD and the check passes without a Green-phase commit of this track.

This track applies the same scope to all three: one helper returns the files the track's own
commits changed (or None when the range has no other-track commit, when the range has no
commits, or when git fails — the caller keeps the full-range behavior), and one helper
returns the own commits. The four gates then read the scoped set: spec-review's outside-
`measure/runs/` rule, `ux-paths` (with a `--track` option and the role gate passing it),
and the Jr Green HEAD-advance check (fail when HEAD advanced only by another track). Tests
extend `test_red_track_scope.py` with the helpers and a Jr Green case.

## Functional Requirements

- **FR-1 (one scope helper).** `scoped_changed_files(repo, baseline, track)` returns the
  sorted union of `commit_paths` over `red_scope(...).own`, or None when the scope is None
  (no other-track commit, empty/unreadable range) or any own commit's paths cannot be read
  (fail closed to the full range).
- **FR-2 (own-commit helper).** `own_commits_after(repo, baseline, track)` returns
  `red_scope(...).own`, or None when the scope is None.
- **FR-3 (spec-review).** The outside-`measure/runs/` rule reads the scoped set when the
  role has a track and the scope applies; without a track or with a None scope it keeps the
  full-range set.
- **FR-4 (ux-paths).** `ux_paths(repo, baseline, track="")` filters the scoped set when the
  track is given and the scope applies; the `ux-paths` command gains `--track`, and the
  `ux-browser-review` role gate passes its track.
- **FR-5 (jr-green).** With a track and a non-None scope, Jr Green fails when the range has
  no own commit ("only commits of another track") instead of comparing HEAD with the
  baseline; a non-empty own set passes that check.
- **FR-6 (tests).** `test_red_track_scope.py` gains: the helper returns own-only paths and
  None when no other track is in range; `ux_paths` with a track ignores another track's UI
  file and keeps its own; `own_commits_after` returns an empty list for a range of another
  track only; a Jr Green subprocess case fails with the new message when HEAD advanced only
  by another track.
- **FR-7 (records).** `contracts.md` documents the scoped reads (Baseline and HEAD advance
  bullets), the tech-debt row (deduplicated) becomes `Resolved`, `CHANGELOG.md` records it.
- **FR-8 (verification).** srg 12/12 (the extended suite), CLI 14/14, node 354/354, both
  parity gates; live check passes (no plugin code change); archive with a manifest-only
  closeout FAIL.

## Non-Functional Requirements

- **NFR-1 (fail closed).** Every uncertain read (no track, git error, unreadable commit
  paths) keeps the previous full-range behavior; the scope only ever narrows when it can
  prove the skipped commits belong to another track folder.
- **NFR-2 (no behavior change without a track).** A role gate without `--track` behaves as
  before.

## Acceptance Criteria (track level)

- Given a mixed range, Then spec-review does not report another track's files and UX review
  does not see them.
- Given HEAD advanced only by another track, Then Jr Green fails with the new message.
