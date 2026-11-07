# Specification: DSH Measure registry consolidation

## Overview

The registry-cleanup track rebuilt `measure/tracks.md` but its review found that
the file still has two shapes and one duplicate: seven completed tracks live
outside the Archived Tracks section (four with their link and description, three
also missing a description), `visual_refresh_20260425` has both a single-line
link entry and a bold entry inside the section, the section therefore does not
hold every non-cancelled archive directory, nine descriptions were clipped
mid-word, and the new structural check verifies adjacency rather than attribution
(it cannot see a missing description or an orphan line).

This track consolidates the registry to one layout: an Active section, a
Cancelled section (the four cancelled archives with their reasons), and an
Archived Tracks section holding **every other archive directory exactly once**
as `title / *Link:* / one description` (the full metadata description, collapsed
to one line, never clipped). It hardens the structural check with a per-directory
entry count that reads the tracked entry shape, attribution rules, and negative
fixtures for every rule, and it corrects the archived registry track's record
(descriptions, SHA trail, review dispositions).

## Functional Requirements

- **FR-1 (one layout).** `measure/tracks.md` has exactly three track sections:
  Active (the `[~]` tracks), Cancelled (the four cancelled directories, each
  once, with its reason and link), and Archived Tracks (every other directory
  under `measure/archive/`, exactly once). The old single-link entries and the
  duplicate `visual_refresh` entry are removed; every directory appears exactly
  once across the whole file.
- **FR-2 (one entry shape).** Every Archived entry is exactly three lines: the
  bold title line, its own `*Link:` line, and one description line. The
  description is the archive's `metadata.json` `description` collapsed to one
  line, never truncated and never rewritten; when it is empty, the title is used.
- **FR-3 (the checker).** `tests/dsh/test-registry.sh` takes the registry path
  (default `measure/tracks.md`) and the archive directory (default
  `measure/archive/`), and enforces: each bold title line has its own following
  `*Link:` line; each Archived entry has exactly one description line directly
  after its link; no description line exists without a preceding link; every
  archive directory has exactly one tracked entry in the whole file (title+link
  pair, or a cancelled reason entry); at most one `[~]` track. Each rule has a
  synthetic negative fixture that must be rejected (missing description, orphan
  description, missing link, duplicate entry, unreferenced directory), and the
  fixtures use their own archive directory so the production tree is not read.
- **FR-4 (verification).** `bash tests/dsh/run.sh` passes (the new check plus the
  negative fixtures), the node suite stays 301/301, both parity gates stay
  green, and the registry entry count equals the archive-directory count.
- **FR-5 (the archived registry record).** The archived
  `dsh_measure_registry_20261107` track's spec/plan/metadata are corrected: the
  description rule says full text, the section scope names the cancelled
  exemption, the task SHAs point at the commits that contain the deliverables
  (the rebuild is `b314321`), and its `spec-review.md` records the review with one
  disposition per finding.

## Non-Functional Requirements

- **NFR-1 (no code change).** Only `measure/tracks.md`, the structural test, and
  records change; the plugin is untouched.
- **NFR-2 (POSIX).** Windows stays out of scope.

## Acceptance Criteria (track level)

- Given `measure/tracks.md`, Then it has the three sections, every archive
  directory appears exactly once (cancelled ones in Cancelled), and every
  Archived entry has its own link and exactly one full description.
- Given `tests/dsh/test-registry.sh`, Then it passes on the real registry and
  rejects each synthetic violation (missing description, orphan description,
  missing link, duplicate entry, unreferenced directory).
- Given the archived registry track, Then its record states the full-description
  rule, the cancelled exemption, the corrected SHA trail, and its review with
  dispositions.
- Given the gates, Then the CLI suite passes, node is 301/301, both parity gates
  are ok; each phase checkpoint is pushed.

## Out of Scope

- Rewriting historical descriptions or the cancelled reasons.
- The remaining spec_review_gate runner/parser rows.
