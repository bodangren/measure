# Implement Workflow

Execute tasks from a track's plan following the TDD workflow.

## Prerequisites

Validate every tool call. If any fails, halt immediately and inform the user.

## 1.0 Setup Check

**PROTOCOL: Verify that the Measure environment is properly set up.**

1. **Verify Core Context:** Using the **Universal File Resolution Protocol**, resolve and verify the existence of:
   - **Product Definition**
   - **Tech Stack**
   - **Workflow**

2. **Handle Failure:** If ANY of these are missing (or their resolved paths do not exist), Announce: "Measure is not set up. Please run setup first." and HALT.

3. **Activate Relevant Skills:**
   - Check for the existence of installed skills in `.claude/skills/` (workspace-level).
   - If skills exist, list the subdirectories to identify available skills.
   - Based on the track's **Specification**, **Implementation Plan**, and **Product Definition**, determine if any installed skills are relevant.
   - **CRITICAL:** For every relevant skill identified, read its `SKILL.md` and reference files.
   - Explicitly apply and prioritize the guidelines, commands, and constraints from these files during task execution.

## 2.0 Track Selection

**PROTOCOL: Identify and select the track to be implemented.**

1. **Check for User Input:** First, check if the user provided a track name as an argument.

2. **Locate and Parse Tracks Registry:**
   - Resolve the **Tracks Registry**.
   - Read and parse this file by splitting its content by the `---` separator to identify each track section. For each section, extract the status (`[ ]`, `[~]`, `[x]`), the track description, and the link to the track folder.
   - **CRITICAL:** If no track sections are found after parsing, announce: "The tracks file is empty or malformed. No tracks to implement." and halt.

3. **Select Track:**
   - **If a track name was provided:**
     1. Perform an exact, case-insensitive match against the track descriptions.
     2. If a unique match is found, confirm with the user: "I found track '<track_description>'. Is this correct?"
     3. If no match or ambiguous, inform the user and ask for the correct track name.
   - **If no track name was provided:**
     1. **Identify Next Track:** Find the first track NOT marked as `[x]` Completed.
     2. If found, ask: "No track name provided. Would you like to proceed with the next incomplete track: '<track_description>'?"
     3. If declined, ask for the specific track name.
     4. If no incomplete tracks found, announce: "All tasks are completed!" and halt.

4. **Handle No Selection:** If no track is selected, inform the user and await further instructions.

## 3.0 Track Implementation

**PROTOCOL: Execute the selected track.**

### 3.1 Initialize

1. Announce which track you're beginning to implement.
2. Update status to 'In Progress' in the **Tracks Registry** file:
   - Find the specific heading for the track and replace `[ ]` with `[~]`.

### 3.2 Load Context

