Author model: claude-code/claude-sonnet-5-5#max

## Spec Review

Date: 2026-11-17
Round: 1
Reviewer: claude-code/claude-sonnet-5-5#max (a fresh session with no conversation history)
Substitution reason: The planned reviewer route, Muse, failed twice. The orchestrator ran the review on a Sonnet route instead. The author and this reviewer are both Sonnet, so the review is not independent by model family.
Audited HEAD: cbeea8e3d991adc7f58c26c3f7995c02f752b187
Reviewer files: `measure/runs/measure_board_20261117/spec-review-cbeea8e.json` and `measure/runs/measure_board_20261117/spec-review-cbeea8e.log`. Git ignores that folder, and these files are not part of the commit.
Verdict: pass. The review found no Blocker. The author applied every finding with the disposition FIX.

### What this track proposes
This track redesigns the measure-status OpenChamber extension into one read-only board. The page shows an accordion with one section for each of eight Reading Advantage repos. Each section shows a Kanban board of the Measure tracks of that repo in five columns: Planned, In progress, Blocked, Waiting on Daniel, and Done. A card shows the track title, the current phase and task, the age of the last file change, and a blocker or gate line. The extension reads files only, through eight declared filesystem globs, and the one-line status band stays.

### How the current system works, per this spec
The current extension has one panel, one status band, and one page. It reads only the open project through the files capability, shows one active track with its phase list and its [b] list, and polls stat every 5 seconds. The parser in src/parse.ts reads tracks.md entries and plan.md tasks with the same rules as the measure-guard hook. OpenChamber 2.7.1 allows a read outside the open project only for a path that matches a declared contributes.filesystem glob and only with the filesystem capability, which the user approves once.

### Findings
- F1 [Major] Acceptance Criteria 3 and Open Question 13: The board hides each track folder that has no registry entry line. This breaks the Done-when item 'the board shows the real tracks of all roster repos'. In lending-desk-bench, 8 of 14 track folders have no entry line, and its own table lists bench_v2 and bugfix_bench as in-progress. In advantage-forge, 5 folders have no entry line. In the monorepo, 2 folders have none. Rationale: Rules R1 to R4 are total, so the column sum always equals the entry-line count, and criterion 3 cannot find a hidden track.
- F2 [Major] FR-4 current task and FR-5 position: The current task is the first open task, but real plans have open tasks before completed tasks. In lending-desk-bench, daily_model_schedule has a first open [b] task 5.4 with no deferral and 27 [x] tasks after it. Rule R3b puts it in Blocked with a red badge, but 52 of 55 tasks are [x] and its registry prose names Phase 4b as next. In the monorepo, primary_mastery_evidence_20261006 has 5 open verification tasks and 23 [x] tasks after the first, so its card names the verification of Phase 0. Rationale: The red badge and the position line are the main signals, and the example table of FR-4 has no row for an open task before completed tasks.
- F3 [Major] FR-4 R3a and Notes: The only text signal of a human gate is the words User Manual Verification. The own Task 1.5 of this track ('GATE. PM look, then Daniel accepts the look') is open and does not match. While Task 1.5 is open, rule R3d puts this track in In progress, not in Waiting on Daniel. Rationale: The column exists to show such gates. The Notes say that the words Daniel, owner, and approved appear in 'few tasks' but give no count, so a reader cannot check the claim.
- F4 [Major] FR-10 and NFR-7: Three edge cases have no stated behavior. A plan read that fails with a code other than NOT_FOUND gives a section line, but NFR-7 says that a bad plan gives an R2 card. The sweep skips Planned tracks, so a plan that gets its first [~] task with no registry change stays Planned until Refresh. The host returns kind missing with mtime 0 for a missing file and not NOT_FOUND (files.js:229-230), and the spec does not say how the loader reads this. Rationale: The plan leaves these edge-case behaviors to the implementer.
- F5 [Major] FR-13 and Test section: The spec names only two functions, parseRegistry(md) and formatAge(now, then). The exports, the parameters, and the result types of board.ts, load.ts, refresh.ts, and render.ts are open. The host type is open too: MeasureHost at src/measure.ts:11-15 has listDir, which FR-1.4 forbids. Rationale: The Red role must choose the API shape, and the Zero-Decision Check leaves no API choice to the implementer.
- F6 [Major] NFR-5 and plan header: Real data goes to measure/runs/measure_board_20261117/, 'which git ignores'. The file .gitignore:213 ignores measure/runs/, but git ls-files lists tracked files in that tree, and the role artifacts of this track are committed from the same folder. A force-add of the folder would commit private advantage-pr data into the public measure repo. The leak check runs once (Task 1.2). Rationale: No task names a command that checks criterion 8 on the final git tree.
- F7 [Nit] FR-9 and FR-10 scope: The rail badge change (FR-9) and the 15-second incremental sweep with its own module refresh.ts (FR-10) add behavior that the assignment did not ask for. Rationale: The assignment says 'v1 = accordion + board + cards'. A Refresh button and a timer on the full load are smaller, and the old panel already polls stat (panel/main.ts:494-497).
- F8 [Nit] R4 volume table: The counts of ra-math-advantage differ from the spec. FR-2 to FR-4 on the checkout of HEAD give 19/12/0/0/203, and the spec gives 20/13/0/0/201. Two commits on 2026-11-17 (19:56 and 19:58 +0700) re-pointed links to the archive. The other seven rows match. Rationale: Pinned counts of live repos drift within one day. Label the table as a sample.
- F9 [Nit] R3 evidence: DOCUMENTATION.md:56 and DOCUMENTATION.md:85-86 name no package. Two files have this name: @openchamber/sdk DOCUMENTATION.md with 473 lines, and @openchamber/web server/lib/guests/DOCUMENTATION.md with 214 lines. The cited text sits only in the SDK file. Rationale: A reader of the web file finds other text at these lines.
- F10 [Nit] R3 and R4 evidence: The spec sits in the public measure repo and cites paths and line numbers inside the private advantage-pr repo. The spec quotes no title and no secret. Rationale: The paths show the structure of a private repo. Name the facts without the paths.
- F11 [Nit] FR-4 Daniel token list: 55 of the 303 deferred lines in the plans of the roster repos carry a token of the list. The tokens pm (24 lines) and phikul (9 lines) are in no list and in no open question. Rationale: Blocked then shows a gate that waits on a person, and the spec does not say that this is intended.

