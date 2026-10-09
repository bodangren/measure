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
3. Write a **set title**: 3 to 8 words. The title names the set in the overview, the registry entries, and the commit message.

### 2.2 Shared Questioning

1. Announce: "I'll ask the questions that apply to every track in the set once. Each track then follows from these answers."

2. **Read before you ask (brownfield):** Read the files that the description names, the **Tracks Registry**, the **Product Definition**, and any existing design document for the program. Do NOT ask a question that these files answer. Use their facts to write the options.

3. **Graph Context Probe (optional):** Apply `new-track` §2.2 step 2 once for the set, with keywords from the set goal.

4. **Questioning Phase:** Ask questions in batches of 4 or fewer, with the format and the Additive or Exclusive Choice classification of `new-track` §2.2 step 4. **CRITICAL:** Wait for the user's response after each batch. Cover these 4 topics:
   1. **Scope and order:** Which work the set covers, and which work comes first.
   2. **Split rule:** How the work divides into members (for example foundation tracks plus one track per module, service, family, or phase).
   3. **Shared decisions:** The choices that every member must follow (for example formats, quality bars, technology, naming).
   4. **Start gate:** The condition before work starts (for example a release, an approval, a date), or "none".

   When the files of step 2 answer a topic, or part of a topic, do not ask that part. Record the file as the source of the answer (§2.9 step 3). Ask only the open part.

5. **Summarize:** State the set goal and the answers in a short list, with the source of each answer that came from a file. Then continue with §2.3.

### 2.3 Draft the Member List

1. Apply the split rule to write the member list. For each member, write:
   - **Order:** a positive integer. Members with the same order may run in either order. Measure still runs one active track at a time.
   - **Short name:** lowercase words with underscores. The track ID is `<short name>_YYYYMMDD`. Give all members one shared prefix (for example `billing_`) so that they sort together.
   - **Title:** 2 to 8 words. The track description (in the registry and in `metadata.json` `description`) is `<set title>: <title>`.
   - **Type:** `feature`, `bug`, or `chore`.
   - **Scope:** one line.
   - **Depends on:** the track IDs that must be complete before this member starts, or none. List direct dependencies only. Do not repeat a dependency of a dependency.

2. **Member rules:**
   - Each member closes on its own acceptance criteria.
   - A dependency is a member with a **lower** order, or a track outside the set (in the **Tracks Directory** or `measure/archive/`). This rule prevents cycles. Do not use a dependency on a member with the same or a higher order.
   - Put foundation members (shared contracts, layouts, base components) first.

3. **Order Conflict Check:** If topic 1 puts a part of the work first (for example "the most-used items first"), and that part falls inside 2 or more members of the split rule, ask (Exclusive Choice):
   - Header: `Order`
   - Question: "<the first part> falls inside <n> members. How should the set put it first?"
   - Options:
     - **A separate member** — One member with a low order does the first part for all. The other members depend on it and leave that part out of their scope.
     - **First phase of each member** — Each member does its share of the first part in its first phase. Because one track runs at a time, the first part is complete only when every one of these members is complete.
     - Type your own answer
   - Recommend **A separate member** when the first part must be complete as a whole before other work (for example for a release). Otherwise recommend **First phase of each member**.
   - Change the scopes and the dependencies of the member list to match the answer.

4. **Name the Set and Check Names:**
   - Write the set ID: `<shortname>_YYYYMMDD`. It must differ from every member track ID.
   - List the **Tracks Directory**. List `measure/archive/` and the **Track Sets Directory** (§2.9 step 2) when they exist. A missing directory counts as empty, not as a failure.
   - Compare the short name of each member (the track ID without the date) with the short names of the existing tracks, as `new-track` §2.5 step 1 does. Compare the set ID with the names of the existing overview files.
   - If a name matches, choose a different short name. Name each change when you present the overview in §2.5.

5. **Size Check:** If the list has more than 20 members, ask: "The set has <n> members. Keep one set, or split it into smaller sets?" Continue with the user's answer.

### 2.4 Choose Spec Formats

1. Show the member list from §2.3 and ask once (Exclusive Choice):
   - Header: `Spec format`
   - Question: "How should the specs of these tracks be structured?"
   - Options:
     - **Mixed (Recommended)** — Classic FR list for the members of a template group (§2.7 step 2), and Story-shaped spec for each unique feature member.
     - **Classic FR list for every feature**
     - **Story-shaped spec for every feature**
     - Type your own answer
