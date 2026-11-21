# measure-status

OpenChamber extension that shows a read-only Measure board for eight
Reading Advantage repos. It needs OpenChamber 2.7.1 or newer.

## What it shows

The extension reads the Measure files of eight repos under `~/Desktop`.
It shows one accordion section for each repo. Each section holds a
read-only board of the Measure tracks of that repo.

The board has five columns: Planned, In progress, Waits for PM, Waits for
Daniel, and Done. An open card shows one state and one reason line. A
card shows the track title, the current phase and task, the age of the
last file change, and the reason line.

The rail panel and the full page show the same board. The Work Status
section keeps its one-line band. The rail icon shows a badge with the
count of Waits for Daniel cards across the eight repos. A Waits for PM
card does not count.

The extension reads files and writes no file. It sends one message only,
and only when the user writes a comment on a Waits for Daniel card.

## Install

1. Open Settings → Extensions.
2. Open Add and paste the absolute path of the `extensions/measure-status`
   folder of this repo.
3. Approve the file access and the service grant.

The approval dialog lists these eight `filesystem` globs:

```
~/Desktop/reading-advantage-monorepo/measure/**
~/Desktop/Workbooks/measure/**
~/Desktop/advantage-pr/measure/**
~/Desktop/advantage-forge/measure/**
~/Desktop/mastery-advantage/measure/**
~/Desktop/ra-math-advantage/measure/**
~/Desktop/lending-desk-bench/measure/**
~/Desktop/measure/measure/**
```

The `files` capability covers read and write. The extension code only
reads.

The dialog also lists the `service` grant and the `sessionControl`
grant. The plain sentence for the dialog is: "This extension reads the
Measure files of eight repos. It sends one message to the Measure PM
session when you write a comment on a Waits for Daniel card."

The grant names no session. The constant `PM_SESSION_ID` in
`src/pm-target.ts` is the only limit on the target.

## Surfaces

The manifest declares three surfaces:

- `status` — the one-line band in the Work Status section, at a height
  of 48 px. The band shows the Measure state of the open project. It
  shows no board data.
- `panel` — the rail panel that the rail icon opens. The manifest sets
  `panel.mobile` to `true`.
- `page` — the full-screen page that the Extension pages menu opens.

The panel and the page show the same board. The layout follows the width
of the frame, not the surface.

## The board

Each section header shows the repo id and the count of each column. The
counts stay visible when the section is closed.

A section starts closed. It opens after its first load when it has a
Waits for PM card or a Waits for Daniel card. Below 640 px, only the first
such section starts open. The choice of the user wins, and a reload
keeps it.

The columns follow this order at every width: Planned, In progress,
Waits for PM, Waits for Daniel, and Done. A column header shows its name
and the count of all its cards. A column with no card shows `None`.

A column other than Done shows eight cards and then the button
`Show N more`. The button opens the full list.

A Planned or In progress card with an age above 30 days goes to a
closed `Stale (N)` group at the end of its column. A click opens the
group.

A card shows one reason line. The line names the state and the cause.
The labels `BLOCKER`, `GATE`, and `MANUAL CHECK` do not appear. A card
that no registry entry names shows `Not in the registry`.

The states are Waits for Daniel, Running, Waits for PM, and Next in line.
A `User Manual Verification` task that says deferred or no visible change
gives Waits for PM. A gate word in a `[b]` owner gives Waits for Daniel.
The gate words name deletion, paid spend, deploy, public date, sudo or
login, proof, Thai check, and look. A `[~]` task gives Running. Each other
open track gives Next in line. The state rules end at the first match.

The Done column is closed at the first paint and shows its count only.
An open Done column shows a closed group of the five Done tracks with
the newest closed date, within 14 days of the load time. The line below
the group reads `N more done, M archived`. A Done track under `tracks/`
and not under `archive/` shows the label `Not archived`.

Only a Waits for Daniel card shows one small `Comment` button. A click
opens the box `Comment to PM` and the Send button on that card only. One
box is open at a time. The Escape key or a finished
send closes the box. A comment needs at least one visible character and
at most 2000 characters. The Send button is off while the text holds no
visible character, while the text is longer than 2000 characters, or
while a send runs.

The Send button sends one message to the Measure PM session. One click
sends one message. There is no retry loop. A failed send shows the error
text, and the button stays usable. After a send the card shows one line
`sent HH:MM`. The time is the local time of the page. The comment state
lives in the page only, and the extension stores nothing.

The message holds one field per line: `Repo`, `Track`, `Task`,
`Reason`, and `Daniel`. The `Reason` field carries the reason line of the
card. Every value stays plain text. A line with no value stays out. A text with no visible character gives no send. A text
longer than 2000 characters gives no send.

## Reading the files

The board reads only these files:

- `<path>/measure/tracks.md` — the registry of the tracks.
- `<path>/measure/<folder>/plan.md` — the phases and the tasks.
- `<path>/measure/<folder>/metadata.json` — the time of the last change.

The board lists only `<path>/measure/tracks` and `<path>/measure/archive`.

The registry accepts the markers `[ ]`, `[~]`, `[x]`, and `[b]`. It
takes the track folder from the `*Link:` target. An absolute target, a
URL, or a target above `measure/` gives no folder.

A folder under `tracks/` that no entry names gets a card when it has a
`plan.md`. A folder under `archive/` that no entry names gets a Done
card. Each of these cards shows `Not in the registry`.

A track is Done when its registry marker is `[x]` or its folder sits
under `archive/`. The board never moves a file.

