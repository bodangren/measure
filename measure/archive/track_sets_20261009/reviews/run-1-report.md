# Dry-run report: new-track-set.md

Document under test: `/home/daniebo/Desktop/measure/skills/measure/references/new-track-set.md` (branch `feat/track-sets`).
Project: `/home/daniebo/Desktop/advantage-forge`. I ignored the `riven_*_20261009` tracks and `measure/riven-lands-roadmap.md`, as the test rules require.
IDs use the date 2026-10-10.

Output files in this folder:

- `overview.md`: the set overview, as §2.9 step 3 writes it.
- `sample/`: the props member of the family template group (`spec.md`, `plan.md`, `metadata.json`, `index.md`), and `changed-values.md` (the Gate 2 table).
- `members.md`: the 16 members with order, `depends_on`, the `set` key, the registry entries, and the other planned writes.

## Step log

- **1.0:** I resolved the Product Definition, the Tech Stack, and the Workflow through `measure/index.md`. All three files exist, so the check passed.
- **2.1:** I wrote the set goal (see `overview.md`) and the set title "Riven Lands assets for Reading Advantage" (6 words).
- **2.2:** I read the registry, `measure/product.md`, `docs/pack-layout.md`, the catalog TSV, and the 29 game manifests. The graph probe printed "Note: graph.db is missing — skipping graph-aware context probe." `docs/pack-layout.md` answers topics 1 and 4 and most of topic 3, so I skipped topics 1 and 4. I asked one batch of two Exclusive Choice questions (split rule, review process). The simulated user gave the scenario answers.
- **2.3:** I drafted 16 members with the prefix `riven_`: 3 foundation members (orders 1 to 3), 12 family members (order 4), and 1 scenes member (order 5). The size check did not apply.
- **2.4:** I asked one spec-format question for the set. The user chose Classic FR list for every member, so no member has a `sprint` key.
- **2.5:** I drafted and presented the overview. The user answered Approve.
- **2.6:** The Tech Debt Registry has 40 lines. I presented the open items TD-01, TD-04, TD-05, TD-06, TD-13, TD-14, TD-19, TD-21, and TD-22. The user declined all items, so no scope changed.
- **2.7:** I made 4 unique members and 1 template group of 12 family members. I read the Workflow and Lessons Learned (50 lines). The Workflow has no "Phase Completion Verification Protocol", and the Blast-Radius Probe did not apply. I wrote the full props sample and the Gate 2 table. To keep the run cheap, the unique members exist only as scope lines. The user answered Approve.
- **2.8:** I did not run `npx -y skills search`, because it downloads and runs a package. The simulated user declines every skill, so §2.4.1 did not apply.
- **2.9:** I listed `measure/tracks/` (101 folders). `measure/archive/` does not exist, and I treated it as empty (finding 12). The index has no Track Sets Directory link. The set ID is `riven_lands_20261010`, and no name collided. I wrote the overview, the props member, and the registry entries into this folder. `python3 -m json.tool` accepted the sample metadata. I checked each `depends_on` ID against the planned member list, because a dry run creates no folder. I did not commit.
- **3.0:** I compared the six cited steps with `implement.md`, `review.md`, and `revert.md`. Each cited step number matches its content. The cited `new-track` steps (§2.1 step 4, §2.2 steps 2 to 6, §2.3 steps 2 to 4, §2.4, §2.4.1, §2.5 steps 4, 5, and 8) also match. The scenario did not use a read-side rule.

Note: `SKILL.md` ("Continuous improvement") tells the agent to create a GitHub issue for each Measure defect. I created no issue, because the test rules allow writes only in this folder.

## Findings

Summary: 21 findings. 5 are Blocking (4, 8, 9, 12, 17). 16 are Minor.