2. Record the answer. Do not assign a format to each member yet: §2.7 step 2 applies the answer after it forms the template groups.
3. Bug and chore members use the Classic FR list with every option (`new-track` §2.2 step 3 recommends it for these types). Only a typed answer that names a bug or chore member changes this.

### 2.5 Draft the Set Overview (Review Gate 1)

1. Draft the set overview with the template in §2.9 step 3: the goal, the start gate, the shared decisions, the member table, and the open questions.
2. Present the draft with embedded content. Name each short name that §2.3 step 4 changed.
   > "Please review the set overview below. It lists every track that this set will create. Does it capture the program?"
   > ```markdown
   > [overview content]
   > ```
   > Options: **Approve** (continue to the member templates) / **Revise** (change the decisions or the members)
3. On **Revise**, apply the changes and present the overview again. Repeat until the user approves.

### 2.6 Surface Relevant Tech Debt

1. Apply `new-track` §2.2 step 5 once for the set.
2. Record each debt item that the user accepts in the scope of the member that will address it. Show each scope change at Gate 2 (§2.7 step 4).

### 2.7 Draft Member Templates and Samples (Review Gate 2)

1. **Member Questions:** List the decisions that a unique member's spec needs and that the shared answers do not give (for example the first module to migrate). Ask them in batches of 4 or fewer for all unique members together, until each question is asked. Do not decide a member question yourself. If the user defers a question, add it to **Open Questions** in the overview with the member that owns it.

2. **Group the Members:**
   - A **template group** is 2 or more members with the same spec sections and the same plan phases. Inside a phase, the tasks of two members may differ in only two ways:
     - a **value**: a name, a number, or a list of rows;
     - a **variant block**: a named list of tasks that only some members of the group have (for example rigging tasks for the character modules of a group).
   - A member that needs a phase or a spec section that the others do not have is a **unique member**, or the first member of a new group.
   - If you are not sure whether two members belong to one group, put them in different groups.
   - Form the groups by structure first. Then apply the format answer of §2.4 to each group and each unique member. With **Mixed**, every member of a template group uses the Classic FR list, and each unique feature member uses the Story-shaped spec. All members of one group use one format.

3. **Draft the Samples:**
   - For each unique member, draft the full `spec.md` and `plan.md`.
   - For each template group, draft the full `spec.md` and `plan.md` of one member as the sample. Mark each value that changes between members (for example `<module>`, `<row count>`). Write each variant block of the group once, marked with its name, also when the sample member does not have it.
   - Follow `new-track` §2.2 step 6 for each spec and `new-track` §2.3 steps 2 to 4 for each plan: read the **Workflow** and **Lessons Learned**, run the Blast-Radius Probe when it applies, and apply the phase rules of §2.3 step 4 with their conditions. Add the Phase Completion Verification tasks only when the **Workflow** defines that protocol.
   - Each member spec has a `## Track Set` section directly after its overview section (§2.9 step 4).
   - When an acceptance criterion needs the value of a shared decision, name the value and its date, for example "bar 7.0 (shared decision of 2026-10-09)". Do not copy the other shared decisions into the spec.

4. **Present the Samples:**
   > "Please review the track samples below. Each unique track is shown in full. For each group, one sample is shown, followed by a table of the values and variant blocks of the other tracks of the group."
   > ```markdown
   > [each unique member: spec and plan]
   > [each template group: sample spec and plan, then a table: track ID | changed values | variant blocks]
   > [the overview changes from step 1 and the scope changes from §2.6, if any]
   > ```
   > Options: **Approve** (create the tracks) / **Revise** (change a sample, a value, or a variant block)

5. On **Revise**, apply the changes and present the changed samples again. Repeat until the user approves.

6. **Draft the Other Members:** After the approval, draft the content of each other member of a template group from its approved sample. Change only the marked values, and keep only the variant blocks that the table gives the member. §2.9 step 4 creates the files.
   - **CRITICAL:** If a member needs a structural change (a phase, a requirement, or a section that its sample does not have), do not draft it silently. Present that member alone with the format of step 4, and wait for **Approve** before you continue.

### 2.8 Skill Recommendation

1. Apply `new-track` §2.4 and §2.4.1 once for the set, with keywords from the set goal and the approved samples.

### 2.9 Create Artifacts

1. **Check Names Again:** Repeat the name check of §2.3 step 4, because another session may have created a track since then. If a name now matches, HALT and tell the user which name matches. Create no file.

