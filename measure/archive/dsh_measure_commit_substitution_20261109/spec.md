# Specification: DSH Measure commit guard substitution fail-closed

## Overview

The strict commit guard reads the staged set (`git diff --cached`) before the
commit runs and adds the paths an in-command `git add` contributes (Decision 9:
paths, `-A`/`--all`, `-u`/`--update`, `.`, pathspecs, wildcards). The remaining
residual in the tech-debt row is that a `git add` hidden inside a command
substitution (`X=$(git add secret.txt); git commit -m x`, or a backticked form)
is invisible to the tokenizer: the tokens contain no `git add` run, so the guard
checks only the previously staged set and the commit can carry a file the guard
never saw.

This track makes `addedPaths()` fail closed for that case: when the command
contains a command substitution that mentions `git add`, the added set becomes
`all` (the guard then considers every working-tree change, as it already does for
`.` and wildcards), so the hidden add cannot bypass the check. A substitution
without a `git add` (for example `git commit -m "$(cat msg)"`) keeps the current
behavior.

## Functional Requirements

- **FR-1 (fail closed).** `addedPaths(command)` returns `all: true` when any
  command substitution in the command ( `$(...)` or backticks ) mentions a `git
  add`; the existing unreadable-token case (`shellTokens` null) keeps failing
  closed too.
- **FR-2 (no over-blocking).** A command substitution without a `git add` does not
  set `all`; the ordinary cases (`git add <path> && git commit`, `git add -A`,
  `git add .`, no add at all) keep their current results.
- **FR-3 (the tests).** `plugins/dsh-measure-guard/tests/commit.test.js` gains
  unit cases: `X=$(git add secret.txt); git commit -m x` and a backtick form set
  `all: true`; `git commit -m "$(cat msg)"` and `git commit -m x` stay
  `all: false`; and the existing addedPaths cases are unchanged.
- **FR-4 (records).** The `dsh_measure_evolve_20261107` commit-race row is
  resolved with the substitution case named; `CHANGELOG.md` has a bug-fix entry.
- **FR-5 (verification).** node suite passes (301 tests plus the new cases), both
  parity gates ok, CLI 13/13, srg 11/11.

## Non-Functional Requirements

- **NFR-1 (bounded).** One regex scan of the command; no new dependency; the
  adapters share the core change through the existing source.
- **NFR-2 (contract preserved).** The guard's decisions for ordinary commands are
  unchanged; only commands that hide a `git add` in a substitution become
  stricter.

## Acceptance Criteria (track level)

- Given `X=$(git add secret.txt); git commit -m x`, Then `addedPaths` returns
  `all: true`.
- Given a backticked `git add`, Then `all: true`.
- Given `git commit -m "$(cat msg)"`, Then `all` stays false.
- Given the gates, Then node 301+ passes, CLI 13/13, srg 11/11, parity ok; each
  phase checkpoint is pushed.

## Out of Scope

- The opencode rows and the remaining spec_review_gate docs rows.

> **Correction (2026-11-09, after the review):** the detection rule is defined by
> a scanner: single-quoted and backslash-escaped text is removed, `$(...)` spans
> are matched with balanced parentheses, backtick spans are matched to their
> closing delimiter, and a span counts when it runs `git -C <dir> add` or a quoted
> `"add"`; only executing spans count. The rule lives in the DSH adapter
> (`plugins/dsh-measure-guard/src/commit.js`); the parity gates compare only the
> shared core and are not evidence for it. The commit-race tech-debt row stays
> **Open**: this track resolves the substitution shape, and wrapper scripts
> (`bash /tmp/add.sh`), `git stage` aliases, and `bash -c "git add …"` remain the
> named residual. The node suite is 303 tests.
