# Specification: Measure board

## Overview

The measure-status extension becomes one board for the Reading Advantage repos. The rail panel and the full page show an accordion with one section for each of eight repos. Each section holds a read-only Kanban board of the Measure tracks of that repo. The board has five columns: Planned, In progress, Blocked, Waiting on Daniel, and Done. The extension reads files only. It runs no service and it writes no file. The one-line status band does not change.

Source: PM assignment A-67, Daniel, 2026-11-17. Type feature, full lane. Dates: mockup by 2026-11-19, done by 2026-11-24.

The track has two parts. Part 1 is this spec and the plan. Part 2 starts at Phase 1 after the PM reads the spec. The first gate of Part 2 is a static mockup that the PM and then Daniel must accept.

## The assignment (Daniel and PM, verbatim)

> "Our measure extension panel is pretty much garbage and useless to me from a UI/UX perspective ... I think I might like some kind of Kanban board under a repo accordion. OpenChamber already has a kanban that we could use as inspiration: https://github.com/mannu150/openchamber-kanban."

> PM detail: redesign extensions/measure-status. One panel/page with an accordion, one section per Reading Advantage repo on the PM roster (reading-advantage-monorepo, Workbooks, advantage-pr, advantage-forge, mastery-advantage, ra-math-advantage, lending-desk-bench, measure). Inside each section: a Kanban board of its Measure tracks. Columns: Planned; In progress (current phase and task, Red/Green/Review); Blocked ([b], with the blocker line); Waiting on Daniel (human gate); Done (recent, collapsed). A card shows: track name, current phase and task, the age of the last commit on the track, and a blocker or gate line. The section header shows counts per column and a red badge for blocked. The status band stays one line. Read-only v1: no card moves; Measure files stay the source of truth. Study openchamber-kanban for the board look and SDK patterns (panel/, ARCHITECTURE.md), not its agent-start features. Reads files only. Fluid width, works at 390/980/1280 px, OpenChamber theme variables, no remote scripts. Keep scope small: v1 = accordion + board + cards.
> Process: spec + plan first (the PM reads the spec). Then a static HTML mockup with fixture data from the real repos, rendered at 390/980/1280; PM looks, then Daniel's look gate, before Green builds the full board. Then Red/Green, reviews, UX browser review with screenshots, acceptance. Done when: Daniel accepts the look; the extension loads in OpenChamber; the board shows the real tracks of all roster repos; tests pass; README updated. Dates: mockup by 2026-11-19, done by 2026-11-24.

## Decisions in brief

| Topic | Decision | Where |
|---|---|---|
| Files outside the open project | Eight declared `contributes.filesystem` globs, one for each repo. No `service`. No `sessions`. | R3, FR-1 |
| Columns | Five columns. Rules R1 to R4 read the registry marker and the plan markers. | FR-4 |
| Waiting on Daniel | The current task is a User Manual Verification task, or a deferred task has a Daniel owner token. | FR-4 |
| Red, Green, Review stage | Dropped from v1. Files do not give it reliably. | R5 |
| Age on a card | File time of `plan.md` and `metadata.json`, shown as "Updated". It is not a commit time. | R5, FR-6 |
| Done column | The five most recent Done tracks. Collapsed by default. | FR-8 |
| Layout | The columns stack below 640 px. They sit side by side from 640 px. | FR-11 |
| Real data | Real fixtures stay out of git. The measure repo is public and `advantage-pr` is private. | NFR-5 |

## Research record

Evidence uses the form `path:line`. Paths of `@openchamber/sdk` and `@openchamber/web` are relative to the package. The installed host is `@openchamber/web` 2.7.1 with `@openchamber/sdk` 2.7.1. It runs from `/home/daniebo/.local/share/pnpm/global/v11/` on port 38307. The research used a byte-identical copy of the files that sit in that folder. Measurements come from throwaway scripts that stay outside the repo.

### R1. The current extension