1. **Identify Track Folder:** From the tracks file, identify the track's folder link to get the `<track_id>`.
2. **Read Files:**
   - **Track Context:** Using the **Universal File Resolution Protocol**, resolve and read the **Specification** and **Implementation Plan** for the selected track.
   - **Workflow:** Resolve **Workflow** (via the **Universal File Resolution Protocol** using the project's index file).
3. **Error Handling:** If you fail to read any of these files, you MUST stop and inform the user of the error.
4. **Load Project Memory:** Resolve **Lessons Learned** and **Tech Debt Registry** (if they exist).
   - Check line count with `wc -l` before loading. If either file exceeds 50 lines, summarize or prune it first.
   - Load relevant entries so implementation benefits from project memory.
   - If either file does not exist, log a warning and continue.

### 3.3 Execute Tasks

1. **Announce:** State that you will now execute the tasks from the track's **Implementation Plan** by following the procedures in the **Workflow**.
2. **Iterate Through Tasks:** You MUST now loop through each task in the track's **Implementation Plan** one by one.
3. **For Each Task, You MUST:**
   - **Defer to Workflow:** The **Workflow** file is the **single source of truth** for the entire task lifecycle. You MUST now read and execute the procedures defined in the "Task Workflow" section of the **Workflow** file you have in your context. Follow its steps for implementation, testing, and committing precisely.

### 3.4 Finalize Track

1. **Retrospective:** Before marking the track as complete, ask the user:
   - "Were there any surprises or deviations from the plan worth documenting?"
   - "Were any shortcuts taken that should be logged as tech debt?"
   - "Were there insights that should be added to lessons-learned.md?"
   - If yes to any, append entries to **Lessons Learned** or **Tech Debt Registry** as appropriate. If either file does not exist, warn the user and skip.

2. **Update Track Metadata:** Read the track's `metadata.json`.
   - Set `actual_tasks` to the total number of completed tasks in the **Implementation Plan**.
   - If the actual work materially differed from the original plan (e.g., tasks were added, removed, or significantly changed), fill `deviation_notes` with a brief explanation.
   - Write the updated `metadata.json`.

3. After all tasks in the track's local **Implementation Plan** are completed, update the track's status in the **Tracks Registry** (from `[~]` to `[x]`).
4. **Commit Changes:** Stage the **Tracks Registry** file, `metadata.json`, and any updated memory files. Commit with the message `chore(measure): Mark track '<track_description>' as complete`.
5. Announce that the track is fully complete and the tracks file has been updated.

## 4.0 Synchronize Documentation

**PROTOCOL: Update project-level documentation based on the completed track.**

1. **Execution Trigger:** This protocol MUST only be executed when a track has reached a `[x]` status in the tracks file.

2. **Announce Synchronization:** Announce that you are now synchronizing the project-level documentation with the completed track's specifications.

3. **Load Track Specification:** Read the track's **Specification**.

4. **Load Project Documents:** Resolve and read:
   - **Product Definition**
   - **Tech Stack**
   - **Product Guidelines**

5. **Analyze and Update:**
   - **Update Product Definition:**
     - Determine if the completed feature significantly impacts the description of the product itself.
     - If needed, propose updates in diff format and embed in a confirmation prompt:
       > "Please review the proposed updates to the Product Definition below. Do you approve?"
       > ```diff
       > [proposed changes]
       > ```
     - Only edit after explicit confirmation. Record whether this file was changed.
   - **Update Tech Stack:**
     - Determine if significant changes in the technology stack are detected.
     - If needed, propose updates in diff format with embedded confirmation. Only edit after explicit confirmation. Record whether changed.
   - **Update Product Guidelines (Strictly Controlled):**
     - **CRITICAL WARNING:** This file defines the core identity and communication style of the product. It should be modified with extreme caution and ONLY in cases of significant strategic shifts, such as a product rebrand or a fundamental change in user engagement philosophy. Routine feature updates or bug fixes should NOT trigger changes.
     - You may ONLY propose an update if the track's **Specification** explicitly describes a change that directly impacts branding, voice, tone, or other core product guidelines.
     - If the conditions are met, propose changes with a clear warning:
       > "WARNING: This is a sensitive action as it impacts core product guidelines. Please review the proposed changes below. Do you approve?"
       > ```diff
       > [proposed changes]
       > ```
     - Only edit after explicit confirmation. Record whether changed.

6. **Final Report:** Announce completion and provide a summary.
   - Construct the message based on which files were changed:
     - If files changed: "Documentation synchronization is complete. Changes made to: <list>. No changes needed for: <list>."
     - If no files changed: "Documentation synchronization is complete. No updates were necessary."
   - **Commit Changes:** If any files were changed, stage and commit with message `docs(measure): Synchronize docs for track '<track_description>'`.

## 5.0 Track Cleanup

**PROTOCOL: Offer to archive or delete the completed track.**

1. **Execution Trigger:** Executed after implementation and documentation sync are complete.

2. **Ask for User Choice:**
   > "Track '<track_description>' is now complete. What would you like to do?"
   > Options:
   > - **Review (Recommended):** Run the review command to verify changes before finalizing.
   > - **Archive:** Move the track's folder to `measure/archive/` and remove it from the tracks file.
   > - **Delete:** Permanently delete the track's folder and remove it from the tracks file.
   > - **Skip:** Do nothing and leave it in the tracks file.

3. **Handle User Response:**

   - **Review:** Announce: "Please run `review` to verify your changes. You will be able to archive or delete the track after the review."
   - **Archive:**
     1. Ensure `measure/archive/` exists.
     2. Move the track's folder from its current location to `measure/archive/<track_id>`.
     3. Remove the track's section from the **Tracks Registry**.
     4. Stage the registry and archive. Commit: `chore(measure): Archive track '<track_description>'`.
     5. Announce: "Track '<track_description>' has been successfully archived."
   - **Delete:**
     1. Warn: "WARNING: This will permanently delete the track folder and all its contents. This action cannot be undone. Are you sure?"
     2. If confirmed: Delete the track folder, remove from **Tracks Registry**, commit: `chore(measure): Delete track '<track_description>'`.
     3. Announce: "Track '<track_description>' has been permanently deleted."
     4. If denied: Announce: "Deletion cancelled."
   - **Skip:** Announce: "Okay, the completed track will remain in your tracks file for now."
