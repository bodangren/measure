# Specification: DSH Measure tracks registry cleanup

## Overview

`measure/tracks.md` is the Measure tracks registry. During the long DSH track
series several archive entries lost their description lines: sixteen description
lines that belong to distinct archived tracks ended up merged under the last
entry (`DSH Measure commit scan fix2`), so a reader sees one track with sixteen
descriptions while the entries above it have none. The registry is the first file
every Measure session reads, so this misleads every future agent.

This track rebuilds the Archived Tracks section with exactly one entry per
archived track (`- [x] **Track: …**`, the `*Link:*` line, and a one-paragraph
description taken from that track's `metadata.json`), with no merged or orphan
description lines. The active and cancelled sections are untouched. It adds a
small structural check so the drift cannot silently return.

## Functional Requirements

- **FR-1 (one entry per archived track).** The Archived Tracks section holds one
  entry per directory under `measure/archive/`: the title line, the archive link,
  and one description line. Every archive directory is referenced; no entry has
  two description lines; no description line exists without a preceding entry.
  The active (`[~]`) and cancelled sections are unchanged.
- **FR-2 (descriptions).** Each description is derived from the archived track's
  own `metadata.json` `description` (or its README/title when absent), collapsed
  to one line; no description is invented.
- **FR-3 (the structural check).** `tests/dsh/test-registry.sh` (part of the CLI
  contract suite) parses `measure/tracks.md` and asserts: every `- [x] **Track:`
  line is followed within two lines by a `*Link:` line; every archive directory
  has exactly one entry; the active section has at most one `[~]` track; no
  `*Link:`-less description block (two or more consecutive `*…*` lines) exists.
- **FR-4 (verification).** `bash tests/dsh/run.sh` passes (including the new
  check), the node suite stays 301/301, both parity gates stay green, and the
  registry file is reviewed for lost entries (count assertion in the test).

## Non-Functional Requirements

- **NFR-1 (no code change).** Only `measure/tracks.md` and the new test change;
  the plugin is untouched.
- **NFR-2 (POSIX).** Windows stays out of scope.

## Acceptance Criteria (track level)

- Given `measure/tracks.md`, Then every archived entry has title, link, and one
  description and no merged description block remains.
- Given `tests/dsh/test-registry.sh`, Then it passes on the rebuilt file and fails
  on a fixture with a merged description block.
- Given the gates, Then the CLI suite passes, node is 301/301, both parity gates
  are ok; each phase checkpoint is pushed.

## Out of Scope

- Rewriting the historical track descriptions or the cancelled section.
- The remaining spec_review_gate runner/parser rows.
