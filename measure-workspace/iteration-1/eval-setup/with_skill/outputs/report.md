# Measure Skill Setup Simulation Report

**Scenario:** User says: *"Set up Measure for my existing Next.js project."*

**Skill Version:** `/home/daniel-bo/Desktop/conductor/claude-skills/measure/SKILL.md` + `references/setup.md`

**Date Simulated:** 2026-04-25

---

## Executive Summary

When the user invokes the Measure skill with an existing Next.js project, the agent follows the **Brownfield Workflow** defined in `references/setup.md`. The agent performs a read-only project discovery scan, then interactively generates 8 core project documents, copies styleguide and workflow assets, installs relevant skills, and proposes an initial MVP track. The entire process creates approximately **15–20 files** under the `measure/` directory and commits them with the message `measure(setup): Add measure setup files`.

**All references in this report use "Measure" (not "Conductor").**
**All directory paths use `measure/` (not `conductor/`).**

---

## Step-by-Step Agent Action Plan

### Phase 0: Resume Check

**Action:** Check for `measure/setup_state.json`

- If **exists**: Read `last_successful_step` and resume from the next step.
- If **missing**: Begin full setup from Step 1.0.

**Assumption for this simulation:** File does not exist → full setup begins.

---

### Phase 1: Project Discovery (Brownfield)

#### 1.1 Detect Project Maturity

**Agent checks the following (ANY triggers Brownfield):**
- `.git/` directory exists → **YES**
- `git status --porcelain` shows uncommitted changes → variable
- `package.json` exists → **YES** (Next.js project)
- `src/` or `app/` directory with code files → **YES**

**Result:** Brownfield (Existing Project)

#### 1.2 Announce & Warn

**Agent says:**
> "I detected an existing project. Setting up Measure for a brownfield Next.js project."

If `git status --porcelain` returns uncommitted changes:
> "⚠️ Warning: You have uncommitted changes. It's recommended to commit or stash them before proceeding."

#### 1.3 Ask Permission for Read-Only Scan

**Agent asks (interactive):**
> "May I perform a read-only analysis of your project to understand the codebase? This will help me ask context-aware questions."

**Options:** Approve / Decline

#### 1.4 Execute Read-Only Analysis (If Approved)

**Actions:**
1. Read `README.md` first.
2. Run `git ls-files --exclude-standard -co` to list tracked files.
3. Respect `.gitignore` and `.geminiignore` patterns.
4. Read `package.json` (manifest priority).
5. For files >1MB, read only first/last 20 lines.

**Extracted information for Next.js project:**
- **Language:** TypeScript/JavaScript
- **Framework:** Next.js (inferred from `package.json` dependencies)
- **Database:** Likely none, Prisma, or MongoDB (from `package.json`)
- **Architecture:** React Server Components / App Router or Pages Router
- **Project goal:** From `package.json` description or `README.md`

#### 1.5 Proceed to Document Generation

---

### Phase 2: Interactive Document Generation

#### 2.1 Product Definition (`measure/product.md`)

**Agent announces:**
> "Now creating the **Product Definition**. I'll ask 3–5 context-aware questions based on your Next.js project."

**Example questions for a Next.js project:**
1. "What is the primary purpose of this Next.js app?"
   - Option A: Marketing website / landing page
   - Option B: SaaS dashboard / web application
   - Option C: E-commerce store
   - Option D: Type your own answer
   - Option E: Autogenerate and review

2. "Who are the target users?"
   - Option A: End consumers (B2C)
   - Option B: Business users (B2B)
   - Option C: Internal team / developers
   - Option D: Type your own answer
   - Option E: Autogenerate and review

3. "What are the top 3 features currently implemented or planned?"
   - (Suggested options based on detected routes/pages)
   - Option D: Type your own answer
   - Option E: Autogenerate and review

4. "What problem does this project solve for users?"
   - (Context-aware options)
   - Option D: Type your own answer
   - Option E: Autogenerate and review

5. "What makes this product different from alternatives?"
   - (Context-aware options)
   - Option D: Type your own answer
   - Option E: Autogenerate and review

