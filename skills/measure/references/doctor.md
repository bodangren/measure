# Doctor Workflow

Execute architectural linting and structural checks on the repository to prevent context drift and architectural degradation.

## Prerequisites

Validate every tool call. If any fails, halt immediately and inform the user.

## 1.0 Setup Check

**PROTOCOL: Verify that the Measure environment and Doctor script exist.**

1. **Verify Core Context:** Using the **Universal File Resolution Protocol**, resolve and verify the existence of:
   - **Product Definition**
   - **Tech Stack**
   - **Workflow**
   - **Doctor Script** (`measure/doctor.sh` or equivalent project script)
   - **Generate Script** (`measure/generate.sh` or equivalent project script)

2. **Handle Failure:** If the Doctor Script or Generate Script are missing, announce: "Measure architecture tools are not set up. Please ensure `measure/doctor.sh` and `measure/generate.sh` exist." and HALT.

## 2.0 Doctor Execution

### 2.1 Regenerate Facts

1. Announce: "I will first regenerate the architecture facts to ensure our state is up to date."
2. Execute the **Generate Script** (e.g., `./measure/generate.sh` or `npm run generate`).
3. If the script fails, report the error to the user and ask if they would like to attempt a fix.

### 2.2 Run Architecture Linter

1. Announce: "I will now run the architecture linter (Doctor)."
2. Execute the **Doctor Script** (e.g., `./measure/doctor.sh` or `npm run doctor`).
3. Capture the output.

### 2.3 Verify Generated Docs Freshness

1. Execute `git diff --exit-code measure/generated/` to check if the generated docs differ from what is committed.

## 3.0 Doctor Report & Remediation

1. **Analyze Results:**
   - Did the Doctor script pass (exit code 0)?
   - Did the git diff pass (exit code 0)?
   - Are there any architectural violations (e.g., import boundary breaches, missing contracts)?

2. **Remediation Loop:**
   - If there are violations:
     - Announce: "The Doctor found architectural violations:" followed by the output.
     - Propose fixes for the violations (e.g., removing a cross-feature import, exporting a missing schema).
     - Ask the user: "Would you like me to attempt to fix these violations automatically?"
     - If yes, apply the fixes and re-run the Doctor loop. If no, halt.
   - If there are uncommitted changes in `measure/generated/`:
     - Announce: "The generated architecture facts were stale."
     - Stage and commit the changes: `git commit -m "chore(measure): Regenerate architecture facts (Doctor)"`.

3. **Final Report:**
   - If all checks pass: "The Doctor found no architectural violations. The project is healthy."
   - Update state: `{"last_successful_step": "doctor_complete"}`
