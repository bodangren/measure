# Specification: DSH Measure commit guard nested fix2

## Overview

The nested-command track closed `git stage` and a simple `bash -c "git add …"`,
but its review found the recognition too narrow and the depth cap unpinned:

- **F1:** the cap ("a fixed depth") was never given a value; the shipped code
  caps at four levels (`depth > 3`), which no document or test states.
- **F2:** `eval` concatenates all its arguments, so `eval git add src/app.js` and
  `eval "git add" src/app.js` run the add while the scan reads only the next token.
- **F3:** `bash -lc`, `bash -x -c`, `/bin/bash -c`, `X=$(git stage …)`, and
  multi-word `eval` still contribute nothing (and are not wrapper scripts).
- **F4:** no `zsh -c`, depth-cap, or unreadable-inner test.
- **F5:** the integration fixture's `src/app.js` was already a taken change via
  `GIT_ADD`/`takesChanges`; only an untracked path proves the recursion.

This track pins the depth cap (four levels), joins all `eval` words, accepts any
shell command basename with a `-c`-bearing option cluster (including `-lc` and
`/bin/bash`), treats `git stage` inside substitutions, and adds the missing
tests with an untracked integration path.

## Functional Requirements

- **FR-1 (depth cap).** The scan recurses at most four levels (the exported call
  is depth 0; depth 5 and beyond returns `all: true`). The value is recorded in
  the code comment, this spec, and a test that nests five `bash -c` levels and
  expects `all: true`.
- **FR-2 (eval joining).** `eval` scans the space-joined values of all its
  arguments until a separator (`eval git add src/app.js`, `eval "git add"
  src/app.js`).
- **FR-3 (shell spellings).** A command whose basename is `bash`, `sh`, or `zsh`
  is scanned when an option cluster before its command word contains `c`
  (`-c`, `-lc`, `-x -c`) or after `--`; `git stage` inside a substitution is
  fail-closed like `git add`.
- **FR-4 (the tests).** Unit cases: `zsh -c`, `bash -lc`, `/bin/bash -c`,
  `bash -x -c`, multi-word `eval` (both forms), `X=$(git stage …)`, the
  five-level nesting (`all: true`), and unreadable inner text (`all: true`);
  the integration case uses an untracked `src/new.js` so only the recursion can
  deny it.
- **FR-5 (records).** The commit-race row names the remaining residual precisely
  (arbitrary wrapper scripts, shell functions, and command spellings not covered
  by the four rules); the fix1 review is recorded with F1–F5 dispositions and its
  spec gets a dated correction note; `CHANGELOG.md` is clarified.
- **FR-6 (verification).** node suite passes (306+ tests), both parity gates ok,
  CLI 13/13, srg 11/11.

## Non-Functional Requirements

- **NFR-1 (bounded).** Token-level recursion over `shellTokens`; fixed depth cap;
  no new dependency.
- **NFR-2 (contract preserved).** Ordinary commands and the substitution rule
  are unchanged; only the newly recognized spellings become stricter.

## Acceptance Criteria (track level)

- Given `eval git add src/app.js` and `eval "git add" src/app.js`, Then the path
  is returned.
- Given `zsh -c`, `bash -lc`, `/bin/bash -c`, and `bash -x -c` with an inner
  `git add`, Then the path is returned.
- Given five nested `bash -c` levels, Then `all: true`; given unreadable inner
  text, Then `all: true`.
- Given the gates, Then node 306+ passes, CLI 13/13, srg 11/11, parity ok; each
  phase checkpoint is pushed.

## Out of Scope

- Arbitrary wrapper scripts and shell functions.
