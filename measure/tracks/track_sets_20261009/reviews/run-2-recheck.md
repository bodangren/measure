# Recheck: revised new-track-set.md against the 21 dry-run findings

Document: `/home/daniebo/Desktop/measure/skills/measure/references/new-track-set.md` (working tree, branch `feat/track-sets`).
Cited steps read: `new-track.md`, `implement.md` (§2.0 step 5, §3.1, §3.2 step 7, §3.4, §5.0), `review.md` (§3.3), `revert.md` (§3.3 step 5, §5.3 step 4). Project checks read: `advantage-forge/measure/tools/common.mjs` and `doctor.mjs`.

Result: 20 findings are resolved, and 1 finding (10) is not resolved. The revision added 10 new problems: 1 Blocking and 9 Minor. Each step number that the document cites matches its content.

## Findings 1 to 21

1. **Resolved.** §2.2 step 4: "When the files of step 2 answer a topic, or part of a topic, do not ask that part. Record the file as the source of the answer (§2.9 step 3). Ask only the open part." §2.9 step 3: "**Date** is the date of the user's answer, or the date of the file statement. **Source** is `user`, or the path of the file." New problem 9 covers the date.
2. **Resolved.** The template has "- **Start gate:** <the condition from §2.2 topic 4, or "none">". `implement` §2.0 step 5 item 1 asks about the gate before §3.1. The announcement says "Start gate: <condition, or 'none'>."
3. **Resolved.** §2.7 step 1: "List the decisions that a unique member's spec needs and that the shared answers do not give ... If the user defers a question, add it to **Open Questions** in the overview with the member that owns it." New problem 7 covers the batch limit.
4. **Resolved.** §2.3 step 3 "Order Conflict Check" asks "<the first part> falls inside <n> members. How should the set put it first?" It gives two options ("A separate member" and "First phase of each member"), a rule for the recommendation, and "Change the scopes and the dependencies of the member list to match the answer."
5. **Resolved.** §2.3 step 1 gives one test: "the track IDs that must be complete before this member starts, or none. List direct dependencies only. Do not repeat a dependency of a dependency." The second test ("cannot be accepted without") is gone.
6. **Resolved.** §2.4 step 1: "Show the member list from §2.3 and ask once", with the option "**Mixed (Recommended)**". New problems 5 and 6 cover this step.
7. **Resolved.** §2.3 step 4 writes the set ID and checks the names before Gate 1. §2.9 step 1: "If a name now matches, HALT and tell the user which name matches. Create no file."
8. **Resolved.** §2.7 step 2: the tasks "may differ in only two ways": a "**value**" or "a **variant block**: a named list of tasks that only some members of the group have (for example rigging tasks for the character modules of a group)". It adds: "If you are not sure whether two members belong to one group, put them in different groups."
9. **Resolved.** §2.7 step 3: "Add the Phase Completion Verification tasks only when the **Workflow** defines that protocol."
10. **Not resolved.** §2.7 step 3 now says "apply the phase rules of §2.3 step 4 with their conditions". `new-track` §2.3 step 4 still requires the four Contract-First phases for a classic plan. Its only exception (documentation-only or workflow-change tracks) is in the story branch. The text still does not say which phase names an asset production member uses when the project **Workflow** gives other phases ("design contract, visual checks, production, and export review").
11. **Resolved.** §2.7 step 6: "**Draft the Other Members:** After the approval, draft the content of each other member ... §2.9 step 4 creates the files."
12. **Resolved.** §2.3 step 4: "List `measure/archive/` and the **Track Sets Directory** (§2.9 step 2) when they exist. A missing directory counts as empty, not as a failure." §2.9 step 6 repeats "(when it exists)".
13. **Resolved.** §2.3 step 4: "Compare the short name of each member (the track ID without the date) with the short names of the existing tracks, as `new-track` §2.5 step 1 does."
14. **Resolved.** §2.9 step 2 item 2: "If the other links have a description, use: "track set overviews: goal, shared decisions, members, and order.""
15. **Resolved.** The Shared Rules section is gone. §2.9 step 3: "Write one row for each decision. One topic can give several rows. A project rule from a file that every member must follow (for example a quality bar in the **Workflow**) is a row with the topic `rule`."
16. **Resolved.** §2.7 step 3: "When an acceptance criterion needs the value of a shared decision, name the value and its date, for example "bar 7.0 (shared decision of 2026-10-09)"." §2.9 step 3 agrees: "A member spec names a value only where a test needs it".
17. **Resolved.** §2.9 step 4 item 5: "add the same keys to each member, with values for that member. If the project has its own dependency key (for example `dependencies`), write in it the same IDs as in `set.depends_on`. If a project rule needs a field to be non-empty, fill it." §2.9 step 6 now runs the doctor. New problem 1 shows that the doctor run cannot pass in this project, and new problem 4 covers the word "newest".
18. **Resolved.** §2.3 step 1: "The track description (in the registry and in `metadata.json` `description`) is `<set title>: <title>`." §2.9 step 4 item 4 and step 5 use it.
19. **Resolved.** §2.9 step 5: "If the registry groups tracks under headings, add them at the end of the group that fits the set best. If no group fits, add them at the end of the file." The choice of the group is a judgment, but the rule is clear.
20. **Resolved.** §2.9 step 8: "The first track is '<track description of the first member>'. Run `implement` and give that description."
21. **Resolved.** §3.0 step 5: "**Change a dependency:** Edit three places: `set.depends_on` in `metadata.json` (and the project dependency key, if any), the **Depends on** line in the `## Track Set` section, and the **Depends on** cell in the overview." New problem 3 covers the order numbers.

