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
   rewrite keeps the force of the rule and does not change its meaning.
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
`skills/measure/assets/code_styleguides/`, `docs/`, and all files outside
this repository. The record files `CHANGELOG.md` and `README.md` change only
in the Task 1.2 archive commit (FR-3); nothing else in them changes.

## Audit method

The audit ran read-only. It searched the scope files for the shouting words
in capitals, for `**PROTOCOL:` labels, for `DO NOT JUMP YET`, and for
capitalized emphasis words. After the spec review of 2026-11-15 (Round 1,
finding F1), it searched every in-scope file again for each word in capitals
(`grep -nE '\b[A-Z]{3,}\b'`) and read each hit. Each instruction-prose hit
gets a row below or a keep reason in "Capital-letter hits kept". Before each
proposed cut it searched `tests/`, `plugins/dsh-measure-guard/tests`, and
`plugins/opencode-measure-guard` for the exact old text with `grep -rF`; no
proposed cut text is pinned. The audit also read the S1, S2, and S4 contract
tests and the DSH reference test to collect the strings those tests pin, so
the table keeps them (see "Pinned strings that stay").

## Audit table

One row per proposed cut. Every cut is a same-line rewrite except the one
marked "removed". Line numbers are the lines of 2026-11-15 in this worktree.
A row that rewrites a rule keeps the rule as an instruction, in sentence
case.

### AGENTS.md

| # | File | Line | Old text (short) | New text | Reason |
|---|------|------|------------------|----------|--------|
| 1 | AGENTS.md | 7 | `**PROTOCOL: How to locate files.**` | removed | `**PROTOCOL:**` label; the section heading already names the protocol |
| 2 | AGENTS.md | 27 | `You MUST verify the resolved file actually exists on the disk.` | `Verify that the resolved file exists on the disk.` | Shouting: `MUST` |

### skills/measure/SKILL.md

| # | File | Line | Old text (short) | New text | Reason |
|---|------|------|------------------|----------|--------|
| 3 | skills/measure/SKILL.md | 56 | `... or the project isn't TypeScript. No HALT, no breakage.` | `... or the project isn't TypeScript. No halt, no breakage.` | Shouting: `HALT` |

### skills/measure/references

