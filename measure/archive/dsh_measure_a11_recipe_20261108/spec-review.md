# Spec Review: dsh_measure_a11_recipe_20261108

Author model: deepseek-official/deepseek-flash

## Round 1

Date: 2026-11-08
Reviewer: subagent (fresh context, default model)

### What this track proposes

Hardening the A11 detection recipe in both catalog copies: `grep -a` text mode
for NUL/invalid-UTF-8 documents; an anchored path pattern that accepts a space
after the first segment; three document messages (`does not exist`, `is not a
regular file`, `cannot be read`); S4 G2 contract rows for each change; the
tech-debt Group (e) row and CHANGELOG.

### How the current system works, per this spec

Before the track, a document failing `[ -f ]` got the single `does not exist`
message, an unreadable file fell through to a failed `grep`, NUL bytes made grep
treat the document as binary and hide claims, and `src/a b.txt` never matched the
space-free pattern. The S4 suite extracted the block and asserted exact outputs.

### Findings

- F1 [Blocker] FR-3: the universal "commands are not reported" claim failed for a command whose first space-free segment contains a slash — `bin/measure-benchmark run|score|report` in `measure/tech-stack.md` became three false candidates (live 3→6), and the command contract row only covered forms the pattern already excluded.
- F2 [Major] FR-2: the space rule was unpinned (any run of spaces, trailing/leading spaces) with only `src/a b.txt` exercised.
- F3 [Major] FR-6/Task 2.1: the Group (e) row was marked Resolved while it still lists `..` outside-repo paths and the "three candidates" item, and the live count was six.
- F4 [Nit] Task 1.2: the plan omitted the G6 sensitivity-mutant retarget the recipe rewrite forces.
- F5 [Nit] FR-5: the non-UTF-8 wording implied the invalid-byte claim itself is reported, while only the document's ASCII claims are.
- F6 [Nit] FR-5/Task 1.2: the unreadable row assumed a non-root runner (chmod 0 does not stop root).
- F7 [Nit] FR-5/Task 1.2: the `trailing_extra` row that pins the anchors was not listed.
- F8 [Nit] Overview: "the suite already names three gaps" overstated it; the message gap lives in the tech-debt row.

### Author Response

- F1: FIX (a span whose first space-free word is an existing executable file and whose full text is not a path is skipped: `bin/measure-benchmark run` is silent while `src/a b.txt` is checked; S4 rows cover the command and its missing-argument form; the live output is back to the pre-track 3 candidates)
- F2: FIX (the pattern is pinned to exactly one space between segments, no leading/trailing space: `^[A-Za-z0-9_.-]+/([A-Za-z0-9_./-]+( [A-Za-z0-9_./-]+)?)?$`; double-space, leading-space, and trailing-space rows are silent; directory claims like `commands/` are still checked)
- F3: FIX (the Group (e) row is Open again: it names the resolved NUL/space/message work and keeps the `..` outside-repo paths and the report-not-confirmed-drift items as the remaining debt; the live count is back to 3)
- F4: FIX (the mutant list is retargeted to the new pattern lines and gains an executable-skip mutant and a multiple-spaces mutant)
- F5: FIX (the correction note says a NUL/invalid-UTF-8 document's ASCII claims are still found; an invalid-byte span is not a path claim)
- F6: FIX (the unreadable-document row is skipped with a printed note under root, so chmod 0's root behavior cannot read as a code regression)
- F7: FIX (the correction note names the `trailing_extra` row and its anchors)
- F8: FIX (the correction note cites the tech-debt row for the message gap)

Delivered by `dsh_measure_a11_recipe_fix2_20261108`; S4 is 92 checks
(PASS=92), the live recipe prints 3 candidates, and the full gate is 10/10.
