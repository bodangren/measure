# Spec Review: dsh_measure_registry_fix2_20261107

Author model: deepseek-official/deepseek-flash

## Round 1

Date: 2026-11-08
Reviewer: subagent (fresh context, default model)

### What this track proposes

Consolidating `measure/tracks.md` into one layout — Active, Cancelled (four
directories with reasons), Archived Tracks holding every other archive directory
exactly once as a bold title, its own `*Link:` line, and one full description
from the archive's `metadata.json` (the title when empty) — tightening
`tests/dsh/test-registry.sh` to take registry/archive paths and enforce own-link,
one-description attribution, no orphan descriptions, one entry per archive
directory, and at most one `[~]` track, with isolated negative fixtures, and
correcting the archived registry track's record.

### How the current system works, per this spec

`measure/tracks.md` is the registry every Measure session reads first. It had
drifted: seven completed tracks sat outside the Archived section (four with their
link and description, three also missing a description), `visual_refresh` had
both a single-line link and a bold entry, nine descriptions were clipped, and the
old check verified adjacency rather than attribution.

### Findings

- F1 [Major] spec.md Overview: the claim that the seven out-of-section entries had "no link line, no description" was inaccurate — all seven had a link line and four had descriptions; only three lacked one.
- F2 [Major] spec.md FR-3: the per-directory rule counts an entry "in the whole file", so an archive entry outside the Archived Tracks heading still passes and the layout defect can return green.
- F3 [Major] spec.md FR-3: the one-line `- [x] [Title](archive/<dir>/…)` shape that produced the `visual_refresh` duplicate was not named or rejected.
- F4 [Major] spec.md FR-2/FR-3: no rule tied a description's text to its directory's metadata, so clipped or swapped descriptions passed (the nine clipped lines could return undetected).
- F5 [Major] spec.md FR-5 / plan Task 3.1: the consolidation track's own `spec-review.md` was named but not delivered, and its spec named neither the findings nor the dispositions.
- F6 [Nit] plan Task 1.2: the equality "archive dirs = entries across the file = Archived + cancelled" counts the Active entry too.
- F7 [Major] spec.md FR-2: "when it is empty, the title is used" did not define "the title".

### Author Response

- F1: FIX (the Overview now says seven outside the section, four with their link and description, three also missing a description)
- F2: FIX (the completed check splits the registry by section and rejects an archived bold entry outside `## Archived Tracks`)
- F3: FIX (the old one-line shape is rejected anywhere, with a fixture)
- F4: FIX (each entry's description must equal its archive's collapsed `metadata.json` description, or its bold title when that is empty; fixtures cover a mismatch and a clipped description — `measure/archive/visual_refresh_20260425` uses its title as the defined fallback and the registry passes)
- F5: FIX (this file records F1–F7 with one disposition each, linked from the track's index)
- F6: FIX (the record states the count as archive-referencing entries: 39 archive directories = 39 archive-referencing entries, plus one active entry)
- F7: FIX (the fallback is the entry's bold title text; `visual_refresh` is the only archive with an empty description and its entry uses that title)

The corrections are delivered by `dsh_measure_registry_fix3_20261107`.