| # | File | Line | Old text (short) | New text | Reason |
|---|------|------|------------------|----------|--------|
| 4 | references/doctor.md | 11 | `**PROTOCOL: Verify that the Measure environment and Doctor script exist.**` | `Verify that the Measure environment and Doctor script exist.` | `**PROTOCOL:**` label |
| 5 | references/doctor.md | 20 | `... exist." and HALT.` | `... exist." and halt.` | Shouting: `HALT` |
| 6 | references/status.md | 21 | `**PROTOCOL: Verify that the Measure environment is properly set up.**` | `Verify that the Measure environment is properly set up.` | `**PROTOCOL:**` label |
| 7 | references/status.md | 29 | `If ANY of these are missing ... and HALT.` | `If any of these are missing ... and halt.` | Shouting: `ANY`, `HALT` |
| 8 | references/status.md | 46 | `If metadata.json is missing or malformed, skip silently and continue — do NOT HALT.` | `If metadata.json is missing or malformed, skip it silently and continue.` | Shouting: `NOT`, `HALT`; keeps `silently` |
| 9 | references/status.md | 150 | `**PROTOCOL: Compute velocity and estimation accuracy from completed feature tracks.**` | `Compute velocity and estimation accuracy from completed feature tracks.` | `**PROTOCOL:**` label |
| 10 | references/review.md | 39 | `**PROTOCOL: Verify that the Measure environment is properly set up.**` | `Verify that the Measure environment is properly set up.` | `**PROTOCOL:**` label |
| 11 | references/review.md | 48 | `If ANY of these files are missing, list them, announce: ... and HALT.` | `If any of these files are missing, list them, announce: ... and halt.` | Shouting: `ANY`, `HALT` |
| 12 | references/review.md | 52 | `... AND check that ... If both pass AND ... does NOT block ...` | lowercase `and` / `does not block` (same sentence) | Shouting: `AND`, `NOT` |
| 13 | references/review.md | 59 | `**PROTOCOL: Follow this sequence to perform a code review.**` | `Follow this sequence to perform a code review.` | `**PROTOCOL:**` label |
| 14 | references/review.md | 75 | `**CRITICAL:** Check for measure/code_styleguides/. Read ALL .md files within it.` | `Check for measure/code_styleguides/. Read every .md file within it. Violations here are High severity.` | Shouting: `CRITICAL`, `ALL` |
| 15 | references/review.md | 123 | `If the caller is **not** updated AND the signature change is non-additive ...` | `If the caller is **not** updated and the signature change is non-additive ...` | Shouting: `AND` |
| 16 | references/review.md | 220 | `**PROTOCOL: Ensure all review-related changes are committed and tracked in the plan.**` | `Ensure all review-related changes are committed and tracked in the plan.` | `**PROTOCOL:**` label |
| 17 | references/review.md | 225 | `**If NOT reviewing a specific track** ... Ask "I've detected uncommitted changes...` | `**When you are not reviewing a specific track** ... Ask "I've detected uncommitted changes...` | Shouting: `NOT` |
| 18 | references/review.md | 243 | `**PROTOCOL: Offer to archive or delete the reviewed track.**` | `Offer to archive or delete the reviewed track.` | `**PROTOCOL:**` label |
| 19 | references/review.md | 245 | `If NOT reviewing a specific track, SKIP this entire section.` | `When you are not reviewing a specific track, skip this entire section.` | Shouting: `NOT`, `SKIP` |
| 20 | references/new-track.md | 23 | `**PROTOCOL: Verify that the Measure environment is properly set up.**` | `Verify that the Measure environment is properly set up.` | `**PROTOCOL:**` label |
| 21 | references/new-track.md | 30 | `If ANY of these are missing ... and HALT.` | `If any of these are missing ... and halt.` | Shouting: `ANY`, `HALT` |
| 22 | references/new-track.md | 38 | `Infer track type from description (Feature vs Bug/Chore/Refactor) - do NOT ask user to classify` | `Infer track type from description (Feature vs Bug/Chore/Refactor) - do not ask the user to classify` | Shouting: `NOT` |
| 23 | references/new-track.md | 59 | `**Availability + freshness gate** (must pass BOTH):` | `**Availability + freshness gate** (both must pass):` | Shouting: `BOTH` |
| 24 | references/new-track.md | 61 | `- **Freshness:** graph.db exists at the project root AND its mtime ...` | `- **Freshness:** graph.db exists at the project root and its mtime ...` | Shouting: `AND` |
| 25 | references/new-track.md | 63 | `**If both pass AND the Tech Stack includes TypeScript:**` | `**If both pass and the Tech Stack includes TypeScript:**` | Shouting: `AND` |
| 26 | references/new-track.md | 73 | `- Do NOT HALT.` | `- Do not halt.` | Shouting: `NOT`, `HALT` |
| 27 | references/new-track.md | 85 | `**CRITICAL:** Wait for the user's response after each prompt.` | `Wait for the user's response after each prompt.` | Shouting: `CRITICAL` |
| 28 | references/new-track.md | 93 | `At least one batch in this Questioning Phase MUST cite a specific finding from build-graph results ...` | `Cite a specific finding from build-graph results in at least one batch of this Questioning Phase (e.g., "I see validateToken is called from 4 files including auth/middleware.ts — should the new behavior live there or in a sibling module?").` | Shouting: `MUST`; keeps the rule as an instruction |
| 29 | references/new-track.md | 105 | `Do NOT ask generic questions if the answer is already in the files.` | `Do not ask generic questions when the answer is already in the files.` | Shouting: `NOT` |
| 30 | references/new-track.md | 137 | `Any downstream workflow that reads spec.md MUST treat the absence of a ## Stories section as classic mode and proceed silently — no HALT, no warning, no migration prompt.` | `Any downstream workflow that reads spec.md must treat the absence of a ## Stories section as classic mode and proceed silently — no halt, no warning, no migration prompt.` | Shouting: `MUST`, `HALT`; keeps the rule as an instruction |
| 31 | references/new-track.md | 161 | `(build-graph available AND graph.db fresh AND project is TS)` | lowercase `and` (same sentence) | Shouting: `AND` |
| 32 | references/new-track.md | 167 | `... every story-phase that touches one of these symbols MUST include a _Blast radius:_ line ...` | `... every story-phase that touches one of these symbols must include a _Blast radius:_ line ...` | Shouting: `MUST`; keeps the rule as an instruction |
| 33 | references/new-track.md | 195 | `The plan MUST include the following phases in order:` | `The plan must include the following phases in order:` | Shouting: `MUST`; keeps the rule as an instruction |
| 34 | references/new-track.md | 226 | `... identify relevant skills that are NOT yet installed ...` | `... identify relevant skills that are not yet installed ...` | Shouting: `NOT` |
| 35 | references/new-track.md | 239 | `This step MUST only be executed if you installed new skills ...` | `Run this step only when you installed new skills in the previous section.` | Shouting: `MUST` |
| 36 | references/new-track.md | 240 | `Do NOT ask a question here — make a statement and wait.` | `Do not ask a question here — make a statement and wait.` | Shouting: `NOT` |
| 37 | references/new-track-set.md | 31 | `**PROTOCOL: Verify that the Measure environment is properly set up.**` | `Verify that the Measure environment is properly set up.` | `**PROTOCOL:**` label |
| 38 | references/new-track-set.md | 38 | `If ANY of these are missing ... and HALT.` | `If any of these are missing ... and halt.` | Shouting: `ANY`, `HALT` |
| 39 | references/new-track-set.md | 52 | `Do NOT ask a question that these files answer.` | `Do not ask a question that these files answer.` | Shouting: `NOT` |
| 40 | references/new-track-set.md | 56 | `**CRITICAL:** Wait for the user's response after each batch.` | `Wait for the user's response after each batch.` | Shouting: `CRITICAL` |
| 41 | references/new-track-set.md | 159 | `**CRITICAL:** If a member needs a structural change ... do not draft it silently.` | `If a member needs a structural change (a phase, a requirement, or a section that its sample does not have), do not draft it silently. Present that member alone with the format of step 4, and wait for **Approve** before you continue.` | Shouting: `CRITICAL` |
| 42 | references/new-track-set.md | 167 | `If a name now matches, HALT and tell the user which name matches.` | `If a name now matches, halt and tell the user which name matches.` | Shouting: `HALT` |
| 43 | references/new-track-set.md | 238 | `Do NOT commit until each check in this list passes ...` | `Do not commit until each check in this list passes ...` | Shouting: `NOT` |
| 44 | references/new-track-set.md | 243 | `On **Stop**, HALT without a commit.` | `On **Stop**, halt without a commit.` | Shouting: `HALT`; `Stop` stays as the option label |
| 45 | references/new-track-set.md | 252 | `**PROTOCOL: How other workflows treat set data.**` | `How other workflows treat set data.` | `**PROTOCOL:**` label |
| 46 | references/new-track-set.md | 266 | `Never HALT because of set data.` | `Never halt because of set data.` | Shouting: `HALT` |
| 47 | references/setup.md | 53 | `**PROTOCOL: Before starting setup, determine the project's state by auditing existing artifacts.**` | `Before starting setup, determine the project's state by auditing existing artifacts.` | `**PROTOCOL:**` label |
| 48 | references/setup.md | 67 | `... (highest match wins). **DO NOT JUMP YET.** Keep this target in mind.` | `... (highest match wins). Keep this target in mind.` | Shouting: `DO NOT JUMP YET` (PM-named) |
| 49 | references/setup.md | 71 | `| All files in tracks/<track_id>/ (...) | **HALT** | ...` | `| All files in tracks/<track_id>/ (...) | **Halt** | ...` | Shouting: `HALT` |
| 50 | references/setup.md | 81 | `You MUST proceed to Section 2.0 to establish the Greenfield/Brownfield context ...` | `Proceed to Section 2.0 to establish the Greenfield/Brownfield context before jumping to your target.` | Shouting: `MUST` |
| 51 | references/setup.md | 87 | `**Brownfield (Existing)** if ANY of:` | `**Brownfield (Existing)** if any of:` | Shouting: `ANY` |
| 52 | references/setup.md | 93 | `**Greenfield (New)** if NONE of the above AND directory is empty or contains only README.md` | `**Greenfield (New)** if none of the above and the directory is empty or contains only README.md` | Shouting: `NONE`, `AND` |
| 53 | references/setup.md | 116 | `**CRITICAL:** Do NOT ask for more files. Base analysis SOLELY on discovered file snippets ...` | `Do not ask for more files. Base the analysis only on the discovered file snippets and the directory structure.` | Shouting: `CRITICAL`, `NOT`, `SOLELY` |
| 54 | references/setup.md | 131 | `**CRITICAL:** Do NOT execute any tool calls until the user has provided a response.` | `Do not execute any tool calls until the user provides a response.` | Shouting: `CRITICAL`, `NOT` |
| 55 | references/setup.md | 145 | `Do NOT ask generic questions if the answer is already in the files.` | `Do not ask generic questions when the answer is already in the files.` | Shouting: `NOT` |
| 56 | references/setup.md | 148 | `Draft product.md based ONLY on the user's selected answers` | `Draft product.md based only on the user's selected answers` | Shouting: `ONLY` |
| 57 | references/setup.md | 194 | `Incorporate BOTH the chosen aesthetic AND ... **CRITICAL:** The design must be highly opinionated ...` | `Incorporate both the chosen aesthetic and the user's differentiation notes. Make the design highly opinionated. Avoid generic "AI slop" terms like "clean" or "modern" without specific implementation details.` | Shouting: `BOTH`, `AND`, `CRITICAL`; keeps the design constraint as a rule |
| 58 | references/setup.md | 211 | `**CRITICAL WARNING:** Your goal is to document the project's existing tech stack ...` | `Your goal is to document the project's existing tech stack, not to propose changes.` | Shouting: `CRITICAL WARNING` |
| 59 | references/setup.md | 295 | `This step MUST only be executed if you installed new skills ...` | `Run this step only when you installed new skills in the previous section.` | Shouting: `MUST` |
| 60 | references/setup.md | 296 | `Do NOT ask a question here — make a statement and wait.` | `Do not ask a question here — make a statement and wait.` | Shouting: `NOT` |
| 61 | references/setup.md | 301 | `**CRITICAL:** Placeholder scripts are useless. You MUST configure actual architectural enforcement ...` | `Placeholder scripts are useless. Configure actual architectural enforcement based on the project's Tech Stack.` | Shouting: `CRITICAL`, `MUST` |
| 62 | references/setup.md | 322 | `**If "Install build-graph rules in AGENTS.md only" OR "Install build-graph + scan now":**` | `**If "Install build-graph rules in AGENTS.md only" or "Install build-graph + scan now":**` | Shouting: `OR` |
| 63 | references/setup.md | 441 | `Include the sprint key ONLY when type = "feature" AND ...` | `Include the sprint key only when type = "feature" and ...` | Shouting: `ONLY`, `AND` |
| 64 | references/setup.md | 453 | `**CRITICAL:** The structure of tasks MUST adhere to the principles in measure/workflow.md.` | `The structure of tasks must adhere to the principles in measure/workflow.md.` | Shouting: `CRITICAL`, `MUST`; keeps the rule as an instruction |
| 65 | references/setup.md | 460 | `**CRITICAL: Inject Phase Completion Tasks.** Read measure/workflow.md ...` | `Inject Phase Completion tasks. Read measure/workflow.md ...` | Shouting: `CRITICAL` |
| 66 | references/implement.md | 24 | `**PROTOCOL: Verify that the Measure environment is properly set up.**` | `Verify that the Measure environment is properly set up.` | `**PROTOCOL:**` label |
| 67 | references/implement.md | 31 | `If ANY of these are missing ... and HALT.` | `If any of these are missing ... and halt.` | Shouting: `ANY`, `HALT` |
| 68 | references/implement.md | 37 | `**CRITICAL:** For every relevant skill identified, read its SKILL.md ...` | `For every relevant skill identified, read its SKILL.md and reference files.` | Shouting: `CRITICAL` |
| 69 | references/implement.md | 42 | `**PROTOCOL: Identify and select the track to be implemented.**` | `Identify and select the track to be implemented.` | `**PROTOCOL:**` label |
| 70 | references/implement.md | 49 | `**CRITICAL:** If no track sections are found after parsing, announce ...` | `If no track sections are found after parsing, announce ...` | Shouting: `CRITICAL` |
| 71 | references/implement.md | 57 | `Find the first track NOT marked as [x] Completed.` | `Find the first track not marked as [x] Completed.` | Shouting: `NOT` |
| 72 | references/implement.md | 74 | `**PROTOCOL: Execute the selected track.**` | `Execute the selected track.` | `**PROTOCOL:**` label |
| 73 | references/implement.md | 89 | `If you fail to read any of these files, you MUST stop and inform the user ...` | `If you fail to read any of these files, stop and inform the user of the error.` | Shouting: `MUST`; keeps the original scope |
| 74 | references/implement.md | 100 | `**Availability + freshness gate** (must pass BOTH):` | `**Availability + freshness gate** (both must pass):` | Shouting: `BOTH` |
| 75 | references/implement.md | 102 | `- **Freshness:** graph.db exists at the project root AND its mtime ...` | `- **Freshness:** graph.db exists at the project root and its mtime ...` | Shouting: `AND` |
| 76 | references/implement.md | 104 | `**If both pass AND the Tech Stack includes TypeScript:**` | `**If both pass and the Tech Stack includes TypeScript:**` | Shouting: `AND` |
| 77 | references/implement.md | 117 | `- Do NOT HALT.` | `- Do not halt.` | Shouting: `NOT`, `HALT` |
| 78 | references/implement.md | 124 | `You MUST now loop through each task ...` | `Loop through each task ...` | Shouting: `MUST` |
| 79 | references/implement.md | 125 | `**For Each Task, You MUST:**` | `**For each task:**` | Shouting: `MUST` |
| 80 | references/implement.md | 126 | `You MUST now read and execute the procedures ...` | `Read and execute the procedures ...` | Shouting: `MUST` |
| 81 | references/implement.md | 136 | `**Update graph when ANY of these are true:**` | `**Update graph when any of these are true:**` | Shouting: `ANY` |
| 82 | references/implement.md | 170 | `**If metadata.json does NOT contain a sprint key**, skip the sprint sync silently ...` | `**If metadata.json does not contain a sprint key**, skip the sprint sync silently ...` | Shouting: `NOT` |
| 83 | references/implement.md | 180 | `**PROTOCOL: Update machine-generated facts and verify architectural integrity ...**` | `Update machine-generated facts and verify architectural integrity based on the completed track.` | `**PROTOCOL:**` label |
| 84 | references/implement.md | 182 | `This protocol MUST only be executed when a track has reached a [x] status ...` | `Run this protocol only when a track has reached a [x] status in the tracks file.` | Shouting: `MUST` |
| 85 | references/implement.md | 199 | `**PROTOCOL: Offer to archive or delete the completed track.**` | `Offer to archive or delete the completed track.` | `**PROTOCOL:**` label |
| 86 | references/revert.md | 29 | `Your workflow MUST anticipate and handle common non-linear Git histories ...` | `Anticipate and handle common non-linear Git histories in the workflow, such as rewritten commits (from rebase/squash) and merge commits.` | Shouting: `MUST`; keeps the rule as an instruction |
| 87 | references/revert.md | 35 | `**CRITICAL:** The user's explicit confirmation is required at multiple checkpoints. If denied, halt immediately.` | `Ask the user for explicit confirmation at each checkpoint. If denied, halt immediately.` | Shouting: `CRITICAL`; keeps the gate and `immediately` |
| 88 | references/revert.md | 39 | `**PROTOCOL: Verify that the Measure environment is properly set up.**` | `Verify that the Measure environment is properly set up.` | `**PROTOCOL:**` label |
| 89 | references/revert.md | 47 | `If ANY of these are missing ... and HALT.` | `If any of these are missing ... and halt.` | Shouting: `ANY`, `HALT` |
| 90 | references/revert.md | 111 | `Goal: Find ALL commits associated with the target in Git history.` | `Goal: Find all commits associated with the target in Git history.` | Shouting: `ALL` |
| 91 | references/revert.md | 180 | `1. HALT execution` | `1. Halt execution` | Shouting: `HALT` |

