# Final check: new-track-set.md and the cited steps

Document: `/home/daniebo/Desktop/measure/skills/measure/references/new-track-set.md` (working tree, branch `feat/track-sets`). Diff read: `git diff HEAD -- skills/measure` (6 files). Cited steps read: `new-track.md` §2.1 to §2.5, `implement.md` §2.0 to §5.0, `review.md` §3.3, `revert.md` §3.3 and §5.3. Test project read: `advantage-forge/measure/doctor.sh`, `generate.sh`, `tools/doctor.mjs`, `tools/generate.mjs`, `tools/common.mjs`.

Result: 8 problems and the Delete note are resolved. Problem 1 is resolved, with one Minor gap that remains. Problem 10 is partly resolved. The diff has 1 Blocking problem. Each section number that the changed files cite matches its target step. The `claude-skills/measure` copies are the same as the `skills/measure` files.

## Problems 1 to 10 and the Delete note

1. **Resolved.**
   - Quote (§2.9 step 6): "If the project has a generate script (for example `measure/generate.sh`), run it first, and stage the files that it changes. Then, if the project has a doctor script (for example `measure/doctor.sh`), run it, as `implement` §4.0 step 3 does."
   - Exit: "If a failure remains that names no file of the set, show it to the user and ask: "The doctor reports a failure that this set did not cause. Commit the set anyway?" On **Commit anyway**, continue with step 7 and name the failure in the commit message body. On **Stop**, HALT without a commit."
   - Step 7 now stages "the files that the generate script changed". In the test project, the doctor runs `git diff --exit-code -- measure/generated/`. This command compares the work tree with the index, so the staged generated files pass it. The citation of `implement` §4.0 step 3 is correct.
   - Minor gap: a failure that names `measure/tracks.md` or `measure/index.md` is not "a member file or the overview". Thus it goes to the user question, also when the set caused it. Also, the test project now has a stale `measure/generated/asset-inventory.json` from other work. The generate step puts that change into the set commit.

2. **Resolved.**
   - Quote (`revert` §3.3 step 5): "apply **Remove a member** in [new-track-set.md](new-track-set.md) §3.0 step 5 (overview status `removed`, and the dependencies of the other members)".
   - Quote (§3.0 step 5): "For every other member that lists it, apply **Change a dependency**: replace the removed ID with the removed track's own `set.depends_on` entries, without duplicates."
   - **Change a dependency** names all three places and "the project dependency key, if any". The replacement keeps the dependencies that a member had through the removed track. The order rule stays true, because each replacement ID has a lower order than the removed track.

3. **Resolved.**
   - Quote: "An order number is in four places: `set.order` in `metadata.json`, "member <order>" in the `## Track Set` section, the **Order** cell in the overview, and the `*Set:*` line in the registry. Then move the registry entries and the overview rows so that both stay in order."

4. **Resolved.**
   - Quote: "Read every `metadata.json` in the **Tracks Directory** ... Find the keys that every one of these files has and that the Measure schema does not have ... Do not copy a key that only some tracks have."
   - In the test project, all 101 tracks have 4 project keys: `workstream`, `retrospective`, `evidence`, and `dependencies`. The rule drops `pack` (16 tracks) and the history keys (11 tracks). Thus two agents get the same key set. The value of each key for each member is still a judgment (Minor).

5. **Resolved.**
   - Quote (§2.4 step 2): "Do not assign a format to each member yet: §2.7 step 2 applies the answer after it forms the template groups."
   - Quote (§2.7 step 2): "Form the groups by structure first. Then apply the format answer of §2.4 to each group and each unique member. ... All members of one group use one format."

6. **Resolved.**
   - Quote (§2.4 step 3): "Bug and chore members use the Classic FR list with every option (`new-track` §2.2 step 3 recommends it for these types). Only a typed answer that names a bug or chore member changes this."
   - The options now say "for every feature".

7. **Resolved.**
   - Quote (§2.7 step 1): "Ask them in batches of 4 or fewer for all unique members together, until each question is asked. Do not decide a member question yourself."

8. **Resolved.**
   - Quote (§2.6 step 2): "Show each scope change at Gate 2 (§2.7 step 4)."
   - Gate 2 template: "[the overview changes from step 1 and the scope changes from §2.6, if any]".

9. **Resolved.**
   - Quote (§2.9 step 3): "For a decision from a file, it is the date that the file gives for the statement; if the file gives none, it is the date of the last commit that changed the file (`git log -1 --format=%cs -- <file>`)."

10. **Partly resolved.**
    - Resolved parts: the description ("Run `new-track` for it, with the description `<set title>: <title>` (§2.3 step 1)"), the commit ("Commit these edits: `chore(measure): Add track '<track description>' to set '<set_id>'`"), and the `new-track` rule, which now says "§2.9 step 4, and §3.0 step 5 when a track joins a set later".
    - Remaining gap: "The project metadata keys come from `new-track` like any track." `new-track` §2.5 step 4 writes a fixed schema with no project keys. The previous revision said to add "the project metadata keys (§2.9 step 4, item 5)". The step also does not copy `set.depends_on` into the project dependency key. Blocking problem 1 below gives the details.

**Delete note: Resolved.**
- Quote (`implement` §5.0): "**Track set member:** Before you delete the folder, read its `metadata.json`. If it has a `set` key, apply **Remove a member** in [new-track-set.md](new-track-set.md) §3.0 step 5, and stage the changed files with the delete commit."
- `review` §3.3 **Delete** has the same rule: "read it before you delete the folder, apply **Remove a member** ...".
- **Remove a member** says: "replace its **Track** link with the plain track ID". Thus no overview link points to a deleted folder. §3.0 step 2 lists the two **Delete** steps.

## Blocking problems in the diff

1. **§3.0 step 5, Add a member: the project metadata keys.**
   - Quote: "**Add a member:** Run `new-track` for it, with the description `<set title>: <title>` (§2.3 step 1). Then add the `set` key, the `## Track Set` section, the index link, the `*Set:*` registry line, and a row in the overview. The order rule of §2.3 applies. The project metadata keys come from `new-track` like any track."
   - Problem: `new-track` §2.5 step 4 writes only the Measure schema, with `"deviation_notes": ""`. It has no step that adds project keys. Thus the last sentence states a step that the cited workflow does not have. §2.9 step 4 item 5 gives the members that the set creates the project keys, and a project dependency key with the same IDs as `set.depends_on`. The Add a member step does not give these to an added member.
   - Effect in the test project: an added member has no `workstream`, `retrospective`, `evidence`, or `dependencies`, and its `deviation_notes` is empty. The doctor then reports 9 errors for that `metadata.json` (4 "missing" errors, 4 type errors, and 1 empty `deviation_notes` error). Neither `new-track` nor this step runs the doctor, so the error stays until a later `implement` §4.0.
   - Readings: (a) Write the `new-track` schema only, as the text says. (b) Copy the project keys as §2.9 step 4 item 5 does, and fill the project dependency key from `set.depends_on`. A careful agent can choose either reading, and the two `metadata.json` files differ materially.
   - The diff introduced this sentence. `HEAD` did not mention project keys, and the previous revision gave reading (b).
   - Possible correction: "Then apply §2.9 step 4 item 5 to it (project metadata keys, and the project dependency key with the IDs of `set.depends_on`)."

No other Blocking problem was found. These checks gave no Blocking result: each section citation, the removal of **Shared Rules** from all files, the start gate in `implement` §2.0 step 5 and §3.0 step 6, the **Remove a member** rule in `implement`, `review`, and `revert`, the order rule after a removal, and the doctor flow in the test project.
