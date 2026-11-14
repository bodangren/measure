# Specification: Heavy-run prompt line

## Overview

Monorepo reported that `measure-review-b-security` and `measure-phase-acceptance`
got `permission.rejected` when they ran tests through
`/home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh`. Review B round 2
then ran `heavy-run.sh` with no shell redirection, and it worked. The refusals
came from shell redirection (for example `> file` or `2>&1 | tee`). The audit
roles deny `* > *`, `* >*`, `*>>*`, and `*tee *` on purpose, because these
patterns write files. The S2 section "audit roles narrow the redirect deny so
2>&1 is not blocked" in `tests/spec_review_gate/test_s2_role_docs.sh` pins the
narrowed denies.

PM decision (2026-11-15): no permission change. Each of the five audit roles
gets one prompt line. The line tells the role to run tests with no shell
redirection and to read the test output in the tool result.

Source: PM request, 2026-11-15.

## Functional Requirements

- **FR-1 (the five role files).** In `agents/measure-review-a-correctness.md`,
  `agents/measure-review-b-security.md`, `agents/measure-review-c-ux-api.md`,
  `agents/measure-phase-acceptance.md`, and `agents/measure-final-acceptance.md`,
  insert one new paragraph directly after the paragraph that starts with "Do not
  use the question tool." (line 115 in each file), with one empty line before
  and after it. The frontmatter of each file stays unchanged. No other role
  file changes.

- **FR-2 (the paragraph text).** The new paragraph holds this text, exactly:

  ```text
  Run tests with no shell redirection (`>`, `>>`, or `tee`), also through a wrapper such as `heavy-run.sh`. The shell rules of this role deny redirection. Read the test output in the tool result.
  ```

- **FR-3 (the S2 role-doc section).** `tests/spec_review_gate/test_s2_role_docs.sh`
  gets one new section before the "# Edge checks" block. For each file of FR-1,
  the section asserts that the paragraph of FR-2 occurs exactly once, and that
  the paragraph is the first non-empty line after the "Do not use the question
  tool." paragraph. The section also asserts that `agents/measure-spec-review.md`,
  `agents/measure-orchestrator-audit.md`, and `agents/measure-ux-browser-review.md`
  do not hold the paragraph. The new checks fail before FR-1 lands (Red). The
  existing S2 checks keep their result, so the redirect denies stay.

- **FR-4 (the records).** `CHANGELOG.md` gets one entry at the top of
  "## Unreleased" / "### Bug Fixes". `README.md` line 33 names this track as
  the latest archived track (2026-11-15).

## Acceptance Criteria

- Red evidence: the failing `bash tests/spec_review_gate/test_s2_role_docs.sh`
  output, taken before FR-1 lands, is kept in
  `measure/runs/heavy_run_prompt_20261115/`.
- The new S2 checks pass after FR-1, and the existing S2 checks still pass.
- `bash tests/spec_review_gate/test_s2_role_docs.sh` exits 0.
- `bash tests/spec_review_gate/run.sh` exits 0.
- The frontmatter of the five role files is unchanged: the FR-1 diff touches no
  frontmatter line.
- `bash tests/dsh/test-registry.sh` exits 0 (it is slow; use a long timeout).
- The closeout check
  (`python3 skills/measure-orchestrator/scripts/measure_interphase_checks.py
  closeout --repo . --track heavy_run_prompt_20261115`) fails only on the
  missing closeout manifest.
- `CHANGELOG.md` gets one entry at the top of "## Unreleased" / "### Bug Fixes".
- `README.md` line 33 names this track as the latest archived track
  (2026-11-15).

## Out of scope

- Any permission change. The shell deny rules (`* > *`, `* >*`, `*>>*`,
  `*tee *`) of the audit roles stay.
- `heavy-run.sh` and the advantage-pr scripts. The job script lives outside
  this repository.
- The installed role copies outside this repository. The hourly installer job
  updates them from `main` after the merge.
- The other role files. Only the five files of FR-1 change.
- A merge into `main`. Only Daniel merges the pull request. The pull request
  stacks on PR #15.