### skills/measure/assets/workflow.md

| # | File | Line | Old text (short) | New text | Reason |
|---|------|------|------------------|----------|--------|
| 92 | assets/workflow.md | 59 | `**CRITICAL:** Run the tests and confirm that they fail as expected. ... Do not proceed until you have failing tests.` | `Run the tests and confirm that they fail as expected. This is the "Red" phase of TDD. Proceed only when the tests fail.` | Shouting: `CRITICAL` |
| 93 | assets/workflow.md | 81 | `- **STOP** implementation` | `- **Stop** implementation` | Shouting: `STOP` |
| 94 | assets/workflow.md | 120 | `**CRITICAL:** First, check its extension. Exclude non-code files ...` | `First, check its extension. Exclude non-code files (e.g., .json, .md, .yaml).` | Shouting: `CRITICAL` |
| 95 | assets/workflow.md | 131 | `**CRITICAL:** To generate the plan, first analyze product.md, product-guidelines.md, and plan.md ...` | `To generate the plan, first analyze product.md, product-guidelines.md, and plan.md ...` | Shouting: `CRITICAL` |
| 96 | assets/workflow.md | 157 | `**PAUSE** and await the user's response. ...` | `**Pause** and await the user's response. ...` | Shouting: `PAUSE` |

### agents

