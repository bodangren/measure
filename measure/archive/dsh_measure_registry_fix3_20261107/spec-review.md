# Spec Review: dsh_measure_registry_fix3_20261107

Author model: deepseek-official/deepseek-flash

## Round 1

Date: 2026-11-08
Reviewer: subagent (fresh context, default model)

### What this track proposes

Completing `tests/dsh/test-registry.sh` so it enforces section placement (bold
archived entries inside `## Archived Tracks`, cancelled directories as reason
entries in Cancelled), description content (each entry's description equals its
archive's collapsed `metadata.json` description, or the entry's bold title when
that is empty), and rejection of the old one-line
`- [x] [Title](archive/<dir>/…)` shape; isolated fixtures for each rule; plus the
missing consolidation-track review record and the corrected count wording.

### How the current system works, per this spec

`measure/tracks.md` has Active, Cancelled (four directories as reason entries),
and Archived Tracks (the other directories as bold title/link/description
entries); all non-empty metadata descriptions match, `visual_refresh` uses its
title as the fallback, and the check took registry/archive paths but verified
adjacency and presence rather than placement, content, or the old shape.

### Findings

- F1 [Major] spec.md FR-2 / plan Task 1.3: the empty-description fallback was not pinned to an exact string — "the entry's bold title text" could include the literal `Track: ` label, while the registry holds the label-stripped title — so the plan's registry "fix" was a no-op under one reading and a rewrite under the other.
- F2 [Major] spec.md FR-4 / plan Task 1.2: no isolated fixture covered the empty-description fallback, so a check that skipped empty-description entries would still pass the real registry.
- F3 [Major] plan Task 1.1 / spec FR-1: the "and only those" half of the section rule had no detection or fixture — a cancelled reason entry or a `[~]` entry inside `## Archived Tracks` passes the other rules.
- F4 [Blocker] plan Tasks 1.3/2.1/2.2/3.1: the plan required recording PASS lines, results, the entry count, and the closeout output but named no file or format.
- F5 [Major] plan Task 1.1: the JSON read had no named mechanism (python3/node/jq).
- F6 [Nit] spec Acceptance Criteria: "plus the earlier five" disagreed with FR-4's six earlier cases.
- F7 [Nit] spec F5: the consolidation track's `spec-review.md` was not "named" in its documents; it is required by the review process, and the missing file is real but the wording overstated the naming.

### Author Response

- F1: FIX (the fallback is pinned to the **label-stripped bold title**, the text between `**Track: ` and `**`; `visual_refresh` already uses exactly that string, so no registry description changed)
- F2: FIX (an empty-description fallback mismatch fixture is added: metadata description empty, registry description different from the title → rejected with the existing mismatch message)
- F3: FIX (the check now rejects any non-bold reason entry and any `[~]` entry inside `## Archived Tracks`, with a specific message and two fixtures)
- F4: FIX (the evidence file is `measure/runs/dsh_measure_registry_fix3_20261107/evidence.md`, holding the PASS lines, the node/parity/CLI results, the archive-referencing count, and the closeout output — written and recorded)
- F5: FIX (the JSON read uses `python3`, as tests/dsh/test-reload.sh does; named here and in the test)
- F6: FIX (the acceptance criterion says "the six earlier cases")
- F7: FIX (the wording now says the missing record was required by the review process, not named in the track's documents)

The corrections are delivered by `dsh_measure_registry_fix4_20261107`.
