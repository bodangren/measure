# Specification: DSH Measure count pins

## Overview

The doc-drift suite pins the anti-pattern class count as literals: the per-catalog loop
expects exactly 11 A-entry headings, the orchestrator registry text must say
`11 entries (A1–A11)`, the strategy role and the audit Inputs must say `A1–A11 today`, and
a negative check forbids `A1–A10`. Adding a class therefore requires editing four documents
*and* the test, and forgetting one of them fails the gate for the wrong reason — the
Group (b) row records this as "the fixed-count checks are brittle across releases and new
roles" (the release half was fixed with the whole-file changelog credit; the class-count
half is this track).

This track derives both numbers from the catalog itself (the A-entry heading count and the
highest class number) and uses them in every check, so a new class needs only the catalog
and the documents to agree; the test then verifies agreement instead of a frozen number.
A mutation proof (a temporary `## A12 — …` heading) shows the derived check fails when a
document lags, then passes after restore.

## Functional Requirements

- **FR-1 (derive).** `test_s4_doc_drift.sh` derives `CATALOG_COUNT` (A-entry headings) and
  `CATALOG_LAST` (highest A number) from `skills/measure-orchestrator/references/anti-pattern-catalog.md`,
  fails when either is empty/zero, and passes a labeled derivation check.
- **FR-2 (use).** The six checks use the derived values: both catalogs' heading count, the
  registry `"<count> entries (A1–A<last>)"`, the strategy `"(A1–A<last> today)"`, the audit
  Inputs `"A1–A<last> today"`, and the negative "no file contains `A1–A<last-1>`".
- **FR-3 (mutation proof).** A temporary extra `## A12 — …` heading in the skills catalog
  makes the suite fail (the documents lag); after restore it passes; the proof is recorded.
- **FR-4 (records).** The Group (b) tech-debt row becomes `Resolved` (all four parts are
  now closed); `CHANGELOG.md` records the derivation; the installed skill copies are
  re-synced and the live check passes.
- **FR-5 (verification).** srg 11/11 (S4 94 checks), CLI 13/13, node 351/351, both parity
  gates ok; the track is archived with a manifest-only closeout FAIL.

## Non-Functional Requirements

- **NFR-1 (no new dependency).** `grep`/`sed`/`sort` only.
- **NFR-2 (same rigor).** A missing catalog, a count zero, or a document that disagrees
  still fails; the negative check keeps proving no stale previous-class text.

## Acceptance Criteria (track level)

- Given the current catalog, Then every count check passes with the derived numbers.
- Given an extra class heading whose documents were not updated, Then the suite fails
  naming the count text.
- Given the restoration, Then the suite passes again.