| # | File | Line | Old text (short) | New text | Reason |
|---|------|------|------------------|----------|--------|
| 97 | agents/measure-mid-red.md | 86 | `- Do NOT fabricate (no fake rows, no invented dates, no made-up outreach).` | `- Do not fabricate (no fake rows, no invented dates, no made-up outreach).` | Shouting: `NOT` |
| 98 | agents/measure-jr-green.md | 75 | Line 75: `- Do NOT fabricate. No fake session notes, no fake outreach rows, no fake consent` (the sentence wraps; line 76 starts with `artifacts. The verification-checkpoint rule ...`) | Line 75 becomes `- Do not fabricate. No fake session notes, no fake outreach rows, no fake consent`; line 76 stays unchanged | Shouting: `NOT`; the edit keeps both lines |
| 99 | agents/measure-orchestrator-audit.md | 153 | `If the test/guard does NOT exist, report ...` | `If the test or guard does not exist, report ...` | Shouting: `NOT` |
| 100 | agents/measure-orchestrator-audit.md | 315 | `- Do NOT modify plan task markers ...` | `- Do not modify plan task markers ...` | Shouting: `NOT` |
| 101 | agents/measure-orchestrator-audit.md | 317 | `- Do NOT archive tracks. Report archive readiness ...` | `- Do not archive tracks. Report archive readiness ...` | Shouting: `NOT` |

