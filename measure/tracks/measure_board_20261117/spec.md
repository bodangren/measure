# Specification: Measure board

## Overview

The measure-status extension becomes one board for the Reading Advantage repos. The rail panel and the full page show an accordion with one section for each of eight repos. Each section holds a read-only Kanban board of the Measure tracks of that repo. The board has five columns: Planned, In progress, Blocked, Waiting on Daniel, and Done. The extension reads files only. It writes no file. The look D1-D2 adds one local service that sends a comment to the PM session. The one-line status band does not change.

Source: PM assignment A-67, Daniel, 2026-11-17. Type feature, full lane. Dates: mockup by 2026-11-19, done by 2026-11-24.

The track has two parts. Part 1 is this spec and the plan. Part 2 starts at Phase 1 after the PM reads the spec. The first gate of Part 2 is a static mockup that the PM and then Daniel must accept.

## The assignment (Daniel and PM, verbatim)

> "Our measure extension panel is pretty much garbage and useless to me from a UI/UX perspective ... I think I might like some kind of Kanban board under a repo accordion. OpenChamber already has a kanban that we could use as inspiration: https://github.com/mannu150/openchamber-kanban."

> PM detail: redesign extensions/measure-status. One panel/page with an accordion, one section per Reading Advantage repo on the PM roster (reading-advantage-monorepo, Workbooks, advantage-pr, advantage-forge, mastery-advantage, ra-math-advantage, lending-desk-bench, measure). Inside each section: a Kanban board of its Measure tracks. Columns: Planned; In progress (current phase and task, Red/Green/Review); Blocked ([b], with the blocker line); Waiting on Daniel (human gate); Done (recent, collapsed). A card shows: track name, current phase and task, the age of the last commit on the track, and a blocker or gate line. The section header shows counts per column and a red badge for blocked. The status band stays one line. Read-only v1: no card moves; Measure files stay the source of truth. Study openchamber-kanban for the board look and SDK patterns (panel/, ARCHITECTURE.md), not its agent-start features. Reads files only. Fluid width, works at 390/980/1280 px, OpenChamber theme variables, no remote scripts. Keep scope small: v1 = accordion + board + cards.
> Process: spec + plan first (the PM reads the spec). Then a static HTML mockup with fixture data from the real repos, rendered at 390/980/1280; PM looks, then Daniel's look gate, before Green builds the full board. Then Red/Green, reviews, UX browser review with screenshots, acceptance. Done when: Daniel accepts the look; the extension loads in OpenChamber; the board shows the real tracks of all roster repos; tests pass; README updated. Dates: mockup by 2026-11-19, done by 2026-11-24.

## Decisions in brief

| Topic | Decision | Where |
|---|---|---|
| Files outside the open project | Eight declared `contributes.filesystem` globs, one for each repo. The D1 send path adds `contributes.service` and `contributes.sessionControl`. | R3, R6, FR-1, FR-16 |
| Columns | Five columns. Rules R1 to R4 read the registry marker and the plan markers. | FR-4 |
| Current task | The first `[~]` task. Else the first open task after the last `[x]` task. An open task before the last `[x]` task never names the current task. | FR-4 |
| Waiting on Daniel | The current task is a gate task. With no current task, a closed `[b]` task that has a Daniel owner token also gives it. A gate task holds `User Manual Verification` or starts with the word `GATE`. | FR-4 |
| Blocked | An open `[b]` task in any place of the plan. With no current task, a closed `[b]` task with a token such as `pm` or `phikul` also gives Blocked. | FR-4 |
| Folders with no registry entry | A folder under `tracks/` with a `plan.md` shows by its plan, with the line "Not in the registry". A folder under `archive/` shows in Done. | FR-2, FR-4 |
| Red, Green, Review stage | Dropped from v1. Files do not give it reliably. | R5 |
| Age on a card | File time of `plan.md` and `metadata.json`, shown as "Updated". It is not a commit time. | R5, FR-6 |
| Done column | One closed group with the 5 newest tracks closed in the last 14 days. A count line below the group. | FR-8, FR-16 |
| Comment on a blocker | One message to the PM session. The session id is a constant of `src/pm-target.ts`. | FR-16 |
| Reload | A full reload on open, on Refresh, and every 60 seconds while the page is visible. No partial update. | FR-10 |
| Rail badge | The number of Blocked tracks of all repos. | FR-9 |
| Layout | The columns stack below 640 px. They sit side by side from 640 px. | FR-11 |
| Real data | Real fixtures and the real-data mockup live outside the repo. The measure repo is public and `advantage-pr` is private. | NFR-5 |

## Research record

Evidence uses the form `path:line`. Paths of `@openchamber/sdk` and `@openchamber/web` are relative to the package. The installed host is `@openchamber/web` 2.7.1 with `@openchamber/sdk` 2.7.1. It runs from `/home/daniebo/.local/share/pnpm/global/v11/` on port 38307. The research used a byte-identical copy of the files that sit in that folder. Measurements come from throwaway scripts that stay outside the repo.

The files `API.md`, `DOCUMENTATION.md`, and `dist/contract.js` belong to `@openchamber/sdk`. The file `files.js` is `server/lib/guests/files.js` of `@openchamber/web`. A different `DOCUMENTATION.md` exists in `@openchamber/web`, at `server/lib/guests/DOCUMENTATION.md`. Every citation of `DOCUMENTATION.md` below names its package.

### R1. The current extension

- The manifest declares one panel, one status section (height 48), `page: true`, and the capability `files`. Evidence: `extensions/measure-status/package.json:5-14`. The engine floor is `>=1.24.0` at line 7.
- The loader reads the open project only, with relative paths such as `measure/index.md`. Evidence: `src/measure.ts:49-135`, `src/measure.ts:63-64`. A second repo cannot show in this panel.
- The type `MeasureHost` declares `readFile`, `stat`, and `listDir`. The band loader calls `readFile` and `stat` only. Evidence: `src/measure.ts:11-15`, and the test stub at `src/band.test.ts:50`.
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
| 3 | Declaring `contributes.filesystem` adds the capability. It takes 1 to 16 globs of 1 to 256 characters. The approval dialog lists the globs. | `API.md:561`, `@openchamber/sdk` `DOCUMENTATION.md:85-86` |
| 4 | `**` spans folders. `*` and `?` stay in one segment. A glob that ends in `/**` also matches the folder itself. The host compares real paths. | `files.js:33-75,87-126` |
| 5 | The grant covers read and write. A call without it gives `NOT_GRANTED`. | `files.js:268-278` |
| 6 | The user approves the whole capability list once. A manifest that later asks for more needs a new approval. | `@openchamber/sdk` `DOCUMENTATION.md:85` |
| 7 | `readFile` returns UTF-8 text up to 2,000,000 characters. `stat` returns `kind`, `size`, and `mtime` in milliseconds. `stat` of a missing path gives kind `missing` and `mtime` 0, with no error. `listDir` returns up to 2,000 entries, sorted by name. A symlink has the kind `other`. `listDir` of a missing path gives `NOT_FOUND`. | `dist/contract.js:45-49`, `files.js:173-178,180-236`, `API.md:170,380` |
| 8 | A `service` is a process with the user's rights and no sandbox. | `API.md:704` |
| 9 | The `sessions` grant lists projects and sessions and opens sessions. It does not read files. | `@openchamber/sdk` `DOCUMENTATION.md:56` |
| 10 | A phone shows a panel or a page only when the manifest sets `panel.mobile: true`. | `API.md:7,260,552` |

Chosen mechanism: the manifest declares one glob for each roster repo, in the form `~/Desktop/<repo>/measure/**`. The page reads with `readFile`, `stat`, and `listDir`. The manifest keeps the `files` capability for the band and adds no `service`, no `sessions`, and no `network`.

