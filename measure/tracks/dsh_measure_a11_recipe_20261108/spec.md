# Specification: DSH Measure A11 recipe hardening

## Overview

The A11 detection recipe in the anti-pattern catalog (and its identical copy in
this project's `measure/anti-patterns.md`) finds backticked path claims in
`measure/product.md` and `measure/tech-stack.md` and reports the missing ones.
Its adversarial suite already names three gaps:

- a **NUL byte** in a document makes `grep` treat the file as binary, print
  `binary file matches`, and hide every claim (the suite's own comment cites
  finding F1);
- a backticked path **with a space** is dropped by the path pattern, so
  `\`src/a b.txt\`` is never checked;
- a **missing-document message** covers only absence: a document path that is a
  directory or another non-regular file gets the "does not exist" text, and an
  unreadable file is not distinguished.

This track hardens the recipe: `grep -a` (text mode) so a NUL or invalid UTF-8
byte cannot hide claims; the path pattern accepts one space after the first
segment while a leading shell-word command (`bash`, `git`, …) is skipped; and the
document check reports `does not exist`, `is not a regular file`, or
`cannot be read` as appropriate. Both catalog copies stay identical (the suite
asserts equality), and the S4 contract cases cover each change.

## Functional Requirements

- **FR-1 (NUL and non-UTF-8).** A claim in a document that contains a NUL byte or
  invalid UTF-8 bytes is still found and reported when the path is missing, and
  not reported when it exists; the recipe prints no `binary file matches` line.
- **FR-2 (space paths).** The path pattern accepts a relative path with a space
  after the first segment (`src/a b.txt`); a missing one is reported with its
  exact text; an existing one is not reported.
- **FR-3 (commands stay out).** A backticked shell command is not reported: the
  path pattern requires a slash inside the first space-free segment, so a span
  with a space before its first slash (`bash measure/generate.sh`) and a span
  without a slash (`git log`) are not path claims; a span with characters after
  the path (`src/a.txt:tag`) is not a path claim either (the pattern is anchored
  at both ends).
- **FR-4 (document messages).** For each document: absent →
  `DRIFT candidate: the document does not exist`; present but not a regular file
  (directory, FIFO, device) → `DRIFT candidate: the document is not a regular
  file`; present and unreadable → `DRIFT candidate: the document cannot be read`.
  A symlink to a regular file is read normally.
- **FR-5 (the suite).** `tests/spec_review_gate/test_s4_adversarial.sh`'s G2
  contract gains: NUL-document missing claim (reported), NUL-document existing
  claim (silent), non-UTF-8 missing claim (reported), space-path missing
  (reported) and existing (silent), directory document (`is not a regular file`),
  unreadable document (`cannot be read`), and keeps the command cases silent; the
  G1 equality of the two catalog copies and the report rows stay.
- **FR-6 (records).** Both A11 blocks are identical; the tech-debt Group (e) row
  records the resolved NUL/space/message items; `CHANGELOG.md` has a bug-fix
  entry.

## Non-Functional Requirements

- **NFR-1 (bounded).** bash, grep, tr, sort; no new dependency; the recipe stays
  one bash block in the catalog.
- **NFR-2 (contract preserved).** The recipe remains read-only, linear, and
  exit-0 reporting-only; the project copy stays byte-identical to the catalog
  copy; the gate passes 10/10.

## Acceptance Criteria (track level)

- Given a document with a NUL byte and a missing backticked path, Then the recipe
  prints exactly the missing-path line with no binary-file text.
- Given `src/a b.txt` missing/existing, Then it is reported/not reported; given
  `bash measure/generate.sh`, Then it is not reported.
- Given a directory as a document, Then the `is not a regular file` line is
  printed; given an unreadable file, Then the `cannot be read` line.
- Given the gates, Then srg is 10/10, node 301/301, both parity gates are ok;
  each phase checkpoint is pushed.

## Out of Scope

- The scope rule comparing trees rather than intermediate commits.
- Symbolic-link-to-/dev/zero and FIFO latency behavior (kept as report rows).
