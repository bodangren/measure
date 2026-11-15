# Specification: Result line

## Overview

The installer keeps 13 files in `~/.config/opencode/agents/` as local-edit, so
they miss PR #16 and PR #18. Cause: PM tooling C116 added one line to each of
these installed role files, and the source does not have it. The line tells the
role to end its final message with a verdict. The advantage-pr script
`scripts/jobs/outcomes_close.py` reads that line and records PASS or FAIL for
each role run. 0 of 135 runs had a verdict line.

Source: PM order, 2026-11-15, light lane. Date needed: today.

## The order (PM, 2026-11-15)

Put the same line into the source agent files, word for word. The line,
exactly:

```
The last line of your final message is `RESULT: PASS` or `RESULT: FAIL` (FAIL when the work or the gate did not pass).
```

The 13 files (all in `agents/`):

- `agents/measure-adversarial-testing.md`
- `agents/measure-closeout.md`
- `agents/measure-final-acceptance.md`
- `agents/measure-jr-green.md`
- `agents/measure-mid-red.md`
- `agents/measure-orchestrator-audit.md`
- `agents/measure-phase-acceptance.md`
- `agents/measure-review-a-correctness.md`
- `agents/measure-review-b-security.md`
- `agents/measure-review-c-ux-api.md`
- `agents/measure-spec-review.md`
- `agents/measure-strategy.md`
- `agents/measure-ux-browser-review.md`

`agents/measure-orchestrator.md` does not get the line.

## Decided design (recorded here; do not choose another design)

- Placement: the same place as in the installed copy. Add a new paragraph with
  one empty line before it, directly after the paragraph that tells the role to
  end with the `MEASURE_AGENT_RESULT` block. The anchor line of each file (the
  line before the added line) was read from the installed copies of
  2026-11-15 and is listed below. In the source, insert the line after the
  same anchor paragraph.
- Proof of placement: after the change, for each of the 13 files,
  `diff agents/<file> ~/.config/opencode/agents/<file>` shows only the lines
  that PR #16 and PR #18 changed (the heavy-run paragraph and the prompt-audit
  trims), and no difference for the RESULT line. Keep these diffs as evidence.
- No frontmatter change. No other text change.

### Anchor lines (read from the installed copies)

| File | Anchor paragraph (verbatim; the added line follows it after one empty line) |
|------|-----------------------------------------------------------------------------|
| `agents/measure-adversarial-testing.md` | `Own durable Playwright coverage when browser automation is needed. Add valuable tests, but do not fix production behavior exposed by those tests. Commit useful tests, return `status: "fail"`, and route implementation defects to Green. Any subsequent implementation commit invalidates this result and requires the relevant adversarial gate to rerun. Write provenance-bound audit JSON and end with `MEASURE_AGENT_RESULT`.` |
| `agents/measure-closeout.md` | `Commit closeout. Write the required audit result JSON and end with `MEASURE_AGENT_RESULT`.` — the added line is the last line of the file. |
| `agents/measure-final-acceptance.md` | `This is a gate-only role. Do not edit implementation, tests, plans, registry, metadata, or archive state and do not commit. Write only the supplied result artifact. Do not archive the track or update closeout metadata. End with `MEASURE_AGENT_RESULT`.` |
| `agents/measure-jr-green.md` | The handoff paragraph that starts `After the targeted Red command exits 0 ...`; its last line is `- the immutable `phase_base_sha` and final Green HEAD`. |
| `agents/measure-mid-red.md` | `End with the required `MEASURE_AGENT_RESULT` block. Set its `baseline_sha` field to the supplied `phase_base_sha`, and identify this role, track, phase, resulting HEAD, commits, tests, files, and exact remaining failures.` |
| `agents/measure-orchestrator-audit.md` | `End with the required `MEASURE_AGENT_RESULT` block.` |
| `agents/measure-phase-acceptance.md` | `This is a gate-only role. Do not edit implementation, tests, plans, or registry files and do not commit. Write only the supplied result artifact. Any blocker fails acceptance and routes to the owning role; acceptance must be rerun against the resulting new HEAD. End with the required `MEASURE_AGENT_RESULT` block.` |
| `agents/measure-review-a-correctness.md` | `Write provenance-bound audit JSON at the supplied result path and end with the required `MEASURE_AGENT_RESULT` block.` |
| `agents/measure-review-b-security.md` | `Write the required audit result JSON at the orchestrator-supplied result path. End with the required `MEASURE_AGENT_RESULT` block.` |
| `agents/measure-review-c-ux-api.md` | `This is an audit-only role. Do not edit implementation, tests, plans, or registry files and do not commit. Write only the supplied result artifact, route blockers to Green, and end with the required `MEASURE_AGENT_RESULT` block.` |
| `agents/measure-spec-review.md` | `This is a report-only role. Edit no file outside your two artifacts. Make no commit. End with the `MEASURE_AGENT_RESULT` block, with `role: spec-review` and `phase: track setup`.` |
| `agents/measure-strategy.md` | `Refresh and commit the strategy for the current revision. A pre-existing file without a committed change does not satisfy this role. End with the required `MEASURE_AGENT_RESULT` block.` |
| `agents/measure-ux-browser-review.md` | `Write the required UX audit result JSON and end with `MEASURE_AGENT_RESULT`.` |