The look D1-D2 of 2026-11-18 changes this choice. The manifest now declares the grant of FR-16. It declares one service and the session control of the PM session. The manifest adds no `network` and no other capability.

Reasons: the host needs no new process. The approval dialog shows the eight exact paths. The grant is the smallest one that reads the eight repos. The globs end at the `measure/` folder, so the code and the secrets of the repos stay out of reach.

| Rejected option | Reason |
|---|---|
| `contributes.service` with `git` | It runs with the user's full rights (`API.md:704`). It would give an exact commit age, but the grant is far wider than a file read. |
| `sessions` and the project list | It reads no file. The reads still need the `filesystem` globs. The roster is a PM list, not the OpenChamber project list. |
| Switch the open project | The `files` capability reads only the open project. Eight repos must show at once. |
| Runtime settings or `integration` | Globs are static in the manifest. A runtime setting cannot add a repo. `integration` also adds the `network` capability (`@openchamber/sdk` `DOCUMENTATION.md:85`). |
| One broad glob `~/Desktop/*/measure/**` | It also opens every non-roster repo for read and write. Least privilege wins. |
| Read the PM roster at runtime | The PM log of a private roster repo lists sessions, not repos. The globs stay static in any case. |

Risk: the `filesystem` grant allows writes under the eight `measure/` folders. The code never calls `writeFile`. A unit test fails when the source holds the text `writeFile` (NFR-3).

### R4. The eight repos and their markers

Paths. All eight `measure/tracks.md` files exist on 2026-11-17. The repo list of the PM gives the paths of the monorepo, Workbooks, forge, mastery, and ra-math. It also names `lending-desk-bench` and `measure`. The list sits in a private roster repo. `advantage-pr` is the PM repo.

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

Visibility. `advantage-pr` is private. The other seven roster repos are public. Evidence: the repo list in a private roster repo for the five repos of its table, and `gh repo view` on 2026-11-17 for `measure` and `lending-desk-bench`. The repo `advantage-mmorpg` is not in the roster and is private.

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

Real owner tokens include `owner`, `daniel`, `owner-manual-verification`, `owner-browser-recording`, `daniel-deploy-word`, `track-owner`, `pm`, `phikul`, and tokens that name a later track or an event. The tokens `pm` and `phikul` name people who are not Daniel.

Real plans also hold open tasks before completed tasks. A track can skip a verification task and go on. Two real shapes occur. In the first shape, one open `[b]` task with no deferral sits before many `[x]` tasks. In the second shape, five open verification tasks sit before the last `[x]` task. FR-4 handles both shapes.

Registry grammar in the real files. These forms occur:

- Titles take five forms. Three are bold: with `Track:`, with `Track A:` or `Track 8:`, and with another prefix such as `Program:`. The other two are a markdown link and plain text (forge, 9 entries).
- The `*Link:*` line sits in one of three places. It is on the same line (197 entries in the monorepo). It is on one of the next three lines. It is more than three lines below (16 entries in ra-math and mastery). Evidence in the checkout of 2026-11-17: `ra-math-advantage/measure/tracks.md:322`, `:346`, `:394`.
- Three entries in ra-math use a `Link:` line without the asterisks.
- Some entries have no link (7 in the monorepo, 6 in ra-math). They are stubs that name the folder in prose.
- The link target is relative to `measure/` (`./tracks/x/`, `./archive/x/`, `tracks/x/`) or relative to the repo root (`./measure/archive/x/`, 120 entries in ra-math, line 339 for example).
- Forge keeps its done tracks under `measure/tracks/`. Other repos move them to `measure/archive/`.
- Lines with no marker, such as the "Cancelled Tracks" lines of the measure repo, are not entries.
- Indented entries are sub-items. All of them are done.
- Folders with no entry occur. They are plan folders under `measure/tracks/` and old folders under `measure/archive/`. The Volume sample counts them.

Volume. The table is a sample of the main checkouts, taken on 2026-11-17 at 21:25 +0700. It comes from a prototype of the rules in FR-2 and FR-4. The repos change every day, so the counts change too. A test never pins these counts.

| Repo | Planned | In progress | Blocked | Waiting on Daniel | Done | Entry lines | Folders added |
|---|---|---|---|---|---|---|---|
| reading-advantage-monorepo | 25 | 49 | 12 | 11 | 229 | 313 | 13 |
| Workbooks | 4 | 8 | 0 | 2 | 53 | 62 | 5 |
| advantage-pr | 1 | 7 | 1 | 2 | 35 | 28 | 18 |
| advantage-forge | 28 | 51 | 0 | 0 | 47 | 121 | 5 |
| mastery-advantage | 1 | 3 | 0 | 0 | 10 | 14 | 0 |
| ra-math-advantage | 19 | 12 | 0 | 0 | 240 | 234 | 37 |
| lending-desk-bench | 0 | 10 | 3 | 0 | 1 | 6 | 8 |
| measure | 0 | 0 | 0 | 0 | 114 | 110 | 4 |

The column "Folders added" counts the folders that FR-2 adds. In the sample, 14 of them sit under `tracks/` (monorepo 1, forge 5, lending-desk-bench 8) and 76 sit under `archive/`. For each repo, the five column counts add up to the entry lines plus the folders added. One more folder under `tracks/` of the monorepo has no `plan.md` and does not show.

One column holds up to 51 cards (forge, In progress). FR-8 caps a column at 8 cards for this reason. One full load of the sample makes about 730 file calls and reads about 6 MB of text. A registry has up to 200 KB. A plan has up to 680 KB. The largest folder list has 225 entries, below the limit of 2,000. Every file is far below the 2,000,000 character limit.

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

### R6. Sending a message to the PM session

The SDK of 2.7.1 has no extension call that sends a message to a session by id. The research used the installed `@openchamber/sdk` 2.7.1 and the installed `@openchamber/web` 2.7.1. No call sent a message.

| # | Fact | Evidence |
|---|---|---|
| 1 | The extension call `prompt({ text, send: true })` sends on the current session. Its request holds no session id. | `API.md:160`, `dist/contract.d.ts:119-125` |
| 2 | The extension call `startSession` creates a session. It never reuses one. | `API.md:159`, `dist/host.d.ts:114` |
| 3 | The extension call `openSession(sessionId)` opens the chat of a session. It sends no message. | `API.md:222` |
| 4 | The service call `sessions.send(sessionId, prompt)` sends a message to a session by id. It answers `{ sent: true }`. | `GUEST_SERVICES.md:195`, `dist/service-host.d.ts:280` |
| 5 | The call `sessions.send` needs the `sessionControl` capability. The grant comes from `contributes.sessionControl`. | `GUEST_SERVICES.md:195`, `server/lib/guests/service-host-api.js:123-129` |
| 6 | The contribution `contributes.sessionControl` needs `contributes.service`. Its shape is `{ content?: true, answers?: true }`. | `DOCUMENTATION.md:47`, `dist/parse.js:657`, `dist/manifest.d.ts:976-977` |
| 7 | The grant of `sessionControl` records only the content flag. It names no session and no directory. | `server/lib/guests/grant-scope.js:102,188-189` |
| 8 | The service runs as a local process. It needs a built `service/main.js`. It starts on the first `serviceRequest`. | `API.md:668`, `GUEST_SERVICES.md:157,170` |
| 9 | The panel holds no service token. Only the service calls OpenChamber. | `GUEST_SERVICES.md:126,190` |
| 10 | The approval dialog shows the row "Run a local service". It shows the row "Start sessions and send messages". | the `@openchamber/web` 2.7.1 settings bundle, keys `settings.extensions.capability.service` and `settings.extensions.capability.sessionControl` |
| 11 | A refused call gives the code `NOT_GRANTED` and the status 403. The rate limit gives `TOO_MANY_PROMPTS` and the status 429. A service sends at most 60 prompts an hour. | `server/lib/guests/service-host-api.js:78-80,112`, `GUEST_SERVICES.md:208` |
| 12 | The service host throws `ServiceHostError` with a code, a message, and a status. | `dist/service-host.js:99-106,134` |
| 13 | The panel call `serviceRequest` fails with `NO_SERVICE`, `SERVICE_FAILED`, or `REQUEST_FAILED`. | `GUEST_SERVICES.md:110-117` |
| 14 | The `prompt` capability sends on the current session. Its dialog row reads "Send messages in your sessions". | `DOCUMENTATION.md:85`, the `@openchamber/web` 2.7.1 settings bundle, key `settings.extensions.capability.prompt` |

