# Status Workflow

Display project progress overview including completed, in-progress, and pending tasks.

## Prerequisites

Validate every tool call. If any fails, halt immediately and inform the user.

## 1.0 Setup Check

**PROTOCOL: Verify that the Measure environment is properly set up.**

1.  **Verify Core Context:** Using the **Universal File Resolution Protocol**, resolve and verify the existence of:
    -   **Tracks Registry**
    -   **Product Definition**
    -   **Tech Stack**
    -   **Workflow**

2.  **Handle Failure:** If ANY of these are missing (or their resolved paths do not exist), Announce: "Measure is not set up. Please run setup first." and HALT.

## 2.0 Read Project Data

1.  **Locate and Parse Tracks Registry:**
    -   Resolve the **Tracks Registry**.
    -   Read and parse this file. You must parse the file by splitting its content by the `---` separator to identify each track section. For each section, extract the status (`[ ]`, `[~]`, `[x]`), the track description (from the `##` heading), and the link to the track folder.

2.  **Locate Tracks Directory:** Resolve the **Tracks Directory**.

3.  **Read Track Plans:** For each track in the **Tracks Registry**, resolve and read its **Implementation Plan** (`plan.md`).

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
═══════════════════════════════════════════════════════════
                    MEASURE STATUS REPORT
═══════════════════════════════════════════════════════════

📅 Date/Time: <current timestamp>

📊 Project Status: <On Track | Behind Schedule | Blocked>

───────────────────────────────────────────────────────────
                      CURRENT WORK
───────────────────────────────────────────────────────────

🔄 Current Track: <track description>
   Phase: <current phase>
   Task:  <current in-progress task>

⏭️  Next Action: <next pending task>

🚧 Blockers: <any blocked items, or "None">

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

═══════════════════════════════════════════════════════════
```

## Status Determination Logic

- **On Track**: Has in-progress tasks, no blockers
- **Blocked**: Has items explicitly marked as blocked
- **Behind Schedule**: No in-progress tasks but pending tasks exist
- **Complete**: All tasks marked as `[x]`