1. **§2.2 step 4 and §2.9 step 3 — Minor.**
   - Quote: "Skip a topic only when the files in step 2 already answer it, and say so in the summary." / "| YYYY-MM-DD | <topic from §2.2> | <the user's answer> |"
   - Problem: `docs/pack-layout.md` answers topics 1 and 4. It answers topic 3 only in part: the base size, the skeleton names, and the bars, but not the independent review. The text does not say what to do with a partial answer. For a skipped topic, the table still asks for "the user's answer" and a date. The decision came from a file with an earlier date.
   - Readings: (a) Ask all four topics, and date every row 2026-10-10. (b) Skip the answered topics, and give the source date and the source file. My guess: (b). I asked only the open part of topic 3.

2. **§2.2 step 4 (topic 4), §2.9 step 3, and §2.9 step 8 — Minor.**
   - Quote: "**Start gate:** The condition before work starts (for example a release, an approval, a date), or \"none\"." / "Start with track '<first track_id>' by running `implement <first track_id>`."
   - Problem: The workflow collects a start gate, but the overview template has no field for it. No read-side rule checks it. `implement` §2.0 step 5 checks only `depends_on`. `implement` §3.2 step 7 reads the overview after §3.1 has set the track to in progress. The announce text tells the user to start now, but the gate says to wait for the cutover.
   - Readings: (a) A row in Shared Decisions only. (b) A rule in Shared Rules, or a gate task in the plan of the first member. My guess: (a). I kept the announce text as written.

3. **§2.2 step 1 and §2.7 step 2 — Minor.**
   - Quote: "Each track then follows from these answers." / "For each unique member, draft the full `spec.md` and `plan.md`."
   - Problem: Unique members need decisions that the four topics do not cover. Examples: the first game in the Riven Lands skin, the world scale for a 1.6 m character, and the pack choice at run time. `new-track` asks 3 to 4 functional questions for a classic feature. This workflow has no step for member questions.
   - Readings: (a) Ask member questions before Gate 2. (b) Put the questions in Open Questions, each with an owner member. My guess: (b).

4. **§2.3 steps 1 and 2 — Blocking.**
   - Quote: "Apply the split rule to write the member list." / "If a member cannot be accepted without another member's work, add that member to its **Depends on**." / "Measure still runs one active track at a time."
   - Problem: The user order ("the game set first, then the rest of the catalog by family") cuts across the split rule (one track for each family). A dependency is always a whole track, and only one track is active at a time. The workflow has no step that finds this conflict or asks the user about it.
   - Readings: (a) The game skin track builds the whole game set. Each family track builds only its rows outside the game set and depends on the game skin track. (b) Each family track builds its game-set rows first. The game skin track then depends on 8 family tracks and comes last, so the game set is not first. My guess: (a). The member scopes and the `depends_on` arrays differ between (a) and (b).

5. **§2.3 steps 1 and 2 — Minor.**
   - Quote: "**Depends on:** the track IDs that must be complete before this member starts, or none." / "If a member cannot be accepted without another member's work, add that member to its **Depends on**."
   - Problem: The two sentences give two different tests: "before this member starts" and "cannot be accepted without". The scenes track can start before the family tracks are complete, but it cannot be accepted without them. The text also does not say whether to list transitive dependencies.
   - Readings: (a) List only the direct dependencies of one test. (b) List every needed member of both tests. My guess: (b). Each family member lists the pack layout, the base character, and the game skin.

6. **§2.4 steps 1 and 2 — Minor.**
   - Quote: "Ask once for the set, with the options of `new-track` §2.2 step 3 (Story-shaped spec or Classic FR list)." / "Recommend **Classic FR list** for members that repeat one template (for example one track per module), and **Story-shaped spec** for unique feature members."
   - Problem: Two options cannot show the recommended mix. Also, the user first sees the member list at Gate 1 (§2.5), after this question. Thus the user cannot see which members repeat a template.
   - Readings: (a) Two options, with the recommendation in the question text. (b) A third option "Mixed", with the member list in the question. My guess: (b).