Choice: the extension sends through the service. The panel calls `serviceRequest`. The service calls `sessions.send` with the constant session id of `src/pm-target.ts`. The SDK grant names no session, so the constant is the only limit on the target session.

Rejected option: the extension call `prompt({ text, send: true })` with the `prompt` capability. It sends on the current session, so the message can reach the wrong session. It fails with `NO_SESSION` when no session is open.

Rejected option: the extension calls `openSession(sessionId)` and then `prompt`. It opens the chat on the screen of the user, and the current session can differ.

## Functional Requirements

### FR-1. Roster and file access

- FR-1.1 `src/roster.ts` holds the roster (`ROSTER`). It lists the eight repos in the order of the assignment: reading-advantage-monorepo, Workbooks, advantage-pr, advantage-forge, mastery-advantage, ra-math-advantage, lending-desk-bench, measure. Each repo has an id equal to its folder name and the path `~/Desktop/<id>`.
- FR-1.2 `package.json` declares `contributes.filesystem` with one glob for each roster repo: `~/Desktop/<id>/measure/**`. A unit test fails when the globs and `rosterGlobs()` differ.
- FR-1.3 The board reads only `<path>/measure/tracks.md`, `<path>/measure/<folder>/plan.md`, and `<path>/measure/<folder>/metadata.json`. It lists only `<path>/measure/tracks` and `<path>/measure/archive`. The band keeps its own reads of the open project (relative paths, `files` capability).
- FR-1.4 The code calls `readFile`, `stat`, and `listDir`. Only `src/load.ts` calls `listDir`, and only on the two folders of FR-1.3. The code never calls `writeFile`. The D2 rule adds two `stat` calls for each Done track (FR-16).
- FR-1.5 The manifest keeps `capabilities: ["files"]` for the band. It adds `panel.mobile: true`. It sets `engines.openchamber` to `>=2.7.1`, the host version that the live load in Task 4.2 uses. The docs of `@openchamber/sdk` 2.2.0 do not name `panel.mobile`. The manifest also declares the grant of FR-16. It declares `contributes.service` with the built entry `service/main.js`, and `contributes.sessionControl` with `{}`. The grant list holds no other new capability.
- FR-1.6 The board shows the main checkout of each repo under `~/Desktop`. A track that exists only in an unmerged worktree does not show.
- FR-1.7 `MeasureHost` in `src/measure.ts` keeps its three members: `readFile`, `stat`, and `listDir`. The band never calls `listDir`. The type `BoardHost` of `src/load.ts` has the same three members, so one host object serves both loaders.

### FR-2. Registry reading

`parseRegistry(md)` returns one entry for each registry entry line. The rules:

- An entry line starts in column 0 with `- [m] `, where `m` is a space, `~`, `x`, or `b`. An indented line is not an entry. A line with no marker is not an entry.
- The title is the text of the first `**...**` pair. Without a bold pair, it is the text of a leading markdown link. Without a link, it is the rest of the line. A leading `Track: `, `Program: `, or `Track <id>: ` is removed, where `<id>` has letters, digits, and dots.
- The link target is the first of these, in the lines from the entry line to the line before the next entry line or heading: `*Link: [text](target)*`, then `Link:` followed by `(target)`, then the link of a link title. The scan has no line limit.
- The folder comes from the target. Remove a trailing `/index.md`, `/plan.md`, and `/`. Resolve `./` and `..`. Remove a leading `measure/`. The result has the form `tracks/<id>` or `archive/<id>`. An entry with no target has no folder.
- A target that is absolute, has a URL scheme, or climbs above `measure/` gives no folder. This rule blocks path escapes.
- A `[x]` entry has a done date from one of two sources. The first source is the first ISO date after the word `completed`, `complete`, `archived`, or `done` in any case. At most 24 non-digit characters sit between the word and the date. The second source is the last `_YYYYMMDD` of the folder name, written `YYYY-MM-DD`. With neither source, the done date is empty. The result records the source: `registry` or `folder`.

Folders with no entry. The loader lists `<path>/measure/tracks` and `<path>/measure/archive`. It keeps each list entry of kind `directory` and skips each other kind, such as a symlink. An entry names a folder when its folder equals `tracks/<name>` or `archive/<name>`. The board adds a card for each folder that no entry names:

- A folder under `tracks/` that has a `plan.md` gets a card. The title is the folder name. The plan alone decides the column (R3 and R4 of FR-4). A plan with no readable task goes to Planned. A folder under `tracks/` with no `plan.md` gets no card.
- A folder under `archive/` gets a Done card (R1). The title is the folder name. The done date is the date in the folder name, with the source `folder`. With no such date, the done date is empty.
- Each added card carries the line "Not in the registry" (FR-5).

The card order of a repo has three parts. First come the entries in file order. Next come the added folders of `tracks/` in name order. Last come the added folders of `archive/` in name order. The name order is the order of code points.

### FR-3. Plan reading

- The page reuses `parsePlan`, `isOpen`, and `tasksOf` of `src/parse.ts`. A task is a top-level checkbox line under a `## Phase` heading. A plan with no `## Phase` heading has no task.
- The board finds the phase and task numbers of the current task itself. The function `position` of `src/parse.ts` takes the first open task, not the first open task that is ahead (FR-4).
- A task is closed when its marker is `x`, or its marker is `b` and its line matches `deferred:` as the guard reads it. A task is open when it is not closed.
- The owner token of a task is the text after `deferred:`. It ends at the first character that is not a letter, a digit, `.`, `_`, or `-`. `ownerToken(text)` removes trailing `.`, `_`, and `-`. The change affects the shown token and the Daniel check only. It does not change which tasks are closed.
- The task text for a card removes the trailing 7-character SHA and any `[checkpoint: ...]`. It collapses runs of white space. It stops at 140 characters and adds `…`. The full text goes to the `title` attribute. `taskLabel(text)` returns this text.
- The task body is the task text without its id prefix. The prefix is an optional `**`, an optional word `Task`, an id, and an optional `:`, with white space around them. The id has letters, digits, dots, and hyphens, and it has at least one digit. `taskBody(text)` returns the body.
- The page reads the task line only. A `deferred:` field on a continuation line does not close a task. The guard behaves in the same way.

### FR-4. Column rules

Terms:

- The last done task is the last task with marker `x`. A task is ahead when it comes after the last done task. When no task has marker `x`, every task is ahead.
- A skipped task is an open task with marker space or `b` that is not ahead. An open task before the last done task is therefore skipped.
- The current task is the first task with marker `~`. When no task has marker `~`, it is the first open task that is ahead. A plan can have no current task. A skipped task never names the current task.
- A gate task is an open task that is ahead. Its text contains `User Manual Verification`, or its task body starts with the word `GATE`. The test is case-sensitive. A skipped task is never a gate task.
- A Daniel token is an owner token with one of these values in any case: `daniel`, `user`, `owner`, `po`, `product-owner`, `human`, `human-gated`, or `both-owners`. A token that starts with `owner-` or `daniel-` also counts.
- Only a Daniel token gives Waiting on Daniel. The tokens `pm` and `phikul`, and every other token, give Blocked.

Rules. The first rule that applies decides:

| Rule | Condition | Column | Card line |
|---|---|---|---|
| R1 | The registry marker is `x`, or the folder starts with `archive/`. | Done | none |
| R2 | The track has no task (no folder, no `plan.md`, a plan that cannot be read, or no task under a phase heading). The registry marker is `b`. | Blocked | "Registry marker [b]." |
| R2 | The same, with registry marker `~`. | In progress | none |
| R2 | The same, with any other registry marker. | Planned | none |
| R3a | A current task exists and it is a gate task. | Waiting on Daniel | the text of the gate task |
| R3b | The plan has an open task with marker `b`, in any place. | Blocked | the text of the first such task |
| R3c | The current task has marker `~`. | In progress | none |
| R3d | The current task has marker space, and the registry marker is `b`. | Blocked | "Registry marker [b]." |
| R3d | The current task has marker space, and the registry marker is `~` or any task has marker `x`. | In progress | none |
| R3d | The current task has marker space, in all other cases. | Planned | none |
| R4a | No current task exists, and a task with marker `b` has a Daniel token. | Waiting on Daniel | the text of the first such task |
| R4b | No current task exists, and another task has marker `b`. | Blocked | the text of the first such task |
| R4c | No current task exists, and no task has marker `b`. | In progress | none |

Notes on the rules:

- The plan decides over the registry when the plan has a readable task. The registry marker decides only in R2 and in R3d. The registry markers are often stale in real files.
- R3b applies to every open `[b]` task. It applies to a skipped task and to a task that is not the current task. R4a and R4b therefore see closed `[b]` tasks only.
- A gate task that is the current task wins over an open `[b]` task, because R3a comes first.
- A card with no current task has a note in the position slot (FR-5). The note is `No plan.` or `Plan unreadable` for R2. It is `All tasks closed.` when no task is open. It is `Open tasks before the last closed task: N.` when `N` tasks are open.
- A gate task is the only text signal of a human gate. The words "Daniel", "owner", and "approved" in a task line are not signals. In the sample of R4, 13 of 191 current tasks hold one of these words. Several of those tasks are not gates, for example an implementation task that says "owner-approved".
- A User Manual Verification task that is skipped shows no gate. The track went on past that task.
- PM look amendment (FR-15, C1): rule R3a applies only when the Updated age of the card is 14 days or less. With an older or unknown age, rule R3a does not apply.
- Daniel look amendment (FR-16, D2): a Done track under `tracks/` and not under `archive/` stays in Done. It gets the label "Not archived".
- An owner token that is not a Daniel token, for example `track-owner`, `pm`, or the name of a later track, gives Blocked. A gate that waits on another person therefore shows as Blocked. This is intended: the column Waiting on Daniel holds the gates of Daniel only.
- The text of a `[b]` task includes its `deferred:<token>` field. The reader sees who owns the gate.

Examples. Each row is a case for the unit tests:

| Registry | Plan | Column and line |
|---|---|---|
| `x` | any | Done |
| any | folder `archive/<id>` | Done |
| space | first task `[ ]` and no `[x]` | Planned |
| space | one `[x]`, no `[~]`, next task `[ ]` | In progress |
| `~` | all tasks `[ ]` | In progress |
| space | no plan file | Planned, note "No plan." |
| `~` | no plan file | In progress, note "No plan." |
| `b` | no plan file | Blocked, line "Registry marker [b]." |
| `~` | the plan read fails with a code other than `NOT_FOUND` | In progress, note "Plan unreadable" |
| any | first `[~]` task is an ordinary task | In progress |
| any | first `[~]` task is a User Manual Verification task that is ahead | Waiting on Daniel |
| any | no `[~]`, first open task is a `[ ]` User Manual Verification task that is ahead | Waiting on Daniel |
| any | no `[~]`, first open task is `Task 1.5: GATE. PM look, then Daniel accepts the look.` | Waiting on Daniel |
| any | no `[~]`, first open task is `Task 1.5: GATEWAY work` or `Task 1.5: Open the gate` | In progress |
| any | no `[~]` task, first open task is a `[b]` task with no `deferred:` field | Blocked, the text of that task |
| `b` | no `[~]` task, first open task is `[ ]` | Blocked, line "Registry marker [b]." |
| any | all other tasks `[x]`, one `[b]` with `deferred:owner-manual-verification` | Waiting on Daniel |
| any | all other tasks `[x]`, one `[b]` with `deferred:after-the-cutover` | Blocked |
| any | all other tasks `[x]`, one `[b]` with `deferred:pm` or `deferred:phikul` | Blocked |
| any | all tasks `[x]` | In progress, note "All tasks closed." |
| any | an open `[b]` task with no owner, then a `[~]` task | Blocked, the text of the `[b]` task |
| any | a `[b]` task with `deferred:later-track`, then a `[~]` task | In progress |
| any | an open `[b]` task, then an `[x]` task, then a User Manual Verification task | Waiting on Daniel (R3a before R3b) |
| any | a User Manual Verification task before the last `[x]` task, then an ordinary `[ ]` task after it | In progress (the skipped task is no gate) |
| any | the `daily_model_schedule`-like plan of the Test section | Blocked, the text of its `[b]` task |
| any | the `primary_mastery_evidence`-like plan of the Test section | In progress, note "Open tasks before the last closed task: 5." |
| none | a folder under `tracks/` with a plan: one `[x]` task, then a `[ ]` task | In progress, line "Not in the registry" |
| none | a folder under `tracks/` with a plan that has no task | Planned |
| none | a folder under `archive/` | Done |

### FR-5. Card

A card shows these items in this order. All text comes from the files and is escaped.

1. The track title. For a folder with no entry, the title is the folder name.
2. The position line. A Done card has none. A card with a current task shows `Phase p/P · Task t/T` and the task text with its marker, for example `[~] Write the loader`. The numbers are the phase number and the phase count. They are also the task number in that phase and the task count of that phase. A card with no current task shows its note (FR-4).
3. The card line of FR-4, when the rule gives one.
4. The line `Not in the registry`, when no registry entry names the card.
5. The foot line. For a card that is not Done, it reads `Updated <age>` (FR-6), or `Updated unknown` when the age is unknown. For a Done card, it reads `Done <date>` with a registry date, `From <date>` with a folder date, or `No date`.

The card data has these fields: `repo`, `title`, `trackId`, `column`, `position`, `marker`, `taskText`, `note`, `line`, `registered`, `lastChange`, `doneDate`, and `doneSource`. The field `trackId` is the folder name of the track. It is empty when the folder is unknown. The field `position` is an object with `phase`, `phases`, `task`, and `tasks`, or null. The fields `marker` and `taskText` are null when the card has no current task. The field `note` holds the note of FR-4 when `position` is null, and it is null for a Done card. The field `registered` is false when no registry entry names the card. The field `lastChange` is a time in milliseconds, or null. The model, the mockup fixtures, and the preview fixtures all use these fields. A fixture file has the form `{ "capturedAt": <ms>, "repos": [{ "repo": "<id>", "cards": [<card>] }] }`.

A card in Blocked or Waiting on Daniel shows the label `BLOCKER` for a blocker line, and `GATE` or `MANUAL CHECK` for a gate line (FR-15, C1).

Daniel look amendment (FR-16, D1): a card in Blocked or in Waiting on Daniel shows a "Comment to PM" box. It shows a Send button below the card line. No other card shows them.

A Blocked card has a 3 px left border in the colour of `--oc-error`. A Waiting on Daniel card has a 3 px left border in the colour of `--oc-warning`. A card has no click action in v1. The text can be selected.

The track title wraps up to 3 lines. A longer title ends in `…`, and the full title goes to the `title` attribute.

### FR-6. Age