2. **Resolve the Track Sets Directory:** Resolve **Track Sets Directory** with the **Universal File Resolution Protocol**. If the index has no such link:
   1. Use `measure/sets/` and create it.
   2. Add a link labeled **Track Sets Directory** to `./sets/` in `measure/index.md`, next to the **Tracks Directory** link and in the same format. If the other links have a description, use: "track set overviews: goal, shared decisions, members, and order."

3. **Write the Set Overview:** Create `<Track Sets Directory>/<set_id>.md`:
   ```markdown
   # Track Set: <set title>

   - **Set ID:** `<set_id>`
   - **Status:** new
   - **Created:** YYYY-MM-DD
   - **Goal:** <set goal>
   - **Start gate:** <the condition from §2.2 topic 4, or "none">

   ## Shared Decisions

   | Date | Topic | Decision | Source |
   | --- | --- | --- | --- |
   | YYYY-MM-DD | <scope and order, split rule, shared decision, or rule> | <one decision> | <user, or the file that states it> |

   ## Members

   | Order | Track | Type | Scope | Depends on | Status |
   | --- | --- | --- | --- | --- | --- |
   | 1 | [<track_id>](../tracks/<track_id>/) | feature | <one line> | — | new |

   ## Open Questions

   - <a question that a member must answer, with the member that owns it>
   ```
   - Write one row for each decision. One topic can give several rows. A project rule from a file that every member must follow (for example a quality bar in the **Workflow**) is a row with the topic `rule`.
   - **Date** is the date of the user's answer. For a decision from a file, it is the date that the file gives for the statement; if the file gives none, it is the date of the last commit that changed the file (`git log -1 --format=%cs -- <file>`). **Source** is `user`, or the path of the file.
   - The **Track** link is relative to the overview. After an archive it becomes `../archive/<track_id>/`.
   - **Status** values for the set and for each member: `new`, `in_progress`, `completed` (the `metadata.json` status values). A member that `revert` removes from the set has the status `removed`.
   - The overview is the source of each shared decision. A member spec names a value only where a test needs it (§2.7 step 3).

4. **Write Each Member:** For each member, in order:
   1. Create `measure/tracks/<track_id>/`.
   2. Write `spec.md` and `plan.md` from §2.7. Directly after the spec's overview section, add:
      ```markdown
      ## Track Set

      This track is member <order> of the track set [<set title>](<path to the overview>). Depends on: <track IDs, or "none">. The shared decisions and the start gate in the set overview apply to this track.
      ```
      The path to the overview from a track folder is `../../sets/<set_id>.md` for the default directories. The same path works after an archive to `measure/archive/<track_id>/`.
   3. Write `index.md` in the format of `new-track` §2.5 step 5, with one more line: `- [Track Set](<path to the overview>)`.
   4. Write `metadata.json` with the schema and the `sprint` rules of `new-track` §2.5 step 4. Use the track description from §2.3 as `description`. Add the `set` key:
      ```json
      "set": {
        "id": "<set_id>",
        "order": 1,
        "depends_on": []
      }
      ```
      - `depends_on` lists the track IDs from §2.3. Use an empty array when there is none.
      - Set `estimated_tasks` to the number of top-level tasks in the member's `plan.md` (`new-track` §2.5 step 8).
   5. **Project Metadata Keys:** Read every `metadata.json` in the **Tracks Directory** (or in `measure/archive/` when the directory has no track). Find the keys that every one of these files has and that the Measure schema does not have (for example `workstream` or `evidence`). Add those keys to each member, with values for that member. Do not copy a key that only some tracks have. If the project has its own dependency key (for example `dependencies`), write in it the same IDs as in `set.depends_on`. If a project rule needs a field to be non-empty, fill it.

5. **Update the Tracks Registry:** Add each member, in order, with this entry:
   ```markdown

   ---

   - [ ] **Track: <track description>**
     *Link: [./tracks/<track_id>/](./tracks/<track_id>/)*
     *Set: <set title> (`<set_id>`), order <n>*
   ```
   Keep the members together. Add them where `new-track` adds a new track: after the last track entry. If the registry groups tracks under headings, add them at the end of the group that fits the set best. If no group fits, add them at the end of the file.

