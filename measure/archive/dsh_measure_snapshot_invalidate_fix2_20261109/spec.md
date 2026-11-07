# Specification: DSH Measure snapshot invalidation fix2

## Overview

The snapshot-invalidation narrowing shipped, but its review found:

- **F1:** the plan named no test file and left the plugin-level seam open.
- **F2:** the gate said `node 320/320` while the tree is 317 (315 before the
  track's two cases).
- **F3:** the new READ_ONLY_TOOLS set is a second classification next to the
  existing `MUTATION_TOOLS` set (`src/guard.js`), with nothing keeping them
  disjoint and the write-tool list omitting `pwsh`/`str_replace_editor`.
- **F4:** the within-step window is new: several tool calls can share one step, so
  an external edit between two calls of the same step is seen at the next
  pre-step, not the next call.
- **F5:** the perf row's status/wording was unpinned and ended contradictory
  (Status Open with a "Resolved" note), and "read-only results no longer
  invalidate" over-claims — only the seven allowlisted names skip.
- **F6:** the cost claim attributed a per-result `git status` read that is actually
  per-turn.

This track exports `MUTATION_TOOLS`, adds the disjoint/coverage test, states the
within-step window as the residual, and corrects the records.

## Functional Requirements

- **FR-1 (the two sets).** `src/guard.js` exports `MUTATION_TOOLS`;
  `tests/guard-prep.test.js` asserts every mutation name is
  `repoMutationLikely` true and that the mutation and read-only sets are disjoint
  (the test reads the exported set).
- **FR-2 (the record).** `measure/tech-debt.md`'s perf row has **Status Resolved**
  and states precisely: only the seven allowlisted read-only names skip the
  invalidation, unknown/write names stay conservative, the pre-step invalidation
  remains, and the within-step external-edit window is the documented residual.
- **FR-3 (spec corrections, named files).** The track's `spec.md` carries dated
  corrections: the test files are
  `plugins/dsh-measure-guard/tests/guard-prep.test.js` (predicate and disjoint
  sets) and `plugins/dsh-measure-guard/tests/plugin.test.js` (the read-vs-bash
  invalidation spy); the node count is 318 after the new block (317 before it);
  the cost is the per-result measure/ re-read (no per-result `git status`); the
  within-step window is the residual.
- **FR-4 (the review).** `spec-review.md` in this track's folder records F1–F6 with
  severity/scope and dispositions and is linked from the index.
- **FR-5 (verification).** node 318/318, both parity gates ok, CLI 13/13,
  srg 11/11.

## Non-Functional Requirements

- **NFR-1 (bounded).** Exporting an existing constant and one test block; no new
  dependency.
- **NFR-2 (contract preserved).** The guard classification and the invalidation
  behavior are unchanged; only their testability and records improve.

## Acceptance Criteria (track level)

- Given the mutation tools, Then `repoMutationLikely` is true for each and the
  sets are disjoint.
- Given the perf row, Then Status is Resolved with the precise wording and the
  within-step window named.
- Given the gates, Then node 318/318, CLI 13/13, srg 11/11, parity ok; each phase
  checkpoint is pushed.

## Out of Scope

- Eliminating the within-step window (it would need a per-call change detector).

> **Follow-up correction (2026-11-10, before the review):** the node suite is 318
> after the new disjoint-set block (317 before it), not 320. The test files are
> `plugins/dsh-measure-guard/tests/guard-prep.test.js` (predicate and disjoint
> sets) and `plugins/dsh-measure-guard/tests/plugin.test.js` (read-vs-bash
> invalidation spy). `MUTATION_TOOLS` is exported from `src/guard.js`. The
> within-step external-edit window is named as the residual in the perf row.
