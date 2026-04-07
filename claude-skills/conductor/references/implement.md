# Implement Workflow

Execute tasks from a track's plan following the TDD workflow.

## Prerequisites

Validate every tool call. If any fails, halt immediately and inform the user.

## 1.0 Setup Check

**PROTOCOL: Verify that the Conductor environment is properly set up.**

1.  **Verify Core Context:** Using the **Universal File Resolution Protocol**, resolve and verify the existence of:
    -   **Product Definition**
    -   **Tech Stack**
    -   **Workflow**

2.  **Handle Failure:** If ANY of these are missing (or their resolved paths do not exist), Announce: "Conductor is not set up. Please run setup first." and HALT.

3.  **Activate Relevant Skills:**
   - Check for the existence of installed skills in `.claude/skills/` (workspace-level).
   - If skills exist, list the subdirectories to identify available skills.
   - Based on the track's **Specification**, **Implementation Plan**, and **Product Definition**, determine if any installed skills are relevant.
   - **CRITICAL:** For every relevant skill identified, ask the agent to activate it and read its `SKILL.md` and reference files.
   - Explicitly apply and prioritize the guidelines, commands, and constraints from these files during task execution.

## 2.0 Track Selection

**PROTOCOL: Identify and select the track to be implemented.**

1.  **Check for User Input:** First, check if the user provided a track name as an argument.

2.  **Locate and Parse Tracks Registry:**
    -   Resolve the **Tracks Registry**.
    -   Read and parse this file. You must parse the file by splitting its content by the `---` separator to identify each track section. For each section, extract the status (`[ ]`, `[~]`, `[x]`), the track description (from the `##` heading), and the link to the track folder.
    -   **CRITICAL:** If no track sections are found after parsing, announce: "The tracks file is empty or malformed. No tracks to implement." and halt.

3.  **Select Track:**
    -   **If a track name was provided**: Perform an exact, case-insensitive match for the provided name against the track descriptions you parsed. If a unique match is found, confirm the selection with the user.
    -   **If no track name was provided**:
        1.  **Identify Next Track**: Find the first track in the parsed tracks file that is NOT marked as `[x] Completed`.
        2.  **If a next track is found**: Announce and proceed with this track.
        3.  **If no incomplete tracks are found**: Announce: "All tasks are completed!" and halt.

4.  **Handle No Selection**: If no track is selected, inform the user and await further instructions.

## 3.0 Track Implementation

**PROTOCOL: Execute the selected track.**

### 3.1 Initialize

1. Announce which track you're beginning to implement.
2. Update status to 'In Progress' in the **Tracks Registry** file:
   - Find the specific heading for the track (e.g., `## [ ] Track: <Description>`) and replace it with the updated status (e.g., `## [~] Track: <Description>`) in the **Tracks Registry** file.

### 3.2 Load Context