## New problems

1. **§2.9 steps 6 and 7 — Blocking.**
   - Quote: "If the project has a doctor script (for example `measure/doctor.sh`), run it. Correct each failure that names a member file or the overview. Report other failures to the user, and do not correct them in this workflow." / "Do NOT commit until every check passes." / "the generated files that the doctor script changed"
   - Problem: The workflow does not run the generate script before the doctor. In the test project, `measure/generated/status.md` has one row for each track (`measure/tools/common.mjs`, line 340). New members make this file stale, and the doctor reports `measure/generated/status.md: stale generated fact`. That failure names no member file. Thus the agent must not correct it, and it must not commit. The workflow has no exit from this state. A doctor failure that the set did not cause also stops the commit.
   - The doctor of this project changes no file (it runs the generator only with `--bootstrap`). Thus "the generated files that the doctor script changed" matches no file. The doctor also runs `git diff --exit-code -- measure/generated/`, which fails until the agent stages the generated files. Measure itself runs the generate script first and the doctor second (`implement` §4.0 step 3).
   - Result: one agent runs `generate.sh` without an instruction, one commits after a failure, and one stops with no commit.

2. **`revert` §3.3 step 5, against §3.0 step 5 and §2.9 step 4 item 5 — Minor.**
   - Quote: `revert`: "Remove its ID from the `set.depends_on` of every other member, and from the **Depends on** cells of the overview." / §3.0 step 5: "**Change a dependency:** Edit three places: ..."
   - Problem: The revert step edits two of the places that §3.0 step 5 names. It keeps the removed ID in the `## Track Set` line of each spec and in the project dependency key. In the test project, the doctor then reports `unknown dependency` for each member that named the removed track. Also, members list direct dependencies only. When the agent removes track B from the list of track A, track A loses the dependencies that it had through track B. The text does not tell the agent to add them to track A.

3. **§3.0 step 5 (Change a dependency) — Minor.**
   - Quote: "If the change breaks the order rule, change the order numbers in the same three kinds of places, and tell the user."
   - Problem: The order number is in four places: `set.order`, "member <order>" in the `## Track Set` section, the **Order** cell of the overview, and the registry line `*Set: <set title> (`<set_id>`), order <n>*`. The text does not name the registry line. §2.9 step 6 also requires the overview rows in registry order, and the text does not say whether to move rows. An agent can keep the old order in the registry.

