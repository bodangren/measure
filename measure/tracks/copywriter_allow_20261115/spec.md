# Specification: Copywriter allow

## Overview

The PR orchestrator session could not spawn the global `copywriter` agent
(Daniel's order of 2026-11-15), because `agents/measure-orchestrator.md`
denied it. The PM added one allow rule to the installed file
`~/.config/opencode/agents/measure-orchestrator.md`, directly after the
`coder` rule. The installer now keeps that file as local-edit:
`bin/install-measure-skill --check` prints
"local-edit ~/.config/opencode/agents/measure-orchestrator.md". The source
must carry the same rule, so the installer installs from main again and the
orchestrator can spawn the copywriter.

Source: PM order, 2026-11-15, light lane. Date needed: today.

## The order (PM, 2026-11-15)

Put the same three lines into the source `agents/measure-orchestrator.md`, at
the same place, in one PR.

## Decided change (recorded here; do not choose another design)

- Placement: in `agents/measure-orchestrator.md`, directly after the three
  lines of the `coder` subagent rule (lines 114 to 116 on 2026-11-15) and
  before the `change-quality-reviewer` rule, insert exactly:

  ```
    - action: subagent
      resource: "copywriter"
      effect: allow
  ```

  (two spaces before "- action", four spaces before "resource" and "effect",
  the same as the other rules).
- Proof of placement: after the change,
  `diff agents/measure-orchestrator.md ~/.config/opencode/agents/measure-orchestrator.md`
  exits 0. Keep the output as text evidence in
  `measure/runs/copywriter_allow_20261115/placement-diff.log`. The installed
  copy sits outside the repository and changes when the PM restores it.
- No other change to any file outside `measure/` except the test,
  `CHANGELOG.md`, and `README.md` line 33.

## Test

One new section in `tests/spec_review_gate/test_s2_role_docs.sh`, directly
before the `# Edge checks` separator block. The section reads the frontmatter
rules of `agents/measure-orchestrator.md` with the existing `rules()` helper
and checks that the subagent rules, in order, are `"*"|deny`,
`"measure-*"|allow`, `"coder"|allow`, `"copywriter"|allow`,
`"change-quality-reviewer"|allow`. Red: the section fails before the change.
Task 1.1 runs the S2 test before the edit and keeps the failing output in
`measure/runs/copywriter_allow_20261115/red-s2.log`.

## Functional Requirements

- **FR-1 (the S2 section and the three lines).** Add the S2 section of the
  Test paragraph above (Red) and add the three lines of the Decided change to
  `agents/measure-orchestrator.md` (Green), in one commit on
  `chore/copywriter-allow` with the message
  `chore(agents): Allow the copywriter subagent in the orchestrator`. Keep the
  failing S2 output of the Red step in
  `measure/runs/copywriter_allow_20261115/red-s2.log`, the passing S2 output
  in `measure/runs/copywriter_allow_20261115/green-s2.log`, the placement diff
  output in `measure/runs/copywriter_allow_20261115/placement-diff.log`, the
  `spec_review_gate` heavy-run output in
  `measure/runs/copywriter_allow_20261115/run-suites.log`, and the registry
  heavy-run output in
  `measure/runs/copywriter_allow_20261115/test-registry.log`. The runs folder
  is gitignored, as in the Result line track. No other frontmatter change, no
  other text change.
- **FR-2 (the records).** `CHANGELOG.md` gets one entry at the top of
  "## Unreleased" under the existing "### Chores" heading:
  `* **copywriter allow:** agents/measure-orchestrator.md now allows the global copywriter subagent: a subagent "copywriter" allow rule sits directly after the "coder" rule and before the "change-quality-reviewer" rule, and a new S2 role-doc section pins the subagent rule order. Cause: the PR orchestrator session could not spawn the global copywriter agent (Daniel's order of 2026-11-15), the PM added the rule to the installed copy only, and the installer then held the installed file as local-edit, so it missed earlier PRs. Track `copywriter_allow_20261115`.`
  `README.md` line 33: replace its first sentence, up to and including its
  closing bracket and full stop, with "As of 2026-11-15, the latest archived
  track is Copywriter allow (the orchestrator may spawn the global copywriter
  agent, so the installed copy matches the source again)." The rest of line 33
  stays unchanged. Both record changes ride in the Task 1.2 archive commit, as
  in the Result line track.
- **FR-3 (the closeout).** Archive the track to
  `measure/archive/copywriter_allow_20261115/`, move the registry entry to
  Archived Tracks with `[x]`, and record the results.

## Acceptance Criteria

- The subagent rules of `agents/measure-orchestrator.md`, in order, are
  `"*"|deny`, `"measure-*"|allow`, `"coder"|allow`, `"copywriter"|allow`,
  `"change-quality-reviewer"|allow` (pinned by the new S2 section).
- `diff agents/measure-orchestrator.md ~/.config/opencode/agents/measure-orchestrator.md`
  exits 0.
- `bash tests/spec_review_gate/test_s2_role_docs.sh` exits 0 (run directly).
- Through the heavy-job wrapper with no shell redirection
  (`HEAVY_PRIORITY=p2 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh bash tests/spec_review_gate/run.sh`
  and
  `HEAVY_PRIORITY=p2 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh bash tests/dsh/test-registry.sh`)
  exit 0.
- `CHANGELOG.md` gets one entry under the existing "### Chores" heading and
  `README.md` line 33 names this track as the latest archived track
  (2026-11-15). Both changes ride in the Task 1.2 archive commit.
- The closeout check
  (`python3 skills/measure-orchestrator/scripts/measure_interphase_checks.py closeout --repo . --track copywriter_allow_20261115`)
  fails only on the missing closeout manifest.

## Out of Scope

- The installed copy in `~/.config/opencode/agents/measure-orchestrator.md`:
  the PM restores it after the merge, and the installer then writes the new
  version.
- The copywriter agent itself.
- Every other file and every other frontmatter rule of the orchestrator role.
- A merge into `main`. Only Daniel merges.
