# measure-status

OpenChamber extension that monitors the Measure status of the open project.

## What it shows

The extension reads the Measure files of the open project:

- `measure/index.md` — finds the Tracks Registry link.
- `measure/tracks.md` — lists the tracks and the active one.
- `<track>/plan.md` — reads the phases and the current task of the active plan.

It draws a one-line band in the Work Status section and a full panel on
the rail and the full page. The rail icon carries a badge with the count
of blocked (`[b]`) tasks in the active plan.

## Install

1. Open Settings -> Extensions.
2. Paste the absolute path of this folder.
3. Approve the `files` capability.

The extension needs `files` to read the Measure files. It does not need
`prompt`, `sessions`, `model`, or `shells`.

## Surfaces

The page serves three surfaces:

- `status` — one line above the prompt in the Work Status section.
- `panel` — the rail panel that the rail icon opens.
- `page` — the full-screen page that the Extension pages menu opens.

The Work Status section keeps a tight height. The rail and page add a
refresh button, a copy button, and the full status view.

## Parse rules

The parser follows the rules of `mods/measure-guard`:

- Status markers: `[ ]` pending, `[~]` in progress, `[x]` done, `[b]` blocked.
- A `[b]` task closes when its line has a `deferred:<owner>` field.
- `measure/tracks.md` accepts two entry formats: a bold title with a
  `*Link:` line, or a markdown link to `archive/<id>/index.md`.
- The active track is the first `[~]` track whose plan has a `[~]` task;
  else the first `[~]` track.
- In `plan.md`, a task is an unindented checkbox line under a `## Phase ...`
  heading. Indented lines are sub-tasks. Checkbox lines in other `##`
  sections are not tasks.
- A completed task line ends with a 7-character SHA, with or without
  backticks.
- A phase is checkpointed when its heading has `[checkpoint: <sha>]`.

## Refresh

The panel loads the files on first paint and refreshes them:

- When the open project changes.
- Every 5 seconds, by `stat` of the known files. A change to any mtime or
  to the set of `[~]` track folders triggers a full reload.
- When the user clicks the Refresh button.

`NO_DIRECTORY` (no open project) and `NOT_FOUND` (a file vanished) fall
back to the matching empty state.

## Build

```bash
bun install
bunx esbuild panel/main.ts --bundle --format=iife --platform=browser --outfile=panel/main.js
```

The shipped `panel/main.js` is the built bundle. The app never compiles
the extension; it loads the bundle from disk.

## Test

```bash
bunx tsc -p . --noEmit
bunx vitest run
```

## Layout

```
extensions/measure-status/
  package.json        manifest
  tsconfig.json
  README.md
  src/
    types.ts          data shapes
    parse.ts          pure parser
    measure.ts        snapshot loader over the host file API
    band.ts           band line and status view model
    fixtures.ts       plan and tracks fixtures
    parse.test.ts     parser tests
    band.test.ts      band line and snapshot loader tests
  panel/
    index.html        entry
    main.ts           UI source
    main.js           built IIFE
```