4. **§2.9 step 4 item 5 — Minor.**
   - Quote: "Read the `metadata.json` of the newest track in the **Tracks Directory** (or in `measure/archive/` when the directory has no track). If it has keys that the Measure schema does not have (for example `workstream` or `evidence`), add the same keys to each member, with values for that member."
   - Problem: The text does not define "newest": the date in the track ID, `created_at`, or the folder time. In the test project, 16 tracks have the newest ID date, and each has a `pack` key. 11 history tracks have `commit_count`, `historical_start`, `source_revision_start`, and other keys. The rule copies the keys of one track, also keys that apply only to that track. Two agents that choose different tracks write different key sets.

5. **§2.4 step 1 — Minor.**
   - Quote: "**Mixed (Recommended)** — Classic FR list for members that repeat one template (for example one track per module), and Story-shaped spec for unique feature members."
   - Problem: §2.7 step 2 defines "template group" and "unique member" later, with its own rule: "If you are not sure whether two members belong to one group, put them in different groups." A group needs "the same spec sections", and a Story-shaped spec and a Classic spec have different sections. Thus the choice in §2.4 sets the groups before §2.7 applies its test. A member that §2.4 treats as a template member can become a unique member in §2.7, with a Classic spec. Two agents can give different formats to the same member.

6. **§2.4 step 2 — Minor.**
   - Quote: "A bug or chore member uses the Classic FR list unless the user names it for the Story-shaped spec"
   - Problem: The text does not say whether the answer "Story-shaped spec for all" names the bug and chore members. One agent writes a Story-shaped spec for a chore member, and another agent writes a Classic FR list. The spec sections and the template groups then differ.

7. **§2.7 step 1 — Minor.**
   - Quote: "Ask them in one batch of 4 or fewer for all unique members together. If the user defers a question, add it to **Open Questions** in the overview with the member that owns it."
   - Problem: The unique members can need more than 4 decisions. The text does not say what to do with the decisions that do not fit in the batch: ask a second batch, write them as open questions, or decide them in the draft.

8. **§2.6 step 2 and §2.7 step 4 — Minor.**
   - Quote: "Record each debt item that the user accepts in the scope of the member that will address it." / "[the overview changes from step 1, if any]"
   - Problem: §2.6 changes the **Scope** of members after the user approved the overview at Gate 1. Gate 2 shows only the overview changes from §2.7 step 1. Thus the user does not see the scope changes from the tech debt step before the files exist. One agent shows them, and another agent does not.

9. **§2.9 step 3 — Minor.**
   - Quote: "**Date** is the date of the user's answer, or the date of the file statement."
   - Problem: The text does not say how to find the date of a file statement: a date in the file, the last commit that changed the statement, or the date of the read. Member specs copy this date ("bar 7.0 (shared decision of 2026-10-09)"). Two agents can write different dates for the same decision.

10. **§3.0 step 5 (Add a member) — Minor.**
    - Quote: "**Add a member:** Run `new-track` for it. Then add the `set` key, the project metadata keys (§2.9 step 4, item 5), the `## Track Set` section, the index link, the `*Set:*` registry line, and a row in the overview."
    - Problem: `new-track` writes the user's description into the registry and into `description`, and it commits. The text does not tell the agent to change the description to `<set title>: <title>` (§2.3 step 1). It also does not say how to commit the later edits. Also, `new-track` §2.5 step 4 says: "Only the track set workflow ([new-track-set.md](new-track-set.md) §2.9 step 4) writes `set`", but this step writes it too. An added member can differ from the members that §2.9 created.

Note (not counted, not caused by the revision): `implement` §5.0 **Delete** and `review` §3.3 **Delete** do not change the set overview. After a delete, the member link `../tracks/<track_id>/` in the overview points to no folder.
