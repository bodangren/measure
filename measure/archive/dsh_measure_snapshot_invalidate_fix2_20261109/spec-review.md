# Spec Review: dsh_measure_snapshot_invalidate_fix2_20261109

Author model: deepseek-official/deepseek-flash

## Round 1

Date: 2026-11-10
Reviewer: subagent (fresh context, default model)

### What this track proposes

Exporting `MUTATION_TOOLS`, adding the disjoint/coverage test, pinning the perf
row to Resolved with precise wording, appending dated corrections to the snapshot
track's record (test files, node 318, per-result cost, within-step window),
writing the previous track's review with F1–F6 and dispositions, and updating the
CHANGELOG; gates node 318/318, parity, CLI 13/13, srg 11/11.

### How the current system works, per this spec

`tools/result` invalidates only when `repoMutationLikely(exec.name)` is true: false
for the seven read-only names, true otherwise. A snapshot load re-reads measure/
and runs one `git rev-parse --is-inside-work-tree`; `git status --porcelain` is per
turn. `READ_ONLY_TOOLS` (hooks) and `MUTATION_TOOLS` (guard) sit side by side.

### Findings

- F1 [Major] FR-3/Task 2.1: the four dated corrections were split across two records and neither was complete; the snapshot track's note said "318 after the new block (317 before it)" although its own suite was 317/317.
- F2 [Major] Task 2.1 (CHANGELOG): the narrowing bullet carried fix2's work (node 318, exported `MUTATION_TOOLS`, disjoint test) but attributed only the original track, while the perf row in the same commit named both.
- F3 [Nit] FR-3: the cost statement omitted the per-result `git rev-parse --is-inside-work-tree` that every `loadSnapshot` runs.
- F4 [Nit] Overview (F3): the finding said `MUTATION_TOOLS` omitted `pwsh`/`str_replace_editor`; the set contains both — the predicate test's enumeration was incomplete.
- F5 [Nit] FR-2/Task 2.1: the perf row carried two resolution clauses (2026-11-09 and 2026-11-10) saying the same narrowing twice, against the curated-not-append-only header.

### Author Response

- F1: FIX (the fix2 spec note now carries all four corrections — test files, the 317/318 counts, the rev-parse cost, the within-step window — and the snapshot track's note states its own 317/317)
- F2: FIX (the CHANGELOG bullet names both tracks)
- F3: FIX (the cost line includes the one `git rev-parse --is-inside-work-tree`; `git status` stays per turn)
- F4: FIX (the fix2 spec carries an appended F4 wording correction: `MUTATION_TOOLS` contains both tools; the predicate test's enumeration was the incomplete list, and the shipped disjoint-set test enumerates the exported set)
- F5: FIX (the perf row has a single 2026-11-10 resolution clause with the allowlist wording, the rev-parse cost, and the window)

Delivered by `dsh_measure_snapshot_invalidate_fix3_20261109`; node 318/318,
parity ok, CLI 13/13, srg 11/11.