### F9 additions (Round 2, 2026-11-15)

Rows 102-111 came from spec review Round 2 (finding F9, orchestrator
decision: the author adds them, with no third round). Each is a same-line
rewrite.

| # | File | Line | Old text (short) | New text | Reason |
|---|------|------|------------------|----------|--------|
| 102 | references/setup.md | 99 | `- **IMMEDIATELY JUMP** to the Target Section. Do not execute the rest of Section 2.0.` | `- **Jump immediately** to the Target Section. Do not execute the rest of Section 2.0.` | Shouting: `IMMEDIATELY JUMP` |
| 103 | references/new-track.md | 205 | `- Include [ ] status markers for EVERY task and sub-task:` | `- Include [ ] status markers for every task and sub-task:` | Shouting: `EVERY` |
| 104 | references/setup.md | 454 | `- **Status markers** for EVERY task and sub-task:` | `- **Status markers** for every task and sub-task:` | Shouting: `EVERY` |
| 105 | references/revert.md | 127 | `- Happened AFTER the implementation commit` | `- Happened after the implementation commit` | Shouting: `AFTER` |
| 106 | references/review.md | 132 | `**CONDITIONAL:** Only execute this section if the diff touches frontend files ...` | `**Conditional:** Only execute this section if the diff touches frontend files ...` | Shouting: `CONDITIONAL` label |
| 107 | references/review.md | 134 | `**PURPOSE:** Complement unit/integration tests ...` | `**Purpose:** Complement unit/integration tests ...` | Shouting: `PURPOSE` label |
| 108 | assets/workflow.md | 195 | `**AI AGENT INSTRUCTION: This section should be adapted to the project's specific language, framework, and build tools.**` | `This section should be adapted to the project's specific language, framework, and build tools.` | Shouting: `AI AGENT INSTRUCTION` label |
| 109 | references/review.md | 223 | `2. **If NO changes detected:** Proceed to 3.3 Track Cleanup.` | `2. **When no changes are detected:** Proceed to 3.3 Track Cleanup.` | Shouting: `NO` |
| 110 | skills/measure-orchestrator/references/anti-pattern-catalog.md | 45 | `require EITHER (a) explicit anonymization marker on the artifact, OR (b) a non-empty` | `require either (a) explicit anonymization marker on the artifact, or (b) a non-empty` | Shouting: `EITHER`, `OR` |
| 111 | skills/measure-orchestrator/references/anti-pattern-catalog.md | 91 | `(all-[~]) AND when a phase has zero in-progress tasks (all-[x]).` | `(all-[~]) and when a phase has zero in-progress tasks (all-[x]).` | Shouting: `AND` |