The panel sends a comment to the local service of the extension. The
service listens on `127.0.0.1` only. It asks every request for the
bearer token of the host. The service calls `sessions.send` with
`PM_SESSION_ID`. It runs no command and names no socket of its own.

Reading errors follow this list:

- A failed read of `tracks.md` gives the line `No Measure tracks file at
  <path>.` or `Cannot read <repo>: <code>.`
- The code `NOT_GRANTED` adds one banner: `Allow file access outside the
  project in Settings → Extensions.`
- A failed read of `plan.md` gives a card with the note `No plan.` or
  `Plan unreadable`.
- A failure in one repo does not stop the other repos.

## Refresh

The panel and the page run a full load in these cases:

- when the surface opens;
- when the user clicks Refresh;
- every 60 seconds while the page is visible.

A press or a timer tick during a load starts no second load. A reload
keeps the old cards of a repo on the page until the new data of that
repo arrives. The board has no partial update. A change in a file shows
at the next full load.

The page makes at most eight file calls at one time. It loads each repo
on its own.

Load results, the timer, the Refresh click, and a host ready context are
data paints. A data paint waits while the open comment box has focus or
holds a character. An invisible character also holds the paint. A held
paint changes no DOM node and sets one pending flag. The rail badge
still updates with each data result. The badge counts the Waits for
Daniel cards.

The pending paint runs when the box closes. The box closes on Escape and
when a send ends. The pending paint also runs when the box loses focus
with no text in it.

An action of the user is a user paint. A user paint draws at once. These
actions are user paints: open a comment, start a send, end a send, toggle
a section, toggle the Done column, open the Done group, show more cards,
toggle the stale group, and press Escape. A user paint clears a pending
data paint and draws the latest data once. After the paint, the open box
keeps its text for its card key. When the box had focus, it gets focus
back with no scroll, and it keeps its selection start and end.

The `status` surface reads the Measure files of the open project. It
loads on open and when the open project changes. A paint on the status
surface never waits.

## Layout

Below 640 px, the five columns stack in column order. From 640 px, the
columns sit side by side. A column is at least 220 px wide and at most
320 px wide. The row wraps when the columns do not fit.

At 980 px, at least three columns sit side by side. At 1280 px, all
five columns fit. The page does not scroll sideways at 390, 980, or
1280 px. A long word wraps.

All buttons and section headers are at least 40 px high. All colours
come from the `--oc-*` variables of the host. The CSS holds no colour
literal. The page loads no remote resource.

## The age and its limits

The age of a card is the time of the last change to `plan.md` or
`metadata.json`. The board uses the file time. The board never uses a
commit time.

The label shows `<1m` below one minute, `Nm` below one hour, `Nh` below
one day, and `Nd` below 60 days. From 60 days it shows `Nmo`, with one
month of 30 days. A future time shows `<1m`. An unknown age shows
`Updated unknown`.

The page computes the label at each paint. The 60-second reload keeps
the label current.

The age feeds three limits:

- A Planned or In progress card above 30 days goes to the `Stale (N)`
  group.
- A gate task gives Waits for Daniel only when its age is 14 days or
  less.
- The Done group holds only tracks that closed within 14 days.

## Add a repo

A new repo needs three changes:

1. One roster line in `src/roster.ts`.
2. One `filesystem` glob in `package.json`.
3. A new approval of the file access in the host.

A test fails when the roster and the manifest globs differ.

## Build

Run these commands from `extensions/measure-status`:

```bash
bun install
bunx esbuild panel/main.ts --bundle --format=iife --platform=browser --outfile=panel/main.js
bunx openchamber-guest-bundle --node service/main.ts service/main.js
```

The commit holds the bundles `panel/main.js` and `service/main.js`. The
host loads the bundles from disk. The host never compiles the extension.

The preview page renders the board code with the invented fixtures in
`mockup/fixtures.json`. Build the preview with this command:

```bash
bunx esbuild preview/preview.ts --bundle --format=iife --platform=browser --outfile=preview/preview.js
```

Open `preview/preview.html` in a browser. The query key `theme` takes
`light` or `dark`. The file `preview/preview.js` stays out of git.

## Test

```bash
bunx tsc -p . --noEmit
bunx vitest run
```

The tests run in Node. A fake host replaces the file API of OpenChamber.
The tests use invented fixtures. The send tests never reach the network.

## Files

```
extensions/measure-status/
  package.json           manifest, grants, and the eight globs
  README.md
  tsconfig.json
  src/
    roster.ts            the eight repos and their measure globs
    registry.ts          the reader of tracks.md and the folder rules
    parse.ts             the reader of plan.md
    board.ts             the column rules, the card, the sort, the cap, the counts
    age.ts               the last change and the age label
    load.ts              the loader over readFile, stat, and listDir
    measure.ts           the loader of the band
    band.ts              the band line of the status surface
    render.ts            the escaped HTML of the board
    styles.ts            the CSS string
    send.ts              the send rules of the comment
    comment.ts           the message layout and its limits
    comment-box.ts       the state of the comment box
    page-state.ts        the repo states of a reload
    pm-target.ts         the PM session id
    *.test.ts            the unit and adversarial tests
  panel/
    index.html           the entry of the panel and the page
    main.ts              the host wiring
    main.js              the built bundle
  preview/
    preview.html         the preview page
    preview.ts           the preview entry
  service/
    main.ts              the local service
    main.js              the built service
  mockup/
    board.html           the accepted static mockup
    fixtures.json        the invented fixture data
```
