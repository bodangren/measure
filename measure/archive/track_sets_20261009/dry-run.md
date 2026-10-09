# Dry run of the track set workflow

## Run 1 (Task 5.1)

- **Agent:** a fresh general-purpose agent with no context from this session.
- **Input:** `skills/measure/references/new-track-set.md` at commit 6b5809b and the files it cites.
- **Scenario:** the Riven Lands request in advantage-forge ("create a set of measure tracks for recreating the Chibi Quest assets in the Riven Lands style for Reading Advantage"), with the owner's answers of 2026-10-09 given as simulated user answers. The agent did not see the 16 tracks that an earlier session made by hand (advantage-forge e3173ca7).
- **Writes:** only in a scratch folder. It wrote the overview, one family sample (props), the member list, and the report.
- **Result:** 21 findings: 5 Blocking (4, 8, 9, 12, 17) and 16 Minor. All step numbers that the reference cited matched their content.

Two blocking findings were confirmed against the project before any change. The project has no `measure/archive/` folder (finding 12). The project doctor `measure/tools/common.mjs` requires `workstream`, `retrospective`, `evidence`, and `dependencies` (finding 17).

Finding 4 is the clearest evidence for the change. The agent split "the game set first" into one separate member that the family tracks depend on. The earlier session, which worked without the reference, put the game set into the first phase of each family track. Both readings fit the old text. The reference now asks the user.

## Corrections (Task 5.2)

| # | Severity | Finding | Correction in `new-track-set.md` (unless named) |
| ---: | --- | --- | --- |
| 1 | Minor | No rule for a topic that a file answers in part; the decision table asked for "the user's answer" | §2.2 step 4: ask only the open part, record the file as the source. §2.9 step 3: a `Source` column |
| 2 | Minor | The start gate had no field and no reader; the announce text said "start now" | §2.9 step 3: a **Start gate** line. `implement` §2.0 step 5 item 1 asks once and records `(met YYYY-MM-DD)`. §2.9 step 8 names the gate. §3.0 step 6 |
| 3 | Minor | No step for questions that only a unique member needs | §2.7 step 1: one batch of member questions; deferred questions go to **Open Questions** |
| 4 | Blocking | The order ("X first") cut across the split rule; no step found it | §2.3 step 3: Order Conflict Check (a separate member, or the first phase of each member) |
| 5 | Minor | Two tests for a dependency ("before it starts", "cannot be accepted without"); transitive entries unclear | §2.3 step 1: one test (complete before the member starts), direct dependencies only |
| 6 | Minor | The format question came before the user saw the member list, and had no "mixed" option | §2.4: shows the member list; options **Mixed (Recommended)**, Classic for all, Story-shaped for all |
| 7 | Minor | The set ID and the name check came after both review gates | §2.3 step 4: name the set and check names before Gate 1. §2.9 step 1: check again and HALT on a new match |
| 8 | Blocking | "The same task pattern" was not defined | §2.7 step 2: same spec sections and phases; differences are values or named variant blocks; when unsure, two groups |
| 9 | Blocking | The summary dropped the condition on the Phase Completion Verification tasks | §2.7 step 3: add them only when the **Workflow** defines that protocol |
| 10 | Minor | `new-track` §2.3 step 4 forces Measure phase names on asset work | Not changed here: the same rule applies to one track. Filed as issue #5 |
| 11 | Minor | "write" could mean create files before the name check | §2.7 step 6: draft the content; §2.9 step 4 creates the files |
| 12 | Blocking | A missing `measure/archive/` made the listing fail, and the Prerequisites rule said HALT | §2.3 step 4: a missing directory counts as empty. §2.9 step 6: "when it exists" |
| 13 | Minor | The set compared full IDs; `new-track` compares short names | §2.3 step 4: compare short names, as `new-track` §2.5 step 1 |
| 14 | Minor | No description text for the index link | §2.9 step 2: a description when the other links have one |
| 15 | Minor | One row per topic or per decision; a quality bar fitted two sections | §2.9 step 3: one table, one row per decision, topic `rule` for project rules. The **Shared Rules** section is removed (also in `implement` §3.2 step 7 and the spec) |
| 16 | Minor | A testable criterion needs the value of a shared decision | §2.7 step 3: name the value and its date. §3.0 step 5: update the specs that name a changed value |
| 17 | Blocking | The project doctor requires metadata keys that the Measure schema lacks; the verification did not run the doctor | §2.9 step 4 item 5: copy the project keys from the newest track; write the project dependency key. §2.9 step 6: run the project doctor |
| 18 | Minor | No "member description" | §2.3 step 1: a **Title**; the description is `<set title>: <title>` |
| 19 | Minor | No placement rule for a registry with headings | §2.9 step 5: keep members together; end of the best group, else end of file |
| 20 | Minor | The announce gave a track ID, but `implement` matches descriptions | §2.9 step 8: the announce gives the description |
| 21 | Minor | No rule to change the dependencies of an existing member | §3.0 step 5: **Change a dependency** in three places |