## Capital-letter hits kept

These in-scope hits stay, with the reason:

- `references/implement.md:147` — `NOT` inside the quoted rule name
  `"When NOT to update"` of `repo-graph/AGENTS.md`; a quotation, not
  shouting.
- `references/new-track.md:279` (`ONLY`, `AND`) and `:285` (`Do NOT write a
  `set` key`) — inside §2.5 steps 1-8, pinned byte-equal to the track base by
  `tests/spec_review_gate/test_s1_new_track.sh` (steps-1-8 check).
- `agents/measure-orchestrator.md` — the sentence-case `Never ...` bullets
  (lines 179, 209, 262-265, 283, 287, 334, 341-344, 364, 436); owner rules
  and human gates. S2 pins the dispatch sentence
  (`tests/spec_review_gate/test_s2_role_docs.sh`, the check that forbids an
  agent-less session) and the question-tool paragraph position; line 441 must
  stay equal to `ruleSection()` per
  `plugins/opencode-measure-guard/tests/context.test.ts`.
- `references/grill-me.md:37` — `Never` is sentence case, not capitals.
- Output and test tokens kept as code names: `PASS`, `FAIL`, `INCOMPLETE`,
  `WARN`, `DRIFT`, `PROPOSAL`, `INFO`, and `BANNED` (test-output and
  audit-output tokens).
