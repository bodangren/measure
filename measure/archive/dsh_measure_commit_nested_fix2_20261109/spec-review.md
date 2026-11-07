# Spec Review: dsh_measure_commit_nested_fix2_20261109

Author model: deepseek-official/deepseek-flash

## Round 1

Date: 2026-11-09
Reviewer: subagent (fresh context, default model)

### What this track proposes

Pinning the recursion cap at four levels, joining all `eval` words, accepting
`bash`/`sh`/`zsh` by basename with any `-c`-bearing option cluster and after
`--`, treating `git stage` inside substitutions as fail-closed, adding the
missing unit cases, switching the integration case to an untracked path, and
recording the fix1 review and the narrowed residual.

### How the current system works, per this spec

`addedPaths` walks command-position words, collects `git [-C <dir>] add|stage`
runs, sets `all`/`trackedOnly` for `.`/pathspec/wildcard/`-A`/`-u`, fails closed
for unterminated quotes and executing substitutions, and recursed only into a
literal `bash -c`/`sh -c`/`zsh -c` second word and one `eval` word, capped by
`depth > 3`. The adapter unions the staged tree with that set; `commitDecision`
applies the format and no-task rules.

### Findings

- F1 [Blocker] plan Task 2.1: the task named no file for the fix1 review record or for its dated correction note, although the archive's conventions exist and the review standard requires naming the files a phase creates or changes.
- F2 [Major] FR-1/Acceptance/Task 1.2: the cap was stated two ways — "at most four levels" and "depth 5 and beyond returns all" — while the shipped check is `depth > 3`, so the fourth nested level already fails closed; the five-level test does not pin the value.
- F3 [Major] FR-3/Task 1.1/1.2: the shell rule was not concrete for option arguments (`bash -o pipefail -c`, `bash -O extglob -c`) or `--` placement, and no case covered `--`.
- F4 [Major] Overview/Fix1 F5: the claim that the integration fixture's `src/app.js` "was already a taken change via `GIT_ADD`/`takesChanges`" is false — the adapter passes `commitTakesAll`, not the core `takesChanges`, and the fixture had empty staged/status, so only the recursion denied it.
- F5 [Major] FR-5/Task 2.1: "the four rules" was undefined and the CHANGELOG still said `node 306 tests` while the suite was 308.

### Author Response

- F1: FIX (the review record is `measure/archive/dsh_measure_commit_nested_20261109/spec-review.md`, linked from that index, and the note is a dated correction block in that track's `spec.md`; this track's plan names the same paths)
- F2: FIX (the code states `depth > 3` with the four-level explanation; a boundary pair asserts three nested shells return the path and four return `all: true`)
- F3: FIX (the option loop steps over the argument of `-o`/`-O` and skips a `--` token before the command word; `bash -c -- <string>` is covered; unknown-argument options remain a named residual)
- F4: FIX (the fix1 review's F5 disposition is corrected: the fixture had empty staged/status and `commitTakesAll` is false, so only the recursion denied the file; the fixture rewrite is kept as extra coverage of the untracked path)
- F5: FIX (the record defines the rules — cap, eval join, shell spellings, substitution pattern — and the residual names unknown-option-argument forms, arbitrary wrapper scripts, and shell functions; the CHANGELOG now says `node 310 tests`)

Delivered by `dsh_measure_commit_nested_fix3_20261109`; node 310/310, parity ok,
CLI 13/13, srg 11/11.
