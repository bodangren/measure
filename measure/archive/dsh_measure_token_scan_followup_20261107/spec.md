# Specification: DSH Measure token scan follow-up

## Overview

The whole-command token scan shipped (`dsh_measure_add_quoting_followup_20261107`)
and its review found two real gaps in the scan and several record gaps:

- **A double-quoted line continuation is not handled.** POSIX removes a
  backslash-newline inside double quotes too; the shipped `shellTokens` keeps the
  backslash and newline in the word, so `git add "src/file\` newline `.ts"`
  yields a path that no file has and the actually staged `src/file.ts` stays
  invisible to the guard.
- **The `git` token is not required to begin a command.** The scan matches `git
  add` anywhere, so `echo git add . && git commit -m "x"` counts `all: true`
  (the old anchored regex returned no paths); a command-boundary rule is needed
  and untested.
- The follow-up track's own tasks carry no SHAs (its closeout prints seven
  "lacks commit SHA" FAILs), Task 3.4 names no evidence file/format for the gate
  results, the evidence track's Overview still says the record items had "no
  finding ids" (the records spec already named F1–F3), FR-3 names an "escaped
  case" that no test has, and Task 2.1 names no evidence path.

This track fixes the two scan rules with tests, then reconciles the records.
No shared-core change.

## Functional Requirements

- **FR-1 (double-quoted continuation).** In `shellTokens`, a backslash followed by
  a newline inside a double-quoted span is a line continuation: both characters
  are dropped and the word continues. A backslash-newline outside quotes stays a
  continuation too. The rule is documented in the function header.
- **FR-2 (command boundary).** `addedPaths` only treats a `git` word as a command
  when it is the first word of the command or directly follows a separator
  (`;`, newline, `&`/`&&`, `|`/`||`). `echo git add . && git commit …` therefore
  contributes no paths, while `cd x && git add a.ts` and `git -C dir add .` still
  do; the spec states the rule and tests cover both sides.
- **FR-3 (tests).** `commit.test.js` adds: a double-quoted backslash-newline
  continuation (`git add "src/file\` newline `.ts"` → `paths: ['src/file.ts']`);
  a command boundary negative (`echo git add . && git commit …` → `all: false`,
  no paths); a post-separator positive (`cd x && git add a.ts && git commit …` →
  `paths: ['a.ts']`); the existing `.`/`-A`/`-u`/plain/quoted/`--`/comment/
  unterminated cases unchanged. The old scan fails the double-quoted case.
- **FR-4 (the follow-up track's records).** The archived
  `dsh_measure_add_quoting_followup_20261107` plan's tasks carry their SHAs
  (1.1/1.2/1.3 = its Phase 1 commit; 2.1 = its Phase 2 commit; 3.1–3.4 = its
  Phase 3 commit; 4.1 = its archive commit); Task 3.4 names the ledger
  `measure/runs/dsh_measure_midred_records_20261107/closeout.txt` and the format
  (append the four gate results and read them back); its closeout reports only
  the expected `automation-supervisor` manifest FAIL.
- **FR-5 (the evidence track's Overview).** The archived evidence track's
  Overview F4 bullet is corrected: the records spec's FR-3 already named F1–F3;
  what was missing was the severity/text for those findings and the ids for the
  four observations.
- **FR-6 (the follow-up spec's wording).** The archived follow-up spec's FR-3
  baseline list no longer names an "escaped case" that no test has; Task 2.1 in
  its plan names the evidence file
  `measure/runs/dsh_measure_add_quoting_20261107/live-quoting.md`.
- **FR-7 (gates, pushes, closeout).** Node suite, both parity gates, the CLI
  suite, and `bash tests/spec_review_gate/run.sh` pass; each phase checkpoint is
  pushed to `origin/main`; the track is archived closeout-clean except the
  expected manifest FAIL.

## Non-Functional Requirements

- **NFR-1 (scope).** Only `src/commit.js`, its tests, and records/docs change;
  the shared core and decision logic are untouched; both parity gates stay green.
- **NFR-2 (POSIX).** Windows stays out of scope.

## Acceptance Criteria (track level)

- Given the parser, Then a double-quoted continuation yields the joined path, a
  mid-command `git add` is not counted, a post-separator `git add` is, and the
  suite passes.
- Given the archived follow-up track, Then every task carries its SHA, the ledger
  names the gate results and they are read back, and its closeout reports only
  the expected manifest FAIL.
- Given the gates, Then node/parity/CLI/srg pass and each phase checkpoint is
  pushed.

## Out of Scope

- Full shell parsing (subshells, command substitution, wrapper scripts).
- The commit staged-read race and the heredoc grammar rows.