### Author Response
- F1: FIX
- F2: FIX
- F3: FIX
- F4: FIX
- F5: FIX
- F6: FIX
- F7: FIX
- F8: FIX
- F9: FIX
- F10: FIX
- F11: FIX

### Applied Changes

The orchestrator gave the dispositions on 2026-11-17. This list records the change for each finding.

- F1 (FIX): FR-2 adds the folders that have no registry entry. A folder under `tracks/` with a `plan.md` shows by its plan, with the line "Not in the registry". A folder under `archive/` shows in Done. FR-10 reads the two folder lists. Acceptance criterion 3 adds the folders to the entry lines. Open Question 12 (13 at the audited HEAD) now has the default yes. The PM can change this default.
- F2 (FIX): FR-4 defines the last done task, the ahead task, the skipped task, and the current task. The current task is the first `[~]` task, else the first open task after the last `[x]` task. A skipped task never names the current task. An open `[b]` task in any place gives Blocked, and the card line is that task. FR-5 adds the note for a card with no current task. The Test section adds a `daily_model_schedule`-like case and a `primary_mastery_evidence`-like case with invented text.
- F3 (FIX): A gate task is an open ahead task that holds `User Manual Verification` or whose body starts with the word `GATE`. The test is case-sensitive and reads the text after the task id prefix. Task 1.5 already starts with `GATE` after its id, so its text does not change. The Notes now give a count for the words Daniel, owner, and approved (13 of 191 current tasks in the sample).
- F4 (FIX): FR-10 states the three behaviors. A plan read that fails with a code other than `NOT_FOUND` gives an R2 card with the note "Plan unreadable". A `stat` result of kind `missing` counts as not found. The board has no partial update, so a full reload closes the gap of a plan that gets its first `[~]` task.
- F5 (FIX): FR-13 names the exports and the types of every new module. FR-1.4 and FR-1.7 allow `listDir` in `src/load.ts` only, for the folders `tracks` and `archive`. `MeasureHost` keeps `listDir`, because the board loader needs the call and `BoardHost` has the same three members. NFR-3 and the Test section follow.
- F6 (FIX): Real fixtures, the real-data mockup, the real-data previews, and the real-data screenshots go to `/home/daniebo/.local/share/measure-board-private/`, outside every work tree. The committed fixtures and the committed mockup use invented text. The claim that `measure/runs/` keeps real data out of git is removed. Task 4.5 is a leak check before the push, with the evidence file `leak-check.log`. The old Task 4.5 is now Task 4.6.
- F7 (FIX): The module `refresh.ts` and the sweep are removed. The board reloads in full when the page opens, when the user presses Refresh, and every 60 seconds while the page is visible. The rail badge stays and counts Blocked tracks only (Open Question 3).
- F8 (FIX): The volume table is a sample with the time 2026-11-17 21:25 +0700. It now has the entry lines and the folders that FR-2 adds. A test never pins these counts.
- F9 (FIX): Each citation of `DOCUMENTATION.md` names `@openchamber/sdk`. The research intro names the second file of `@openchamber/web`.
- F10 (FIX): The spec cites no path and no line inside the private repo. It names the source as the PM log or the repo list of a private roster repo.
- F11 (FIX): FR-4 states that only the Daniel tokens give Waiting on Daniel. The tokens `pm` and `phikul`, and every other token, give Blocked. R4 and Open Question 5 name both tokens.

Other changes in this round:

- Open Questions 9 to 13 follow the order of the final reply of Part 1. Question 11 is the reload question, and question 12 is the folder question.
- Open Questions 14, 15, and 16 are new. Each has a default.
  - Question 14: a gate task before an older open `[b]` task.
  - Question 15: the note for a card with no current task.
  - Question 16: the scope of the leak check.