- The last change of a track is the largest value of `stat(plan.md).mtime` and `stat(metadata.json).mtime`. A missing file gives no value. A `stat` result with kind `missing` is a missing file, and its `mtime` of 0 never counts. A `stat` that fails gives no value. With no value, the last change is unknown.
- `formatAge(now, then)` gives `<1m` below one minute, `Nm` below one hour, `Nh` below one day, and `Nd` below 60 days. From 60 days it gives `Nmo`, where one month is 30 days and the value rounds down. A future time gives `<1m`.
- The page computes the age label at each render from the stored time. The reload of FR-10 renders every 60 seconds, so the label stays current. A render without a reload makes no file call.
- The card never says "commit". The label is "Updated". The tooltip of the label says: "Time of the last change to plan.md or metadata.json (file time, not a commit time)."

### FR-7. Accordion and section header

- The page shows one section for each roster repo, in roster order.
- The header is one `button` with `aria-expanded`. It shows the repo id and one count for each of the five columns, with the column names. The counts stay visible when the section is closed.
- A red badge shows the Blocked count when it is 1 or more. A badge in the warning tone shows the Waiting on Daniel count when it is 1 or more.
- Daniel look amendment (FR-16, D2): the header shows the count of not archived Done tracks next to the blocked badge. The count shows only when it is above 0.
- A section is closed until its first load ends. Then it opens when its Blocked count or its Waiting on Daniel count is 1 or more. Other sections stay closed.
- PM look amendment (FR-15, C3): below 640 px, only the first section that qualifies starts open.
- The page keeps the open or closed state that the user sets, and the user's choice always wins. A reload does not reset it. The state lives in memory only.
- A section that is still loading shows `Loading` in its header. A section that failed shows the error line of FR-10.
- The header is at least 40 px high.

### FR-8. Columns

- The columns follow this order at every width: Planned, In progress, Blocked, Waiting on Daniel, Done.
- A column header shows the column name and the count of all cards of the column.
- A column with no card shows `None`.
- PM look amendment (FR-15, C2): a Planned or In progress card with an Updated age of more than 30 days goes to a closed `Stale (N)` group at the end of its column.
- A column other than Done shows at most 8 cards, then a button `Show N more`, where `N` is the number of hidden cards. The button opens the full list. The state is kept in memory like FR-7.
- Cards sort by last change, newest first. Cards with an unknown last change come last, in card order. Equal times keep card order.
- The Done column follows the rule of FR-16, D2. It replaces the rule of the 5 most recent Done cards.
- The count of the header is the count of all Done tracks.
- A Done card needs two `stat` calls for its closed date. It needs no read call. It comes from the registry and from the folder list of `archive/`.

### FR-9. Status band and rail badge

- The status surface keeps `bandLine` and `height: 48`. It shows the Measure state of the open project, as it does now. It shows no board data.
- The rail badge shows the number of tracks in the Blocked column across all loaded repos. A track in Waiting on Daniel does not count. It shows no badge when the number is 0. The old badge (count of `[b]` tasks of the open project) goes away.
- The panel and the page show the same board. The layout follows the width of the frame, not the surface.

### FR-10. Loading, reload, and errors

- A full load reads, for each repo, `measure/tracks.md`. It lists `measure/tracks` and `measure/archive`. For each track that is not Done, it reads `plan.md` and calls `stat` on `plan.md` and on `metadata.json`. A Done track makes no read call. It calls `stat` on `plan.md` and on `metadata.json` for its closed date (FR-16, D2).
- For each folder of `tracks/` that no entry names, the loader reads `plan.md` first. A missing `plan.md` ends the work for that folder. Otherwise the loader calls `stat` on `plan.md` and on `metadata.json`.
- The page makes at most 8 file calls at one time. The page loads each repo on its own. A failure in one repo does not stop the others.
- The page runs a full load when it opens, when the user presses Refresh, and every 60 seconds while `document.visibilityState` is `visible`. A timer tick or a press while a load runs starts no second load. A reload keeps the old cards on the page until the new data of that repo arrives.
- The board has no partial update. A change in a file shows at the next full load. A plan that gets its first `[~]` task, for example, leaves Planned at that load.
- The Refresh button shows a busy state until the load ends.
- Error lines follow the call and the code of the failure:
  - A failed read of `tracks.md` gives a section line. `NOT_FOUND` gives "No Measure tracks file at <path>." Any other code gives "Cannot read <repo>: <code>."
  - `NOT_GRANTED` on the read of `tracks.md` also gives one banner at the top: "Allow file access outside the project in Settings → Extensions."
  - A failed `listDir` gives the section line "Cannot read <repo>: <code>." The code `NOT_FOUND` is the exception: it gives an empty list.
  - A failed read of a plan gives an R2 card (NFR-7). `NOT_FOUND` gives the note "No plan." Any other code (`FILE_TOO_LARGE`, `DENIED`, `BAD_PATH`, `NOT_GRANTED`) gives the note "Plan unreadable".
  - `stat` of a missing path does not fail. It returns kind `missing` with `mtime` 0 (`@openchamber/web` `server/lib/guests/files.js:229-230`). The loader treats kind `missing` as not found and never uses its `mtime`.
  - A thrown value with no `code` gives the code `UNKNOWN`.
- The added stat calls of FR-16, D2 read no text. A full load of the real roster finishes in less than 10 seconds on the development machine. Phase 4 records the time.
- The comment send of FR-16 runs outside the load. A failed send never changes the cards.

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
- The page has no drag and drop and no file write call. The comment path of FR-16 sends one message to the PM session.
- Every text from a file passes through one escape function before it reaches HTML. This includes a folder name. A test uses titles such as `<img src=x onerror=alert(1)>`.
- A blocked or waiting state never relies on colour alone: the card line and the badge carry text.
- The section header and the Show more button are `button` elements with a visible focus ring from `--oc-focus`.

### FR-13. Files and duties

| File | Duty |
|---|---|
| `src/roster.ts` | The roster and the glob list. |
| `src/pm-target.ts` | The session id and the directory of the PM session (FR-16, D1). |
| `src/comment.ts` | `formatComment` and the rules of the comment box (FR-16, D1). |
| `src/registry.ts` | `parseRegistry` and the folder rules (FR-2). |
| `src/parse.ts` | The plan parser, with the owner token, the card text, and the gate test (FR-3, FR-4). |
| `src/board.ts` | The column rules, the card, the sort, the cap, and the counts (FR-4, FR-5, FR-8). |
| `src/age.ts` | The last change and `formatAge` (FR-6). |
| `src/load.ts` | The loader over `readFile`, `stat`, and `listDir`, with the call limit and the error isolation (FR-10). |
| `src/styles.ts` | The CSS string (FR-12). |
| `src/render.ts` | Pure functions that return escaped HTML for the board (FR-5, FR-7, FR-8). |
| `src/measure.ts`, `src/band.ts` | The band for the open project. Dead view-model code leaves. |
| `panel/main.ts` | The host wiring: events, the reload timer, the badge, the band, and the render calls. |
| `panel/index.html` | The entry. A minimal shell. |
| `mockup/board.html` | The static mockup of Phase 1, with invented fixture data. |
| `preview/preview.html`, `preview/preview.ts` | A page without a host that renders the real board code from invented data. The review uses it. |
| `service/main.ts`, `service/main.js` | The local service that sends the comment to the PM session (FR-16, D1). The host builds it with `openchamber-guest-bundle --node`. |

Exports of the new code. The Red role writes the tests against these names. A module can hold more functions that it does not export. The types `Marker`, `Plan`, and `Task` come from `src/types.ts`.

