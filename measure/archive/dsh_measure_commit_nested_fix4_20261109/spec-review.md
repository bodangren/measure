# Spec Review: dsh_measure_commit_nested_fix4_20261109

Author model: deepseek-official/deepseek-flash

## Round 1

Date: 2026-11-09
Reviewer: subagent (fresh context, default model)

### What this track proposes

Changing the DSH commit guard's nested-shell scan to step over option arguments
(`-o`/`-O`, short clusters ending in `o`/`O`, `--rcfile`, `--init-file`) and to
pin `--` semantics, adding the matching cases, and correcting five records
(fix3 review, fix2 review and its note, fix1 F5 finding, tech-debt residual,
CHANGELOG count).

### How the current system works, per this spec

`addedPaths` tokenizes the command; at a command position it recognizes `eval`, a
nested shell by basename, or `git add`/`git stage`, recursing into a nested
shell's command string with a depth cap and fail-closed unreadable input. The
option walk stepped only an exact `-o`/`-O` over its argument and skipped every
`--`. The adapter unions the staged set with the result in `stagedFiles`; the
decision applies the message and no-task rules.

### Findings

- F1 [Blocker] plan Task 2.1: the task wrote the fix3 review into this track's own `spec-review.md`, the file reserved for this track's fresh review; the precedent is the earlier archive's own `spec-review.md`.
- F2 [Major] FR-4: it wrote the fix2 review and tech-debt residual, which already existed, while the missing fix3 record was not a requirement.
- F3 [Major] FR-4/FR-5/Acceptance: the node count was stated as 312 while the suite is 310 at the base commit and 311 after this track's case block; the spec's own note said 311.
- F4 [Major] Overview F2/FR-3/Task 1.2: "the rule was not pinned by a case" was false — the existing case already asserts `bash -c -- "git add src/app.js"` returns the path.
- F5 [Major] FR-4: the `--` reversal falsifies the fix2 and fix3 records that say the walk skips a `--` before the command word; those statements were not named for correction.
- F6 [Major] FR-1/FR-3/Task 1.2: `--init-file` was required but had no case.
- F7 [Nit] FR-2/Task 1.1: the walk set `takesCommand` for any token containing `c`, so `bash --norc -- -c <string>` (rejected by bash) still scanned.

### Author Response

- F1: FIX (the fix3 review lives in `measure/archive/dsh_measure_commit_nested_fix3_20261109/spec-review.md` and is linked from its index; the fix4 spec carries a dated note correcting the plan's wrong target)
- F2: FIX (the requirements name the actually missing record and the existing ones are not rewritten)
- F3: FIX (the base count is 310, this track's case makes 311, and the spec note says 311)
- F4: FIX (the record acknowledges the existing `bash -c --` case; the new `--` cases target the before-`-c` behavior instead)
- F5: FIX (dated `--` corrections are appended to the fix2 and fix3 specs and the fix3 evidence)
- F6: FIX (`bash --init-file /dev/null -c "git add src/app.js"` returns the path; `--init-file` is in the option-argument set)
- F7: FIX (`takesCommand` is set only by a short option cluster containing `c`; `bash --norc -- -c` does not scan)

Delivered by `dsh_measure_commit_nested_fix5_20261109`; node 312/312, parity ok,
CLI 13/13, srg 11/11.
