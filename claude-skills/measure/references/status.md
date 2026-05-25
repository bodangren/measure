# Status Workflow

Display project progress overview including completed, in-progress, and pending tasks.

## Prerequisites

Validate every tool call. If any fails, halt immediately and inform the user.

## 1.0 Setup Check

**PROTOCOL: Verify that the Measure environment is properly set up.**

1. **Verify Core Context:** Using the **Universal File Resolution Protocol**, resolve and verify the existence of:
   - **Tracks Registry**
   - **Product Definition**
   - **Tech Stack**
   - **Workflow**

2. **Handle Failure:** If ANY of these are missing (or their resolved paths do not exist), Announce: "Measure is not set up. Please run setup first." and HALT.

## 2.0 Read Project Data

1. **Locate and Parse Tracks Registry:**
   - Resolve the **Tracks Registry**.
   - Read and parse this file. Support both track formats:
     - New standard format: `- [ ] **Track: <Description>**`
     - Legacy format: `## [ ] Track: <Description>`
   - Split content by `---` separator to identify each track section. For each section, extract the status, the track description, and the link to the track folder.

2. **Locate Tracks Directory:** Resolve the **Tracks Directory**.

3. **Read Track Plans:** For each track in the **Tracks Registry**, resolve and read its **Implementation Plan** (`plan.md`).

4. **Read Track Metadata:** For each track, also resolve and read its `metadata.json` and extract: `type`, `status`, `estimated_tasks`, `actual_tasks`, `created_at`, `updated_at`, and the optional `sprint` object.
   - **Read-side rules (backward compatibility):**
     - If `metadata.json` is missing or malformed, skip silently and continue — do NOT HALT.
     - Treat absence of the `sprint` key as classic mode (no sprint data); never warn the user about this.
     - Accept both `"completed"` and `"complete"` as valid completed-status values.

## 3.0 Parse and Analyze

1. **Identify Phases**: Top-level markdown headings in each plan

2. **Identify Tasks**: Bullet points under headings with status markers:
   - `[ ]` - Pending
   - `[~]` - In Progress
   - `[x]` - Completed

3. **Calculate Totals**:
   - Total phases across all tracks
   - Total tasks
   - Completed tasks
   - In-progress tasks
   - Pending tasks

## 4.0 Generate Status Report

Present a clear, formatted report:

```
═════════════════════════════════════════════════════════════
                    MEASURE STATUS REPORT
═════════════════════════════════════════════════════════════

Date/Time: <current timestamp>

Project Status: <On Track | Behind Schedule | Blocked>

───────────────────────────────────────────────────────────
                       CURRENT WORK
───────────────────────────────────────────────────────────

Current Track: <track description>
   Phase: <current phase>
   Task:  <current in-progress task>

Next Action: <next pending task>

Blockers: <any blocked items, or "None">

───────────────────────────────────────────────────────────
                        PROGRESS
───────────────────────────────────────────────────────────

Tracks:
  Total:      <n>
  Completed:  <n>
  In Progress: <n>
  Pending:    <n>

Phases:
  Total: <n>

Tasks:
  Total:      <n>
  Completed:  <n> (<percentage>%)
  In Progress: <n>
  Pending:    <n>

Progress: [████████░░░░░░░░░░░░] <completed>/<total> (<percentage>%)

───────────────────────────────────────────────────────────
                     TRACK BREAKDOWN
───────────────────────────────────────────────────────────

<For each track>:
[<status>] <track description>
    Phases: <n> | Tasks: <completed>/<total> (<percentage>%)

───────────────────────────────────────────────────────────
                     PROJECT HEALTH
───────────────────────────────────────────────────────────

Lessons Learned:
  Last updated: <result of `git log -1 --format="%ar" -- measure/lessons-learned.md`, or "not created yet">
  Line count:   <line count via `wc -l`, or "N/A">
  Budget:       <OK or OVER_LIMIT (max 50 lines)>

Tech Debt:
  Open items:   <count of rows where Status = Open, or "not created yet">
  Line count:   <line count via `wc -l`, or "N/A">
  Budget:       <OK or OVER_LIMIT (max 50 lines)>

Velocity (last 3 feature tracks):
  <one of the following, per the rules in section "Velocity Calculation" below>
  - "<actual_1>, <actual_2>, <actual_3> tasks (avg <mean>)"
  - "<actual_1>[, <actual_2>] tasks (avg <mean>) (based on <n> track(s) — directional only)"
  - "not yet available — complete a feature track to start tracking velocity"

Estimation accuracy:
  <one of the following, omitted entirely when 0 qualifying tracks>
  - "actual / estimated = <ratio> (<qualifier>)"
  - "actual / estimated = <ratio> (<qualifier>) (based on <n> track(s) — directional only)"

═════════════════════════════════════════════════════════════
```

## Velocity Calculation

**PROTOCOL: Compute velocity and estimation accuracy from completed feature tracks.**

1. **Filter qualifying tracks** from the metadata collected in §2.0 step 4:
   - Track is marked `[x]` in the **Tracks Registry**.
   - `metadata.json.type == "feature"`.
   - `metadata.json.status` ∈ `{"completed", "complete"}`.
   - Both `metadata.json.estimated_tasks` and `metadata.json.actual_tasks` are non-null integers.
   - Skip any track with missing or malformed metadata.

2. **Sort qualifying tracks** most-recent first by `metadata.json.updated_at` if present, else `metadata.json.created_at`.

3. **Take the rolling window** of the first 3 qualifying tracks (the "last 3 feature tracks").

4. **Compute velocity:**
   - `actuals = [actual_tasks of each track in the window]`
   - `mean = round(sum(actuals) / len(actuals))`

5. **Compute estimation accuracy:**
   - `ratios = [actual_tasks / estimated_tasks for each track in the window]`
   - `ratio = round(mean(ratios), 2)`
   - Qualifier:
     - `ratio > 1.15` → `under-estimating`
     - `ratio < 0.85` → `over-estimating`
     - `0.85 ≤ ratio ≤ 1.15` → `calibrated`

6. **Render fallback strings** based on window size:
   - **0 tracks:** Velocity line shows `not yet available — complete a feature track to start tracking velocity`. Estimation accuracy line is **omitted entirely**.
   - **1–2 tracks:** Both lines include the suffix `(based on <n> track(s) — directional only)`.
   - **≥3 tracks:** Both lines render without the directional disclaimer.

## Status Determination Logic

- **On Track**: Has in-progress tasks, no blockers
- **Blocked**: Has items explicitly marked as blocked
- **Behind Schedule**: No in-progress tasks but pending tasks exist
- **Complete**: All tasks marked as `[x]`