- The manifest declares one panel, one status section (height 48), `page: true`, and the capability `files`. Evidence: `extensions/measure-status/package.json:5-14`. The engine floor is `>=1.24.0` at line 7.
- The loader reads the open project only, with relative paths such as `measure/index.md`. Evidence: `src/measure.ts:49-135`, `src/measure.ts:63-64`. A second repo cannot show in this panel.
- The panel body shows one active track of the open project. It has the track list, the plan path, a current-task box, a banner, the phase list, and the `[b]` list. Evidence: `panel/main.ts:263-349`. It has no roster, no columns, and no age.
- The panel polls `stat` every 5 seconds. Evidence: `panel/main.ts:494-497`, `README.md:57-67`.
- The band line is `Measure · <track> · Phase p/P · Task t/T [<marker>] <task>`. Evidence: `src/band.ts:13-43`. The band stays.
- The parser rules stay where they apply. A task is an unindented checkbox line under a `## Phase` heading. A `[b]` task closes when its line has `deferred:<owner>`. Evidence: `src/parse.ts:5-16`, `src/parse.ts:79-112`, `README.md:37-55`. The rules match the guard: `mods/measure-guard/hooks/parse.ts:21,164-165,251`. The board and the guard therefore agree on what is open.
- The parser rules change in two places. The registry reader needs a wider grammar (FR-2). The owner pattern `[^\s`]+` at `src/parse.ts:16` takes a trailing `)` or `**`, so FR-3 narrows the owner token.
- The old panel body, `statusView`, `copyText`, and the old banner helpers leave with the redesign. The band, `loadSnapshot`, and their tests stay.
- The build and test commands stay: `bunx esbuild panel/main.ts --bundle --format=iife --platform=browser --outfile=panel/main.js`, `bunx tsc -p . --noEmit`, and `bunx vitest run`. Evidence: `README.md:69-84`. The host serves the built file `panel/main.js`, so it is committed (`@openchamber/sdk` `API.md:20-29`).
- The panel already reads host theme variables such as `--primary-text`, `--success-text`, `--warning-text`, and `--oc-font`. Evidence: `panel/index.html:8-24`.

### R2. openchamber-kanban

Sources: https://github.com/mannu150/openchamber-kanban, https://raw.githubusercontent.com/mannu150/openchamber-kanban/main/README.md, https://raw.githubusercontent.com/mannu150/openchamber-kanban/main/ARCHITECTURE.md, https://raw.githubusercontent.com/mannu150/openchamber-kanban/main/src/ui/styles.ts, https://raw.githubusercontent.com/mannu150/openchamber-kanban/main/panel/page.html.

- Layout: one full-screen page with five columns (Backlog, To Do, In Progress, Review, Done), a project filter, and a search field. The rail panel is a read-only summary with a badge. Evidence: `ARCHITECTURE.md`, section "The board".
- Columns: `.kb-columns{display:flex;gap:12px;overflow-x:auto}` and `.kb-column{flex:1 0 220px;min-width:220px;max-width:320px}` on a muted surface with a border. A column head has an upper-case 12 px title and a mono count. Evidence: `src/ui/styles.ts`.
- Cards: an elevated surface, a border, and 10 px padding. A card that needs attention has `border-left-width:3px` in the warning colour. Evidence: `src/ui/styles.ts`.
- Colours come from `--oc-*` tokens. Evidence: `src/ui/styles.ts` (one overlay uses a literal `rgba`).
- Code layout: a pure `domain/` layer with no SDK or DOM import, thin `store/` and `host/` layers, and one `ui/` layer. The CSS is a string that the page injects. esbuild builds the IIFE bundles. Evidence: `ARCHITECTURE.md`, section "File structure".
- This board takes the column strip with a 220 px minimum. It takes the muted column, the elevated card, the mono count, and the coloured left border. It also takes the pure model apart from the DOM, the injected CSS string, and the `--oc-*` tokens.
- This board leaves: drag and drop, the `host.storage` task store, the `sessions` and `prompt` capabilities, the git `service`, Start Agent, and the detail dialog.
- Two differences: the kanban holds user tasks in storage, and this board derives cards from files. The kanban scrolls its strip sideways at narrow widths, and this board stacks the columns below 640 px.

### R3. Reading files outside the open project

| # | Fact | Evidence |
|---|---|---|
| 1 | A relative path lives inside the project that is open when the call runs. It needs the `files` capability. | `API.md:301`, `server/lib/guests/files.js:6-9,147-162` |
| 2 | A path that starts with `/` or `~/` is outside the project. It must match a `contributes.filesystem` glob and needs the `filesystem` capability. | `API.md:301`, `files.js:163-170`, `dist/contract.js:203` |
| 3 | Declaring `contributes.filesystem` adds the capability. It takes 1 to 16 globs of 1 to 256 characters. The approval dialog lists the globs. | `API.md:561`, `DOCUMENTATION.md:85-86` |
| 4 | `**` spans folders. `*` and `?` stay in one segment. A glob that ends in `/**` also matches the folder itself. The host compares real paths. | `files.js:33-75,87-126` |
| 5 | The grant covers read and write. A call without it gives `NOT_GRANTED`. | `files.js:268-278` |
| 6 | The user approves the whole capability list once. A manifest that later asks for more needs a new approval. | `DOCUMENTATION.md:85` |
| 7 | `readFile` returns UTF-8 text up to 2,000,000 characters. `stat` returns `kind`, `size`, and `mtime` in milliseconds. `listDir` returns up to 2,000 entries. | `dist/contract.js:45-49`, `files.js:180-236` |
| 8 | A `service` is a process with the user's rights and no sandbox. | `API.md:704` |
| 9 | The `sessions` grant lists projects and sessions and opens sessions. It does not read files. | `DOCUMENTATION.md:56` |
| 10 | A phone shows a panel or a page only when the manifest sets `panel.mobile: true`. | `API.md:7,260,552` |

Chosen mechanism: the manifest declares one glob for each roster repo, in the form `~/Desktop/<repo>/measure/**`. The page reads with `readFile` and `stat`. The manifest keeps the `files` capability for the band and adds no `service`, no `sessions`, and no `network`.

Reasons: the host needs no new process. The approval dialog shows the eight exact paths. The grant is the smallest one that reads the eight repos. The globs end at the `measure/` folder, so the code and the secrets of the repos stay out of reach.

| Rejected option | Reason |
|---|---|
| `contributes.service` with `git` | It runs with the user's full rights (`API.md:704`). It would give an exact commit age, but the grant is far wider than a file read. |
| `sessions` and the project list | It reads no file. The reads still need the `filesystem` globs. The roster is a PM list, not the OpenChamber project list. |
| Switch the open project | The `files` capability reads only the open project. Eight repos must show at once. |
| Runtime settings or `integration` | Globs are static in the manifest. A runtime setting cannot add a repo. `integration` also adds the `network` capability (`DOCUMENTATION.md:85`). |
| One broad glob `~/Desktop/*/measure/**` | It also opens every non-roster repo for read and write. Least privilege wins. |
| Read the PM roster at runtime | The roster in `advantage-pr/measure/pm-log.md:19` lists sessions, not repos. The globs stay static in any case. |

Risk: the `filesystem` grant allows writes under the eight `measure/` folders. The code never calls `writeFile`. A unit test fails when the source holds the text `writeFile` (NFR-3).

### R4. The eight repos and their markers

Paths. All eight `measure/tracks.md` files exist on 2026-11-17. The paths come from `advantage-pr/00-sources/REPOS.md:17,20,21,22,23` for the monorepo, Workbooks, forge, mastery, and ra-math. The same file names `lending-desk-bench` and `measure` at line 48. `advantage-pr` is the PM repo.

| Repo | Path | Registry entries | Archive folder |
|---|---|---|---|
| reading-advantage-monorepo | `~/Desktop/reading-advantage-monorepo` | 313 | yes |
| Workbooks | `~/Desktop/Workbooks` | 62 | yes |
| advantage-pr | `~/Desktop/advantage-pr` | 28 | yes |
| advantage-forge | `~/Desktop/advantage-forge` | 121 | yes |
| mastery-advantage | `~/Desktop/mastery-advantage` | 14 | yes |
| ra-math-advantage | `~/Desktop/ra-math-advantage` | 234 | yes |
| lending-desk-bench | `~/Desktop/lending-desk-bench` | 6 | no |
| measure | `~/Desktop/measure` | 110 | yes |

Visibility. `advantage-pr` is private. The other seven roster repos are public. Evidence: `advantage-pr/00-sources/REPOS.md:26` for the five repos of its table, and `gh repo view` on 2026-11-17 for `measure` and `lending-desk-bench`. The repo `advantage-mmorpg` is not in the roster and is private.

Markers.

| Marker or field | Meaning | Evidence |
|---|---|---|
| `[ ]` | Pending. The orchestrator marks it as legacy, but real plans use it. | `skills/measure-orchestrator/SKILL.md:41-51` |
| `[~]` | In progress. | `SKILL.md:46` |
| `[x]` | Complete. A task line ends with a 7-character SHA. | `SKILL.md:45`, `README.md:53-54` |
| `[b]` | Blocked or human-gated. It stays open until its line has `deferred:<owner>`. | `SKILL.md:47`, `mods/measure-guard/hooks/parse.ts:164-165` |
| `deferred:<owner>` | The task is closed for the completion count. A human-gated task can stay `[b]` with this field. | `mods/measure-guard/hooks/guards.ts:121-148` |
| `User Manual Verification` | A phase-end task. The agent must stop and wait for the explicit confirmation of the user. | `measure/workflow.md:86-88` |
| Red, Green, Review | Role evidence sits in `measure/runs/<track>/`. It is in no plan marker. | R5 |

Real plans carry the owner on the task line. In the plans under `measure/tracks/` of seven repos, 303 `[b]` lines carry `deferred:<owner>` on the task line. Only 32 `[b]` tasks in 2 tracks carry it on a continuation line. The guard reads the task line only, so the board follows the guard.

Real owner tokens include `owner`, `daniel`, `owner-manual-verification`, `owner-browser-recording`, `daniel-deploy-word`, `track-owner`, and tokens that name a later track or an event.

Registry grammar in the real files. These forms occur:

- Titles take five forms. Three are bold: with `Track:`, with `Track A:` or `Track 8:`, and with another prefix such as `Program:`. The other two are a markdown link and plain text (forge, 9 entries).
- The `*Link:*` line sits in one of three places. It is on the same line (197 entries in the monorepo). It is on one of the next three lines. It is more than three lines below (16 entries in ra-math and mastery). Evidence in the checkout of 2026-11-17: `ra-math-advantage/measure/tracks.md:322`, `:346`, `:394`.
- Three entries in ra-math use a `Link:` line without the asterisks.
- Some entries have no link (7 in the monorepo, 6 in ra-math). They are stubs that name the folder in prose.
- The link target is relative to `measure/` (`./tracks/x/`, `./archive/x/`, `tracks/x/`) or relative to the repo root (`./measure/archive/x/`, 120 entries in ra-math, line 339 for example).
- Forge keeps its done tracks under `measure/tracks/`. Other repos move them to `measure/archive/`.
- Lines with no marker, such as the "Cancelled Tracks" lines of the measure repo, are not entries.
- Indented entries are sub-items. All of them are done.

Volume on 2026-11-17, from the prototype of the rules in FR-4:

| Repo | Planned | In progress | Blocked | Waiting on Daniel | Done |
|---|---|---|---|---|---|
| reading-advantage-monorepo | 25 | 49 | 10 | 12 | 217 |
| Workbooks | 4 | 8 | 0 | 2 | 48 |
| advantage-pr | 1 | 7 | 1 | 2 | 17 |
| advantage-forge | 28 | 46 | 0 | 0 | 47 |
| mastery-advantage | 1 | 3 | 0 | 0 | 10 |
| ra-math-advantage | 20 | 13 | 0 | 0 | 201 |
| lending-desk-bench | 0 | 4 | 1 | 0 | 1 |
| measure | 0 | 0 | 0 | 0 | 110 |

One column holds up to 49 cards. FR-8 caps a column at 8 cards for this reason. A registry has up to 200 KB. A plan has up to 680 KB. All plans of the eight repos have about 6 MB. Every file is far below the 2,000,000 character limit.

### R5. Age and stage from files

Age. The extension cannot run `git`. The options were:

| Option | Result |
|---|---|
| File time of `plan.md` and `metadata.json` (chosen) | One `stat` for each file. Measured on 155 tracks against `git log -1 -- measure/<folder>`: 125 values fell within 24 hours of the real commit time, 136 within 72 hours, and the 90th percentile of the gap was 240 hours. |
| The SHA on the last done task line, mapped to a time through `.git/logs/HEAD` | It found a time for 19 of 154 tracks. It also needs globs for `.git`. Rejected. |
| The `[checkpoint: <sha>]` of a phase | It has the same gap as the task SHA. Rejected. |
| `git log -1 -- <folder>` in a `service` | Exact, but it needs the `service` grant (R3). Rejected for v1. |

Limit, stated on the card: the age is the time of the last file change, not the time of a commit. A `git checkout`, `git pull`, or `git clone` sets the file time to the time of the write, so the age then reads too small. An uncommitted edit counts as a change. A commit that touches only other files of the track does not change the age.

Stage. The assignment asks for Red, Green, and Review on In progress cards. The files do not give it:

- A text rule on the current task matched 6 of 140 tracks. The rule looks for the words Red, Green, Review, and the role names. One of the 6 matches was wrong.
- The role evidence files in `measure/runs/<track>/` exist for 81 tracks. The newest role file gave a stage for 16 of them. One full load would need about 1,800 `stat` calls.

Decision: v1 shows no stage. The card shows the current phase and task, whose text often names the stage. A later track can add a stage chip that reads the role file names.

## Functional Requirements

### FR-1. Roster and file access

- FR-1.1 `src/roster.ts` holds the roster. It lists the eight repos in the order of the assignment: reading-advantage-monorepo, Workbooks, advantage-pr, advantage-forge, mastery-advantage, ra-math-advantage, lending-desk-bench, measure. Each repo has an id equal to its folder name and the path `~/Desktop/<id>`.
- FR-1.2 `package.json` declares `contributes.filesystem` with one glob for each roster repo: `~/Desktop/<id>/measure/**`. A unit test fails when the globs and the roster differ.
- FR-1.3 The board reads only `<path>/measure/tracks.md`, `<path>/measure/<folder>/plan.md`, and `<path>/measure/<folder>/metadata.json`. The band keeps its own reads of the open project (relative paths, `files` capability).
- FR-1.4 The code calls `readFile` and `stat`. It never calls `writeFile` or `listDir`.
- FR-1.5 The manifest keeps `capabilities: ["files"]` for the band. It adds `panel.mobile: true`. It sets `engines.openchamber` to `>=2.7.1`, the host version that the live load in Task 4.2 uses. The docs of `@openchamber/sdk` 2.2.0 do not name `panel.mobile`.
- FR-1.6 The board shows the main checkout of each repo under `~/Desktop`. A track that exists only in an unmerged worktree does not show.

### FR-2. Registry reading

`parseRegistry(md)` returns one entry for each registry entry line. The rules:

- An entry line starts in column 0 with `- [m] `, where `m` is a space, `~`, `x`, or `b`. An indented line is not an entry. A line with no marker is not an entry.
- The title is the text of the first `**...**` pair. Without a bold pair, it is the text of a leading markdown link. Without a link, it is the rest of the line. A leading `Track: `, `Program: `, or `Track <id>: ` is removed, where `<id>` has letters, digits, and dots.
- The link target is the first of these, in the lines from the entry line to the line before the next entry line or heading: `*Link: [text](target)*`, then `Link:` followed by `(target)`, then the link of a link title. The scan has no line limit.
- The folder comes from the target. Remove a trailing `/index.md`, `/plan.md`, and `/`. Resolve `./` and `..`. Remove a leading `measure/`. The result has the form `tracks/<id>` or `archive/<id>`. An entry with no target has no folder.
- A target that is absolute, has a URL scheme, or climbs above `measure/` gives no folder. This rule blocks path escapes.
- A `[x]` entry has a done date from one of two sources. The first source is the first ISO date after the word `completed`, `complete`, `archived`, or `done` in any case. At most 24 non-digit characters sit between the word and the date. The second source is the last `_YYYYMMDD` of the folder name, written `YYYY-MM-DD`. With neither source, the done date is empty. The result records the source: `registry` or `folder`.

### FR-3. Plan reading

- The page reuses `parsePlan`, `isOpen`, `tasksOf`, and `position` of `src/parse.ts`. A task is a top-level checkbox line under a `## Phase` heading. A plan with no `## Phase` heading has no task.
- A task is closed when its marker is `x`, or its marker is `b` and its line matches `deferred:` as the guard reads it. A task is open when it is not closed.
- The owner token of a task is the text after `deferred:`. It ends at the first character that is not a letter, a digit, `.`, `_`, or `-`. The page removes trailing `.`, `_`, and `-`. The change affects the shown token and the Daniel check only. It does not change which tasks are closed.
- The task text for a card removes the trailing 7-character SHA and any `[checkpoint: ...]`. It collapses runs of white space. It stops at 140 characters and adds `…`. The full text goes to the `title` attribute.
- The page reads the task line only. A `deferred:` field on a continuation line does not close a task. The guard behaves in the same way.

### FR-4. Column rules

Terms:

- The current task is the first task with marker `~`. When no task has `~`, it is the first open task. A plan can have no current task.
- A gate task is a task whose line matches `User Manual Verification` in any case.
- A Daniel token is an owner token with one of these values in any case: `daniel`, `user`, `owner`, `po`, `product-owner`, `human`, `human-gated`, or `both-owners`. A token that starts with `owner-` or `daniel-` also counts.

Rules. The first rule that applies decides:

| Rule | Condition | Column | Card line |
|---|---|---|---|
| R1 | The registry marker is `x`, or the folder starts with `archive/`. | Done | none |
| R2 | The track has no task (no folder, no `plan.md`, or no task under a phase heading). The registry marker is `b`. | Blocked | "No plan. Registry marker [b]." |
| R2 | The same, with registry marker `~`. | In progress | "No plan." |
| R2 | The same, with registry marker space. | Planned | "No plan." |
| R3a | A current task exists and it is a gate task. | Waiting on Daniel | the text of the gate task |
| R3b | A current task exists, it is not a gate task, and its marker is `b`. | Blocked | the text of the `[b]` task |
| R3c | The current task has marker `~`. | In progress | none |
| R3d | The current task has marker space, and the registry marker is `b`. | Blocked | "Registry marker [b]." |
| R3d | The current task has marker space, and the registry marker is `~` or any task has marker `x`. | In progress | none |
| R3d | The current task has marker space, in all other cases. | Planned | none |
| R4a | No current task exists, and a task with marker `b` has a Daniel token. | Waiting on Daniel | the text of the first such task |
| R4b | No current task exists, and another task has marker `b`. | Blocked | the text of the first such task |
| R4c | No current task exists, and no task has marker `b`. | In progress | none |

Notes on the rules:

- The plan decides over the registry when the plan has a readable task. The registry marker decides only in R2 and in R3d. The registry markers are often stale in real files.
- A gate task is the only text signal of a human gate. The words "Daniel", "owner", and "approved" in a task line are not signals. Measured on the current tasks of the non-Done tracks, those words appear in few tasks. Several of those tasks are not gates, for example an implementation task that says "owner-approved".
- An owner token that is not a Daniel token, for example `track-owner` or the name of a later track, gives Blocked, not Waiting on Daniel.
- The text of a `[b]` task includes its `deferred:<token>` field. The reader sees who owns the gate.

Examples. Each row is a case for the unit tests:

| Registry | Plan | Column |
|---|---|---|
| `x` | any | Done |
| any | folder `archive/<id>` | Done |
| space | first task `[ ]` and no `[x]` | Planned |
| space | one `[x]`, no `[~]`, next task `[ ]` | In progress |
| `~` | all tasks `[ ]` | In progress |
| space | no plan file | Planned |
| `~` | no plan file | In progress |
| `b` | no plan file | Blocked |
| any | first `[~]` task is an ordinary task | In progress |
| any | first `[~]` task is a User Manual Verification task | Waiting on Daniel |
| any | no `[~]`, first open task is a `[ ]` User Manual Verification task | Waiting on Daniel |
| any | no `[~]` task, first open task is a `[b]` task with no `deferred:` field | Blocked |
| `b` | no `[~]` task, first open task is `[ ]` | Blocked |
| any | all other tasks `[x]`, one `[b]` with `deferred:owner-manual-verification` | Waiting on Daniel |
| any | all other tasks `[x]`, one `[b]` with `deferred:after-the-cutover` | Blocked |
| any | all tasks `[x]` | In progress, "All tasks closed." |
| any | an open `[b]` task with no owner, then a `[~]` task | In progress (the `[~]` task is the current task) |
| any | a `[b]` task with `deferred:x`, then a `[~]` task | In progress |

### FR-5. Card

A card shows these items in this order. All text comes from the files and is escaped.

1. The track title.
2. The position line. A Done card has none. A card with a current task shows `Phase p/P · Task t/T` and the task text with its marker, for example `[~] Write the loader`. The position comes from `position()`. A card with a plan and no current task shows `All tasks closed.` An R2 card shows its R2 card line.
3. The card line of FR-4, when the rule gives one other than an R2 line.
4. The foot line. For a card that is not Done, it reads `Updated <age>` (FR-6), or `Updated unknown` when the age is unknown. For a Done card, it reads `Done <date>` with a registry date, `From <date>` with a folder date, or `No date`.

The card data has these fields: `repo`, `title`, `column`, `position`, `marker`, `taskText`, `line`, `lastChange`, `doneDate`, and `doneSource`. The field `position` is an object with `phase`, `phases`, `task`, and `tasks`, or null. The field `lastChange` is a time in milliseconds, or null. The model, the mockup fixtures, and the preview fixtures all use these fields.

A Blocked card has a 3 px left border in the colour of `--oc-error`. A Waiting on Daniel card has a 3 px left border in the colour of `--oc-warning`. A card has no click action in v1. The text can be selected.

The track title wraps up to 3 lines. A longer title ends in `…`, and the full title goes to the `title` attribute.

### FR-6. Age

- The last change of a track is the largest value of `stat(plan.md).mtime` and `stat(metadata.json).mtime`. A missing file gives no value. With no value, the last change is unknown.
- `formatAge(now, then)` gives `<1m` below one minute, `Nm` below one hour, `Nh` below one day, and `Nd` below 60 days. From 60 days it gives `Nmo`, where one month is 30 days and the value rounds down. A future time gives `<1m`.
- The age label updates every 60 seconds from the stored time. It makes no file call.
- The card never says "commit". The label is "Updated". The tooltip of the label says: "Time of the last change to plan.md or metadata.json (file time, not a commit time)."

### FR-7. Accordion and section header

- The page shows one section for each roster repo, in roster order.
- The header is one `button` with `aria-expanded`. It shows the repo id and one count for each of the five columns, with the column names. The counts stay visible when the section is closed.
- A red badge shows the Blocked count when it is 1 or more. A badge in the warning tone shows the Waiting on Daniel count when it is 1 or more.
- A section is closed until its first load ends. Then it opens when its Blocked count or its Waiting on Daniel count is 1 or more. Other sections stay closed.
- The page keeps the open or closed state that the user sets, and the user's choice always wins. A refresh does not reset it. The state lives in memory only.
- A section that is still loading shows `Loading` in its header. A section that failed shows the error line of FR-10.
- The header is at least 40 px high.

### FR-8. Columns

- The columns follow this order at every width: Planned, In progress, Blocked, Waiting on Daniel, Done.
- A column header shows the column name and the count of all cards of the column.
- A column with no card shows `None`.
- A column other than Done shows at most 8 cards, then a button `Show N more`, where `N` is the number of hidden cards. The button opens the full list. The state is kept in memory like FR-7.
- Cards sort by last change, newest first. Cards with an unknown last change come last, in registry order. Equal times keep registry order.
- The Done column is closed at the first paint. It shows its count only. An open Done column shows the 5 most recent Done cards. Done cards sort by done date, newest first. Cards with no date come last, in registry order. The count of the header is the count of all Done tracks.
- The Done cards need no file call. They come from the registry.

### FR-9. Status band and rail badge

- The status surface keeps `bandLine` and `height: 48`. It shows the Measure state of the open project, as it does now. It shows no board data.
- The rail badge shows the number of tracks in the Blocked and the Waiting on Daniel columns across all loaded repos. It shows no badge when the number is 0. The old badge (count of `[b]` tasks of the open project) goes away.
- The panel and the page show the same board. The layout follows the width of the frame, not the surface.

### FR-10. Loading, refresh, and errors

- A full load reads, for each repo, `measure/tracks.md`. For each track that is not Done, it reads `plan.md` and calls `stat` on `plan.md` and on `metadata.json`. Done tracks make no call.
- The page makes at most 8 file calls at one time. The page loads each repo on its own. A failure in one repo does not stop the others.
- A sweep runs every 15 seconds while `document.visibilityState` is `visible`. It calls `stat` on the registry of each repo and on the `plan.md` of each track that is In progress, Blocked, or Waiting on Daniel. A changed `mtime` makes the page read that file again and rebuild that repo. A changed registry also reads the plans of new tracks.
- The Refresh button runs a full load. It shows a busy state until the load ends.
- Error lines follow the code of the failed call:
  - `NOT_GRANTED` gives one banner at the top: "Allow file access outside the project in Settings → Extensions."
  - `NOT_FOUND` for `tracks.md` gives the section line "No Measure tracks file at <path>."
  - `NOT_FOUND` for a plan gives the card line "No plan."
  - Any other code (`FILE_TOO_LARGE`, `DENIED`, `BAD_PATH`) gives the section line "Cannot read <repo>: <code>."
- A full load of the real roster finishes in less than 10 seconds on the development machine. Phase 4 records the time.

### FR-11. Layout

The mockup shows each rule at 390, 980, and 1280 px. The final page keeps the rules.

- Below 640 px, the five columns stack in the order of FR-8. A column with no card shows its header only.
- From 640 px, the columns sit side by side. A column is at least 220 px wide and at most 320 px wide. The row wraps when the columns do not fit.
- At 980 px, at least three columns are visible side by side. At 1280 px, all five columns are visible side by side, with Done as a header while it is closed.
- The page never scrolls sideways at 390, 980, or 1280 px. A long word in a title wraps (`overflow-wrap: anywhere`).
- Buttons and section headers are at least 40 px high.
- The panel in the rail uses the same rules. The rule applies to the width of the frame.

### FR-12. Look and sandbox

- All colours come from the host theme variables (`--oc-*`, set by `applyHostTheme`). The CSS has no hex colour, no `rgb()` or `hsl()`, and no named colour except `transparent` and `currentColor`. A `color-mix()` of variables is allowed.
- The CSS is one string in `src/styles.ts`. The page injects it at start. The preview page uses the same string. The mockup holds the same rules as plain CSS, and Task 3.2 moves them into the string.
- The page loads no remote script, style, font, or image. The sources `panel/index.html`, `panel/main.ts`, and `src/` hold no `http://` string, no `https://` string, no `fetch(`, no `XMLHttpRequest`, no `WebSocket`, and no `@import`.
- The page has no drag and drop and no write call.
- Every text from a file passes through one escape function before it reaches HTML. A test uses titles such as `<img src=x onerror=alert(1)>`.
- A blocked or waiting state never relies on colour alone: the card line and the badge carry text.
- The section header and the Show more button are `button` elements with a visible focus ring from `--oc-focus`.

### FR-13. Files and duties

| File | Duty |
|---|---|
| `src/roster.ts` | The roster and the glob list. |
| `src/registry.ts` | `parseRegistry` (FR-2). |
| `src/parse.ts` | The plan parser, with the owner token of FR-3. |
| `src/board.ts` | The column rules, the card, the sort, the cap, and the counts (FR-4, FR-5, FR-8). |
| `src/age.ts` | The last change and `formatAge` (FR-6). |
| `src/load.ts` | The loader over `readFile` and `stat` with the call limit and the error isolation (FR-10). |
| `src/refresh.ts` | The sweep targets and the change test (FR-10). |
| `src/styles.ts` | The CSS string (FR-12). |
| `src/render.ts` | Pure functions that return escaped HTML for the board (FR-5, FR-7, FR-8). |
| `src/measure.ts`, `src/band.ts` | The band for the open project. Dead view-model code leaves. |
| `panel/main.ts` | The host wiring: events, the sweep, the badge, the band, and the render calls. |
| `panel/index.html` | The entry. A minimal shell. |
| `mockup/board.html` | The static mockup of Phase 1, with invented fixture data. |
| `preview/preview.html`, `preview/preview.ts` | A page without a host that renders the real board code from invented data. The review uses it. |

### FR-14. Records

- The extension README has these sections: What it shows, Install, Surfaces, The board, Reading the files, Refresh, Layout, The age and its limits, Add a repo, Build, Test, and Files.
- The Install section names the `files` capability and the eight globs. It says that the grant covers read and write, and that the code only reads.
- The Add a repo section says that a new repo needs one roster line, one manifest glob, and a new approval.
- The CHANGELOG entry goes first in the list under the first `### Features` heading of `## Unreleased`. Its text is: `* **measure board:** the measure-status extension shows one accordion section for each of eight Reading Advantage repos. Each section holds a read-only Kanban board of the Measure tracks of that repo. The columns are Planned, In progress, Blocked, Waiting on Daniel, and Done. A card shows the track name, the current phase and task, the age of the last file change, and a blocker or gate line. The extension reads files only, through eight contributes.filesystem globs, and runs no service. The status band does not change.`
- The first sentence of `README.md` line 33 becomes: `As of <closeout date>, the latest archived track is Measure board (the measure-status extension shows a read-only Kanban board of the Measure tracks of eight Reading Advantage repos).` The rest of the line stays.

## Non-Functional Requirements

- NFR-1. The code is TypeScript, strict. `bunx tsc -p . --noEmit` passes.
- NFR-2. The model code (`roster`, `registry`, `parse`, `board`, `age`, `load`, `refresh`, `render`) has no SDK import and no DOM access. Unit tests run in Node.
- NFR-3. A unit test reads the source files of `src/` and `panel/main.ts`. It fails when it finds `writeFile` or `listDir`.
- NFR-4. The shipped bundle `panel/main.js` comes from `panel/main.ts` with the esbuild command of R1. It is committed.
- NFR-5. Real fixtures stay out of git. The measure repo is public and `advantage-pr` is private (R4). Committed fixtures use invented titles and task texts with the same lengths and the same markers. Real fixtures live in `measure/runs/measure_board_20261117/`, which git ignores.
- NFR-6. New prose in the README, the plan, and the spec follows ASD-STE100. These documents do not state how many tests, checks, or suites exist.
- NFR-7. Reading a plan never throws. A bad plan gives the R2 card, not an error screen.

## Test

The tests run with `cd extensions/measure-status && bunx tsc -p . --noEmit && bunx vitest run`.

- `roster.test.ts`: the manifest globs equal the roster globs. Each glob has the form `~/Desktop/<id>/measure/**` and 1 to 256 characters. The list has 1 to 16 globs (`API.md:561`).
- `registry.test.ts`: every grammar form of R4, the folder rules, the path escape, and the done date rules.
- `parse.test.ts`: the owner token cases (`(deferred:owner)`, `**deferred:x**`, `deferred:owner-manual-verification)`), and the existing cases.
- `board.test.ts`: each row of the rule table and each example row of FR-4, the card line, the sort, the cap, and the counts.
- `age.test.ts`: `formatAge` at each boundary, and the last change with a missing file.
- `load.test.ts`: a fake host with a call counter. It checks the call limit, the error isolation, the call budget of a full load and a sweep, and that Done tracks make no call.
- `refresh.test.ts`: the sweep targets and the change test.
- `render.test.ts`: counts, badges, escaping, the closed Done column, `aria-expanded`, the `Show N more` button, and no colour literal or remote URL in `src/styles.ts` and `src/render.ts`.
- `band.test.ts`: the tests of `bandLine` and `loadSnapshot` stay and pass. The tests of the removed view-model code leave with it.
- `source.test.ts`: NFR-3.

## Acceptance Criteria

1. Daniel accepts the look. `measure/runs/measure_board_20261117/look-gate.md` holds the verdicts of the PM and of Daniel for the mockup, and the verdict of Daniel for the live board.
2. The extension loads in OpenChamber 2.7.1. The approval dialog lists the eight globs. The rail panel and the page show the board. The band still shows one line.
3. The board shows the real tracks of all eight repos. For each repo, the sum of the five column counts equals the number of column-0 entry lines of its `tracks.md`.
4. `cd extensions/measure-status && bunx tsc -p . --noEmit && bunx vitest run` exits 0.
5. `extensions/measure-status/README.md` describes the board: the install approval, the column rules, the refresh, the layout, and the limits of the age.
6. Screenshots at 390, 980, and 1280 px, in the light and the dark theme, exist for the mockup, the preview page, and the live board. The page does not scroll sideways in any of them.
7. The CSS has no colour literal. The package loads no remote resource. The source has no `writeFile`.
8. No file in git holds real track titles or task texts of the roster repos.

## Out of Scope

- Moving cards, drag and drop, and any write to a Measure file.
- Starting an agent, opening a session, or any session action.
- Editing a track, a plan, or a task from the board.
- A click action on a card, a detail dialog, search, and filters.
- Repos outside the roster, including `advantage-mmorpg`, unless the PM adds them (one roster line and one manifest glob).
- Tracks in worktrees that are not merged.
- The Red, Green, and Review stage chip (R5).
- An exact commit age (it needs a `service`).
- Saved accordion state, keyboard shortcuts, and translations.
- A copy-to-clipboard button. The old "Copy status" leaves with the old panel body.

## Open Questions

Each question has a default. The plan follows the default.

1. Add `advantage-mmorpg` to the roster? Default: no. It needs one roster line and one glob.
2. Keep real fixtures out of git? Default: yes (NFR-5).
3. Does the rail badge count Blocked and Waiting on Daniel tracks? Default: yes.
4. Which sections start open? Default: the sections with a Blocked or Waiting on Daniel card (FR-7).
5. Does an unknown owner token such as `track-owner` count as Daniel? Default: no. It gives Blocked.
6. Which `engines.openchamber` floor? Default: `>=2.7.1`.
7. Show tracks of worktrees? Default: no. Main checkouts only.
8. Add a `service` for the exact commit age? Default: no.
9. Add a stage chip later from the role file names? Default: not in v1.
10. How many cards does a column show before `Show N more`? Default: 8. Done shows 5.
11. Add the tooling rows to `measure/tech-stack.md` in Task 1.1? Default: yes. The extension has no row today.
12. Poll every 15 seconds? Default: yes, only while the page is visible.
13. Show a track whose folder is in `measure/tracks/` but not in the registry? Default: no. The registry is the source.