**After user responds:**
1. Agent drafts `measure/product.md` based **ONLY** on selected answers.
2. Presents draft for review.
3. User options: **Approve** / **Suggest Changes**
4. On approval, writes file to `measure/product.md`.
5. Updates `measure/index.md` with link to **Product Definition**.
6. Updates `measure/setup_state.json`:
   ```json
   {"last_successful_step": "2.1_product_guide"}
   ```

**Files created/modified:**
- `measure/product.md` (new)
- `measure/index.md` (new or updated)
- `measure/setup_state.json` (new or updated)

---

#### 2.2 Product Guidelines (`measure/product-guidelines.md`)

**Agent announces:**
> "Creating **Product Guidelines** — prose style, brand messaging, and visual identity."

**Example questions:**
1. "What tone should the UI copy and messaging use?"
   - Option A: Professional and formal
   - Option B: Friendly and conversational
   - Option C: Technical and precise
   - Option D: Type your own answer
   - Option E: Autogenerate and review

2. "Do you have existing brand colors or a design system?"
   - Option A: Yes, I have a design system
   - Option B: I have brand colors only
   - Option C: No, start from scratch
   - Option D: Type your own answer
   - Option E: Autogenerate and review

3. "What is the desired user emotion when interacting with the app?"
   - Option A: Trust and confidence
   - Option B: Delight and fun
   - Option C: Efficiency and control
   - Option D: Type your own answer
   - Option E: Autogenerate and review

4. "Are there any words or phrases to avoid in the product?"
   - Option A: Jargon-heavy technical terms
   - Option B: Overly casual slang
   - Option C: Competitor names
   - Option D: Type your own answer
   - Option E: Autogenerate and review

5. "What is the primary call-to-action style?"
   - Option A: Action-oriented verbs (e.g., "Get Started")
   - Option B: Benefit-oriented (e.g., "Save Time Now")
   - Option C: Neutral descriptors (e.g., "Learn More")
   - Option D: Type your own answer
   - Option E: Autogenerate and review

**After user responds:**
1. Draft `measure/product-guidelines.md`.
2. Present for review.
3. On approval, write to `measure/product-guidelines.md`.
4. Update `measure/index.md` with link to **Product Guidelines**.
5. Update state:
   ```json
   {"last_successful_step": "2.2_product_guidelines"}
   ```

**Files created/modified:**
- `measure/product-guidelines.md` (new)
- `measure/index.md` (updated)
- `measure/setup_state.json` (updated)

---

#### 2.3 Design Definition (`DESIGN.md`)

**Agent announces:**
> "Creating the **Design Definition** using the `@google/design.md` specification. For inspiration, you can visit `getdesign.md`. What visual identity do you prefer? For example: 'Apple cinematic', 'Stripe elegance', 'Vercel minimalism', etc."

**User provides a style preference.**

**Agent actions:**
1. Draft `DESIGN.md` in the **project root** (not under `measure/`).
2. Ensure strict adherence to `@google/design.md` spec.
3. Avoid generic terms like "clean" or "modern" without substance.
4. Present for review.
5. On approval, write to `./DESIGN.md`.
6. Update `measure/index.md` with link to **Design Definition**.
7. Update state:
   ```json
   {"last_successful_step": "2.3_design_definition"}
   ```

**Files created/modified:**
- `DESIGN.md` (new, project root)
- `measure/index.md` (updated)
- `measure/setup_state.json` (updated)

---

#### 2.4 Tech Stack (`measure/tech-stack.md`)

**Agent announces:**
> "Defining the **Tech Stack**. Based on my analysis, I detected: Next.js, React, TypeScript. Please confirm or correct."

**Brownfield behavior:** State inferred stack, ask for confirmation only.

**Example inferred stack for Next.js:**
- **Framework:** Next.js 14+ (App Router or Pages Router)
- **Language:** TypeScript
- **Styling:** CSS Modules / Tailwind CSS / Styled Components (inferred from dependencies)
- **State Management:** React Context / Zustand / Redux (inferred)
- **Database:** PostgreSQL / MongoDB / None (inferred)
- **Testing:** Jest / Vitest / Playwright (inferred)

**Agent asks:**
> "Is the detected tech stack accurate? Would you like to add, remove, or modify any entries?"

**After confirmation/corrections:**
1. Draft `measure/tech-stack.md`.
2. Present for review.
3. On approval, write to `measure/tech-stack.md`.
4. Update `measure/index.md` with link to **Tech Stack**.
5. Update state:
   ```json
   {"last_successful_step": "2.4_tech_stack"}
   ```

