# Specification: Installed role-file edits

## Overview

9 Measure role files in `/home/daniebo/.config/opencode/agents/` have local edits
that `agents/` does not have. `bin/install-measure-skill --ref HEAD --check`
reports the 9 files as local-edit and exits 1. The installed roles already use the
edits. This track copies the 9 files into `agents/` with no change.

Source: PM decision, 2026-11-11.
PR: https://github.com/bodangren/measure/pull/9

## Functional Requirements

- **FR-1 (the 9 files, byte for byte).** Copy these files byte for byte from
  `/home/daniebo/.config/opencode/agents/` into `agents/`:
  measure-adversarial-testing.md, measure-closeout.md,
  measure-final-acceptance.md, measure-orchestrator.md,
  measure-phase-acceptance.md, measure-review-a-correctness.md,
  measure-review-b-security.md, measure-review-c-ux-api.md,
  measure-ux-browser-review.md.
- **FR-2 (no other file).** Copy no other file. The `*.bak-*` files,
  `.measure-install`, and the agents that are not Measure roles (coder*, inbox,
  model-notes, pm-orchestrator*) stay out of the repository.
- **FR-3 (three change kinds only).** The diff in `agents/` holds only these
  kinds of change: (a) the frontmatter steps value rises in 6 files: 40 to 56 in
  measure-closeout.md, measure-review-a-correctness.md,
  measure-review-b-security.md, and measure-review-c-ux-api.md; 48 to 64 in
  measure-adversarial-testing.md; 48 to 72 in measure-ux-browser-review.md. The
  other 3 files keep their steps value. (b) a new section
  "## Rating rubric v1 (optional result keys)" at the end of 6 audit role files:
  measure-adversarial-testing.md, measure-final-acceptance.md,
  measure-phase-acceptance.md, measure-review-a-correctness.md,
  measure-review-b-security.md, and measure-review-c-ux-api.md. In
  measure-final-acceptance.md and measure-phase-acceptance.md, the section also
  has a "reviewer_ratings" paragraph. (c) in measure-orchestrator.md, one new
  Delegation Rules bullet that starts with
  "Put one line in every role brief: `Route: <provider/model#variant>`".
- **FR-4 (numstat table).** `git diff --numstat agents/` equals this table
  (added/deleted): adversarial-testing 15/1, closeout 1/1, final-acceptance 16/0,
  orchestrator 1/0, phase-acceptance 16/0, review-a-correctness 15/1,
  review-b-security 15/1, review-c-ux-api 15/1, ux-browser-review 1/1.
  A different result stops the task.
- **FR-5 (doc tests).** These 5 doc tests pass:
  `tests/spec_review_gate/test_s2_role_docs.sh`,
  `tests/spec_review_gate/test_s3_dispositions_docs.sh`,
  `tests/spec_review_gate/test_s4_doc_drift.sh`,
  `tests/dsh/test-docs.sh`,
  `tests/dsh/test-reference.sh`.
- **FR-6 (install check after the commit).** After the commit,
  `bin/install-measure-skill --ref HEAD --check` shows no local-edit row. It
  shows 9 "different" rows for `~/.agents/agents/measure-*.md`, because that
  second target gets the edits from main after the merge. It writes nothing.
- **FR-7 (branch and PR).** Done when the commits are on local-changes-20261111
  and pushed to origin/local-changes-20261111, and PR #9 shows them.
  origin/main stays a0aa585.

## Out of Scope

- A merge into main.
- An install step.
- A change to the installed files.
- A change to the content of the edits.
- `agents/measure-spec-review.md` and the other role files with no installed
  edit (test_s2_role_docs.sh expects "steps: 40" in the spec-review role file).
- The full suite `tests/spec_review_gate/run.sh`.