7. **§2.5 step 1 and §2.9 step 1 — Minor.**
   - Quote: "Write the set ID: `<shortname>_YYYYMMDD`." (§2.9 step 1) / "If a member track ID matches an existing track folder, or the set ID matches an existing overview, HALT and suggest a different short name."
   - Problem: The Gate 1 overview shows the Set ID, and the Gate 2 samples link to `../../sets/<set_id>.md`. But the workflow defines the set ID only in §2.9 step 1, after both gates. The name check also runs after both approvals. A collision then stops the workflow after the user approved the IDs. The text does not say whether to go back to §2.3 or to show the gates again.
   - My guess: I chose the set ID at §2.3, and I checked the names before Gate 1.

8. **§2.7 step 1 — Blocking.**
   - Quote: "A **template group** is 2 or more members with the same structure: the same spec sections, the same phases, and the same task pattern. Only values change"
   - Problem: The 12 family members have the same spec sections and the same phases. Their tasks differ by kind. Character families need rig, clip, preset, and clearance tasks. Equipment needs fit tasks, and world families need none of these. The text does not say how closely the "task pattern" must match.
   - Readings: (a) One group of 12, with one marked value `<kind checks>`. (b) Two or more groups (characters, world) and one unique member (equipment), each with its own sample at Gate 2. My guess: (a). The number of samples and the plan tasks of each member differ between (a) and (b).

9. **§2.7 step 2 — Blocking.**
   - Quote: "use the Contract-First phases, and add the Phase Completion Verification tasks."
   - Problem: The cited step `new-track` §2.3 step 4 adds these tasks only "If **Workflow** defines \"Phase Completion Verification Protocol\"". The project `measure/workflow.md` does not define this protocol. The summary in §2.7 drops the condition.
   - Readings: (a) Add one verification task to each phase. Each member then has 4 more tasks (`estimated_tasks` 14 in the sample) that refer to a protocol that does not exist. (b) Leave out the tasks (`estimated_tasks` 10). My guess: (b).

10. **§2.7 step 2 — Minor.**
    - Quote: "use the Contract-First phases"
    - Problem: `new-track` §2.3 step 4 requires the phases Contract & Schema Definition, Test, Implement, and Generate Docs & Doctor. Its only exception is "documentation-only or workflow-change tracks". The project workflow says "Asset work uses a design contract, visual checks, production, and export review." An asset production track is not an exception.
    - Readings: (a) The Measure phase names. (b) The project asset phase names. My guess: the Measure names, with the asset meaning in parentheses.

11. **§2.7 step 5 and §2.9 step 4 — Minor.**
    - Quote: "**Generate the members:** After the approval, write each member of a template group from its approved sample."
    - Problem: "write" can mean "create the files now". Then the files exist before the §2.9 step 1 name check and before the overview. "write" can also mean "draft the content", and §2.9 step 4 then creates the files.
    - My guess: draft the content in §2.7, and create the files in §2.9 step 4.

12. **§2.9 step 1 and Prerequisites — Blocking.**
    - Quote: "List the **Tracks Directory**, `measure/archive/`, and the **Track Sets Directory** (step 2) if it exists." / "Validate every tool call. If any fails, halt immediately and inform the user."
    - Problem: "if it exists" applies only to the Track Sets Directory. This project has no `measure/archive/`, so the listing fails. The Prerequisites rule then says to stop.
    - Readings: (a) Stop, and create no artifact. (b) Treat a missing archive as empty. My guess: (b).

13. **§2.9 step 1 and `new-track` §2.5 step 1 — Minor.**
    - Quote: "If a member track ID matches an existing track folder" / `new-track`: "Extract short names from track IDs" and "If proposed name matches existing, halt and suggest different name"
    - Problem: `new-track` compares short names, but the set workflow compares full track IDs. A member with a new date can repeat the short name of an existing track. `new-track` stops in that case, and the set workflow continues. This run had no collision, because I ignored the `riven_*_20261009` tracks. With those tracks, the two rules give different results.
    - Readings: (a) Compare full IDs. (b) Compare short names. My guess: (a), as written.

14. **§2.9 step 2 — Minor.**
    - Quote: "Add a link labeled **Track Sets Directory** to `./sets/` in `measure/index.md`, next to the **Tracks Directory** link and in the same format."
    - Problem: The index lines of this project have a description after the link ("- [Tracks Directory](./tracks/): specifications, plans, metadata, and evidence."). The workflow gives no description text.
    - My guess: "- [Track Sets Directory](./sets/): track set overviews and their member tables."

