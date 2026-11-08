# Specification: DSH Measure TDD names and fixture paths

## Overview

Two small open rows. Row 15 (name rules) records that the TDD and commit guards use name
rules and therefore miss some tests: the current rules cover `_test.py|go|rs|exs` but not
the `_test.dart` (Dart) and `_test.rb` (minitest) conventions, and the test commands cover
`node --test` but not Node's newer `node --run test`, nor `cargo nextest run`. Row 17
records that `mods/measure-guard/tests/fixtures/sync-real.sh` reads
`measure/tracks/agent_performance_benchmarking_20260527/plan.md` and
`measure/tracks/measure_guard_20261004/plan.md`, but both tracks are archived, so the
generator is broken before the next fixture refresh.

This track adds the two test-file conventions and the two test commands (with tests and a
mutation proof against the pre-fix rules), and points the fixture generator at the archive
paths without regenerating the frozen `real.ts` snapshot (the generator is only re-run when
a test needs newer real data). It verifies every path the generator reads resolves and
parses with `jq`, so the next refresh cannot fail on a missing plan.

## Functional Requirements

- **FR-1 (test-file names).** `TEST_FILES`'s `_test.` rule gains `dart` and `rb`:
  `_test.(py|go|rs|exs?|dart|rb)`.
- **FR-2 (test commands).** `TEST_COMMANDS` gains `node --run test` (Node's `--run`) and
  `cargo nextest run`; `node --run build` and `cargo nextest list` stay non-test.
- **FR-3 (fixture paths).** `sync-real.sh` reads both plans from `measure/archive/...`;
  the generated `real.ts` is not regenerated in this track (frozen snapshot), and every
  path the script reads is checked to exist and parse with `jq`.
- **FR-4 (tests).** The DSH core/TDD tests pin the new names and commands and the two
  negatives; the pre-fix rules are shown to miss them.
- **FR-5 (records).** Row 15 notes the further improvement (it stays `Open`: name rules are
  inherently incomplete and `/measure-off` is the bypass); row 17 becomes `Resolved` with
  the path evidence; `CHANGELOG.md` records both.
- **FR-6 (verification).** node suite green, both parity gates, srg 12/12, CLI 14/14; the
  installed plugin is reloaded and the live check passes; the track is archived with a
  manifest-only closeout FAIL.

## Non-Functional Requirements

- **NFR-1 (bounded).** Two regex additions and two path edits; no behavior change for the
  names and commands already covered.
- **NFR-2 (no snapshot churn).** `real.ts` is not regenerated.

## Acceptance Criteria (track level)

- Given `a_test.dart`/`a_test.rb`, Then they are test files; `node --run test` and
  `cargo nextest run` are test commands.
- Given the fixture generator, Then every plan it reads exists under `measure/archive/`.
