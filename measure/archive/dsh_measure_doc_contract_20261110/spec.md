# Specification: DSH Measure doc contract

## Overview

Two documentation-contract rows remain open. Row 16: `new-track` §2.5 step 4 writes only the
Measure metadata schema, so a project whose doctor requires extra keys (`workstream`,
`retrospective`, `evidence`, `dependencies`) fails until someone adds them — the track-set
workflow copies those keys (`new-track-set.md` §2.9 step 4 item 5) but a single track does
not. Row 34: the OpenCode adapter README carries a broken inline code span
(`` ``/measure-guard`, … the terminal sidebar` ``) that no check catches, so doc lint is
missing for the plugin docs.

This track closes both: `new-track` §2.5 step 4 gains the same project-metadata-keys rule
(copy only keys every existing track has and the Measure schema does not; do not copy a key
only some tracks have; fill a field a project rule requires), the OpenCode README span is
fixed, and `test-docs.sh` gains an inline-code-span balance check over the guide and both
plugin READMEs (fenced blocks ignored, escaped backticks ignored, a run must close with an
equal run) with a fixture proving an unbalanced span is rejected.

## Functional Requirements

- **FR-1 (project metadata keys).** `skills/measure/references/new-track.md` §2.5 step 4
  states: after the Measure schema, read every `metadata.json` in the Tracks Directory (or
  in `measure/archive/` when it has no track), add the keys every one of them has and the
  Measure schema does not, with a value for this track; do not copy a key only some tracks
  have; fill a field a project rule requires; the rule cross-references
  `new-track-set.md` §2.9 step 4 item 5. The bundle copy stays identical.
- **FR-2 (span fix).** `plugins/opencode-measure-guard/README.md`'s "Status lines" bullet
  reads as one well-formed code span per command name.
- **FR-3 (doc lint).** `tests/dsh/test-docs.sh` checks inline code spans in `docs/dsh.md`
  and the two plugin READMEs: a backtick run opens a span that must close with an equal
  run (fenced blocks and escaped backticks skipped, different runs inside a span are
  content), and a fixture with a stray backtick is rejected.
- **FR-4 (pins).** `test_s1_new_track.sh` asserts the §2.5 project-metadata-keys sentence.
- **FR-5 (records).** Tech-debt rows 16 and 34 become `Resolved`; `CHANGELOG.md` records
  the changes; the live check passes (no plugin code change).
- **FR-6 (verification).** CLI 14 tests? no — the new check lives in `test-docs.sh`, so the
  suite count stays 13; srg 11/11, node 352/352, both parity gates ok; the track is
  archived with a manifest-only closeout FAIL.

## Non-Functional Requirements

- **NFR-1 (no new dependency).** The span check is Python from the standard library, run
  inline by the existing test.
- **NFR-2 (no false positives).** Multi-line spans pair across lines; fences and escapes are
  skipped; a different run length inside an open span is content, not an error.

## Acceptance Criteria (track level)

- Given the current repository docs, Then the span check passes.
- Given a fixture with a stray backtick, Then the span check fails.
- Given a single track on a project with extra metadata keys, Then §2.5 says to copy them.
