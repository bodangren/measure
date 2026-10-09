# New Track Set Workflow

Create a related set of tracks in one pass from one set of shared decisions.

A **track set** is a group of ordinary tracks. Each member has its own `spec.md`, `plan.md`, `metadata.json`, and registry entry, and closes on its own acceptance criteria. The set adds one overview page (`measure/sets/<set_id>.md`) and one optional `set` key in each member's `metadata.json`. Every workflow that reads tracks keeps working, because a member is a normal track.

Use this workflow when `new-track` §2.1 step 4 routes here, or when the user asks for a track set by name. For one unit of work, use `new-track`.

## Prerequisites

Validate every tool call. If any fails, halt immediately and inform the user.

## 1.0 Setup Check

**PROTOCOL: Verify that the Measure environment is properly set up.**

1. **Verify Core Context:** Using the **Universal File Resolution Protocol**, resolve and verify the existence of:
   - **Product Definition**
   - **Tech Stack**
   - **Workflow**

2. **Handle Failure:** If ANY of these are missing (or their resolved paths do not exist), Announce: "Measure is not set up. Please run setup first." and HALT.

## 2.0 Set Initialization

### 2.1 Confirm the Set Goal

1. Read the user's description. If there is none, ask: "Please describe the program of work that the track set covers."
2. Write the **set goal**: one sentence that states the outcome when every member is complete.
3. Write a **set title**: 3 to 8 words. The title names the set in the overview, the registry lines, and the commit message.

### 2.2 Shared Questioning

1. Announce: "I'll ask the questions that apply to every track in the set once. Each track then follows from these answers."

2. **Read before you ask (brownfield):** Read the files that the description names, the **Tracks Registry**, the **Product Definition**, and any existing design document for the program. Do NOT ask a question that these files answer. Use their facts to write the options.

3. **Graph Context Probe (optional):** Apply `new-track` §2.2 step 2 once for the set, with keywords from the set goal.

4. **Questioning Phase:** Ask questions in batches of 4 or fewer, with the format and the Additive or Exclusive Choice classification of `new-track` §2.2 step 4. **CRITICAL:** Wait for the user's response after each batch. Cover these 4 topics. Skip a topic only when the files in step 2 already answer it, and say so in the summary.
   1. **Scope and order:** Which work the set covers, and which work comes first.
   2. **Split rule:** How the work divides into members (for example foundation tracks plus one track per module, service, family, or phase).
   3. **Shared decisions:** The choices that every member must follow (for example formats, quality bars, technology, naming).
   4. **Start gate:** The condition before work starts (for example a release, an approval, a date), or "none".

5. **Summarize:** State the set goal and the answers in a short list. Then continue with §2.3.

### 2.3 Draft the Member List

1. Apply the split rule to write the member list. For each member, write:
   - **Order:** a positive integer. Members with the same order may run in either order. Measure still runs one active track at a time.
   - **Short name:** lowercase words with underscores. The track ID is `<short name>_YYYYMMDD`. Give all members one shared prefix (for example `billing_`) so that they sort together.
   - **Type:** `feature`, `bug`, or `chore`.
   - **Scope:** one line.
   - **Depends on:** the track IDs that must be complete before this member starts, or none.

2. **Member rules:**
   - Each member closes on its own acceptance criteria. If a member cannot be accepted without another member's work, add that member to its **Depends on**.
   - A dependency is a member with a **lower** order, or a track outside the set (in the **Tracks Directory** or `measure/archive/`). This rule prevents cycles. Do not use a dependency on a member with the same or a higher order.
   - Put foundation members (shared contracts, layouts, base components) first.

3. **Size check:** If the list has more than 20 members, ask: "The set has <n> members. Keep one set, or split it into smaller sets?" Continue with the user's answer.

### 2.4 Choose Spec Formats

1. Ask once for the set, with the options of `new-track` §2.2 step 3 (Story-shaped spec or Classic FR list).
2. Recommend **Classic FR list** for members that repeat one template (for example one track per module), and **Story-shaped spec** for unique feature members.
3. Record the format of each member. A member may differ from the set choice when the user says so.

### 2.5 Draft the Set Overview (Review Gate 1)

1. Draft the set overview with the template in §2.9 step 3: the goal, the shared decisions, the member table, the shared rules, and the open questions.
2. Present the draft with embedded content:
   > "Please review the set overview below. It lists every track that this set will create. Does it capture the program?"
   > ```markdown
   > [overview content]
   > ```
   > Options: **Approve** (continue to the member templates) / **Revise** (change the decisions or the members)
3. On **Revise**, apply the changes and present the overview again. Repeat until the user approves.

### 2.6 Surface Relevant Tech Debt

1. Apply `new-track` §2.2 step 5 once for the set.
2. Record each debt item that the user accepts in the scope of the member that will address it.

### 2.7 Draft Member Templates and Samples (Review Gate 2)

1. **Group the members:**
   - A **template group** is 2 or more members with the same structure: the same spec sections, the same phases, and the same task pattern. Only values change (for example the module name, the scope rows, the counts, the dependencies).
   - A **unique member** has its own structure (for example a foundation track).

2. **Draft the samples:**
   - For each unique member, draft the full `spec.md` and `plan.md`.
   - For each template group, draft the full `spec.md` and `plan.md` of one member as the sample. Mark each value that changes between members (for example `<module>`, `<row count>`).
   - Follow `new-track` §2.2 step 6 for each spec and `new-track` §2.3 steps 2 to 4 for each plan: read the **Workflow** and **Lessons Learned**, run the Blast-Radius Probe when it applies, use the Contract-First phases, and add the Phase Completion Verification tasks.
   - Each member spec has a `## Track Set` section directly after its overview (§2.9 step 4).

3. **Present the samples:**
   > "Please review the track samples below. Each unique track is shown in full. For each group, one sample is shown, followed by a table of the values that change for the other tracks of the group."
   > ```markdown
   > [each unique member: spec and plan]
   > [each template group: sample spec and plan, then a table: track ID | changed values]
   > ```
   > Options: **Approve** (create the tracks) / **Revise** (change a sample or a value)

4. On **Revise**, apply the changes and present the changed samples again. Repeat until the user approves.

5. **Generate the members:** After the approval, write each member of a template group from its approved sample. Change only the marked values.
   - **CRITICAL:** If a member needs a structural change (a phase, a requirement, or a section that its sample does not have), do not write it silently. Present that member alone with the format of step 3, and wait for **Approve** before you continue.

### 2.8 Skill Recommendation

1. Apply `new-track` §2.4 and §2.4.1 once for the set, with keywords from the set goal and the approved samples.
