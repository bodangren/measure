# Specification: DSH Measure registry checker completeness

## Overview

The registry consolidation shipped (one layout, full descriptions), but its
review found that the hardened check still verifies *adjacency and presence*, not
*placement and content*:

- F1 [Major] the Overview misstated the pre-fix shape: the seven completed tracks
  outside the Archived section all had a link line and four had descriptions; only
  three lacked a description. The real defect was placement plus three missing
  descriptions.
- F2 [Major] the per-directory rule counts an entry "in the whole file", so an
  archive entry sitting outside the Archived Tracks heading still passes; the
  layout defect can return with the check green.
- F3 [Major] the one-line `- [x] [Title](archive/<dir>/index.md)` shape that
  produced the `visual_refresh` duplicate is not named or rejected.
- F4 [Major] no rule ties a description's text to its directory's
  `metadata.json`, so a clipped or swapped description passes (the nine clipped
  lines the track fixed could return unnoticed).
- F5 [Major] the consolidation track's own `spec-review.md` (findings with
  dispositions) was named but not delivered.
- F6 [Nit] the equality "archive dirs = entries across the file = Archived +
  cancelled" counts the Active entry too, so a literal run reports a mismatch.
- F7 [Major] the empty-description fallback did not define "the title".

This track makes the check complete: section placement, description content
equality against the archive's metadata, and rejection of the old single-line
shape, each with an isolated negative fixture; it fixes the registry's one
fallback description (`visual_refresh` uses its title), delivers the
consolidation review record, and corrects the Overview wording. It is records and
one test file; no plugin change.

## Functional Requirements

- **FR-1 (section placement).** `tests/dsh/test-registry.sh` splits the registry
  by `## Active Tracks`, `## Cancelled Tracks`, and `## Archived Tracks`, and
  requires each bold archived entry to be inside the Archived section (the four
  cancelled directories stay, as reason entries, inside the Cancelled section;
  no bold `[x]` entry may sit before the Archived heading).
- **FR-2 (description content).** For every Archived entry, the description line
  (the line directly after its own link, stripped of `  *` and the trailing `*`)
  equals the collapse-to-one-line `metadata.json` `description` of its archive
  directory; when that description is empty, it equals the entry's bold title
  text. A mismatch is reported with the directory and both values.
- **FR-3 (the old shape).** A one-line `- [x] [Title](archive/<dir>/…)` link is
  rejected anywhere in the file.
- **FR-4 (fixtures).** Isolated negative fixtures prove each rule: an archived
  entry outside the section, a description that differs from metadata, a clipped
  description, an old-shape one-line link, plus the existing missing-description,
  orphan, missing-link, duplicate, unreferenced-directory, and two-active cases.
  Fixtures build their own registry and archive tree.
- **FR-5 (the records).** The consolidation track's
  `spec-review.md` is delivered with F1–F7 and one disposition each, its
  Overview is corrected to the accurate pre-fix shape, and the registry's
  `visual_refresh` description uses its title as the defined fallback.
- **FR-6 (verification).** `bash tests/dsh/run.sh` passes, node stays 301/301,
  both parity gates stay green, and the registry passes the completed check with
  the archive-directory/entry count stated as "archive-referencing entries".

## Non-Functional Requirements

- **NFR-1 (no code change).** Only `measure/tracks.md`, the structural test, and
  records change.
- **NFR-2 (POSIX).** Windows stays out of scope.

## Acceptance Criteria (track level)

- Given the registry, Then the completed check passes and the archive-referencing
  entry count equals the archive-directory count.
- Given any of the synthetic violations (entry outside the section, metadata
  mismatch, clipped description, old-shape link, plus the earlier five), Then the
  check rejects it with a specific message.
- Given the consolidation track, Then its `spec-review.md` holds F1–F7 with
  dispositions and its Overview states the accurate pre-fix shape.
- Given the gates, Then the CLI suite passes, node is 301/301, both parity gates
  are ok; each phase checkpoint is pushed.

## Out of Scope

- Rewriting historical descriptions or the cancelled reasons.
- The remaining spec_review_gate runner/parser rows.

> **Correction (2026-11-08, dsh_measure_registry_fix4_20261107):** the
> empty-description fallback is pinned to the **label-stripped bold title** (the
> text between `**Track: ` and the closing `**`); the fixture list is "the six
> earlier cases" (missing description, orphan description, missing link,
> duplicate entry, unreferenced directory, two active tracks) plus the new
> empty-fallback, reason-entry-in-Archived, and active-entry-in-Archived cases;
> and the missing consolidation review record was required by the review process,
> not named in the track's documents. The evidence file is
> `measure/runs/dsh_measure_registry_fix3_20261107/evidence.md`.
