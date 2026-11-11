# Specification: Merge pull request 9

## Overview

GitHub pull request #9 (`local-changes-20261111` → `main`) carries local work that
`origin/main` did not have when it was opened:

- `93c7cd5`: the 2026-11-10 orchestrator process review
  (`measure/reviews/2026-11-10-orchestrator-process-review.md`).
- `4402c67`: the `measure-status` OpenChamber extension
  (`extensions/measure-status/`, 15 files including its `bun test` suites; no
  `node_modules` in the commit).
- `f45b7d5`: 9 installed role files copied byte for byte into `agents/` with the
  three documented change kinds.
- `beb270e`…`a8530be`: the Measure track `role_file_edits_20261111`, created and
  archived, plus its registry entry.

The PR states its own verification (extension `bun test` 43/43, `cmp` of the 9
copied pairs, 5 doc tests, the install check, and `tests/dsh/test-registry.sh`)
but explicitly did not run the full repository suite. This chore track reviews
the PR against its stated result, runs the checks plus the repository gates that
cover the touched paths, merges it, and records the merge.

## Functional Requirements

- **FR-1 (diff review).** Fetch the PR branch and review `git diff a0aa585..HEAD`
  (the PR is based on the current `main` tip): only the described review document,
  extension files, the 9 role files, the archived track, and the registry change;
  no `node_modules`, no build output, no unrelated edits.
- **FR-2 (verification).** In a scratch git worktree of the PR head, run the PR's
  own checks — `bun test` in `extensions/measure-status` (43 pass),
  `cmp` on the 9 `agents/` pairs, `tests/spec_review_gate/test_s2_role_docs.sh`,
  `test_s3_dispositions_docs.sh`, `test_s4_doc_drift.sh`, `tests/dsh/test-docs.sh`,
  `tests/dsh/test-reference.sh`, `tests/dsh/test-registry.sh` — and the repository
  gates `bash tests/dsh/run.sh` and `bash tests/spec_review_gate/run.sh`.
- **FR-3 (merge).** Merge PR #9 into `main` only when `mergeStateStatus` is CLEAN
  and the checks pass. Use a merge commit (the repository keeps per-commit history
  and its existing merges are merge commits). After the merge, `main` is
  fast-forwarded/pulled locally, the tree is clean, and the PR commits are
  reachable from `main`.
- **FR-4 (records).** Record the review, the command results, the merge commit, and
  the post-merge state under `measure/runs/pr_9_merge_20261111/`; archive this
  chore track, update the registry and the README status line, and record the
  expected manifest-only closeout FAIL.

## Non-Functional Requirements

- **NFR-1 (no product change).** This track changes no plugin, extension, role, or
  skill file: its commits are the merge plus its own Measure records.
- **NFR-2 (read-only review).** The PR content is reviewed in a scratch worktree,
  never edited; a failure in the PR content blocks the merge instead of being
  fixed inside this track.
- **NFR-3 (clean tree).** Every check runs on the PR head in the scratch worktree
  with a clean status; the main worktree stays clean until the merge.

## Acceptance Criteria (track level)

- Given PR #9, Then its diff touches only the described files and contains no
  `node_modules` or build artifacts.
- Given the PR head worktree, Then the PR's listed checks and `bash tests/dsh/run.sh`
  pass, and the recorded outputs match the PR description.
- Given a CLEAN mergeable state, Then PR #9 is merged, `origin/main` contains the PR
  commits, and a local `git pull --ff-only` leaves a clean tree.
- Given the archive, Then the closeout check reports only the missing closeout
  manifest.

## Out of Scope

- Re-running the PR's authoring work or editing the PR branch.
- Installing the extension or the role files into a running profile.
- The paused DSH goal (this track is not a goal-bound track).