6. **Verify:** Run each check. If a check fails, correct the artifact and run the check again. Do NOT commit until each check in this list passes, except as the last check allows.
   - Each member folder has `index.md`, `spec.md`, `plan.md`, and `metadata.json`.
   - Each `metadata.json` parses as JSON (for example `python3 -m json.tool <file>` or `jq . <file>`).
   - Each `depends_on` ID is a folder in the **Tracks Directory** or in `measure/archive/` (when it exists), and is a member with a lower order or a track outside the set.
   - The overview's member table lists each member once, in the order of the registry.
   - **Project scripts:** If the project has a generate script (for example `measure/generate.sh`), run it first, and stage the files that it changes. If a generated file had changes before this step, tell the user that the set commit will include them. Then, if the project has a doctor script (for example `measure/doctor.sh`), run it, as `implement` §4.0 step 3 does. Correct each failure that names a file that this workflow wrote (a member file, the overview, the **Tracks Registry**, or `measure/index.md`), and run both scripts again. If a failure remains that names no such file, show it to the user and ask: "The doctor reports a failure that this set did not cause. Commit the set anyway?" On **Commit anyway**, continue with step 7 and name the failure in the commit message body. On **Stop**, HALT without a commit.

7. **Commit Changes:** Stage only these paths, by name: the overview, `measure/index.md` (if changed), the **Tracks Registry**, each member folder, and the files that the generate script changed. Commit with message `chore(measure): Add track set '<set title>' (<n> tracks)`.

8. **Announce:**
   > "Track set '<set title>' has been created with <n> tracks. The overview is `<path>`. Start gate: <condition, or 'none'>. The first track is '<track description of the first member>'. Run `implement` and give that description."

## 3.0 Read-Side Rules for Track Sets

**PROTOCOL: How other workflows treat set data.**

1. **Optional key:** A track without a `set` key in `metadata.json` is a standalone track. No workflow warns about the absence.

2. **Workflows that use set data:**
   - `implement` §2.0 step 5: asks when the start gate is not met, and warns when a dependency is not complete.
   - `implement` §3.1 and §3.4: update the member status and the set status in the overview.
   - `implement` §3.2 step 7: reads the overview as track context.
   - `implement` §5.0 and `review` §3.3: change the member link in the overview after an archive, and apply **Remove a member** (step 5) after a delete.
   - `revert` §3.3 step 5: removes one member without a revert of the set commit.
   - `revert` §5.3 step 4: sets the member status in the overview after a revert.

3. **Complete dependency:** A dependency is complete when its registry entry is `[x]`, or when its folder is in `measure/archive/`.

4. **Missing overview data:** If the overview file is missing, or its member table does not list the track, warn once: "The set overview `<path>` does not list track `<track_id>`. I will continue without it." Then continue. Never HALT because of set data.

5. **Change a set later:**
   - **Add a member:** Run `new-track` for it, with the description `<set title>: <title>` (§2.3 step 1). Then add the `set` key, the `## Track Set` section, the index link, the `*Set:*` registry line, and a row in the overview. Apply §2.9 step 4 item 5 to it: the project metadata keys, and the project dependency key with the IDs of `set.depends_on`. The order rule of §2.3 applies. Commit these edits: `chore(measure): Add track '<track description>' to set '<set_id>'`.
   - **Change a shared decision:** Add a dated row to **Shared Decisions** in the overview. Then search the member specs for the old value, and update each spec that names it (§2.7 step 3).
   - **Change a dependency:** Edit three places: `set.depends_on` in `metadata.json` (and the project dependency key, if any), the **Depends on** line in the `## Track Set` section, and the **Depends on** cell in the overview.
   - **Change an order number:** If a change breaks the order rule, change the order numbers, and tell the user. An order number is in four places: `set.order` in `metadata.json`, "member <order>" in the `## Track Set` section, the **Order** cell in the overview, and the `*Set:*` line in the registry. Then move the registry entries and the overview rows so that both stay in order.
   - **Remove a member:** Set its **Status** cell in the overview to `removed`, and replace its **Track** link with the plain track ID. For every other member that lists it, apply **Change a dependency**: replace the removed ID with the removed track's own `set.depends_on` entries, without duplicates. `revert` §3.3 step 5, and the **Delete** choice of `implement` §5.0 and `review` §3.3, use this rule.

6. **Start gate:** The start gate is met when the user confirms it. `implement` §2.0 step 5 asks once and then writes ` (met YYYY-MM-DD)` after the condition in the overview. A gate of `none` needs no confirmation.
