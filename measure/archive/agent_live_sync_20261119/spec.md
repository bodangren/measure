# Specification: Agent live sync

## Overview

The installed copies `~/.config/opencode/agents/measure-*.md` hold PM-accepted hand edits. The repo source `agents/measure-*.md` still holds the old values. The installer copies the source with no transform. The source must match the live files.

Live-vs-stamp diff (stamp `80ee12d`, main `f5d1e94`) shows two accepted edit kinds across 11 files:

- Step limits raised to 120 in 10 files (adversarial, closeout, final-acceptance, jr-green, mid-red, phase-acceptance, reviews A/B/C, ux-browser-review).
- Route rules in `measure-spec-review.md`: two new edit-allow rules for `measure/tracks/*/spec-review.md` and `**/measure/tracks/*/spec-review.md`.

Source: PM hand edits, folded twice before (orchestrator route rules, step limits).

## Decided change

Item 1: set the `steps:` field of each of the 10 source files to the live value 120. Keep every other line, including the PR #32 exact result block sentence.

Item 2: copy the two live edit-allow rules into `agents/measure-spec-review.md`, in the live order, after the `**/measure/runs/**` rule. Keep `steps: 64` and the PR #32 block sentence.

Item 3: update `tests/spec_review_gate/test_s2_role_docs.sh` only where the accepted edit requires it (the edit-rules expectation grows from three to five). Change no other test.

No live edit touches the same lines as the PR #32 change. No accidental deletion was found.

## Tests

Run `tests/spec_review_gate/test_s2_role_docs.sh`, `test_s3_dispositions_docs.sh`, `test_result_block_form.py`, and any other suite that reads `agents/*.md`. Then run the full `tests/spec_review_gate/run.sh` through the heavy-run wrapper. Report `bin/install-measure-skill --ref chore/agent-live-sync-2 --check`.
