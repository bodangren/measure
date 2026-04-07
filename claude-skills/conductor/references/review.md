# Review Workflow

Review the implementation of a track or a set of changes against the project's standards, design guidelines, and the original plan.

## Prerequisites

Validate every tool call. If any fails, halt immediately and inform the user.

## 1.0 Setup Check

**PROTOCOL: Verify that the Conductor environment is properly set up.**

1.  **Verify Core Context:** Using the **Universal File Resolution Protocol**, resolve and verify the existence of:
    -   **Tracks Registry**
    -   **Product Definition**
    -   **Tech Stack**
    -   **Workflow**
    -   **Product Guidelines**

2.  **Handle Failure:** If ANY of these files are missing, list them, announce: "Conductor is not set up. Please run setup first." and HALT.

## 2.0 Review Protocol

**PROTOCOL: Follow this sequence to perform a code review.**

### 2.1 Identify Scope

1.  **Check for User Input**: If arguments were provided, use them as the target scope.
2.  **Auto-Detect Scope**:
    -   If no input, read the **Tracks Registry**.
    -   Look for a track marked as `[~] In Progress`.
    -   Ask the user if they want to review that track.
    -   If none or user declines, ask the user what they would like to review.
3.  **Confirm Scope**: Ensure the target of the review is clear.

### 2.2 Retrieve Context

1.  **Load Project Context**:
    -   Read **Product Guidelines** and **Tech Stack**.
    -   **CRITICAL:** Check for `conductor/code_styleguides/`. Read ALL `.md` files within it. Violations here are **High** severity.
    -   **Check for Installed Skills:**
        -   Check for the existence of `.claude/skills/` (workspace-level).
        -   If skills exist, list the subdirectories to identify installed skills.
        -   If relevant skills (e.g., `gcp-*`, `firebase-*`) are found, enable specialized feedback for those domains.
    -   **Load Recurring Gotchas:** Resolve **Lessons Learned** (if it exists). Check line count with `wc -l`; if over 50 lines, summarize or prune before loading. Read the "Recurring Gotchas" section so the review can check for repeated failure modes. If the file does not exist, skip silently.
2.  **Load Track Context (if applicable)**:
    -   Read the track's **Implementation Plan**.
    -   Extract commit hashes and determine the revision range.
3.  **Load and Analyze Changes (Smart Chunking)**:
    -   **Small/Medium Changes (< 300 lines)**: Get full diff.
    -   **Large Changes (> 300 lines)**: Use 'Iterative Review Mode'. List files and iterate through them one by one.

### 2.3 Analyze and Verify

1.  **Intent Verification**: Does the code implement the plan/spec?
2.  **Style Compliance**: Follow **Product Guidelines** and **Code Styleguides**.
3.  **Correctness & Safety**: Look for bugs, race conditions, security risks (secrets, PII, unsafe input).
4.  **Testing**:
    -   Check for new tests.
    -   **Execute the test suite automatically**: Infer and run the test command (e.g., `npm test`, `pytest`). Analyze output.

5.  **Skill-Specific Checks:**
    -   If specific skills are installed (e.g., GCP, Firebase), verify compliance with their best practices.

### 2.4 Output Findings

Format report with:
- **Summary**: Overall quality.
- **Verification Checks**: Plan compliance, style compliance, new tests, coverage, results.
- **Findings**: For each issue, include severity (Critical/High/Medium/Low), file/lines, context, and a suggested diff.

## 3.0 Completion Phase

### 3.1 Review Decision

1.  **Recommend**: Recommendation based on severity of findings.
2.  **Action**:
    -   **Apply Fixes (A)**: Automatically apply suggested changes. After applying, if any findings were **Critical** or **High** severity, offer: "Would you like to log the root cause of these findings to `lessons-learned.md` under 'Recurring Gotchas'?" If yes, append an entry with the date and track ID. If `lessons-learned.md` does not exist, warn the user and skip.
    -   **Manual Fix (B)**: Stop for user to fix.
    -   **Complete Track (C)**: Proceed to cleanup.

### 3.2 Commit Review Changes

1.  **Check for Changes**: If changes exist, offer to commit them.
2.  **Handle Track-Specific Changes**:
    -   If yes, update the **Implementation Plan** with a "Review Fixes" phase/task.
    -   Commit code with `fix(conductor): Apply review suggestions for track '<track_name>'`.
    -   Update plan with SHA and commit plan update.

### 3.3 Track Cleanup

Offer to **Archive**, **Delete**, or **Skip** the reviewed track (following the same protocol as Implement Workflow).
