# Specification: Final acceptance head scope

## Overview

Line 115 of `agents/measure-final-acceptance.md` holds two HEAD rules today:
"confirm the audited HEAD is current" and "at least the latest result targets
current HEAD so no later changes remain unaccepted". Other tracks commit on the
shared branch all the time. Every final acceptance then fails, because the
audited HEAD is not current (Monorepo Storytime look F865, 2026-11-13). The PM
ruling of 2026-11-13: a later commit counts as covered when the diff from the
audited HEAD to current HEAD changes no path of the track under review, or only
its plan and evidence files. The role records the path-diff command and its
output.

The checker does not enforce the two rules. `passing_audit_feedback` in
`skills/measure-orchestrator/scripts/measure_interphase_checks.py` reads no
HEAD, so the role text is the only place of the rule. The installed copy
`~/.config/opencode/agents/measure-final-acceptance.md` equals the repository
file today, so the hourly installer updates it after the merge.

Source: PM request, 2026-11-13.

## Functional Requirements

- **FR-1 (line 115).** Line 115 of `agents/measure-final-acceptance.md`
  becomes exactly this text (one line):

  ```
  Require `track_base_sha`, `role_base_sha`, and `audited_head_sha`, and require exactly one passing phase-acceptance result for every phase in the plan. Verify that each result's baseline is an ancestor of its audited HEAD and that every audited HEAD is an ancestor of current HEAD. Your audited HEAD and the audited HEAD of the latest result must each equal current HEAD, or each later commit must be covered. A later commit is covered when `git diff --name-only <audited HEAD> HEAD` lists no path of the track under review, or lists only its plan and evidence files. The paths of the track are the paths that the commits of the track changed in `<track_base_sha>..<audited HEAD>` (sort the commits with the Track scope rule in `references/contracts.md` of the measure-orchestrator skill), and each path under `measure/tracks/<track>/` and `measure/runs/<track>/`. The plan and evidence files are `measure/tracks/<track>/plan.md`, each file in `measure/tracks/<track>/` whose name contains `evidence`, and each file under `measure/runs/<track>/`. Put each path-diff command and its output in the `evidence` list of the result JSON. When a later commit is not covered, do not pass final acceptance. Read all Measure routing artifacts, spec, plan, strategy, anti-patterns, memory, debt, exact track diff, and prior results.
  ```

  No other line of the file changes.

- **FR-2 (the new S2 section).** `tests/spec_review_gate/test_s2_role_docs.sh`
  gets one new section that checks `agents/measure-final-acceptance.md`:

  - the text `so no later changes remain unaccepted` is absent;
  - the text `` `git diff --name-only <audited HEAD> HEAD` `` is present;
  - the text `plan and evidence files` is present;
  - the text `` in the `evidence` list of the result JSON `` is present.

  The section must fail on today's file and pass on the new file. No other line
  of the test file changes.

- **FR-3 (the doc tests).** These doc tests pass:
  `tests/spec_review_gate/test_s2_role_docs.sh`,
  `tests/spec_review_gate/test_s3_dispositions_docs.sh`,
  `tests/spec_review_gate/test_s4_doc_drift.sh`, `tests/dsh/test-docs.sh`,
  `tests/dsh/test-reference.sh`. Each test writes its output to
  `measure/runs/final_acceptance_head_scope_20261113/doc-tests.log`, and that
  log holds the counts.

- **FR-4 (the records).** `README.md` line 33 names this track as the latest
  archived track (first sentence only). `CHANGELOG.md` gets a new first bullet
  under Unreleased, Bug Fixes, for this track, with no test count.

- **FR-5 (the light lane).** `metadata.json` declares `"lane": "light"`,
  because this track runs no final acceptance. The closeout check then fails
  only on the missing closeout manifest.

- **FR-6 (the PR).** Done when the branch `fix/final-acceptance-head-scope` is
  pushed to origin and a PR to main is open. After the merge, the hourly
  installer puts the new line 115 into
  `~/.config/opencode/agents/measure-final-acceptance.md`; the orchestrator
  checks that after the merge.

## Out of scope

The checker (no code change); `contracts.md`; the phase-acceptance role; any
permission entry; a merge into main; the full suite
`tests/spec_review_gate/run.sh`; the installed files (never edit them).
