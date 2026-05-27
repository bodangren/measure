# Specification: Measure Workflow Memory & Learning Improvements

## Overview

Add persistent learning mechanisms to the Measure workflow, enabling projects to accumulate knowledge across tracks. This includes a lessons-learned memory file, a tech debt registry, bounded-context safeguards, and integration points in the setup, new-track, implement, review, and status workflows that surface this knowledge during planning and execution.

The core problem being solved: insights discovered during one track are currently lost. The next track starts with no memory of what worked, what caused delays, or what shortcuts were taken. This feature closes that loop without letting long-lived memory files grow until they become counterproductive.

## Functional Requirements

### FR-1: Lessons Learned File (`measure/lessons-learned.md`)

A structured Markdown file, created as a stub during setup, with the following sections:

```markdown
# Lessons Learned

## Architecture & Design
<!-- Decisions made that future tracks should be aware of -->

## Recurring Gotchas
<!-- Problems encountered repeatedly; save future tracks from the same pain -->

## Patterns That Worked Well
<!-- Approaches worth repeating -->

## Planning Improvements
<!-- Notes on where estimates were wrong and why -->
```

Each entry should include the date and originating track ID in parentheses, e.g.:
```
- (2026-03-07, auth_20260301) Decided against JWT; sticky sessions simpler for single-server deploy
```

This file is a curated working-memory artifact, not an append-only history log. It must remain concise enough to be loaded as planning context.

### FR-2: Tech Debt Registry (`measure/tech-debt.md`)

A table-based Markdown file, created as a stub during setup:

```markdown
# Tech Debt Registry

| Date | Track | Item | Severity | Status | Notes |
|------|-------|------|----------|--------|-------|
```

Severity values: `Critical`, `High`, `Medium`, `Low`.
Status values: `Open`, `Resolved`.

This file is a curated working-memory artifact, not an append-only history log. Resolved or obsolete items should be summarized or removed when they no longer need to influence near-term planning.

### FR-3: Setup Workflow Integration

The setup workflow (`references/setup.md`) must:

1. Create `measure/lessons-learned.md` stub after step 2.5 (Workflow creation).
2. Create `measure/tech-debt.md` stub after step 2.5.
3. Add named index entries for both files in `measure/index.md`:
   - `**Lessons Learned**`: link to `./lessons-learned.md`
   - `**Tech Debt Registry**`: link to `./tech-debt.md`

### FR-4: Template Parity

Any new template artifact introduced by this track must be added in both locations:

1. `claude-skills/measure/assets/`
2. `templates/`

The paired copies must remain identical where duplication is intentional.

### FR-5: New Track Workflow Integration

The new track workflow (`references/new-track.md`) must:

1. **Before plan generation (§2.3):** Load `lessons-learned.md` (if it exists) and use its contents to:
   - Identify known gotchas relevant to the track type or feature area.
   - Adjust task complexity estimates based on "Planning Improvements" entries.
   - Note relevant patterns in the generated plan.
2. **During spec questions (§2.2):** After gathering requirements, check `tech-debt.md` (if it exists) for items relevant to the feature area and surface them as a question: "There are open tech debt items that may relate to this track. Would you like to address any of them?"
3. **Before reading either file:** Check its line count first and only load it directly when it is within the configured context budget.
4. **When the budget is exceeded:** Summarize or prune the file before using it as planning context, rather than loading the full file verbatim.

### FR-6: Implement Workflow Integration

The implement workflow (`references/implement.md`) must:

1. **Before task execution (§3.2 or §3.3):** Load relevant entries from `lessons-learned.md` and open items from `tech-debt.md` so implementation benefits from project memory, not just retrospective logging.
1. **Before track finalization (§3.4):** Add a retrospective step that prompts:
   - "Were there any surprises or deviations from the plan worth documenting?"
   - "Were any shortcuts taken that should be logged as tech debt?"
   - "Were there insights that should be added to lessons-learned.md?"
   - If yes to any, append the relevant entries before committing the track as complete.
