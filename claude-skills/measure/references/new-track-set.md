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

### 2.9 Create Artifacts

1. **Check Names:**
   - List the **Tracks Directory**, `measure/archive/`, and the **Track Sets Directory** (step 2) if it exists.
   - Write the set ID: `<shortname>_YYYYMMDD`. It must differ from every member track ID.
   - If a member track ID matches an existing track folder, or the set ID matches an existing overview, HALT and suggest a different short name.

2. **Resolve the Track Sets Directory:** Resolve **Track Sets Directory** with the **Universal File Resolution Protocol**. If the index has no such link:
   1. Use `measure/sets/` and create it.
   2. Add a link labeled **Track Sets Directory** to `./sets/` in `measure/index.md`, next to the **Tracks Directory** link and in the same format.

3. **Write the Set Overview:** Create `<Track Sets Directory>/<set_id>.md`:
   ```markdown
   # Track Set: <set title>

   - **Set ID:** `<set_id>`
   - **Status:** new
   - **Created:** YYYY-MM-DD
   - **Goal:** <set goal>

   ## Shared Decisions

   | Date | Question | Decision |
   | --- | --- | --- |
   | YYYY-MM-DD | <topic from §2.2> | <the user's answer> |

   ## Members

   | Order | Track | Type | Scope | Depends on | Status |
   | --- | --- | --- | --- | --- | --- |
   | 1 | [<track_id>](../tracks/<track_id>/) | feature | <one line> | — | new |

   ## Shared Rules

   - <a rule that applies to every member, for example a quality bar or a naming rule>

   ## Open Questions

   - <a question that a member must answer, with the member that owns it>
   ```
   - The **Track** link is relative to the overview. After an archive it becomes `../archive/<track_id>/`.
   - **Status** values for the set and for each member: `new`, `in_progress`, `completed` (the `metadata.json` status values). A member that `revert` removes from the set has the status `removed`.
   - Write each shared decision once, here. Member specs link to it and do not copy it.

4. **Write Each Member:** For each member, in order:
   1. Create `measure/tracks/<track_id>/`.
   2. Write `spec.md` and `plan.md` from §2.7. Directly after the spec's overview section, add:
      ```markdown
      ## Track Set

      This track is member <order> of the track set [<set title>](<path to the overview>). Depends on: <track IDs, or "none">. The shared decisions and shared rules in the set overview apply to this track.
      ```
      The path to the overview from a track folder is `../../sets/<set_id>.md` for the default directories. The same path works after an archive to `measure/archive/<track_id>/`.
   3. Write `index.md` in the format of `new-track` §2.5 step 5, with one more line: `- [Track Set](<path to the overview>)`.
   4. Write `metadata.json` with the schema and the `sprint` rules of `new-track` §2.5 step 4, and add the `set` key:
      ```json
      "set": {
        "id": "<set_id>",
        "order": 1,
        "depends_on": []
      }
      ```
      - `depends_on` lists the track IDs from §2.3. Use an empty array when there is none.
      - Set `estimated_tasks` to the number of top-level tasks in the member's `plan.md` (`new-track` §2.5 step 8).

5. **Update the Tracks Registry:** Append each member in order:
   ```markdown

   ---

   - [ ] **Track: <member description>**
     *Link: [./tracks/<track_id>/](./tracks/<track_id>/)*
     *Set: <set title> (`<set_id>`), order <n>*
   ```

6. **Verify:** Run each check. If a check fails, correct the artifact and run the check again. Do NOT commit until every check passes.
   - Each member folder has `index.md`, `spec.md`, `plan.md`, and `metadata.json`.
   - Each `metadata.json` parses as JSON (for example `python3 -m json.tool <file>` or `jq . <file>`).
   - Each `depends_on` ID is a folder in the **Tracks Directory** or `measure/archive/`, and is a member with a lower order or a track outside the set.
   - The overview's member table lists each member once, in the order of the registry.

7. **Commit Changes:** Stage only these paths, by name: the overview, `measure/index.md` (if changed), the **Tracks Registry**, and each member folder. Commit with message `chore(measure): Add track set '<set title>' (<n> tracks)`.

8. **Announce:**
   > "Track set '<set title>' has been created with <n> tracks. The overview is `<path>`. Start with track '<first track_id>' by running `implement <first track_id>`."

## 3.0 Read-Side Rules for Track Sets

**PROTOCOL: How other workflows treat set data.**

1. **Optional key:** A track without a `set` key in `metadata.json` is a standalone track. No workflow warns about the absence.

2. **Workflows that use set data:**
   - `implement` §2.0 step 5: warns when a dependency is not complete.
   - `implement` §3.1 and §3.4: update the member status and the set status in the overview.
   - `implement` §3.2 step 7: reads the overview as track context.
   - `implement` §5.0 and `review` §3.3: change the member link in the overview after an archive.
   - `revert` §3.3 step 5: removes one member without a revert of the set commit.
   - `revert` §5.3 step 4: sets the member status in the overview after a revert.

3. **Complete dependency:** A dependency is complete when its registry entry is `[x]`, or when its folder is in `measure/archive/`.

4. **Missing overview data:** If the overview file is missing, or its member table does not list the track, warn once: "The set overview `<path>` does not list track `<track_id>`. I will continue without it." Then continue. Never HALT because of set data.

5. **Change a set later:**
   - **Add a member:** Run `new-track` for it. Then add the `set` key, the `## Track Set` section, the index link, the `*Set:*` registry line, and a row in the overview. The order rule of §2.3 applies.
   - **Change a shared decision:** Add a dated row to **Shared Decisions** in the overview. Do not copy the decision into member specs.
