# Specification: DSH Measure TDD name rules

## Overview

The strict TDD guard decides "is this a test file / a test command" from the shared core's
name rules. Measured on the adapter, two forms are missed: a code file nested more than one
level under a test directory (`tests/unit/x.py`, `src/__tests__/deep/x.ts`,
`plugins/a/tests/deep/y.js`) is not a test file, and `node --test …` — the runner this
repository itself uses — is not a test command (`node --experimental-strip-types --test`
too). A missed test file is treated as a source file, and a missed test command never
completes a Red phase, so the guard both blocks valid work and fails to recognize real Red
evidence.

This track widens the shared core's rules to any-depth test-directory paths and to the
`node --test` runner (with option tokens between), keeping the rules name-based and
bounded, and pins each form in the core tests. Copies stay mechanically in sync.

## Functional Requirements

- **FR-1 (test files at any depth).** `TEST_FILES` matches a code file at any depth under a
  `test`/`tests`/`__tests__`/`spec` directory: `tests/unit/x.py`,
  `src/__tests__/deep/x.ts`, and `plugins/a/tests/deep/y.js` are test files; a
  non-code file under a test directory stays non-test.
- **FR-2 (node --test).** `TEST_COMMANDS` matches `node --test` and
  `node <options> --test`, including `--test-only`; `node -e "…"` and a plain `node
  script.js` stay non-test commands.
- **FR-3 (tests).** `core.test.js` pins each new positive and the negative controls, and
  `tdd.set.test` style adapter coverage keeps passing.
- **FR-4 (copies).** The DSH copy (after the `./parse` → `./parse.ts` transform) and the
  OpenCode byte copy stay identical; both parity gates pass.
- **FR-5 (records).** The guard README's TDD bullet and the tech-debt name-rule row note
  the widened coverage (the rules stay name-based by design); `CHANGELOG.md` records it;
  the installed plugin is reloaded and the live check passes.
- **FR-6 (verification).** node suite green with the new cases, srg 11/11, CLI 13/13; the
  track is archived with a manifest-only closeout FAIL.

## Non-Functional Requirements

- **NFR-1 (bounded, still name-based).** No content heuristic and no dependency; only
  path/command patterns.
- **NFR-2 (no false positives on documents).** A Markdown or JSON file under a test
  directory is not a test file; a quoted mention of `--test` in an unrelated command is
  not a test command unless it follows `node` as an option token.

## Acceptance Criteria (track level)

- Given `tests/unit/x.py`, `src/__tests__/deep/x.ts`, and `plugins/a/tests/deep/y.js`, Then
  each is a test file.
- Given `node --test tests/*.test.js` and `node --experimental-strip-types --test x.ts`,
  Then each is a test command; `node -e "run()"` is not.
- Given the gates, Then node/parity/srg/CLI are green and the track is archived.
