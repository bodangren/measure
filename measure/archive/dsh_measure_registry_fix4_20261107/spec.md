# Specification: DSH Measure registry check finalization

## Overview

The registry checker completeness track delivered the section-placement,
description-content, and old-shape rules, but its review found four precision
items: the empty-description fallback was not pinned to an exact string (the
label-stripped bold title), there was no fixture for that fallback, the
"and only those" half of the section rule had no detection (a cancelled reason
entry or a `[~]` entry inside `## Archived Tracks` passes), the evidence file was
named nowhere in the plan, and the JSON mechanism was left open.

This final track pins the fallback to the **label-stripped bold title** (the text
between `**Track: ` and `**`), adds a negative empty-fallback fixture (metadata
description empty, description different from the title), rejects any non-bold
reason entry or `[~]` entry inside `## Archived Tracks` with fixtures, names the
evidence file (`measure/runs/dsh_measure_registry_fix3_20261107/evidence.md`) and
the python3 JSON mechanism, and delivers the fix3 review record with dispositions
plus a dated correction note on its spec. It completes the registry work; further
registry tuning is out of scope.

## Functional Requirements

- **FR-1 (the pinned fallback).** The expected description for an entry whose
  archive `metadata.json` has an empty `description` is the **label-stripped bold
  title**: the text of `- [x] **Track: <title>**` between `**Track: ` and the
  closing `**`. `visual_refresh_20260425` uses exactly that string.
- **FR-2 (the fixtures).** `tests/dsh/test-registry.sh` adds: an empty-description
  fallback mismatch fixture (metadata description empty, registry description
  different from the title → rejected with the existing mismatch message), and
  section-only violations: a cancelled reason entry (`- <title> — <reason>` plus
  its link) inside `## Archived Tracks`, and a `[~]` entry inside
  `## Archived Tracks` (both rejected with a specific message). All fixtures keep
  building their own registry and archive tree.
- **FR-3 (the evidence).** The fix3 record's evidence lives at
  `measure/runs/dsh_measure_registry_fix3_20261107/evidence.md` and holds: the
  eleven PASS lines, the results for node/parity/CLI, the archive-referencing
  entry count (archive directories = archive-referencing entries; plus the active
  entry when one exists), and the `closeout` output (manifest-only FAIL).
- **FR-4 (the records).** `measure/archive/dsh_measure_registry_fix3_20261107/spec-review.md`
  holds the review's findings F1–F7 with one disposition each; its `spec.md`
  carries a dated correction note pinning the fallback string, the exact fixture
  count ("the six earlier cases"), and the F7 wording correction; its index links
  the review.
- **FR-5 (verification).** `bash tests/dsh/test-registry.sh` passes with the new
  fixtures, `bash tests/dsh/run.sh` passes, node stays 301/301, both parity gates
  stay green; each phase checkpoint is pushed.

## Non-Functional Requirements

- **NFR-1 (reuse).** The JSON read uses `python3` (as tests/dsh/test-reload.sh
  does); no new dependency.
- **NFR-2 (no code change).** Only the structural test and records change.
- **NFR-3 (POSIX).** Windows stays out of scope.

## Acceptance Criteria (track level)

- Given the registry, Then the completed check passes and the fallback string is
  the label-stripped bold title.
- Given the synthetic violations (empty-fallback mismatch, cancelled reason entry
  in Archived, `[~]` entry in Archived), Then the check rejects each with its
  message.
- Given the fix3 record, Then its `spec-review.md` holds F1–F7 with dispositions,
  its spec carries the dated correction note, and its evidence file exists with
  the listed contents.
- Given the gates, Then CLI passes, node is 301/301, both parity gates are ok;
  each phase checkpoint is pushed.

## Out of Scope

- Further registry layout or description tuning.
- The remaining spec_review_gate runner/parser rows.

> **Correction (2026-11-08, follow-up review):** the evidence file is
> `measure/runs/dsh_measure_registry_fix4_20261107/evidence.md`; it holds fourteen
> PASS lines (the original eleven plus the empty-fallback, reason-entry, and
> active-entry cases), the node/parity/CLI/srg results, the archive-referencing
> count, and both closeout outputs (manifest-only FAIL for fix3 and fix4 after
> the fix3 plan SHAs were repaired). The Overview's "four precision items" is
> five. The fallback logic was already label-stripped in the test, so only the
> two section rules and the fixtures were new. The fix3 review's findings and
> dispositions live in `measure/archive/dsh_measure_registry_fix3_20261107/spec-review.md`.