**Files created/modified:**
- `measure/tech-stack.md` (new)
- `measure/index.md` (updated)
- `measure/setup_state.json` (updated)

---

#### 2.5 Code Styleguides

**Agent announces:**
> "Setting up **Code Styleguides**. Based on your tech stack, I recommend: TypeScript and JavaScript/Next.js styleguides."

**Available styleguides in skill:**
- `assets/code_styleguides/csharp.md`
- `assets/code_styleguides/dart.md`
- `assets/code_styleguides/general.md`
- `assets/code_styleguides/go.md`
- `assets/code_styleguides/html-css.md`
- `assets/code_styleguides/javascript.md`
- `assets/code_styleguides/python.md`
- `assets/code_styleguides/typescript.md`

**Agent asks:**
> "Include the recommended styleguides (TypeScript, JavaScript, HTML/CSS)? Or would you like to edit the selection?"

**Options:** Install Recommended / Edit Selection

**Action:**
- Copy selected files from `assets/code_styleguides/` to `measure/code_styleguides/`.
- Update state:
  ```json
  {"last_successful_step": "2.5_code_styleguides"}
  ```

**Files created/modified:**
- `measure/code_styleguides/typescript.md` (copied)
- `measure/code_styleguides/javascript.md` (copied)
- `measure/code_styleguides/html-css.md` (copied, optional)
- `measure/code_styleguides/general.md` (copied, optional)
- `measure/setup_state.json` (updated)

---

#### 2.6 Workflow

**Agent announces:**
> "Creating the **Project Workflow** from the Measure template."

**Actions:**
1. Copy `assets/workflow.md` to `measure/workflow.md`.
2. Update `measure/index.md` with link to **Workflow**.
3. Ask: **Default workflow** or **Customize?**

**Default includes:**
- 80% test coverage target
- Commit after every task
- Git Notes for task summaries

**If Customize:**
- Q1: "Change coverage percentage?" (default: 80%)
- Q2: "Commit after task or after phase?" (default: task)
- Q3: "Use Git Notes or commit message for summaries?" (default: Git Notes)

**Action:** Update `measure/workflow.md` based on responses.

**Update state:**
```json
{"last_successful_step": "2.6_workflow"}
```

**Files created/modified:**
- `measure/workflow.md` (copied, then possibly customized)
- `measure/index.md` (updated)
- `measure/setup_state.json` (updated)

---

#### 2.7 Memory Artifacts

**Agent announces:**
> "Creating **Lessons Learned** and **Tech Debt Registry** as bounded working-memory artifacts (50-line context budget each). You can use `scripts/measure/check_context_budget.sh` to check limits."

**Actions:**
1. Copy `assets/lessons-learned.md` to `measure/lessons-learned.md`.
2. Copy `assets/tech-debt.md` to `measure/tech-debt.md`.
3. Update `measure/index.md` with links:
   - `**Lessons Learned**`: `./lessons-learned.md`
   - `**Tech Debt Registry**`: `./tech-debt.md`

**Update state:**
```json
{"last_successful_step": "2.7_memory_artifacts"}
```

**Files created/modified:**
- `measure/lessons-learned.md` (copied)
- `measure/tech-debt.md` (copied)
- `measure/index.md` (updated)
- `measure/setup_state.json` (updated)

---

#### 2.8 Select Skills (Interactive)

**Agent announces:**
> "Analyzing your project to recommend relevant skills from Vercel's Skills registry."

**Actions:**
1. Execute `npx -y skills search react` (keyword from tech stack).
2. Execute `npx -y skills search nextjs` (keyword from tech stack).
3. Execute `npx -y skills search typescript` (keyword from tech stack).
4. Review results and select most relevant skills.

**Possible recommended skills for Next.js:**
- `next-best-practices`
- `vercel-react-best-practices`
- `vitest` (if Vitest is used)
- `frontend-design`

**Agent asks:**
> "Based on your project context, I found the following skills via Vercel's registry: [List]. How would you like to proceed?"

**Options:**
- **Install Recommended**
- **Install find-skills** (to help discover more later)
- **Skip**

