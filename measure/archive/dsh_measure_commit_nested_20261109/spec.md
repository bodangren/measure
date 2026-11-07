# Specification: DSH Measure commit guard nested-command coverage

## Overview

The strict commit guard's `addedPaths()` reads the paths an in-command `git add`
contributes from the command tokens. It already fails closed for executing
command substitutions, `-A`/`--all`, `-u`/`--update`, `.`, pathspecs, and
wildcards, and recognizes `git add` at a command position with `-C <dir>` and
quoting. The tech-debt row's remaining residual names `git stage` aliases and
`bash -c "git add …"`: the tokenizer sees the outer `bash -c` as the command, so
the inner `git add` is invisible and the commit check reads only the previously
staged set.

This track closes those two shapes: `git stage` is treated like `git add`, and the
inner command of `bash -c <string>`, `sh -c <string>`, `zsh -c <string>`, and
`eval <string>` is scanned recursively and merged into the added set. Arbitrary
wrapper scripts (an unreadable file run as `bash script.sh`) stay the documented
residual.

## Functional Requirements

- **FR-1 (`git stage`).** A command-position `git stage <path>`, `git stage -A`,
  `git stage -u`, `git stage .`, and `git -C <dir> stage <path>` contribute the
  same additions as the corresponding `git add` forms.
- **FR-2 (nested commands).** For each command-position `bash -c <word>`,
  `sh -c <word>`, `zsh -c <word>`, and `eval <word>` (the inner text being the
  next token, with shell quoting already removed), `addedPaths()` recurses on the
  inner text and merges its `all`/`trackedOnly`/`paths` into the result.
- **FR-3 (recursion bound).** The recursion is depth-limited (nested `bash -c
  "bash -c \"git add x\""` works to a fixed depth and then fails closed rather
  than looping), and an inner text that cannot be tokenized also fails closed.
- **FR-4 (the tests).** `plugins/dsh-measure-guard/tests/commit.test.js` gains
  cases: `git stage src/app.js` yields the path; `bash -c "git add src/app.js"`
  yields it; `eval "git add src/app.js"` yields it; a nested `bash -c` inside
  `bash -c` yields it; `bash -c "echo hi"` and `eval "echo hi"` stay empty; and a
  `commitCheck` integration case with a conforming message shows the no-task rule
  denying the hidden file for `bash -c "git add src/app.js"`.
- **FR-5 (records).** The commit-race row's residual is narrowed to arbitrary
  wrapper scripts (the `git stage`, `bash -c`, and `eval` forms are resolved);
  `CHANGELOG.md` has a bug-fix entry.
- **FR-6 (verification).** node suite passes (303 tests plus the new cases), both
  parity gates ok (the change is DSH-adapter local), CLI 13/13, srg 11/11.

## Non-Functional Requirements

- **NFR-1 (bounded).** Token-level recursion over existing `shellTokens`; no new
  dependency; fixed depth cap.
- **NFR-2 (contract preserved).** Ordinary commands and the executing-substitution
  rule are unchanged; only the newly recognized forms become stricter.

## Acceptance Criteria (track level)

- Given `git stage src/app.js`, Then `addedPaths` returns the path.
- Given `bash -c "git add src/app.js"` and `eval "git add src/app.js"`, Then the
  path is returned.
- Given a doubly nested `bash -c`, Then the path is returned; beyond the cap the
  result fails closed.
- Given the gates, Then node 303+ passes, CLI 13/13, srg 11/11, parity ok; each
  phase checkpoint is pushed.

## Out of Scope

- Arbitrary wrapper scripts and shell functions (the named residual).
- The opencode rows and the remaining spec_review_gate docs rows.
