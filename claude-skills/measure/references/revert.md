# Revert Workflow

Revert previous work by analyzing Git history and reverting associated commits.

## Scope

Your defined scope is to revert the logical units of work tracked by Measure (Tracks, Phases, and Tasks). You achieve this by first guiding the user to confirm their intent, then investigating the Git history to find all real-world commit(s) associated with that work, and finally presenting a clear execution plan before any action is taken.

Your workflow MUST anticipate and handle common non-linear Git histories, such as rewritten commits (from rebase/squash) and merge commits.

## Prerequisites

Validate every tool call. If any fails, halt immediately and inform the user.

**CRITICAL:** The user's explicit confirmation is required at multiple checkpoints. If denied, halt immediately.

## 1.0 Setup Check

**PROTOCOL: Verify that the Measure environment is properly set up.**

1. **Verify Core Context:** Using the **Universal File Resolution Protocol**, resolve and verify the existence of:
   - **Tracks Registry**
   - **Product Definition**
   - **Tech Stack**
   - **Workflow**

2. **Handle Failure:** If ANY of these are missing (or their resolved paths do not exist), Announce: "Measure is not set up. Please run setup first." and HALT.

## 2.0 Target Selection

### If User Provided Target

**Path A: Direct Confirmation**

1. Find the track/phase/task in the **Tracks Registry** or **Implementation Plan** files (resolved via **Universal File Resolution Protocol**).
2. Confirm: "You asked to revert [Track/Phase/Task]: '<Description>'. Is this correct?"
3. If "yes", proceed to Git Reconciliation (Section 3.0)
4. If "no", ask clarifying questions

### If No Target Provided

**Path B: Guided Selection**

1. **Scan All Plans:**
   - Resolve and read the **Tracks Registry**.
   - For each track, resolve and read its **Implementation Plan**.

2. **Prioritize In-Progress** (`[~]`):
   - Find the **top 3** most relevant tracks, phases, and tasks marked `[~]`

3. **Fallback to Completed**:
   - If no in-progress items, find the **3 most recently completed** (`[x]`)

4. **Present Hierarchical Menu:**
   - Limit to a **maximum of 4 items** in the menu
   - Group by Track with description

   If in-progress found:
   ```
   I found multiple in-progress items. Please choose which one to revert:

   Track: track_20251208_user_profile
     1) [Phase] Implement Backend API
     2) [Task] Update user model

   3) A different Track, Task, or Phase.
   ```

   If showing completed:
   ```
   No items are in progress. Please choose a recently completed item to revert:

   Track: track_20251208_user_profile
     1) [Phase] Foundational Setup
     2) [Task] Initialize React application

   Track: track_20251208_auth_ui
     3) [Task] Create login form

   4) A different Track, Task, or Phase.
   ```

5. **Process Choice:**
   - If valid selection, proceed to Git Reconciliation (Section 3.0)
   - If "different" option, ask clarifying questions and loop back to Path A

6. If no completed items found, halt

## 3.0 Git Reconciliation

Goal: Find ALL commits associated with the target in Git history.

### 3.1 Identify Implementation Commits

1. Find primary SHA(s) from tasks/phases in target's `plan.md`

2. **Handle Ghost Commits** (rewritten history):
   - If SHA not found in git log, announce this
   - Search for commit with similar message
   - Ask user to confirm as replacement
   - If not confirmed, halt

### 3.2 Identify Plan-Update Commits

For each validated implementation commit:
- Use `git log` to find the plan-update commit that:
  - Happened AFTER the implementation commit
  - Modified the relevant `plan.md`

### 3.3 Track Creation Commit (Track Revert Only)

If reverting an entire track:
1. Run `git log -- measure/tracks.md`
2. Find commit that first introduced the track entry
3. Look for lines matching:
   - `- [ ] **Track: <Description>**` (new format)
   - `## [ ] Track: <Description>` (legacy format)
4. Add this SHA to revert list

### 3.4 Compile Final List

1. Compile all SHAs to be reverted
2. Check for merge commits
3. Warn about cherry-pick duplicates

## 4.0 Execution Plan Confirmation

Present summary before any action:

```
I have analyzed your request. Here is the plan:

• Target: Revert Task '<Task Description>'
• Commits to Revert: 2
  - <sha_code_commit> ('feat: Add user profile')
  - <sha_plan_commit> ('measure(plan): Mark task complete')
• Action: I will run `git revert` on these commits in reverse order.
```

**Final Confirmation:** Ask: "Do you want to proceed?"
- **Approve:** Proceed to execution (Section 5.0)
- **Revise:** Ask: "Please describe the changes needed for the revert plan." Then update the plan and re-confirm.

## 5.0 Execution

### 5.1 Execute Reverts

For each commit (starting from most recent, working backward):
```bash
git revert --no-edit <sha>
```

### 5.2 Handle Conflicts

If revert fails due to merge conflict:
1. HALT execution
2. Provide clear instructions:
   ```
   A merge conflict occurred while reverting <sha>.

   To resolve manually:
   1. Check `git status` for conflicting files
   2. Edit files to resolve conflicts
   3. Stage resolved files: `git add <files>`
   4. Complete revert: `git revert --continue`

   Or abort: `git revert --abort`
   ```

### 5.3 Verify Plan State

1. Read relevant `plan.md` file(s)
2. Verify reverted item shows correct status
3. If not correctly reset:
   - Edit file to fix status
   - Commit correction

### 5.4 Announce Completion

```
Revert complete!

• Reverted: <target description>
• Commits reverted: <count>
• Plan status: Synchronized

The work has been undone and the plan reflects the current state.
```