- Report-format and schema tokens kept as code names: the status-report
  banner words (`MEASURE STATUS REPORT`, `CURRENT WORK`, `PROGRESS`,
  `TRACK BREAKDOWN`, `PROJECT HEALTH`), the severity and disposition tokens
  (`Blocker|Major|Nit`, `Critical/High/Medium/Low`,
  `FIX/CONTEST/ESCALATE/DECLINE`), and the `MEASURE_AGENT_RESULT` marker
  block.
- Acronyms and file names in capitals (`TDD`, `JSON`, `YAML`, `API`, `CLI`,
  `SHA`, `HEAD`, `CI`, `TS`, `JSX`, `UX`, `DOM`, `CDP`, `PII`, `XSS`, `SQL`,
  `MVP`, `README`, `DESIGN.md`, `AGENTS.md`) — acronyms and code names, not
  shouting.
- The quoted user-facing messages, including the two deletion `WARNING:`
  quotes (`references/implement.md:222`, `references/review.md:249`) —
  human gates.

## Per-file line counts

Every cut is a same-line rewrite, except row 1 (one line removed in
`AGENTS.md`). Rows 102-111 (Round 2) are same-line rewrites too, so the
counts below already hold for the full 111-row table. `claude-skills/measure/`
mirrors `skills/measure/` and gets the same edits, so its counts match the
`skills/measure/` counts below.

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