## Test

One new section in `tests/spec_review_gate/test_s2_role_docs.sh`, before the
`# Edge checks` block. The section checks, for each of the 13 files, that the
exact RESULT line occurs exactly once, and that the next line after it is
empty or the end of the file. The section also checks that
`agents/measure-orchestrator.md` does not hold the line. Red: the section
fails before the change.

## Functional Requirements

- **FR-1 (the S2 section and the 13 lines).** Add the S2 section of the Test
  paragraph above (Red) and add the RESULT line to the 13 files after the
  anchor paragraph of each (Green), in one commit on `chore/result-line` with
  the message `chore(agents): Add the RESULT verdict line to the thirteen
  role files`. Keep the placement diffs of the Decided design as evidence.
  No frontmatter change, no other text change.
- **FR-2 (the records).** `CHANGELOG.md` gets one entry at the top of
  "## Unreleased" under the existing "### Chores" heading:
  `* **result line:** the thirteen Measure role files in agents/ (all except measure-orchestrator.md) now carry the verdict line "The last line of your final message is RESULT: PASS or RESULT: FAIL (FAIL when the work or the gate did not pass).", placed as in the installed copies, and a new S2 role-doc section pins it. Cause: PM tooling C116 added the line to the installed copies only, so the installer held them as local-edit and they missed PR #16 and PR #18; scripts/jobs/outcomes_close.py in advantage-pr reads the line to record PASS or FAIL for each role run, and 0 of 135 runs had a verdict line. Track `result_line_20261115`.`
  `README.md` line 33 starts with "As of 2026-11-15, the latest archived track
  is Result line (the thirteen Measure role files gain the RESULT verdict
  line, and an S2 role-doc section pins it)." followed by the rest of the
  current line 33 unchanged. Both record changes ride in the Task 1.2 archive
  commit, as in the Prompt audit track.
- **FR-3 (the closeout).** Archive the track to
  `measure/archive/result_line_20261115/`, move the registry entry to
  Archived Tracks with `[x]`, and record the results.

## Acceptance Criteria

- The exact RESULT line occurs exactly once in each of the 13 files, the next
  line after it is empty or the end of the file, and
  `agents/measure-orchestrator.md` does not hold it (pinned by the new S2
  section).
- For each of the 13 files, `diff agents/<file> ~/.config/opencode/agents/<file>`
  shows only the lines that PR #16 and PR #18 changed, and no difference for
  the RESULT line.
- `bash tests/spec_review_gate/test_s2_role_docs.sh` exits 0 (run directly).
- Through the heavy-job wrapper with no shell redirection
  (`HEAVY_PRIORITY=p2 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh bash tests/spec_review_gate/run.sh`
  and
  `HEAVY_PRIORITY=p2 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh bash tests/dsh/test-registry.sh`)
  exit 0.
- `CHANGELOG.md` gets one entry under the existing "### Chores" heading and
  `README.md` line 33 names this track as the latest archived track (2026-11-15).
  Both changes ride in the Task 1.2 archive commit.
- The closeout check
  (`python3 skills/measure-orchestrator/scripts/measure_interphase_checks.py closeout --repo . --track result_line_20261115`)
  fails only on the missing closeout manifest.

## Out of Scope

- The installed copies in `~/.config/opencode/agents/`: the PM restores them
  after the merge, and the installer then writes the new version.
- `agents/measure-orchestrator.md` and every file outside the 13 listed files.
- Frontmatter permission rules of the agent files and any other text.
- A merge into `main`. Only Daniel merges.