1.  **Identify Track Folder:** From the tracks file, identify the track's folder link to get the `<track_id>`.
2.  **Read Files:**
    -   **Track Context:** Using the **Universal File Resolution Protocol**, resolve and read the **Specification** and **Implementation Plan** for the selected track.
    -   **Workflow:** Resolve **Workflow** (via the **Universal File Resolution Protocol** using the project's index file).
3.  **Error Handling:** If you fail to read any of these files, you MUST stop and inform the user of the error.
4.  **Load Project Memory:** Resolve **Lessons Learned** and **Tech Debt Registry** (if they exist).
    -   Check line count with `wc -l` before loading. If either file exceeds 50 lines, summarize or prune it first.
    -   Load relevant entries so implementation benefits from project memory.
    -   If either file does not exist, log a warning and continue.

### 3.3 Execute Tasks

1.  **Announce:** State that you will now execute the tasks from the track's **Implementation Plan** by following the procedures in the **Workflow**.
2.  **Iterate Through Tasks:** You MUST now loop through each task in the track's **Implementation Plan** one by one.
3.  **For Each Task, You MUST:**
    i. **Defer to Workflow:** The **Workflow** file is the **single source of truth** for the entire task lifecycle. You MUST now read and execute the procedures defined in the "Task Workflow" section of the **Workflow** file you have in your context. Follow its steps for implementation, testing, and committing precisely.

### 3.4 Finalize Track

1.  **Retrospective:** Before marking the track as complete, ask the user:
    -   "Were there any surprises or deviations from the plan worth documenting?"
    -   "Were any shortcuts taken that should be logged as tech debt?"
    -   "Were there insights that should be added to lessons-learned.md?"
    -   If yes to any, append entries to **Lessons Learned** or **Tech Debt Registry** as appropriate. If either file does not exist, warn the user and skip.

2.  **Update Track Metadata:** Read the track's `metadata.json`.
    -   Set `actual_tasks` to the total number of completed tasks in the **Implementation Plan**.
    -   If the actual work materially differed from the original plan (e.g., tasks were added, removed, or significantly changed), fill `deviation_notes` with a brief explanation.
    -   Write the updated `metadata.json`.

3.  After all tasks in the track's local **Implementation Plan** are completed, update the track's status in the **Tracks Registry**.
4.  **Commit Changes:** Stage the **Tracks Registry** file, `metadata.json`, and any updated memory files. Commit with the message `chore(conductor): Mark track '<track_description>' as complete`.
5.  Announce that the track is fully complete and the tracks file has been updated.

## 4.0 Synchronize Documentation

**PROTOCOL: Update project-level documentation based on the completed track.**

1.  **Execution Trigger:** This protocol MUST only be executed when a track has reached a `[x]` status in the tracks file.

2.  **Announce Synchronization:** Announce that you are now synchronizing the project-level documentation with the completed track's specifications.

3.  **Load Track Specification:** Read the track's **Specification**.

4.  **Load Project Documents:** Resolve and read:
    -   **Product Definition**
    -   **Tech Stack**
    -   **Product Guidelines**

5.  **Analyze and Update:**
    -   **Analyze Specification**: Identify features, functional changes, or tech stack updates.
    -   **Update Product Definition**: Propose changes in diff format and ask for confirmation before editing.
    -   **Update Tech Stack**: Propose changes in diff format and ask for confirmation before editing.
    -   **Update Product Guidelines (Strictly Controlled)**: ONLY for strategic shifts. Warn user and require explicit confirmation.

6.  **Final Report:** Announce completion and provide a summary.
    -   **Commit Changes**: Stage and commit any changed project documents.
    -   **Commit Message**: `docs(conductor): Synchronize docs for track '<track_description>'`

## 5.0 Track Cleanup

**PROTOCOL: Offer to archive or delete the completed track.**

1.  **Execution Trigger:** Executed after implementation and documentation sync are complete.

2.  **Ask for User Choice:**
    > "Track '<track_description>' is now complete. What would you like to do?
    > A. **Review (Recommended):** Run the review command to verify changes before finalizing.
    > B. **Archive:** Move the track's folder to `conductor/archive/` and remove it from the tracks file.
    > C. **Delete:** Permanently delete the track's folder and remove it from the tracks file.
    > D. **Skip:** Do nothing and leave it in the tracks file.
    > Please enter the option of your choice (A, B, C, or D)."

3.  **Handle User Response:**

    -   **Review (A)**: Announce: "Please run `/conductor:review` to verify your changes. You will be able to archive or delete the track after the review."
    -   **Archive (B)**: Create `conductor/archive/` if needed, move track folder, remove from **Tracks Registry**, and commit: `chore(conductor): Archive track '<track_description>'`.
    -   **Delete (C)**: Warn user of irreversible action, then delete folder, remove from **Tracks Registry**, and commit: `chore(conductor): Delete track '<track_description>'`.
    -   **Skip (D)**: Announce: "Track will remain in your tracks file."
