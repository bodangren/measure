# Specification: Prompt audit

## Overview

The bundled Claude Code command `/doctor prompt-audit` cannot run inside an
agent session. This track does the same audit by hand, with the PM's rules.

The Measure prompts (the repository `AGENTS.md`, the `skills/measure/` skill
bundle and its `claude-skills/measure/` copy, the `skills/measure-orchestrator/`
skill, the `agents/measure-*.md` role files, and the
`plugins/opencode-measure-guard/commands/` command files) still carry
old-model wording: shouting (`CRITICAL`, `IMPORTANT`, `MUST`, `NEVER`,
`ALWAYS`, `DO NOT`, `WARNING` in capitals in instruction prose),
`**PROTOCOL:**` labels, `DO NOT JUMP YET`, repeated warnings, and rules that a
tool or a gate already enforces. This track trims that wording, keeps every
owner rule, and pins nothing new.

Source: PM request, 2026-11-15 (Daniel, Tasks 12:08: "Please tell all repo
sessions to use `/doctor prompt audit` in order to trim AGENTS.md and
skills"). Date needed: 2026-11-16.

## Rules (PM, 2026-11-15)

1. Keep every Daniel quote, every owner rule, and every human gate (a user
   confirmation, an approval, a deletion warning, a "Daniel merges" rule).
   Keep every quoted user-facing message exactly (for example "WARNING: This
   will permanently delete ..."): it is output text, not shouting.
2. Remove stale, repeated, and old-model wording: shouting (`CRITICAL`,
   `IMPORTANT`, `MUST`, `NEVER`, `ALWAYS`, `DO NOT`, `WARNING` in capitals in
   instruction prose; `**PROTOCOL:**` labels; `DO NOT JUMP YET`), repeated
   warnings, and rules that a tool or a gate already enforces (name the tool
   or the gate in the table).
3. A rewritten sentence follows ASD-STE100 (global AGENTS.md section 2). A
   rewrite does not change the meaning of a rule.
4. Keep every string that a test pins. Before a cut, search `tests/` for the
   exact text (`grep -rF`). A pinned string stays.
5. Do not change frontmatter permission rules of the agent files.

## Scope

In scope (only these files):

- `AGENTS.md` (repository root)
- `skills/measure/SKILL.md`, `skills/measure/references/*.md`,
  `skills/measure/assets/workflow.md`
- `skills/measure-orchestrator/SKILL.md` and
  `skills/measure-orchestrator/references/*.md`
- `agents/measure-*.md`
- `plugins/opencode-measure-guard/commands/*.md`

`claude-skills/measure/` must stay byte-equal to `skills/measure/` (the S1
bundle-equality check), so each change in `skills/measure/` goes to
`claude-skills/measure/` too.

Out of scope: `skills/build-graph`, the code style guides in
`skills/measure/assets/code_styleguides/`, `docs/`, `README.md`,
`CHANGELOG.md` content other than the one track entry, and all files outside
this repository.

## Audit method

The audit of 2026-11-15 ran read-only in the Part 1 session. It searched the
scope files for the shouting words, for `**PROTOCOL:` labels, for
`DO NOT JUMP YET`, and for capitalized emphasis words. It read every in-scope
file. Before each proposed cut it searched `tests/` for the exact old text
with `grep -rF`; no proposed cut text is pinned. The audit also read the S1,
S2, and S4 contract tests and the DSH reference test to collect the strings
those tests pin, so the table keeps them (see "Pinned strings that stay").

## Audit table

One row per proposed cut. Every cut is a same-line rewrite except the one
marked "removed". Line numbers are the lines of 2026-11-15 in this worktree.

### AGENTS.md

| # | File | Line | Old text (short) | New text | Reason |
|---|------|------|------------------|----------|--------|
| 1 | AGENTS.md | 7 | `**PROTOCOL: How to locate files.**` | removed | `**PROTOCOL:**` label; the section heading already names the protocol |
| 2 | AGENTS.md | 27 | `You MUST verify the resolved file actually exists on the disk.` | `Verify that the resolved file exists on disk.` | Shouting: `MUST` |

### skills/measure/references

| # | File | Line | Old text (short) | New text | Reason |
|---|------|------|------------------|----------|--------|
| 3 | references/doctor.md | 11 | `**PROTOCOL: Verify that the Measure environment and Doctor script exist.**` | `Verify that the Measure environment and Doctor script exist.` | `**PROTOCOL:**` label |
| 4 | references/status.md | 21 | `**PROTOCOL: Verify that the Measure environment is properly set up.**` | `Verify that the Measure environment is properly set up.` | `**PROTOCOL:**` label |
| 5 | references/status.md | 46 | `skip silently and continue — do NOT HALT.` | `skip it and continue.` | Shouting: `NOT` |
| 6 | references/status.md | 150 | `**PROTOCOL: Compute velocity and estimation accuracy from completed feature tracks.**` | `Compute velocity and estimation accuracy from completed feature tracks.` | `**PROTOCOL:**` label |
| 7 | references/review.md | 39 | `**PROTOCOL: Verify that the Measure environment is properly set up.**` | `Verify that the Measure environment is properly set up.` | `**PROTOCOL:**` label |
| 8 | references/review.md | 52 | `... AND check that ... If both pass AND ... does NOT block ...` | lowercase `and` / `does not block` (same sentence) | Shouting: `AND`, `NOT` |
| 9 | references/review.md | 59 | `**PROTOCOL: Follow this sequence to perform a code review.**` | `Follow this sequence to perform a code review.` | `**PROTOCOL:**` label |
| 10 | references/review.md | 75 | `**CRITICAL:** Check for measure/code_styleguides/. Read ALL .md files within it.` | `Check for measure/code_styleguides/. Read every .md file within it. Violations here are High severity.` | Shouting: `CRITICAL`, `ALL` |
| 11 | references/review.md | 220 | `**PROTOCOL: Ensure all review-related changes are committed and tracked in the plan.**` | `Ensure all review-related changes are committed and tracked in the plan.` | `**PROTOCOL:**` label |
| 12 | references/review.md | 243 | `**PROTOCOL: Offer to archive or delete the reviewed track.**` | `Offer to archive or delete the reviewed track.` | `**PROTOCOL:**` label |
| 13 | references/new-track.md | 23 | `**PROTOCOL: Verify that the Measure environment is properly set up.**` | `Verify that the Measure environment is properly set up.` | `**PROTOCOL:**` label |
| 14 | references/new-track.md | 59 | `**Availability + freshness gate** (must pass BOTH):` | `**Availability + freshness gate** (both must pass):` | Shouting: `BOTH` |
| 15 | references/new-track.md | 73 | `- Do NOT HALT.` | `- Do not halt.` | Shouting: `NOT` |
| 16 | references/new-track.md | 85 | `**CRITICAL:** Wait for the user's response after each prompt.` | `Wait for the user's response after each prompt.` | Shouting: `CRITICAL` |
| 17 | references/new-track.md | 93 | `At least one batch in this Questioning Phase MUST cite a specific finding ...` | `At least one batch in this Questioning Phase cites a specific finding ...` | Shouting: `MUST` |
| 18 | references/new-track.md | 105 | `Do NOT ask generic questions if the answer is already in the files.` | `Do not ask generic questions when the answer is already in the files.` | Shouting: `NOT` |
| 19 | references/new-track.md | 137 | `... MUST treat the absence of a ## Stories section as classic mode ...` | `... treats the absence of a ## Stories section as classic mode ...` | Shouting: `MUST` |
| 20 | references/new-track.md | 161 | `(build-graph available AND graph.db fresh AND project is TS)` | lowercase `and` (same sentence) | Shouting: `AND` |
| 21 | references/new-track.md | 167 | `... every story-phase that touches one of these symbols MUST include a _Blast radius:_ line ...` | `... includes a _Blast radius:_ line ...` | Shouting: `MUST` |
| 22 | references/new-track.md | 195 | `The plan MUST include the following phases in order:` | `The plan includes the following phases in order:` | Shouting: `MUST` |
| 23 | references/new-track.md | 239 | `This step MUST only be executed if you installed new skills ...` | `Run this step only when you installed new skills in the previous section.` | Shouting: `MUST` |
| 24 | references/new-track.md | 240 | `Do NOT ask a question here — make a statement and wait.` | `Do not ask a question here — make a statement and wait.` | Shouting: `NOT` |
| 25 | references/new-track-set.md | 31 | `**PROTOCOL: Verify that the Measure environment is properly set up.**` | `Verify that the Measure environment is properly set up.` | `**PROTOCOL:**` label |
| 26 | references/new-track-set.md | 52 | `Do NOT ask a question that these files answer.` | `Do not ask a question that these files answer.` | Shouting: `NOT` |
| 27 | references/new-track-set.md | 56 | `**CRITICAL:** Wait for the user's response after each batch.` | `Wait for the user's response after each batch.` | Shouting: `CRITICAL` |
| 28 | references/new-track-set.md | 159 | `**CRITICAL:** If a member needs a structural change ... do not draft it silently.` | `If a member needs a structural change (a phase, a requirement, or a section that its sample does not have), do not draft it silently. ...` | Shouting: `CRITICAL` |
| 29 | references/new-track-set.md | 238 | `Do NOT commit until each check in this list passes ...` | `Do not commit until each check in this list passes ...` | Shouting: `NOT` |
| 30 | references/new-track-set.md | 252 | `**PROTOCOL: How other workflows treat set data.**` | `How other workflows treat set data.` | `**PROTOCOL:**` label |
| 31 | references/setup.md | 53 | `**PROTOCOL: Before starting setup, determine the project's state by auditing existing artifacts.**` | `Before starting setup, determine the project's state by auditing existing artifacts.` | `**PROTOCOL:**` label |
| 32 | references/setup.md | 67 | `... (highest match wins). **DO NOT JUMP YET.** Keep this target in mind.` | `... (highest match wins). Keep this target in mind.` | Shouting: `DO NOT JUMP YET` (PM-named) |
| 33 | references/setup.md | 81 | `You MUST proceed to Section 2.0 to establish the Greenfield/Brownfield context ...` | `Proceed to Section 2.0 to establish the Greenfield/Brownfield context before jumping to your target.` | Shouting: `MUST` |
| 34 | references/setup.md | 93 | `**Greenfield (New)** if NONE of the above AND directory is empty or contains only README.md` | `**Greenfield (New)** if none of the above and the directory is empty or contains only README.md` | Shouting: `NONE`, `AND` |
| 35 | references/setup.md | 116 | `**CRITICAL:** Do NOT ask for more files. Base analysis SOLELY on discovered file snippets ...` | `Do not ask for more files. Base the analysis only on the discovered file snippets and the directory structure.` | Shouting: `CRITICAL`, `NOT`, `SOLELY` |
| 36 | references/setup.md | 131 | `**CRITICAL:** Do NOT execute any tool calls until the user has provided a response.` | `Do not execute any tool calls until the user provides a response.` | Shouting: `CRITICAL`, `NOT` |
| 37 | references/setup.md | 145 | `Do NOT ask generic questions if the answer is already in the files.` | `Do not ask generic questions when the answer is already in the files.` | Shouting: `NOT` |
| 38 | references/setup.md | 148 | `Draft product.md based ONLY on the user's selected answers` | `Draft product.md based only on the user's selected answers` | Shouting: `ONLY` |
| 39 | references/setup.md | 194 | `Incorporate BOTH the chosen aesthetic AND ... **CRITICAL:** The design must be highly opinionated ...` | `Incorporate both the chosen aesthetic and ... The design is highly opinionated and avoids generic "AI slop" terms ...` | Shouting: `BOTH`, `AND`, `CRITICAL` |
| 40 | references/setup.md | 211 | `**CRITICAL WARNING:** Your goal is to document the project's existing tech stack ...` | `Your goal is to document the project's existing tech stack, not to propose changes.` | Shouting: `CRITICAL WARNING` |
| 41 | references/setup.md | 295 | `This step MUST only be executed if you installed new skills ...` | `Run this step only when you installed new skills in the previous section.` | Shouting: `MUST` |
| 42 | references/setup.md | 296 | `Do NOT ask a question here — make a statement and wait.` | `Do not ask a question here — make a statement and wait.` | Shouting: `NOT` |
| 43 | references/setup.md | 301 | `**CRITICAL:** Placeholder scripts are useless. You MUST configure actual architectural enforcement ...` | `Placeholder scripts are useless. Configure actual architectural enforcement based on project's Tech Stack.` | Shouting: `CRITICAL`, `MUST` |
| 44 | references/setup.md | 441 | `Include the sprint key ONLY when type = "feature" AND ...` | `Include the sprint key only when type = "feature" and ...` | Shouting: `ONLY`, `AND` |
| 45 | references/setup.md | 453 | `**CRITICAL:** The structure of tasks MUST adhere to the principles in measure/workflow.md.` | `The structure of tasks follows the principles in measure/workflow.md.` | Shouting: `CRITICAL`, `MUST` |
| 46 | references/setup.md | 460 | `**CRITICAL: Inject Phase Completion Tasks.** Read measure/workflow.md ...` | `Inject Phase Completion tasks. Read measure/workflow.md ...` | Shouting: `CRITICAL` |
| 47 | references/implement.md | 24 | `**PROTOCOL: Verify that the Measure environment is properly set up.**` | `Verify that the Measure environment is properly set up.` | `**PROTOCOL:**` label |
| 48 | references/implement.md | 37 | `**CRITICAL:** For every relevant skill identified, read its SKILL.md ...` | `For every relevant skill identified, read its SKILL.md and reference files.` | Shouting: `CRITICAL` |
| 49 | references/implement.md | 42 | `**PROTOCOL: Identify and select the track to be implemented.**` | `Identify and select the track to be implemented.` | `**PROTOCOL:**` label |
| 50 | references/implement.md | 49 | `**CRITICAL:** If no track sections are found after parsing, announce ...` | `If no track sections are found after parsing, announce ...` | Shouting: `CRITICAL` |
| 51 | references/implement.md | 74 | `**PROTOCOL: Execute the selected track.**` | `Execute the selected track.` | `**PROTOCOL:**` label |
| 52 | references/implement.md | 89 | `If you fail to read any of these files, you MUST stop and inform the user ...` | `When a read fails, stop and inform the user of the error.` | Shouting: `MUST` |
| 53 | references/implement.md | 117 | `- Do NOT HALT.` | `- Do not halt.` | Shouting: `NOT` |
| 54 | references/implement.md | 124 | `You MUST now loop through each task ...` | `Loop through each task ...` | Shouting: `MUST` |
| 55 | references/implement.md | 125 | `**For Each Task, You MUST:**` | `**For each task:**` | Shouting: `MUST` |
| 56 | references/implement.md | 126 | `You MUST now read and execute the procedures ...` | `Read and execute the procedures ...` | Shouting: `MUST` |
| 57 | references/implement.md | 180 | `**PROTOCOL: Update machine-generated facts and verify architectural integrity ...**` | `Update machine-generated facts and verify architectural integrity based on the completed track.` | `**PROTOCOL:**` label |
| 58 | references/implement.md | 182 | `This protocol MUST only be executed when a track has reached a [x] status ...` | `Run this protocol only when a track has reached a [x] status in the tracks file.` | Shouting: `MUST` |
| 59 | references/implement.md | 199 | `**PROTOCOL: Offer to archive or delete the completed track.**` | `Offer to archive or delete the completed track.` | `**PROTOCOL:**` label |
| 60 | references/revert.md | 29 | `Your workflow MUST anticipate and handle common non-linear Git histories ...` | `The workflow handles common non-linear Git histories, such as rewritten commits (from rebase/squash) and merge commits.` | Shouting: `MUST` |
| 61 | references/revert.md | 35 | `**CRITICAL:** The user's explicit confirmation is required at multiple checkpoints. If denied, halt immediately.` | `Ask the user for explicit confirmation at each checkpoint. Halt when the user denies one.` | Shouting: `CRITICAL` |
| 62 | references/revert.md | 39 | `**PROTOCOL: Verify that the Measure environment is properly set up.**` | `Verify that the Measure environment is properly set up.` | `**PROTOCOL:**` label |

### skills/measure/assets/workflow.md

| # | File | Line | Old text (short) | New text | Reason |
|---|------|------|------------------|----------|--------|
| 63 | assets/workflow.md | 59 | `**CRITICAL:** Run the tests and confirm that they fail as expected. ... Do not proceed until you have failing tests.` | `Run the tests and confirm that they fail as expected. This is the "Red" phase of TDD. Proceed only when the tests fail.` | Shouting: `CRITICAL` |
| 64 | assets/workflow.md | 120 | `**CRITICAL:** First, check its extension. Exclude non-code files ...` | `First, check its extension. Exclude non-code files (e.g., .json, .md, .yaml).` | Shouting: `CRITICAL` |
| 65 | assets/workflow.md | 131 | `**CRITICAL:** To generate the plan, first analyze product.md, product-guidelines.md, and plan.md ...` | `To generate the plan, first analyze product.md, product-guidelines.md, and plan.md ...` | Shouting: `CRITICAL` |

### agents

| # | File | Line | Old text (short) | New text | Reason |
|---|------|------|------------------|----------|--------|
| 66 | agents/measure-mid-red.md | 86 | `- Do NOT fabricate (no fake rows, no invented dates, no made-up outreach).` | `- Do not fabricate (no fake rows, no invented dates, no made-up outreach).` | Shouting: `NOT` |
| 67 | agents/measure-jr-green.md | 75 | `- Do NOT fabricate. No fake session notes ...` | `- Do not fabricate. No fake session notes, no fake outreach rows, no fake consent artifacts.` | Shouting: `NOT` |
| 68 | agents/measure-orchestrator-audit.md | 153 | `If the test/guard does NOT exist, report ...` | `If the test or guard does not exist, report ...` | Shouting: `NOT` |
| 69 | agents/measure-orchestrator-audit.md | 315 | `- Do NOT modify plan task markers ...` | `- Do not modify plan task markers ...` | Shouting: `NOT` |
| 70 | agents/measure-orchestrator-audit.md | 317 | `- Do NOT archive tracks. Report archive readiness ...` | `- Do not archive tracks. Report archive readiness ...` | Shouting: `NOT` |

## Per-file line counts

Every cut is a same-line rewrite, except row 1 (one line removed in
`AGENTS.md`). `claude-skills/measure/` mirrors `skills/measure/` and gets the
same edits, so its counts match the `skills/measure/` counts below.

| File | Lines now | Lines expected |
|------|-----------|----------------|
| AGENTS.md | 42 | 41 |
| skills/measure/SKILL.md | 163 | 163 |
| skills/measure/references/doctor.md | 59 | 59 |
| skills/measure/references/grill-me.md | 70 | 70 |
| skills/measure/references/implement.md | 227 | 227 |
| skills/measure/references/new-track.md | 350 | 350 |
| skills/measure/references/new-track-set.md | 275 | 275 |
| skills/measure/references/revert.md | 213 | 213 |
| skills/measure/references/review.md | 250 | 250 |
| skills/measure/references/setup.md | 472 | 472 |
| skills/measure/references/spec-review.md | 154 | 154 |
| skills/measure/references/status.md | 185 | 185 |
| skills/measure/assets/workflow.md | 375 | 375 |
| skills/measure-orchestrator/SKILL.md | 204 | 204 |
| skills/measure-orchestrator/references/anti-pattern-catalog.md | 266 | 266 |
| skills/measure-orchestrator/references/contracts.md | 166 | 166 |
| skills/measure-orchestrator/references/dsh.md | 238 | 238 |
| agents/measure-adversarial-testing.md | 66 | 66 |
| agents/measure-closeout.md | 61 | 61 |
| agents/measure-final-acceptance.md | 167 | 167 |
| agents/measure-jr-green.md | 113 | 113 |
| agents/measure-mid-red.md | 93 | 93 |
| agents/measure-orchestrator-audit.md | 329 | 329 |
| agents/measure-orchestrator.md | 447 | 447 |
| agents/measure-phase-acceptance.md | 165 | 165 |
| agents/measure-review-a-correctness.md | 155 | 155 |
| agents/measure-review-b-security.md | 154 | 154 |
| agents/measure-review-c-ux-api.md | 145 | 145 |
| agents/measure-spec-review.md | 153 | 153 |
| agents/measure-strategy.md | 49 | 49 |
| agents/measure-ux-browser-review.md | 134 | 134 |
| plugins/opencode-measure-guard/commands/measure-doctor.md | 6 | 6 |
| plugins/opencode-measure-guard/commands/measure-implement.md | 6 | 6 |
| plugins/opencode-measure-guard/commands/measure-new-track.md | 6 | 6 |
| plugins/opencode-measure-guard/commands/measure-orchestrate.md | 7 | 7 |
| plugins/opencode-measure-guard/commands/measure-revert.md | 6 | 6 |
| plugins/opencode-measure-guard/commands/measure-review.md | 6 | 6 |
| plugins/opencode-measure-guard/commands/measure-setup.md | 6 | 6 |
| plugins/opencode-measure-guard/commands/measure-status.md | 6 | 6 |

## Files checked and found clean

These in-scope files hold no shouting, no `**PROTOCOL:**` label, no
`DO NOT JUMP YET`, and no cut-worthy repetition:

- `skills/measure/SKILL.md`
- `skills/measure/references/grill-me.md` (the bold "Never accept vague
  answers" is sentence case, not capitals; it stays)
- `skills/measure/references/spec-review.md`
- `skills/measure-orchestrator/SKILL.md`
- `skills/measure-orchestrator/references/anti-pattern-catalog.md`
- `skills/measure-orchestrator/references/contracts.md`
- `skills/measure-orchestrator/references/dsh.md`
- `agents/measure-adversarial-testing.md`
- `agents/measure-closeout.md`
- `agents/measure-final-acceptance.md`
- `agents/measure-orchestrator.md` (its "Never ..." bullets are sentence
  case; the "Never use the question tool" line is part of a Daniel rule and
  stays)
- `agents/measure-phase-acceptance.md`
- `agents/measure-review-a-correctness.md`
- `agents/measure-review-b-security.md`
- `agents/measure-review-c-ux-api.md`
- `agents/measure-spec-review.md`
- `agents/measure-strategy.md`
- `agents/measure-ux-browser-review.md`
- all eight `plugins/opencode-measure-guard/commands/*.md`

Notes on repetition, reviewed and kept:

- The graph-availability gate prose repeats across `new-track.md`,
  `implement.md`, and `review.md`. Each reference file is loaded on its own,
  so each keeps its copy.
- The setup-check intro repeats across the workflow references for the same
  reason; only the `**PROTOCOL:**` labels go (rows 3-13, 25, 31, 47-51,
  57-59, 62).
- `new-track.md` lines 279 and 285 (`ONLY`, `Do NOT write a set key`) sit
  inside §2.5 steps 1-8. The S1 contract test pins those steps byte-equal to
  the track base, so they stay.

## Pinned strings that stay

- `references/implement.md:222` and `references/review.md:249`: the exact
  deletion warnings "WARNING: This will permanently delete ..." and
  "WARNING: This is an irreversible deletion. Proceed?" are quoted
  user-facing messages and human gates. They stay.
- `references/new-track.md` §2.5 step 9 and the step lines, pinned by
  `tests/spec_review_gate/test_s1_new_track.sh`.
- `agents/measure-orchestrator.md`: "Never dispatch a session without an
  `agent` value", the Role Handoff Rules first bullet, the dispatch and
  progress sentences, pinned by `tests/spec_review_gate/test_s2_role_docs.sh`.
- The five audit roles keep the heavy-run no-redirection paragraph exactly,
  in its pinned position after the "Do not use the question tool." paragraph
  (`agents/measure-review-a-correctness.md`, `measure-review-b-security.md`,
  `measure-review-c-ux-api.md`, `measure-phase-acceptance.md`,
  `measure-final-acceptance.md`).
- `agents/measure-final-acceptance.md` line 115 keeps the path-scoped HEAD
  coverage rule pinned by S2.
- `skills/measure-orchestrator/SKILL.md`, `references/contracts.md`, and
  `references/anti-pattern-catalog.md` keep every string pinned by
  `tests/spec_review_gate/test_s4_doc_drift.sh`.
- `plugins/opencode-measure-guard/commands/measure-orchestrate.md` keeps its
  pinned `description:` line.
- The frontmatter permission rules of every `agents/measure-*.md` file stay
  unchanged.

## Functional Requirements

- **FR-1 (the trim commit).** Apply the audit table in one commit on
  `chore/prompt-audit` with the message
  `chore(prompts): Trim old-model wording from the Measure prompts`. The
  commit holds every change outside `measure/`. Each cut rewrites only the
  listed text and keeps the meaning of the rule.
- **FR-2 (the bundle copy).** Apply the same edits to
  `claude-skills/measure/`, so `diff -r skills/measure claude-skills/measure`
  exits 0.
- **FR-3 (the records).** `CHANGELOG.md` gets one entry at the top of
  "## Unreleased" (a new "### Chores" heading when none exists).
  `README.md` line 33 names this track as the latest archived track.
- **FR-4 (the closeout).** Archive the track, move the registry entry to
  Archived Tracks with `[x]`, and record the results.

## Acceptance Criteria

- One trim commit holds every change outside `measure/`.
- `diff -r skills/measure claude-skills/measure` exits 0.
- `bash tests/spec_review_gate/test_s1_new_track.sh`,
  `bash tests/spec_review_gate/test_s2_role_docs.sh`,
  `bash tests/spec_review_gate/test_s4_doc_drift.sh`, and
  `bash tests/dsh/test-skill-docs.sh` exit 0 (run directly).
- Through the heavy-job wrapper with no shell redirection
  (`HEAVY_PRIORITY=p2 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh bash tests/spec_review_gate/run.sh`
  and
  `HEAVY_PRIORITY=p2 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh bash tests/dsh/run.sh`)
  exit 0.
- In `plugins/dsh-measure-guard`: `node --test tests/*.test.js` exits 0.
- `CHANGELOG.md` gets one entry at the top of "## Unreleased" (a
  "### Chores" heading when there is none; else the existing chores
  heading). `README.md` line 33 names this track as the latest archived
  track.
- The closeout check
  (`python3 skills/measure-orchestrator/scripts/measure_interphase_checks.py closeout --repo . --track prompt_audit_20261115`)
  fails only on the missing closeout manifest.
- Per-file line counts match the "Lines expected" column of the audit table.

## Out of Scope

- Any file outside the scope list above.
- Frontmatter permission rules of the agent files.
- A merge into `main`. Only Daniel merges.
