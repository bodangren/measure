# Spec Review: dsh_measure_commit_nested_fix5_20261109

Author model: deepseek-official/deepseek-flash

## Round 1

Date: 2026-11-09
Reviewer: subagent (fresh context, default model)

### What this track proposes

Narrowing the `-c` detection to short option clusters (so `--norc` no longer
counts), adding `--init-file FILE -c` (path) and `bash --norc -- -c` (no path)
cases, and correcting the record trail with named targets (fix3 review location,
fix4 plan's wrong target, 312→311 count, fix2/fix3 `--` corrections, tech-debt
residual, CHANGELOG count).

### How the current system works, per this spec

`addedPaths` walks a shell's option tokens hunting for `-c`: it steps over the
argument of `-o`/`-O`, short clusters ending `o`/`O`, `--rcfile`, and
`--init-file`; skips a `--` only after the command flag; marks the shell as taking
a command when any option token's text contains `c`; then recurses, capped at
four levels. The suite has 311 test blocks at the base commit; the fix3 review
record exists; the fix4 review record was missing.

### Findings

- F1 [Blocker] FR-3/Acceptance: FR-3 ordered the fix3 review recorded in an archive where it already existed and linked, while the actually missing fix4 review appeared only in plan Task 2.1, so the "Given the fix3 archive" criterion passes with no edit and the track could close with the fix4 review unrecorded.
- F2 [Major] FR-4/FR-3/acceptance: the node count was fixed at 313 while the base is 311 and the two cases can land as one block (312), two blocks (313), or assertions in the existing block (311).
- F3 [Major] plan Task 2.1/FR-3: the wrong review target is fix4's `plan.md` line 17, but FR-3 placed the correction in fix4's `spec.md`, which does not hold that text.
- F4 [Major] FR-3: the fix3 spec's fix4 correction says "the CHANGELOG states node 311 tests", but the CHANGELOG said 310 at that commit; the named targets did not correct that false statement.
- F5 [Nit] FR-3: "the node count is stated as 311 wherever FR-4/FR-5/acceptance mention 312" was unqualified (this spec has no FR-5) and duplicated the fix4 dated note.

### Author Response

- F1: FIX (the missing record is the fix4 review: `measure/archive/dsh_measure_commit_nested_fix4_20261109/spec-review.md` was written with F1–F7 dispositions and linked from its index; the fix5 spec carries a dated note correcting FR-3's wrong target)
- F2: FIX (the base is 311 and this track's single case block makes 312; the fix5 spec's dated note records 312 and the CHANGELOG states node 312)
- F3: FIX (a dated correction is appended to the fix4 `plan.md` itself, where the wrong target text lives)
- F4: FIX (the fix3 spec receives a dated correction stating the true CHANGELOG trajectory: 310 at fix4, 312 after fix5)
- F5: FIX (the fix5 spec note names the fix4 spec as the target and states append-not-rewrite)

Delivered by this track; node 312/312, parity ok, CLI 13/13, srg 11/11.
