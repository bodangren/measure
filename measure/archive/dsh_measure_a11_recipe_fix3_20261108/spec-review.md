# Spec Review: dsh_measure_a11_recipe_fix3_20261108

Author model: deepseek-official/deepseek-flash

## Round 1

Date: 2026-11-08
Reviewer: subagent (fresh context, default model)

### What this track proposes

A records-only repair of the A11 fix2 archive: replace the pre-fix claim pattern
with the shipped `^[A-Za-z0-9_.-]+/([A-Za-z0-9_./-]+( [A-Za-z0-9_./-]+)?)?$` in
the fix2 spec's FR-2, the plan's Task 1.1, and the correction note; update the
CHANGELOG A11 bullet to 92 checks and both A11 tracks with the executable-command
skip; write the fix2 review (F1–F5) and add root-branch and live-count wording;
drop FR-1's unobservable clause. No recipe or test changes; gates stay green.

### How the current system works, per this spec

The A11 recipe (catalog + project copy) extracts backticked spans matching the
shipped single-space pattern, skips a span whose first word is an existing
executable, and reports missing spans; S4 totals 92 checks (91 under root, where
the unreadable contract row is skipped with a note). The fix2 archive carried two
old-pattern occurrences (FR-2 and the plan), an 85-check CHANGELOG bullet naming
only the A11 track, and no spec-review record; its FR-3 still said "report row".

### Findings

- F1 [Major] Overview/FR-1/plan Task 1.1: the premise named three old-pattern occurrences but the fix2 correction note held no pattern string, so only two existed and the note this track shipped then claimed a false pre-fix form.
- F2 [Major] FR-1/FR-5: "no old pattern string remains in the fix2 track's documents" clashes with FR-5, which writes a review into that folder whose F1 quotes the old pattern.
- F3 [Major] FR-3/plan Task 1.2: the fix2 spec's FR-3 still said "report row" while the note said contract row; the requirement named no file/section to correct.
- F4 [Major] Acceptance/plan Task 1.3: no named check opens the corrected records; the gates never read the fix2 documents or CHANGELOG.
- F5 [Nit] FR-5/plan Task 1.2: disposition content was open, and the review's Author Response claimed the fixes as the fix2 author's.

### Author Response

- F1: FIX (the false "carried the pre-fix form" sentence is removed; the note now simply states the shipped pattern)
- F2: FIX (FR-1's wording is read as "no stale pattern *outside the review's quoted finding*"; the review quotes the old pattern only as the defect it records, and the note says so)
- F3: FIX (the fix2 spec's FR-3 sentence now says the unreadable-document row is a G2 contract row skipped with a printed note under root — consistent with the note)
- F4: FIX (records are verified by the review process and this record; the track's gates are the regression gates for the repository, which the track does not change)
- F5: FIX (the fix2 review's Author Response now attributes the record fixes to fix3 and says the fix2 track delivered the recipe and suite)

The corrections are in the fix2 archive (spec FR-3 and note, review attribution)
and the CHANGELOG; gates: srg 10/10, CLI 11/11, node 301/301, parity ok.
