# Specification: DSH Measure snapshot invalidation fix3

## Overview

The fix2 track corrected the snapshot-invalidation records, but its review found
the corrections split and imprecise:

- **F1:** the four required corrections are split across two records and neither
  is complete; the previous track's note says "318 after the new block (317 before
  it)" although that track's own suite was 317/317.
- **F2:** the CHANGELOG bullet for the narrowing now carries fix2's work (node 318,
  exported `MUTATION_TOOLS`, disjoint test) but still attributes only the original
  track.
- **F3:** the cost statement omits the per-result
  `git rev-parse --is-inside-work-tree` that every `loadSnapshot` runs.
- **F4:** the finding text says `MUTATION_TOOLS` omitted `pwsh`/
  `str_replace_editor`; the set contains both — the predicate *test's* enumeration
  was the incomplete list.
- **F5:** the perf row carries two resolution clauses (2026-11-09 and 2026-11-10)
  saying the same thing, against the file's curated-not-append-only header.

This is a records-only track: it makes the fix2 spec note carry all four
corrections, fixes the previous track's count note, attributes the CHANGELOG to
both tracks, adds the rev-parse cost, corrects the F4 wording, and consolidates
the row to one resolution clause.

## Functional Requirements

- **FR-1 (one complete record).** `measure/archive/dsh_measure_snapshot_invalidate_fix2_20261109/spec.md`
  carries all four corrections: the test files
  (`guard-prep.test.js` predicate/disjoint, `plugin.test.js` spy), the counts (the
  original track 317/317; fix2 318/318; the new block is one), the per-result cost
  (the measure/ re-read plus one `git rev-parse --is-inside-work-tree`; no
  per-result `git status`), and the within-step external-edit window.
- **FR-2 (the previous note).** The original track's correction note states its
  own suite count as 317/317 and does not present 318 as its own.
- **FR-3 (the CHANGELOG).** The snapshot-invalidation bullet attributes the node
  318 count, exported `MUTATION_TOOLS`, and disjoint test to both tracks
  (`dsh_measure_snapshot_invalidate_20261109` and its fix2).
- **FR-4 (the row).** `measure/tech-debt.md`'s perf row has a single resolution
  clause (2026-11-10) with the precise allowlist wording, the rev-parse cost, and
  the within-step window; no duplicate 2026-11-09 clause remains.
- **FR-5 (the review).** `measure/archive/dsh_measure_snapshot_invalidate_fix2_20261109/spec-review.md`
  records F1–F5 with severity/scope and dispositions and is linked from its index.
- **FR-6 (verification).** node 318/318, both parity gates ok, CLI 13/13,
  srg 11/11.

## Non-Functional Requirements

- **NFR-1 (records only).** No code or test behavior change.
- **NFR-2 (curated).** The tech-debt file stays at or below 50 lines.

## Acceptance Criteria (track level)

- Given the fix2 spec, Then it names all four corrections with the 317/318 counts.
- Given the CHANGELOG bullet, Then it attributes both tracks and the node 318
  count.
- Given the perf row, Then one resolution clause names the allowlist, the
  rev-parse cost, and the window.
- Given the gates, Then node 318/318, CLI 13/13, srg 11/11, parity ok; the
  checkpoint is pushed.

> **Follow-up correction (2026-11-10, after the review):** the F4 wording
> correction lives in the fix2 spec (appended block) and in the snapshot track's
> review (appended paragraph), not in this spec. The verification did run the
> node suite (318/318) and both parity gates in addition to the CLI/srg tasks; the
> evidence file records them. The track-level acceptance also covers FR-2 (the
> original note's own 317/317) and FR-5 (the fix2 review with F1-F5, linked from
> its index). The CHANGELOG names the exact second id
> `dsh_measure_snapshot_invalidate_fix2_20261109`. The Overview's "previous
> track's note" sentence mixed the two notes: the 318 claim sat in the note fix2
> appended to the original track's spec; fix2's own suite is 318 and the original
> track's suite was 317.