**Process selection:**
- If "Install Recommended": Execute `npx -y skills add <skill-names>`.
- If "Install find-skills": Execute `npx -y skills add https://github.com/vercel-labs/skills --skill find-skills`.
- If "Skip": Proceed without installation.

**If skills were installed:**
> "New skills installed. Please run `/claude skills reload` to enable them. Let me know when you have done this."

**Agent pauses and waits for user confirmation.**

**Proceed to 2.9.**

---

### Phase 3: Initial Track Generation

#### 3.1 Product Requirements (Greenfield Only)

**For Brownfield:** This step is typically skipped or condensed. The agent may ask 1–2 clarifying questions about immediate priorities instead of the full greenfield requirements questionnaire.

**Possible brownfield question:**
> "What is the most important feature or improvement you want to tackle first?"

---

#### 3.2 Propose Initial Track

**Agent actions:**
1. Analyze `measure/product.md`, `measure/tech-stack.md`, and gathered requirements.
2. Generate a single track title (e.g., for an existing Next.js project):
   - "Refactor authentication flow"
   - "Add dashboard analytics"
   - "Implement API integration"
   - "Improve test coverage"
3. Present for approval.
4. If declined, ask for clarification and regenerate.

**Example proposal:**
> "I propose the initial track: **'Add Comprehensive Test Suite'** — Given this is an existing Next.js project, establishing test coverage aligns with Measure's TDD principles. Approve or suggest a different focus?"

---

#### 3.3 Create Track Artifacts

**Agent actions after track approval:**

1. **Create Tracks Registry** (`measure/tracks.md`):
   ```markdown
   # Project Tracks

   This file tracks all major tracks for the project.

   ---

   - [ ] **Track: <Track Description>**
     *Link: [./measure/tracks/<track_id>/](./measure/tracks/<track_id>/)*
   ```

2. **Update** `measure/index.md` with link to **Tracks Registry**.

3. **Generate Track ID:** `<shortname>_20260425` (e.g., `test_suite_20260425`)

4. **Create directory:** `measure/tracks/<track_id>/`

5. **Create** `measure/tracks/<track_id>/metadata.json`:
   ```json
   {
     "track_id": "test_suite_20260425",
     "type": "feature",
     "status": "new",
     "created_at": "2026-04-25T08:43:29Z",
     "updated_at": "2026-04-25T08:43:29Z",
     "description": "Add comprehensive test suite to existing Next.js project",
     "estimated_tasks": null,
     "actual_tasks": null,
     "deviation_notes": ""
   }
   ```

6. **Create Track Index:** `measure/tracks/<track_id>/index.md`

7. **Generate and write:**
   - `measure/tracks/<track_id>/spec.md` (Specification)
   - `measure/tracks/<track_id>/plan.md` (Implementation Plan)

8. **Update track index** with links to **Specification** and **Implementation Plan**.

9. **Plan requirements:**
   - Must follow TDD structure from `measure/workflow.md`
   - Include `[ ]` markers for all tasks and sub-tasks
   - Add phase completion tasks if defined in workflow

10. **Update state:**
    ```json
    {"last_successful_step": "3.3_initial_track_generated"}
    ```

**Files created/modified:**
- `measure/tracks.md` (new)
- `measure/tracks/<track_id>/` (directory created)
- `measure/tracks/<track_id>/index.md` (new)
- `measure/tracks/<track_id>/metadata.json` (new)
- `measure/tracks/<track_id>/spec.md` (new)
- `measure/tracks/<track_id>/plan.md` (new)
- `measure/index.md` (updated)
- `measure/setup_state.json` (updated)

---

#### 3.4 Finalize

**Agent actions:**
1. Summarize all actions taken:
   > "Measure setup complete! I have created:
   > - `measure/product.md` — Product Definition
   > - `measure/product-guidelines.md` — Brand & voice guidelines
   > - `DESIGN.md` — Visual design specification
   > - `measure/tech-stack.md` — Confirmed technology choices
   > - `measure/code_styleguides/` — Language-specific style guides
   > - `measure/workflow.md` — Development workflow with TDD and quality gates
   > - `measure/lessons-learned.md` & `measure/tech-debt.md` — Project memory artifacts
   > - `measure/tracks.md` — Tracks registry
   > - `measure/tracks/<track_id>/` — Your first track with spec and plan"

2. **Git commit:**
   ```bash
   git add measure/ DESIGN.md
   git commit -m "measure(setup): Add measure setup files"
   ```