- `skills/measure/references/grill-me.md` (the bold "Never accept vague
  answers" is sentence case, not capitals; it stays)
- `skills/measure/references/spec-review.md`
- `skills/measure-orchestrator/SKILL.md`
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
  so each keeps its copy; rows 23-25 and 74-76 trim both copies alike.
- The setup-check intro repeats across the workflow references for the same
  reason; only the `**PROTOCOL:**` labels go (rows 4, 6, 10, 13, 20, 37, 47,
  66, 69, 72, 83, 85, 88 and the other PROTOCOL rows).

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
  commit holds every change to the in-scope prompt files of the Scope
  section, including the `claude-skills/measure/` mirror. Each cut rewrites
  only the listed text and keeps the force and the meaning of the rule.
- **FR-2 (the bundle copy).** Apply the same edits to
  `claude-skills/measure/`, so `diff -r skills/measure claude-skills/measure`
  exits 0.
- **FR-3 (the records).** `CHANGELOG.md` gets one entry at the top of
  "## Unreleased" (a new "### Chores" heading when none exists):
  `* **prompt trim:** the Measure prompts (AGENTS.md, skills/measure and its claude-skills/measure copy, skills/measure-orchestrator, the agents/measure-*.md roles, and the opencode-measure-guard commands) lose old-model capital-letter wording (shouting labels, MUST, DO NOT, and DO NOT JUMP YET); every Daniel quote, owner rule, human gate, and test-pinned string stays. Track `prompt_audit_20261115`.`
  `README.md` line 33 becomes: "As of 2026-11-15, the latest archived track
  is Prompt audit (old-model capital-letter wording is trimmed from the
  Measure prompts; every owner rule and human gate stays)." followed by the
  rest of the current line 33 unchanged. Both record changes ride in the
  Task 1.2 archive commit `chore(measure): Archive track 'Prompt audit'`,
  as in the G21 track (archive commit 19a4f29 is the format precedent).
- **FR-4 (the closeout).** Archive the track, move the registry entry to
  Archived Tracks with `[x]`, and record the results.

## Acceptance Criteria

- One trim commit holds every change to the in-scope prompt files.
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
  track. Both changes ride in the Task 1.2 archive commit.
- The closeout check
  (`python3 skills/measure-orchestrator/scripts/measure_interphase_checks.py closeout --repo . --track prompt_audit_20261115`)
  fails only on the missing closeout manifest.
- Per-file line counts match the "Lines expected" column of the audit table.

## Out of Scope

- Any file outside the scope list above, except the `CHANGELOG.md` and
  `README.md` record changes of the Task 1.2 archive commit (FR-3).
- Frontmatter permission rules of the agent files.
- A merge into `main`. Only Daniel merges.
