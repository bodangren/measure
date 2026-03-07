# Specification: Conductor Workflow Memory & Learning Improvements

## Overview

Add persistent learning mechanisms to the conductor workflow, enabling projects to accumulate knowledge across tracks. This includes a lessons-learned memory file, a tech debt registry, and integration points in the setup, new-track, implement, review, and status workflows that surface this knowledge during planning and execution.

The core problem being solved: insights discovered during one track are currently lost. The next track starts with no memory of what worked, what caused delays, or what shortcuts were taken. This feature closes that loop.

## Functional Requirements

### FR-1: Lessons Learned File (`conductor/lessons-learned.md`)

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

### FR-2: Tech Debt Registry (`conductor/tech-debt.md`)

A table-based Markdown file, created as a stub during setup:

```markdown
# Tech Debt Registry

| Date | Track | Item | Severity | Notes |
|------|-------|------|----------|-------|
```

Severity values: `Critical`, `High`, `Medium`, `Low`.

### FR-3: Setup Workflow Integration

The setup workflow (`references/setup.md`) must:

1. Create `conductor/lessons-learned.md` stub after step 2.5 (Workflow creation).
2. Create `conductor/tech-debt.md` stub after step 2.5.
3. Add named index entries for both files in `conductor/index.md`:
   - `**Lessons Learned**`: link to `./lessons-learned.md`
   - `**Tech Debt Registry**`: link to `./tech-debt.md`

### FR-4: New Track Workflow Integration

The new track workflow (`references/new-track.md`) must:

1. **Before plan generation (§2.3):** Load `lessons-learned.md` (if it exists) and use its contents to:
   - Identify known gotchas relevant to the track type or feature area.
   - Adjust task complexity estimates based on "Planning Improvements" entries.
   - Note relevant patterns in the generated plan.
2. **During spec questions (§2.2):** After gathering requirements, check `tech-debt.md` (if it exists) for items relevant to the feature area and surface them as a question: "There are open tech debt items that may relate to this track. Would you like to address any of them?"

### FR-5: Implement Workflow Integration

The implement workflow (`references/implement.md`) must:

1. **Before track finalization (§3.4):** Add a retrospective step that prompts:
   - "Were there any surprises or deviations from the plan worth documenting?"
   - "Were any shortcuts taken that should be logged as tech debt?"
   - "Were there insights that should be added to lessons-learned.md?"
   - If yes to any, append the relevant entries before committing the track as complete.
2. **In the workflow template (`assets/workflow.md`):** Add a note in the task workflow that when a shortcut is knowingly taken (e.g., skipping an edge case), the agent should prompt the user to add a row to `tech-debt.md`.

### FR-6: Review Workflow Integration

The review workflow (`references/review.md`) must:

1. **After fixing Critical or High severity findings (§3.1):** Offer to log the root cause to `lessons-learned.md` under "Recurring Gotchas" so the same class of error doesn't recur.

### FR-7: Status Workflow Integration

The status workflow (`references/status.md`) must:

1. Include a "Project Health" section that shows:
   - Last update date of `lessons-learned.md` (from `git log -1 --format="%ar" -- conductor/lessons-learned.md`).
   - Count of open rows in `tech-debt.md` (non-header rows).

### FR-8: Metadata Schema Update

The `metadata.json` template in both `references/setup.md` and `references/new-track.md` must include:

```json
"estimated_tasks": null,
"actual_tasks": null,
"deviation_notes": ""
```

`estimated_tasks` is filled at plan creation time (count of tasks in `plan.md`). `actual_tasks` is filled at track completion.

## Non-Functional Requirements

- All new files follow existing conductor Markdown conventions (see product-guidelines.md).
- Changes to workflow reference files are **additive only** — no existing steps are removed or reordered.
- `lessons-learned.md` and `tech-debt.md` are **optional** files: workflows that reference them must gracefully handle their absence (log a warning, do not HALT).
- Both `claude-skills/conductor/` and `templates/` copies must be updated for any template file changes.

## Acceptance Criteria

1. After running setup, `conductor/lessons-learned.md` and `conductor/tech-debt.md` exist with the stub content defined in FR-1 and FR-2.
2. `conductor/index.md` has named entries for `**Lessons Learned**` and `**Tech Debt Registry**`.
3. The new-track workflow explicitly loads `lessons-learned.md` before generating a plan.
4. The new-track workflow checks `tech-debt.md` during spec gathering and surfaces relevant items.
5. The implement workflow prompts for retrospective insights before finalizing a track.
6. The review workflow offers to log Critical/High findings to `lessons-learned.md`.
7. The status workflow shows the last update date of `lessons-learned.md` and count of open tech debt items.
8. `metadata.json` templates in setup.md and new-track.md include `estimated_tasks`, `actual_tasks`, and `deviation_notes` fields.

## Out of Scope

- Automated analysis or summarization of lessons-learned entries.
- Machine-readable structured format for lessons (kept as free-form Markdown for human readability).
- Retroactive updates to existing completed tracks' `metadata.json`.
- Auto-populating `estimated_tasks` by counting plan tasks (manual entry is sufficient for now).
- Integration with external issue trackers for tech debt items.