3. **Inform user:**
   > "You can now start working on your first track with the `implement` command."

---

## Complete File Inventory

### Files Created During Setup

| # | File Path | Source | Step |
|---|-----------|--------|------|
| 1 | `measure/setup_state.json` | Generated | 1.0 (Greenfield) / Resume Check |
| 2 | `measure/index.md` | Generated | 1.0 |
| 3 | `measure/product.md` | Generated from Q&A | 2.1 |
| 4 | `measure/product-guidelines.md` | Generated from Q&A | 2.2 |
| 5 | `DESIGN.md` | Generated from user style choice | 2.3 |
| 6 | `measure/tech-stack.md` | Generated from confirmed inference | 2.4 |
| 7 | `measure/code_styleguides/typescript.md` | Copied from `assets/code_styleguides/` | 2.5 |
| 8 | `measure/code_styleguides/javascript.md` | Copied from `assets/code_styleguides/` | 2.5 |
| 9 | `measure/code_styleguides/html-css.md` | Copied from `assets/code_styleguides/` (optional) | 2.5 |
| 10 | `measure/workflow.md` | Copied from `assets/workflow.md`, then customized | 2.6 |
| 11 | `measure/lessons-learned.md` | Copied from `assets/lessons-learned.md` | 2.7 |
| 12 | `measure/tech-debt.md` | Copied from `assets/tech-debt.md` | 2.7 |
| 13 | `measure/tracks.md` | Generated | 3.3 |
| 14 | `measure/tracks/<track_id>/index.md` | Generated | 3.3 |
| 15 | `measure/tracks/<track_id>/metadata.json` | Generated | 3.3 |
| 16 | `measure/tracks/<track_id>/spec.md` | Generated | 3.3 |
| 17 | `measure/tracks/<track_id>/plan.md` | Generated | 3.3 |

### Final `measure/` Directory Structure

```
measure/
├── index.md
├── product.md
├── product-guidelines.md
├── tech-stack.md
├── workflow.md
├── tracks.md
├── lessons-learned.md
├── tech-debt.md
├── setup_state.json
├── code_styleguides/
│   ├── typescript.md
│   ├── javascript.md
│   └── html-css.md
└── tracks/
    └── <track_id>_20260425/
        ├── index.md
        ├── metadata.json
        ├── spec.md
        └── plan.md
```

---

## User Interaction Summary

| Step | # of Questions | Interaction Type |
|------|---------------|------------------|
| 1.3 Read-only scan permission | 1 | Approve/Decline |
| 2.1 Product Definition | 3–5 | Multiple choice + free text |
| 2.2 Product Guidelines | 3–5 | Multiple choice + free text |
| 2.3 Design Definition | 1 | Free text (visual identity) + Approve/Changes |
| 2.4 Tech Stack | 1 | Confirm/Correct inferred stack |
| 2.5 Code Styleguides | 1 | Install Recommended / Edit / Skip |
| 2.6 Workflow | 1 | Default / Customize (3 follow-ups if customize) |
| 2.8 Select Skills | 1 | Install Recommended / Install find-skills / Skip |
| 2.8.1 Skill Reload (conditional) | 1 | Wait for user confirmation |
| 3.1 Requirements (brownfield) | 0–1 | Free text (priority focus) |
| 3.2 Propose Initial Track | 1 | Approve / Decline + clarify |

**Total estimated user interaction points:** 12–18

---

## Verification Checklist

- [x] All framework references use **"Measure"** (not "Conductor")
- [x] All directory paths use **`measure/`** (not `conductor/`)
- [x] Brownfield workflow is followed for existing Next.js project
- [x] `measure/setup_state.json` is created and updated at each step
- [x] `measure/index.md` is maintained with Universal File Resolution Protocol links
- [x] Resume check logic is applied at the beginning
- [x] Read-only analysis respects `.gitignore` and file size limits
- [x] TDD workflow is embedded in `measure/workflow.md`
- [x] Memory artifacts (`lessons-learned.md`, `tech-debt.md`) are bounded to 50 lines
- [x] Skills installation uses `npx -y skills` commands
- [x] Initial track follows TDD structure with `[ ]` markers
- [x] Final commit message is `measure(setup): Add measure setup files`
