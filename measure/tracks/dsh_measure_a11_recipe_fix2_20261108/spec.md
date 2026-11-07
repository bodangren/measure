# Specification: DSH Measure A11 recipe fix2

## Overview

The A11 recipe track hardened NUL/UTF-8 handling, space paths, and document
messages, but its review found:

- **F1 [Blocker]:** a command whose first space-free segment contains a slash
  (`bin/measure-benchmark run` in this repo's `measure/tech-stack.md`) is
  reported as a drift candidate, so the live output grew from 3 to 6 lines and
  the suite stayed green (the command contract row only covers forms the pattern
  already excludes).
- **F2 [Major]:** the space rule is unpinned: the pattern accepts any run of
  spaces and trailing spaces, and only `src/a b.txt` is exercised.
- **F3 [Major]:** the tech-debt Group (e) row was marked Resolved while it still
  lists `..` paths and the "three candidates" item, neither fixed; the live
  count is now six, so that sentence is false too.
- **F4–F8 [Nit]:** the plan omits the sensitivity-mutant retarget; FR-5
  misdescribes the invalid-UTF-8 case; the unreadable row assumes a non-root
  runner; the trailing-characters row is not listed; and the Overview overstates
  what the suite named before the track.

This track skips a span whose first word is an executable file (a command with
an argument) when the full span is not a path, pins the space rule to exactly one
space inside the span with no leading/trailing spaces, corrects the records,
and adds a non-root guard to the unreadable row.

## Functional Requirements

- **FR-1 (commands out).** A span whose first space-free word is an existing
  executable file (`[ -f ] && [ -x ]`) and whose full text is not an existing
  path is skipped: `bin/measure-benchmark run` is not a drift candidate, while
  `src/a b.txt` (first word not executable) is checked as before.
- **FR-2 (one space).** The claim pattern is
  `^[A-Za-z0-9_.-]+/[A-Za-z0-9_./-]*( [A-Za-z0-9_./-]+)?$`: exactly one space
  between two path segments; a double space, a leading space after the slash, or
  a trailing space is not a claim.
- **FR-3 (the cases).** S4 G2 gains: an executable command span (silent), a
  double-space span (silent), a leading-space span (silent), a trailing-space
  span (silent), and the executable-command-missing-argument span (silent); the
  unreadable-document row is a report row with a note when running as root.
- **FR-4 (sensitivity).** The G6 mutant list is retargeted to the new pattern
  text and gains a mutant for the executable skip and one that allows multiple
  spaces.
- **FR-5 (records).** The tech-debt Group (e) row keeps only unresolved items
  open (`..` paths outside the repository; the candidate count is a report, not
  confirmed drift — now the live count returns to 3 with commands skipped);
  the A11 track's `spec-review.md` records F1–F8 with dispositions; its spec gets
  a dated correction note; `CHANGELOG.md` gains the command/space line.
- **FR-6 (verification).** `bash tests/spec_review_gate/run.sh` is 10/10 (S4
  green), node 301/301, both parity gates ok, and `bash tests/dsh/run.sh`
  returns to 11/11.

## Non-Functional Requirements

- **NFR-1 (bounded).** bash, grep, tr, sort; no new dependency.
- **NFR-2 (contract preserved).** The two catalog copies stay byte-identical,
  the recipe stays read-only and exit-0, and the gate passes 10/10.

## Acceptance Criteria (track level)

- Given `bin/measure-benchmark run` with the file present, Then no drift line is
  printed; given `src/a b.txt` missing, Then one line.
- Given a span with two spaces, a leading space, or a trailing space, Then no
  drift line.
- Given the gates, Then srg 10/10, node 301/301, parity ok, CLI 11/11; each
  phase checkpoint is pushed.

## Out of Scope

- The `..` outside-repository path row and the "candidates are not confirmed
  drift" property (kept as the named debt residual).
- The scope rule comparing trees rather than intermediate commits.

> **Correction (2026-11-08):** the pinned pattern keeps directory claims
> (`commands/`) by allowing an empty segment after the slash; only a space right
> after the slash, a double space, or a trailing space is rejected.