2. **Track metadata updates:** At track completion, update `metadata.json` with:
   - `actual_tasks`
   - `deviation_notes` when actual work materially differed from the original plan
3. **In the workflow template (`assets/workflow.md`):** Add a note in the task workflow that when a shortcut is knowingly taken (e.g., skipping an edge case), the agent should prompt the user to add a row to `tech-debt.md`.

### FR-7: Review Workflow Integration

The review workflow (`references/review.md`) must:

1. **Before analysis (§2.2):** Load relevant entries from `lessons-learned.md`, especially "Recurring Gotchas", so review explicitly checks for repeated failure modes.
1. **After fixing Critical or High severity findings (§3.1):** Offer to log the root cause to `lessons-learned.md` under "Recurring Gotchas" so the same class of error doesn't recur.

### FR-8: Status Workflow Integration

The status workflow (`references/status.md`) must:

1. Include a "Project Health" section that shows:
   - Last update date of `lessons-learned.md` (from `git log -1 --format="%ar" -- measure/lessons-learned.md`).
   - Count of open rows in `tech-debt.md` (`Status = Open`).
   - Current line counts for `lessons-learned.md` and `tech-debt.md`.
   - Whether either file is over the configured context budget.

### FR-9: Metadata Schema Update

The `metadata.json` template in both `references/setup.md` and `references/new-track.md` must include:

```json
"estimated_tasks": null,
"actual_tasks": null,
"deviation_notes": ""
```

`estimated_tasks` is filled at plan creation time (count of tasks in `plan.md`). `actual_tasks` is filled at track completion. `deviation_notes` is filled when the final task count or scope meaningfully diverges from the original plan.

### FR-10: Context Budget Enforcement

The memory artifacts introduced by this track must be bounded so they remain usable as LLM context:

1. `measure/lessons-learned.md` must stay at or below 50 lines.
2. `measure/tech-debt.md` must stay at or below 50 lines.
3. Before loading either file as context, the workflow must check line count with `wc -l` or a dedicated helper script.
4. If a file exceeds the limit, the workflow must summarize, prune, or otherwise condense it before using it as context.
5. The repository must include a small helper script for checking these budgets so workflows can use a standard command instead of ad hoc logic.

## Non-Functional Requirements

- All new files follow existing Measure Markdown conventions (see product-guidelines.md).
- Changes to workflow reference files are **additive only** — no existing steps are removed or reordered.
- `lessons-learned.md` and `tech-debt.md` are **optional** files: workflows that reference them must gracefully handle their absence (log a warning, do not HALT).
- Both `claude-skills/measure/` and `templates/` copies must be updated for any template file changes.
- The memory files are optimized for current guidance, not archival completeness.

## Acceptance Criteria

1. After running setup, `measure/lessons-learned.md` and `measure/tech-debt.md` exist with the stub content defined in FR-1 and FR-2.
2. `measure/index.md` has named entries for `**Lessons Learned**` and `**Tech Debt Registry**`.
3. `claude-skills/measure/assets/` and `templates/` both contain the new memory artifact templates.
4. The new-track workflow explicitly checks file size budget, then loads `lessons-learned.md` before generating a plan.
5. The new-track workflow checks `tech-debt.md` during spec gathering and surfaces relevant open items.
6. The implement workflow loads relevant memory files before execution and prompts for retrospective insights before finalizing a track.
7. The review workflow loads recurring gotchas before analysis and offers to log Critical/High findings to `lessons-learned.md`.
8. The status workflow shows the last update date of `lessons-learned.md`, count of open tech debt items, and the current memory-file line counts.
9. `metadata.json` templates in setup.md and new-track.md include `estimated_tasks`, `actual_tasks`, and `deviation_notes` fields, and the workflows describe when to populate them.
10. A standard helper script or command path exists for checking context-budget limits before reading the memory files.

## Out of Scope

- Automated analysis or summarization of lessons-learned entries.
- Machine-readable structured format for lessons (kept as free-form Markdown for human readability).
- Retroactive updates to existing completed tracks' `metadata.json`.
- Integration with external issue trackers for tech debt items.