15. **§2.9 step 3 — Minor.**
    - Quote: "| YYYY-MM-DD | <topic from §2.2> | <the user's answer> |" / "<a rule that applies to every member, for example a quality bar or a naming rule>" / §2.2: "(for example formats, quality bars, technology, naming)" / "Write each shared decision once, here."
    - Problem: The text does not say whether the table has one row for each topic or one row for each decision. Topic 3 holds several decisions. Also, a quality bar is an example in Shared Decisions and in Shared Rules. Thus one decision can go into either section, or into both.
    - My guess: one row for each decision, with the topic as a prefix. The bar values are in Shared Rules, and the decision row refers to them.

16. **§2.9 step 3 — Minor.**
    - Quote: "Write each shared decision once, here. Member specs link to it and do not copy it."
    - Problem: Some members implement a shared decision. The base character track builds the 1.6 m, 5-head base. The props sample must give its review bar. A testable acceptance criterion needs the value.
    - Readings: (a) Put the value in the FR (a copy). (b) Refer to the overview by name. My guess: (b). The sample says "the world bar in the set's shared rules".

17. **§2.9 step 4 — Blocking.**
    - Quote: "Write `metadata.json` with the schema and the `sprint` rules of `new-track` §2.5 step 4, and add the `set` key"
    - Problem: The project doctor (`measure/tools/common.mjs`) requires the keys `workstream`, `retrospective`, `evidence`, and `dependencies`. It also requires a non-empty `deviation_notes`. The Measure schema has none of these keys and writes `""` for `deviation_notes`. The project key `dependencies` overlaps `set.depends_on`, and the doctor checks cycles only in `dependencies`. The text does not say whether to keep project extensions. The §2.9 step 6 checks do not run the project doctor, so the error appears only later.
    - Readings: (a) Write the Measure schema only. The doctor then fails for all 16 members. (b) Add the project keys, and copy `depends_on` into `dependencies`. My guess: (a) in the sample, because the text names one schema.

18. **§2.9 steps 4 and 5 — Minor.**
    - Quote: "- [ ] **Track: <member description>**" / `new-track` §2.5 step 4: "\"description\": \"<Initial user description>\""
    - Problem: §2.3 does not define a "member description". For a set, the "initial user description" is one request for all 16 members. Thus the registry text and the `description` field are a guess.
    - Readings: (a) The scope line from §2.3. (b) A short title. (c) The user request, the same for every member. My guess: (b), with the same text in the registry and in the metadata.

19. **§2.9 step 5 — Minor.**
    - Quote: "Append each member in order"
    - Problem: This registry has section headings ("## Foundation and history", "## Asset production", "## Games"). An entry at the end of the file falls under "## Games". The text does not say whether to append at the end of the file or in a section.
    - My guess: the end of the file, as written.

20. **§2.9 step 8 and `implement` §2.0 step 3 — Minor.**
    - Quote: "Start with track '<first track_id>' by running `implement <first track_id>`." / `implement`: "Perform an exact, case-insensitive match against the track descriptions."
    - Problem: `implement` compares its argument with the registry descriptions, not with track IDs. The announced command does not match, so `implement` asks for the name again.
    - Readings: (a) `implement` also accepts a track ID, but its text does not say so. (b) The announce must give the description. My guess: I used the announce text as written.

21. **§3.0 step 5 — Minor.**
    - Quote: "**Add a member:** Run `new-track` for it." / "**Change a shared decision:** Add a dated row to **Shared Decisions** in the overview."
    - Problem: The scenes track can find a new dependency in its Phase 1 (an open question in the overview). The text has rules to add a member and to change a decision. It has no rule to change the `depends_on` of an existing member. Three places hold that value: `metadata.json`, the `## Track Set` section, and the overview cell.
    - My guess: edit all three places, and keep the order rule of §2.3.
