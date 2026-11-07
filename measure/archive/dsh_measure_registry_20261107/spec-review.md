# Spec Review: dsh_measure_registry_20261107

Author model: deepseek-official/deepseek-flash

## Round 1

Date: 2026-11-08
Reviewer: subagent (fresh context, default model)

### What this track proposes

Rebuild `measure/tracks.md`'s Archived Tracks section so each archived track has
one title line, one `*Link:` line, and a one-paragraph description from that
track's `metadata.json`, leaving the active and cancelled sections alone; add
`tests/dsh/test-registry.sh` to the CLI contract suite to reject a merged
description block, an archive directory without an entry, a title line without a
nearby link, and more than one `[~]` track; then record metadata and archive the
track.

### How the current system works, per this spec

`measure/tracks.md` is the registry every Measure session reads first; it carried
completed, active (`[~]`), and cancelled tracks, with entries in two shapes: bold
`title / *Link:*` entries and single-line `- [x] [Title](archive/<dir>/index.md)`
links. Sixteen descriptions from distinct archived tracks had collapsed under the
`DSH Measure commit scan fix2` entry. Archive folders live under
`measure/archive/`, and the CLI suite runs every `tests/dsh/test-*.sh`.

### Findings

- F1 [Blocker] spec.md FR-1: three archived entries had no description line (lessons_learned at line 7, scrum_tracks at 14, graph_integration at 19), so the acceptance criterion "every archived entry has title, link, and one description" was unmet while the check passed.
- F2 [Blocker] spec.md FR-1: `visual_refresh_20260425` had two entries (the linked single-line entry and the bold entry at line 167), so "exactly one entry per archived track" was false, and the metadata note admitted the duplicate was kept while the check counted one link line.
- F3 [Major] spec.md FR-1: the Archived Tracks section held 27 of 38 archive directories; seven non-cancelled directories had their only entry outside the section, and the four cancelled directories stayed in the cancelled section, so FR-1 contradicted "the cancelled section is unchanged".
- F4 [Major] spec.md FR-3: negative fixtures covered only a merged block and an empty file, so the link rule, the exactly-one-entry rule, the one-description rule, and the at-most-one-active rule had no failing case.
- F5 [Major] spec.md FR-3: the rules were pair-local — a single orphan description passed, and the link test accepted the next entry's link, so a title without its own link could pass.
- F6 [Nit] plan.md Task 2.1: the unreferenced-directory fixture was not isolated; `check_registry` read the global archive path, so the fixture was dead and the empty-file case exercised the production archive.
- F7 [Major] plan.md Task 1.1: the recorded SHA `46fd0bd` does not contain the registry rebuild; the rebuild is `b314321`.
- F8 [Nit] spec.md FR-2: nine descriptions were truncated mid-word with "…" at 198 characters, and the track's own entry was a rewritten summary, not its metadata description.

### Author Response

- F1: FIX (the consolidation track rebuilt the registry so every archived entry has its own link and exactly one description; the three examples are gone)
- F2: FIX (the old single-line entries are removed, including `visual_refresh`, so every archive directory has exactly one tracked entry in the whole file)
- F3: FIX (the registry now has exactly three sections — Active, Cancelled with the four cancelled directories, Archived Tracks with every other directory — so the scope no longer contradicts the cancelled exemption)
- F4: FIX (the check has isolated negative fixtures for missing description, orphan description, missing link, duplicate entry, unreferenced directory, and two active tracks)
- F5: FIX (the rules are attribution-based: a title must be followed directly by its own link, then by exactly one description, and a description must follow a link line; an orphan single line is rejected)
- F6: FIX (`check_registry` takes the registry and archive paths, and every fixture builds its own archive directory)
- F7: FIX (the corrected plan records the rebuild commit `b314321`; the consolidation track's own record keeps the accurate SHAs)
- F8: FIX (descriptions are the full metadata text collapsed to one line, never clipped, and the track's own description comes from its metadata)

The corrections are delivered by `dsh_measure_registry_fix2_20261107`.