## Run 2: re-check of the corrections

- **Agent:** a second fresh agent. It read the corrected reference, the cited steps, and the run 1 report. It did not see the corrections table above.
- **Result:** 20 of 21 findings resolved; finding 10 not resolved (issue #5, by design). The corrections added 10 new problems: 1 Blocking and 9 Minor. It also noted a gap that existed before: a **Delete** of a member left a broken link in the overview.

| # | Severity | New problem | Correction |
| ---: | --- | --- | --- |
| 1 | Blocking | §2.9 step 6 ran the project doctor without the generate script, so new members made a generated file stale; a failure that named no set file had no exit | §2.9 step 6: run the generate script, then the doctor (as `implement` §4.0 step 3); ask **Commit anyway** or **Stop** for a failure that the set did not cause. §2.9 step 7 stages the files that the generate script changed |
| 2 | Minor | The revert removal edited two of the places that hold a dependency, and lost dependencies through the removed track | §3.0 step 5 **Remove a member** (one rule): status `removed`, plain ID, and the removed track's own dependencies replace it. `revert` §3.3 step 5 uses it |
| 3 | Minor | The order number is in four places, and the registry must stay in order | §3.0 step 5 **Change an order number** names the four places and moves the rows |
| 4 | Minor | "The newest track" was not defined, and one track can have keys of its own | §2.9 step 4 item 5: the keys that every track in the directory has |
| 5 | Minor | The format choice came before the groups existed | §2.4 records the answer only; §2.7 step 2 forms the groups by structure and then applies the format; one format per group |
| 6 | Minor | "Story-shaped spec for all" was unclear for bug and chore members | §2.4: options name "every feature"; bug and chore members use the Classic FR list unless a typed answer names them |
| 7 | Minor | More than 4 member questions | §2.7 step 1: more batches; the agent decides no member question |
| 8 | Minor | Tech-debt scope changes after Gate 1 were not shown | §2.6 step 2 and §2.7 step 4: Gate 2 shows them |
| 9 | Minor | No rule for the date of a file statement | §2.9 step 3: the date in the file, else the last commit date of the file |
| 10 | Minor | An added member kept the `new-track` description, had no commit rule, and broke the `new-track` set rule | §3.0 step 5 **Add a member**: the set description and one commit. `new-track` §2.5 step 4 names §3.0 step 5 as the second writer of `set` |
| — | (existing gap) | **Delete** in `implement` §5.0 and `review` §3.3 left a broken overview link | Both read the metadata before the delete and apply **Remove a member** |

## Run 3: final check

- **Agent:** a third fresh agent. It read the run 2 problems, the current text, and the full diff, and reported only Blocking problems in the diff.
- **Result:** 9 of the 10 run 2 problems and the Delete gap resolved. Problem 10 was partly resolved: one Blocking sentence. "Add a member" said that `new-track` supplies the project metadata keys, but `new-track` §2.5 step 4 writes a fixed schema. No other Blocking problem; every citation matched.
- **Corrections:** §3.0 step 5 **Add a member** applies §2.9 step 4 item 5 (project keys and the project dependency key). §2.9 step 6 also counts the registry and `measure/index.md` as files of the set, and names generated changes that existed before the step.

The three agent reports are in `reviews/`. Each later run checked the corrections of the run before it. Run 1 found 5 Blocking problems, run 2 found 1, and run 3 found 1. The run 3 problem was one sentence, and the correction uses the wording that run 3 proposed.