```ts
// src/roster.ts
export type RosterRepo = { id: string; path: string }                      // path: `~/Desktop/<id>`
export const ROSTER: readonly RosterRepo[]                                 // eight repos, assignment order
export const rosterGlobs: () => string[]                                   // `<path>/measure/**` for each repo
export const measureFile: (repo: RosterRepo, relative: string) => string   // `<path>/measure/<relative>`

// src/pm-target.ts
export const PM_SESSION_ID: string                                         // the session id of the PM session

// src/registry.ts
export type DoneSource = 'registry' | 'folder'
export type RegistryEntry = {
  marker: Marker
  title: string
  folder: string | null            // `tracks/<id>` or `archive/<id>`; null: no folder
  doneDate: string | null          // `YYYY-MM-DD`, only for marker `x`
  doneSource: DoneSource | null
}
export const parseRegistry: (md: string) => RegistryEntry[]                // file order
export const folderOfTarget: (target: string) => string | null            // folder rules of FR-2
export const folderDate: (folder: string) => string | null                // last `_YYYYMMDD` as `YYYY-MM-DD`

// src/parse.ts (added; the existing exports stay)
export const ownerToken: (text: string) => string | null                  // FR-3
export const taskLabel: (text: string) => string                          // FR-3
export const taskBody: (text: string) => string                           // FR-3
export const isGateText: (text: string) => boolean                        // FR-4, one task text

// src/comment.ts
export type CommentInput = { repo: string; trackId: string; taskLine: string; blockerLine: string; text: string }
export const COMMENT_TEXT_MAX = 2000                                     // FR-16, D1
export const formatComment: (input: CommentInput) => string              // FR-16, D1
export const canSendComment: (text: string) => boolean                   // FR-16, D1

// src/age.ts
export const latestChange: (times: ReadonlyArray<number | null>) => number | null
export const formatAge: (now: number, then: number) => string

// src/board.ts
export type Column = 'planned' | 'in-progress' | 'blocked' | 'waiting' | 'done'
export const COLUMNS: readonly Column[]                                    // order of FR-8
export const COLUMN_LABELS: Readonly<Record<Column, string>>               // 'Planned', 'In progress', 'Blocked', 'Waiting on Daniel', 'Done'
export const COLUMN_CAP = 8
export const DONE_SHOWN = 5
export const DONE_WINDOW_DAYS = 14
export type CardPosition = { phase: number; phases: number; task: number; tasks: number }
export type Card = {
  repo: string
  title: string
  trackId: string                     // the folder name of the track; empty when unknown
  column: Column
  position: CardPosition | null
  marker: Marker | null
  taskText: string | null
  note: string | null              // position slot text when `position` is null; null for Done
  line: string | null              // card line of FR-4
  registered: boolean
  lastChange: number | null        // milliseconds
  doneDate: string | null
  doneSource: DoneSource | null
}
export type PlanState = { kind: 'plan'; plan: Plan } | { kind: 'missing' } | { kind: 'unreadable' }
export type TrackInput = {
  repo: string
  title: string
  registryMarker: Marker | null    // null: no registry entry names the folder
  folder: string | null
  plan: PlanState                  // { kind: 'missing' } for a Done track
  lastChange: number | null
  doneDate: string | null
  doneSource: DoneSource | null
}
export const currentIndex: (tasks: readonly Task[]) => number | null     // FR-4 current task
export const classifyTrack: (input: TrackInput) => Card                   // FR-4, FR-5
export type RepoBoard = { repo: string; cards: readonly Card[] }          // card order of FR-2
export const buildBoard: (repo: string, inputs: readonly TrackInput[]) => RepoBoard
export type ColumnView = { column: Column; label: string; total: number; shown: readonly Card[]; hidden: number }
export const columnView: (board: RepoBoard, column: Column, expanded: boolean) => ColumnView   // FR-8; Done ignores `expanded`
export type DoneSummary = { shown: readonly Card[]; more: number; archived: number; notArchived: number }
export const doneSummary: (board: RepoBoard, now: number) => DoneSummary   // FR-16, D2
export const blockedTracks: (boards: readonly RepoBoard[]) => number     // rail badge (FR-9)

// src/load.ts
export type BoardHost = {
  readFile(path: string): Promise<{ content: string }>
  stat(path: string): Promise<{ kind: string; size: number; mtime: number }>
  listDir(path: string): Promise<{ entries: Array<{ name: string; kind: string }> }>
}
export const MAX_IN_FLIGHT = 8
export const RELOAD_MS = 60_000
export type RepoState =
  | { status: 'loading'; repo: RosterRepo }
  | { status: 'ready'; repo: RosterRepo; board: RepoBoard }
  | { status: 'error'; repo: RosterRepo; code: string; line: string }
export type Limiter = <T>(job: () => Promise<T>) => Promise<T>
export const limiter: (max: number) => Limiter
export const errorCode: (error: unknown) => string                        // `error.code`, else 'UNKNOWN'
export const errorLine: (repo: RosterRepo, code: string) => string        // section lines of FR-10
export const loadRepo: (host: BoardHost, repo: RosterRepo, run: Limiter) => Promise<RepoState>   // never throws
export const loadRoster: (host: BoardHost, roster: readonly RosterRepo[], onState: (state: RepoState) => void) => Promise<void>
export const shouldReload: (visible: boolean, loading: boolean) => boolean   // FR-10

// src/render.ts
export type UiState = {
  open: Readonly<Record<string, boolean>>        // repo id: section opened or closed by the user
  doneOpen: Readonly<Record<string, boolean>>    // repo id: Done column open
  expanded: Readonly<Record<string, boolean>>    // `<repo id>/<column>`: all cards shown
}
export type PageView = { states: readonly RepoState[]; ui: UiState; now: number; busy: boolean }
export const GRANT_BANNER: string                                         // text of the NOT_GRANTED banner
export const escapeHtml: (text: string) => string
export const sectionOpen: (state: RepoState, ui: UiState) => boolean      // FR-7
export type CommentUi = { status: 'idle' | 'sending' | 'sent' | 'error'; sentAt: number | null; error: string | null }
export const renderCard: (card: Card, now: number, comment?: CommentUi) => string
export const renderSection: (state: RepoState, ui: UiState, now: number) => string
export const renderPage: (view: PageView) => string                       // shows GRANT_BANNER for a NOT_GRANTED state

// src/styles.ts
export const BOARD_CSS: string
```

The page marks each button with `data-action`: `refresh`, `toggle-section`, `toggle-done`, `toggle-stale`, `toggle-done-group`, `show-more`, or `send-comment`. It adds `data-repo` and `data-column` where the action needs them. The files `panel/main.ts` and `preview/preview.ts` export nothing.

### FR-14. Records

- The extension README has these sections: What it shows, Install, Surfaces, The board, Reading the files, Refresh, Layout, The age and its limits, Add a repo, Build, Test, and Files.
- The Install section names the `files` capability and the eight globs. It says that the grant covers read and write, and that the code only reads.
- The Install section names the grant of FR-16. It gives the plain sentence of FR-16, D1. It says that the grant names no session, so the code constant is the only limit.
- The board section describes the Done group of FR-16, D2, and the comment box of FR-16, D1.
- The Add a repo section says that a new repo needs one roster line, one manifest glob, and a new approval.
- The CHANGELOG entry goes first in the list under the first `### Features` heading of `## Unreleased`. Its text is: `* **measure board:** the measure-status extension shows one accordion section for each of eight Reading Advantage repos. Each section holds a read-only Kanban board of the Measure tracks of that repo. The columns are Planned, In progress, Blocked, Waiting on Daniel, and Done. A card shows the track name, the current phase and task, the age of the last file change, and a blocker or gate line. The extension reads files only, through eight contributes.filesystem globs. It runs one local service that sends a comment to the Measure PM session. The status band does not change.`
- The first sentence of `README.md` line 33 becomes: `As of <closeout date>, the latest archived track is Measure board (the measure-status extension shows a read-only Kanban board of the Measure tracks of eight Reading Advantage repos).` The rest of the line stays.

### FR-15. PM look amendment 2026-11-17 (C1-C4)

The PM looked at the mockup of Phase 1 and ordered four changes. The PM words are in `measure/runs/measure_board_20261117/look-gate.md`. This amendment changes FR-4, FR-5, FR-7, and FR-8 as follows.

- Age source. The age in C1 and C2 is the Updated age of the card (FR-6). It comes from the file time of `plan.md` and `metadata.json`. It is not a commit time. The PM words "commit" in C1 and C2 mean this age, as the spec already says for the age on the card. The age is `now` minus `lastChange`. The mockup uses the capture time as `now`. The page uses the time of the full load. An unknown age never satisfies a rule that needs a known age.
- C1, gate rule. A gate task gives Waiting on Daniel only when it is the current task and the Updated age is 14 days or less. Otherwise rule R3a does not apply. The track then takes the column that the other rules give. The rule R4a for a closed `[b]` task with a Daniel token does not change.
- C1, labels. A Waiting on Daniel card shows the label `MANUAL CHECK` when the text of its line holds `User Manual Verification`. It shows the label `GATE` in all other cases. A Blocked card shows the label `BLOCKER`. A card shows its label before the card line.
- C2, stale group. A card in Planned or In progress with an Updated age of more than 30 days is stale. Each column holds at most one `Stale (N)` group, at its end, where `N` is the number of stale cards of that column. The group is closed by default and opens on click. A column with no stale card shows no group. The cards of an open group sort as the other cards of the column. Blocked, Waiting on Daniel, and Done cards are never stale.
- C2, counts and cap. The header count of the column and the count of the section header include the stale cards. The cap of 8 cards and the button `Show N more` apply to the cards that are not stale. The group holds its own button `data-action="toggle-stale"` with `aria-expanded`.
- C3, first open at a narrow width. When the page width is under 640 px, only the first section in roster order that has a Blocked or Waiting on Daniel card starts open. Every other section starts closed. At 640 px and wider, the rule of FR-7 stays. The open or closed choice of the user and the query key `open` of the mockup still win.
- Code contract. `TrackInput` gets a field `now` (milliseconds). `classifyTrack` and `columnView` use it for the C1 and C2 rules. `ColumnView` gets the fields `stale` (the stale cards) and `staleOpen`. `UiState` gets `staleOpen` with the key `<repo id>/<column>`. Task 2.1 sets the exact signatures.
- C4. The default answers to the design choices 1, 2, and 4 of `look-notes.md` stand. The answer to choice 3 is changed by C3 for widths under 640 px only.

### FR-16. Daniel look amendment 2026-11-18 (D1-D2)

Daniel looked at the mockup of Phase 1 and ordered two changes. His words are in `measure/runs/measure_board_20261117/look-gate.md`. This amendment changes FR-1, FR-4, FR-5, FR-7, FR-8, FR-10, FR-12, FR-13, and FR-14. It adds the send path of D1 and the data rules of D2.

#### D1. Comment to PM

- D1, scope. Each Blocked card and each Waiting on Daniel card shows a "Comment to PM" box and a Send button. No other card shows the box.
- D1, target. The Send button sends one message to the PM session. The session id is the constant `PM_SESSION_ID` of `src/pm-target.ts`. No other module holds it. The code sends only to that session id. The SDK grant names no session, so the constant is the only limit (R6).
- D1, message. The text of the message comes from the pure function `formatComment`. Its input is `{ repo, trackId, taskLine, blockerLine, text }`. Its output has this layout:

  ```
  Measure board comment
  Repo: <repo>
  Track: <track id>
  Task: <task line>
  Blocker: <blocker or gate line>
  Daniel: <text>
  ```

  A line with no value stays out. Every value is plain text. No value becomes markup.
- D1, input. An empty text or a text of only white space disables the Send button. A text longer than 2000 characters is refused with an error text. The text of the card comes from the plan files. It is plain text.
- D1, send. One click sends one message. The button is disabled while the send runs. There is no retry loop. A failed send shows the error text and leaves the button usable.
- D1, result. After a successful send the card shows "sent HH:MM". The time is the time of the send. The state lives in the page only. The extension stores nothing.
- D1, grant. The manifest declares the grant of FR-1.5. The panel calls `serviceRequest`. The service calls `sessions.send` with the constant session id (R6).
- D1, errors. The failure gives the code of the host. The codes are `NOT_GRANTED`, `TOO_MANY_PROMPTS`, `HANDLE_UNKNOWN`, `HOST_UNAVAILABLE`, `NO_SERVICE`, `SERVICE_FAILED`, and `REQUEST_FAILED`. The card shows the code and the message.
- D1, dialog. The host owns the text of the approval dialog. Its rows are the rows of R6. The extension gives the user a plain sentence in its README: "This extension reads the Measure files of eight repos. It sends one message to the Measure PM session when you write a comment on a blocker."
- D1, review. Review B (security) checks this path. It checks the session id, the plain text, one send per click, and the error text.

#### D2. Done stays short

- D2, closed date. The closed date of a Done track is the last change of the track (FR-6). It is the time of the last file change, not the time of a commit. The limit of FR-6 applies to it.
- D2, group. The Done column is closed at the first paint. It shows its count only. An open Done column shows one closed group. The group holds the 5 Done tracks with the newest closed date. They closed within 14 days of the load time. The group is closed by default and opens on click. Its cards sort by closed date, newest first. A Done track with no closed date stays out of the group.
- D2, count line. The Done column shows the line "N more done, M archived" below the group. N is the number of Done tracks that the group does not show. M is the number of Done tracks under `archive/`.
- D2, not archived. A Done track under `tracks/` and not under `archive/` gets the label "Not archived". It counts as a finding for the closeout of its repo. The board never moves the file.
- D2, header. The section header shows the count of not archived Done tracks next to the blocked badge. The count shows only when it is above 0. The count is the count of the Done tracks of that repo.
- D2, calls. A Done track makes two `stat` calls for its closed date. It makes no read call.

## Non-Functional Requirements

- NFR-1. The code is TypeScript, strict. `bunx tsc -p . --noEmit` passes.
- NFR-2. The model code (`roster`, `registry`, `parse`, `board`, `age`, `load`, `render`) has no SDK import and no DOM access. The modules `comment` and `pm-target` are pure too. Unit tests run in Node. The module `load` reads the `code` property of an error and does not import `HostRequestError`.
- NFR-3. A unit test reads the source files of `src/`, `panel/main.ts`, and `service/main.ts`. It fails when it finds `writeFile` in any of them. It also fails when it finds `listDir` in a file other than `src/load.ts` and `src/measure.ts`.
- NFR-4. The shipped bundle `panel/main.js` comes from `panel/main.ts` with the esbuild command of R1. It is committed.
- NFR-5. Real fixtures and the real-data mockup stay outside the repo, in `/home/daniebo/.local/share/measure-board-private/`. That folder lies under no git work tree. The measure repo is public and `advantage-pr` is private (R4). The committed fixtures and the committed mockup use invented titles and task texts with the same lengths and the same markers. The leak check of Task 4.5 searches the committed tree. It looks for the track ids of the private repo. It also looks for paths below its track, archive, and source folders.
- NFR-6. New prose in the README, the plan, and the spec follows ASD-STE100. These documents do not state how many tests, checks, or suites exist.
- NFR-7. Reading a plan never throws. A bad plan gives the R2 card, not an error screen.

## Test

The tests run with `cd extensions/measure-status && bunx tsc -p . --noEmit && bunx vitest run`.

- `roster.test.ts`: the manifest globs equal the roster globs. Each glob has the form `~/Desktop/<id>/measure/**` and 1 to 256 characters. The list has 1 to 16 globs (`API.md:561`).
- `registry.test.ts`: every grammar form of R4, the folder rules, `folderDate`, the path escape, and the done date rules.
- `parse.test.ts`: the existing cases and these groups.
  - The owner token cases: `(deferred:owner)`, `**deferred:x**`, and `deferred:owner-manual-verification)`.
  - The task body cases: `Task 1.5: GATE. PM look`, `1.5 GATE it`, `**Task 2.1: GATE ok**`, and a text with no id.
  - The gate text cases: `GATE` at the start, `GATEWAY`, `gate` in lower case, `GATE` in the middle of a text, and `User Manual Verification` in any place.
- `board.test.ts`: each row of the rule table and each example row of FR-4. The file also covers the current task, the notes, the card line, the sort, the cap, the counts, and `blockedTracks`. The cases below use invented text. The first two copy the shapes of real plans. The file also covers the D2 rules of FR-16. It covers the closed date, the 14 day window, the 5 cards of the group, and the counts. It covers the label "Not archived".
  - A `daily_model_schedule`-like case has eight phases. Phases 1 to 5 hold `[x]` tasks only. Phase 6 ends with one open `[b]` task that has no `deferred:` field. Phase 7 ends with one `[ ]` task. Phase 8 has one `[ ]` task between `[x]` tasks, and its last task is `[x]`. Expected: Blocked, the card line is the text of the `[b]` task, `position`, `marker`, and `taskText` are null, and the note reads `Open tasks before the last closed task: 3.`
  - A `primary_mastery_evidence`-like case has six phases. Phases 1 to 5 each end with one open `[ ]` User Manual Verification task. Phase 6 holds one `[x]` task. Every other task is `[x]`. Expected with registry marker `~`: In progress, no gate, and the note reads `Open tasks before the last closed task: 5.` The same plan with registry marker `x` gives Done.
  - A folder with a plan and no entry: the column follows the plan, `registered` is false, and the line reads "Not in the registry". A folder with a plan with no task gives Planned. A folder under `archive/` gives Done with the folder date.
  - A `Task 1.5: GATE. PM look, then Daniel accepts the look.` task that is the first open task gives Waiting on Daniel.
- `age.test.ts`: `formatAge` at each boundary. The file also covers the last change with a missing file, a failed `stat`, and a `stat` result of kind `missing`.
- `load.test.ts`: a fake host with a call counter. It checks:
  - the call limit, the error isolation, and the call budget of a full load;
  - that a Done track makes no read call and two `stat` calls;
  - that `listDir` runs only on the `tracks` and `archive` folders;
  - a folder list with a symlink (kind `other`), and a missing folder;
  - a folder with no entry that has a plan, and a folder with no entry that has none;
  - a plan read that fails with each code;
  - the `stat` result of kind `missing`, the code `NOT_GRANTED`, and `shouldReload`.
- `render.test.ts`: counts, badges, and escaping (also of a folder name). The file also covers the closed Done column, `aria-expanded`, the `Show N more` button, the line "Not in the registry", and the notes. It checks that `src/styles.ts` and `src/render.ts` hold no colour literal and no remote URL. It also covers the closed Done group, the count line, and the not archived badge of FR-16, D2.
- `comment.test.ts`: the layout of the message of FR-16, D1. A line with no value stays out. A text of only white space gives no send. A text of 2000 characters is accepted. A text of 2001 characters is refused. A card value stays plain text.
- `send.test.ts`: one send per click, the disabled Send button while a send runs, the state "sent HH:MM", and the error text of a failure. The test uses a fake host. It never calls OpenChamber.
- `band.test.ts`: the tests of `bandLine` and `loadSnapshot` stay and pass. The tests of the removed view-model code leave with it.
- `source.test.ts`: NFR-3. It also reads `service/main.ts`.

## Acceptance Criteria

1. Daniel accepts the look. `measure/runs/measure_board_20261117/look-gate.md` holds the verdicts of the PM and of Daniel for the mockup, and the verdict of Daniel for the live board.
2. The extension loads in OpenChamber 2.7.1. The approval dialog lists the eight globs and the two rows of FR-16, D1. The rail panel and the page show the board. The band still shows one line.
3. The board shows the real tracks of all eight repos. For each repo, the five column counts add up to the column-0 entry lines of its `tracks.md` plus the folders that FR-2 adds.
4. `cd extensions/measure-status && bunx tsc -p . --noEmit && bunx vitest run` exits 0.
5. `extensions/measure-status/README.md` describes the board: the install approval, the column rules, the refresh, the layout, and the limits of the age.
6. Screenshots at 390, 980, and 1280 px, in the light and the dark theme, exist for the mockup, the preview page, and the live board. Screenshots of real data sit in the private folder of NFR-5. The page does not scroll sideways in any of them.
7. The CSS has no colour literal. The package loads no remote resource. The source has no `writeFile`.
8. No file in git holds real track titles or task texts of the roster repos. The leak check of Task 4.5 finds no new track id of `advantage-pr` and no new path below its track, archive, or source folders.

## Out of Scope

- Moving cards, drag and drop, and any write to a Measure file.
- Starting an agent, opening a session, or any session action, except the one message of FR-16, D1.
- Editing a track, a plan, or a task from the board.
- A click action on a card, except the comment box of FR-16, D1. A detail dialog, search, and filters.
- Repos outside the roster, including `advantage-mmorpg`, unless the PM adds them (one roster line and one manifest glob).
- Tracks in worktrees that are not merged.
- The Red, Green, and Review stage chip (R5).
- An exact commit age (it needs a `service`).
- Saved accordion state, keyboard shortcuts, and translations.
- A copy-to-clipboard button. The old "Copy status" leaves with the old panel body.
- A partial update of single files. The board reloads in full (FR-10).

## Open Questions

Each question has a default. The plan follows the default.

1. Add `advantage-mmorpg` to the roster? Default: no. It needs one roster line and one glob.
2. Keep real fixtures out of git? Default: yes (NFR-5). They live in the private folder.
3. Does the rail badge count Blocked tracks only? Default: yes. A Waiting on Daniel track does not count.
4. Which sections start open? Default: the sections with a Blocked or Waiting on Daniel card (FR-7).
5. Does an owner token outside the Daniel set give Blocked? Default: yes. The tokens `track-owner`, `pm`, and `phikul` give Blocked.
6. Which `engines.openchamber` floor? Default: `>=2.7.1`.
7. Show tracks of worktrees? Default: no. Main checkouts only.
8. Add a `service` for the exact commit age? Default: no.
9. How many cards does a column show before `Show N more`? Default: 8. Done shows 5.
10. Add the tooling rows to `measure/tech-stack.md` in Task 1.1? Default: yes. The extension has no row today.
11. How does the board reload? Default: in full, when the page opens, when the user presses Refresh, and every 60 seconds while the page is visible. There is no partial update.
12. Show a track folder that has no registry entry? Default: yes (FR-2). A folder under `tracks/` with a `plan.md` shows by its plan, with the line "Not in the registry". A folder under `archive/` shows in Done. A folder under `tracks/` with no `plan.md` does not show.
13. Add a stage chip later from the role file names? Default: not in v1.
14. Does a gate task that is the current task beat an older open `[b]` task? Default: yes. The track goes to Waiting on Daniel (R3a before R3b).
15. What does a card show when every open task sits before the last closed task? Default: no position, and the note "Open tasks before the last closed task: N." (FR-4).
16. What does the leak check of Task 4.5 search for? Default: every track id of `advantage-pr`, and paths below its track, archive, PM log, and source folders. Hits that exist at the merge base with `origin/main` do not count. The check does not search for the roster path `~/Desktop/advantage-pr`, because FR-1 requires it.
17. Which grant does the D1 send path use? Default: the service route of R6. It declares `contributes.service` and `contributes.sessionControl`. The `sessions` capability cannot send to a session by id.
18. Where does the plain sentence of the approval dialog go? Default: the host owns the text of the dialog. The sentence goes in the README Install section.
19. Does the Done card show the date of FR-5 or the closed date? Default: the card keeps the date of FR-5. The closed date sets the group and the 14 day window.
20. Does the Done group open with the Done column? Default: no. The Done column opens to show the closed group. The group opens on click.
