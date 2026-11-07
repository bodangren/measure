# Spec Review: dsh_measure_a11_recipe_fix2_20261108

Author model: deepseek-official/deepseek-flash

## Round 1

Date: 2026-11-08
Reviewer: subagent (fresh context, default model)

### What this track proposes

Removing the false drift candidates the A11 space change introduced: skipping a
backticked span whose first space-free word is an existing executable file, and
pinning the claim pattern to exactly one space between segments with no leading or
trailing space; S4 G2 rows for the executable command, its missing-argument form,
and double/leading/trailing spaces; G6 mutant retarget; a non-fatal unreadable row
under root; the A11 review record, correction note, tech-debt row, and CHANGELOG;
gates srg 10/10, node 301/301, parity, CLI 11/11.

### How the current system works, per this spec

The recipe keeps backticked spans that match the path pattern and prints a
`DRIFT candidate` line for each span `[ -e ]` rejects; the pattern accepts any run
of spaces and a command whose first space-free segment contains a slash matches.
The S4 suite extracts the block from both catalog copies and runs contract, report,
and mutant groups. In this repository the pre-fix recipe printed 6 candidates.

### Findings

- F1 [Blocker] FR-2/plan Task 1.1/trailing note: the pinned pattern `^[A-Za-z0-9_.-]+/[A-Za-z0-9_./-]*( [A-Za-z0-9_./-]+)?$` matches `src/ a.txt` because the second class can be empty, so the requirement contradicts the leading-space row; the shipped recipe and the trailing note pin `^[A-Za-z0-9_.-]+/([A-Za-z0-9_./-]+( [A-Za-z0-9_./-]+)?)?$`, leaving two different patterns in the spec.
- F2 [Major] FR-5/plan Task 2.1: the `CHANGELOG.md` bullet still said "(85 checks)" and named only the A11 track, while the suite is 92 checks and the executable skip ships in fix2.
- F3 [Nit] FR-3/plan Task 1.2: the root branch is a G2 contract row skipped with a note inside `contract_results`, not a G3 report row; under root the total is 91, not 92, and that edge case had no record.
- F4 [Nit] FR-1: the "and whose full text is not an existing path" clause is unobservable — a skipped span and an existing full span both print nothing.
- F5 [Nit] FR-5/plan Task 1.3: the 3-candidate live count is named as an expectation, but the suite's G4 live run only prints it; the value holds only while `commands/` and `node_modules/` are absent.

### Author Response (the record corrections were delivered by `dsh_measure_a11_recipe_fix3_20261108`; the fix2 track itself delivered the recipe and suite)

- F1: FIX by fix3 (the fix2 spec's FR-2 and the plan's Task 1.1 now use the shipped pattern `^[A-Za-z0-9_.-]+/([A-Za-z0-9_./-]+( [A-Za-z0-9_./-]+)?)?$`; no old pattern string remains in the track's documents)
- F2: FIX by fix3 (the CHANGELOG A11 bullet now states 92 checks, names both A11 tracks, and says the executable skip ships in fix2)
- F3: FIX by fix3 (the fix2 record states the unreadable row is a contract row skipped with a printed note under root, giving 91 checks there)
- F4: FIX by fix3 (the clause is dropped from FR-1)
- F5: FIX by fix3 (the record states the live count is evidence — G4 prints it, no test asserts it)

Delivered by `dsh_measure_a11_recipe_fix3_20261108`; the recipe and suite are
unchanged (S4 92 checks, full gate 10/10, CLI 11/11).
