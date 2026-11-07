# Specification: DSH Measure contracts matching and scope details

## Overview

The Group (d) row records that the role contract omits how markers are matched
(`strip()` semantics) and several scope/baseline details: the contract says the
block is "the last result block", but not that the markers are recognized as
whole lines after stripping surrounding whitespace, that the dispositions value is
read raw with a single CRLF terminator ignored, that the baseline need not be an
ancestor, that the phase's changed files include every commit in the range, or that
mid-red/green require HEAD to advance. The doc test pins only the wording that
already exists.

This track adds a "Marker Matching and Baseline" section to
`skills/measure-orchestrator/references/contracts.md` describing the shipped
matching, value, scope, baseline, and HEAD-advance rules, and extends the S3 docs
test so those sentences cannot silently disappear.

## Functional Requirements

- **FR-1 (marker matching).** The contract states: the start/end markers are
  recognized only as whole lines after stripping surrounding whitespace (marker
  text inside another word does not count); the block-range rule is unchanged.
- **FR-2 (the value).** The contract states: the dispositions value is read raw
  after the prefix, one trailing CR of a CRLF log is ignored, each item is
  stripped, and the control/format rejection applies.
- **FR-3 (scope and baseline).** The contract states: a finding's scope is the
  role name for audit roles (`review-a`, `review-b`, `review-c`,
  `adversarial-testing`, `ux-browser-review`, `phase-acceptance`) and the required
  scope word for spec-review; `--baseline` resolves to a commit and need not be an
  ancestor; the phase's changed files are the tree diff unioned with every commit
  in `baseline..HEAD`; mid-red and jr-green require HEAD to advance from the
  baseline.
- **FR-4 (the doc test).** `tests/spec_review_gate/test_s3_dispositions_docs.sh`
  asserts one exact phrase from each of FR-1..FR-3 inside the new section (a
  section extraction, not a whole-file substring), so a deleted sentence fails.
- **FR-5 (records).** The Group (d) row records the matching/baseline/scope part
  resolved and names any residual; `CHANGELOG.md` has a bug-fix entry.
- **FR-6 (verification).** srg 11/11, CLI 13/13, node 318/318, both parity gates ok.

## Non-Functional Requirements

- **NFR-1 (bounded).** Documentation plus doc-test assertions; no code change.
- **NFR-2 (accurate).** Every sentence added matches the shipped checker behavior
  (verified against `dispositions_feedback`, `has_agent_result`, `changed_files`,
  and the mid-red/green HEAD checks).

## Acceptance Criteria (track level)

- Given the contract, Then the new section states the whole-line marker matching,
  the raw value with the CRLF allowance, the scope names, the non-ancestor
  baseline, the unioned changed files, and the HEAD-advance requirement.
- Given the doc test, Then deleting any of those sentences fails a check.
- Given the gates, Then srg 11/11, CLI 13/13, node 318/318, parity ok; the
  checkpoint is pushed.

## Out of Scope

- The remaining Group (a)/(b)/(f)/(g) items.

> **Follow-up correction (2026-11-10, after the review):** the section distinguishes
> the committed set (tree + every commit in `baseline..HEAD`) from the working-tree
> union (unstaged and staged diffs, for roles that read the working tree); the
> spec-review baseline resolution and the Mid Red/Jr Green string comparison are
> stated separately; the spec-review scope names the spec/plan section (the
> standard's rule); the Group (d) residual keeps only the audit result JSON identity
> fields and the model-default wording; the doc test pins all six scope names in
> the new section, the working-tree union, and the spec-review baseline resolution.
