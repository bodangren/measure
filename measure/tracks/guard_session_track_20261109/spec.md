# Specification: Guard session track

Author model: claude-code/claude-opus-5-5 (Claude family).

## Overview

The PM sent this request on 2026-11-09. The PM's words:

> WHAT: the opencode-measure-guard note names the wrong active track. ~/.config/opencode/plugins/opencode-measure-guard/src/core/parse.ts:177 selectActive() takes the FIRST [~] track whose plan has a [~] task, in tracks.md file order. The monorepo registry holds about 30 [~] tracks, so every session sees primary_in_app_help_20261023 (task 6.4) as its active track; before 11-09 it showed the parked APK Arcade track (Monorepo fixed that registry line in 5e63142d6). The advantage-pr guard shows ops_scheduled_jobs T1.1 the same way. Fix it in the plugin source of record (the measure repo, if the plugin is built from it), then install it the way you normally do: select the track per session (from the track id in the role brief, the session title, or the paths it touches), or else list every [~] track that has a [~] task, in short form. WHY: sessions and roles read the note as their scope; a wrong name misleads gates and Build sessions. DONE WHEN: a test with a fake registry of 3 [~] tracks shows the right track for a session that names one, and a short list when none is named; the installed plugin shows that in a live session; one commit, with the install step recorded. DATE: 2026-11-12.

The change gives each OpenCode session its own track for the task note. A session names its track with a prompt, its title, or a file that it writes. When a session names no track and 2 or more tracks have a `[~]` task, the note lists these tracks in short form and names no single track. A project with one track in progress keeps its note.

## Current system

- The source of record is `plugins/opencode-measure-guard/` in this repository. `bin/install-measure-skill` copies it (without `tests/`) to `~/.config/opencode/plugins/opencode-measure-guard/` (`bin/install-targets.tsv`). OpenCode loads the new files without a restart.
- `src/snapshot.ts`, `loadSnapshot`: reads `tracks.md` and the plan of each `[~]` track. It calls `selectActive` (`src/core/parse.ts:177`) and keeps only the selected track in `Snapshot.active`.
- `selectActive` takes the first `[~]` track whose plan has a `[~]` task, in `tracks.md` order. When no plan has a `[~]` task, it takes the first `[~]` track.
- `src/guard.ts`: the `Guard` keeps one snapshot for each project root. `pendingNote` (prompt hook and tool results) and `onCompaction` give each session the note of `Snapshot.active` (`noteKey`, `taskNote`). The session record only stops a second note with the same key.
- The edit guard, the closeout guard, the end-of-turn check, the TDD guard, the commit guard, the TUI band, `/measure-status`, and the status tool also read `Snapshot.active`.
- `src/core/parse.ts`, `src/core/guards.ts`, and `src/types.ts` are copies of the files of the Claude Code mod in `mods/measure-guard/`. `scripts/check-parity.sh` fails when a copy differs from its source.
- `SessionState` (`src/state.ts`) has no track.
- The OpenCode 2.0.32 host gives the plugin `ctx.session.get({ sessionID })`. Its result has an optional `title`.

## Decisions

- **D1 (one track for each session).** `SessionState` gets the field `track: string | null`. A new session starts with `null`. The task note of a session uses this field (D4).
- **D2 (clues).** Three clues set `track`. The last clue that names a track (D3) wins.
  - (a) The text of each user prompt of the session, before the plugin adds a note. The role brief of a subagent is the first prompt of its session. A follow-up prompt of strict mode is not a clue.
  - (b) The title of the session, from `ctx.session.get`. The plugin reads the title at each prompt, before the prompt text, and only while `track` is `null`. A title cannot replace a track that a clue set.
  - (c) Each path that a completed edit tool call (`edit`, `write`, `multiedit`, `apply_patch`) writes, relative to the project root. A failed call gives no clue. A shell command gives no clue.
- **D3 (the naming rule).** A clue names a track when exactly one id of a `[~]` track in `tracks.md` occurs in it as a whole word. A whole word has no character of `[A-Za-z0-9_-]` just before it and just after it. A clue that names 2 or more `[~]` tracks names no track, and `track` keeps its value. The id of a track that is not `[~]` does not count.
- **D4 (the session track).** The plugin selects the track of a session in this order:
  - When `track` is the id of a `[~]` track with a plan that has a `## Phase` heading, that track is the session track. This is true also when its plan has no `[~]` task.
  - Else, when 0 or 1 `[~]` tracks have a `[~]` task, the session track is `Snapshot.active`. This is the old rule with no change.
  - Else, 2 or more tracks have a `[~]` task, and the session has no single track. The note lists the tracks (D5).
  - The note text of a session track does not change: `Active track: <name> (measure/<folder>/).` and the task line.
- **D5 (the list note).** The list note has these lines:

  ```text
  measure-guard (Mode: <mode>)
  This session names no track. <n> tracks have a task in progress:
  - <id>: <name>
  To get the task of one track, write its id in a prompt.
  ```

  The list has one line for each `[~]` track with a `[~]` task, in `tracks.md` order. The note key of the list is `list|` and the ids joined by `,`. A task change in a listed track does not send a new list. A new or a removed track in the list sends a new list.
- **D6 (the guards keep the project rule).** The edit guard, the closeout guard, the end-of-turn check, the TDD guard, the commit guard, the TUI band, `/measure-status`, and the status tool keep `Snapshot.active`. Only the task note (prompt, tool result, and compaction) uses the session track. Reason: a session-scoped guard can deny an edit that the plugin allows today, so it needs its own request.
- **D7 (no change to the shared core).** The new pure functions go into a new plugin file, `src/track.ts`. `src/core/parse.ts`, `src/core/guards.ts`, `src/types.ts`, and the mod do not change, so the parity check stays green. `loadSnapshot` returns `Snapshot & { inProgress: ActiveTrack[] }`: each `[~]` track that has a plan, in `tracks.md` order. The Guard keeps this type, and the guards read it as a `Snapshot`.
- **D8 (title failure).** The Guard gets the title through a function that index.ts gives to it. When the call fails, gives no title, or takes more than 1000 ms, the title gives no clue, and the prompt continues.
- **D9 (distribution).** The change lands on the local `main`. `bin/install-measure-skill` installs the plugin, and `bin/install-measure-skill --check` compares the installed files with `main`. A live check runs through the OpenCode service HTTP API in a temporary git project with 3 `[~]` tracks. Nothing is pushed without the PM's word.

## Functional requirements

- **FR-1.** `src/track.ts` exports `namedTrack(clue, tracks)` (D3), `sessionActive(snapshot, track)` and `sessionList(snapshot, track)` (D4), and `sessionNoteKey(snapshot, track)` and `sessionNote(snapshot, track, mode)` (D4, D5). The functions are pure.
- **FR-2.** `SessionState` has `track` (D1). `Sessions.sessionOf` starts it as `null`.
- **FR-3.** `loadSnapshot` fills `inProgress` (D7). A snapshot with no `measure/` folder or a parse error has an empty `inProgress`.
- **FR-4.** `Guard.onPrompt` reads the title clue and the prompt clue (D2 a, b) before it computes the note. `Guard.onToolAfter` reads the path clues of a completed call (D2 c) before it computes the note. When a path clue changes `track`, the tool result gets the new note, also for a path outside `measure/`.
- **FR-5.** `Guard.pendingNote` uses `sessionNoteKey` and `sessionNote`. `Guard.onCompaction` uses `sessionNote` with the track of the session.
- **FR-6.** The `Guard` constructor gets an optional last argument `titleOf: (sessionID: string) => Promise<string | null>`. `src/index.ts` gives it `ctx.session.get` and reads `title`. The Guard waits at most 1000 ms for it (D8).
- **FR-7.** The guards do not change (D6).
- **FR-8.** `README.md` of the plugin states the session track, the clues, and the list note. `CHANGELOG.md` gets one entry.

## Acceptance criteria

The new test file is `plugins/opencode-measure-guard/tests/session-track.test.ts`. Its fixture is a temporary git project with `measure/index.md` (the plugin fixture) and a `tracks.md` with 3 `[~]` tracks in this order: `alpha_20261109` (name `Alpha`), `beta_20261109` (`Beta`), and `gamma_20261109` (`Gamma`). Each track has a `plan.md` with one phase and one `[~]` task: `Task 1.1: Alpha work`, `Task 1.1: Beta work`, and `Task 1.1: Gamma work`. A case may change a plan or a marker before it runs.

- **AC-1 (the PM case: a session that names a track).** A prompt `Work on track beta_20261109.` gets a note with `Active track: Beta (measure/tracks/beta_20261109/).` and `Current task: [~] Task 1.1: Beta work`. The note does not contain `Alpha`.
- **AC-2 (the PM case: a session that names no track).** A prompt `hello` gets the D5 list note. The note contains `This session names no track. 3 tracks have a task in progress:` and the lines `- alpha_20261109: Alpha`, `- beta_20261109: Beta`, and `- gamma_20261109: Gamma`, in this order. The note does not contain `Active track:`.
- **AC-3 (each session has its own track).** In one Guard, session `ses_a` names `gamma_20261109` and session `ses_b` names `alpha_20261109`. Each note names only the track of its session.
- **AC-4 (the latest clue wins).** A session names `beta_20261109`. A later prompt names `gamma_20261109`. The later prompt gets the Gamma note.
- **AC-5 (two ids name no track).** A prompt that names `alpha_20261109` and `beta_20261109` gets the list note. In a session with the track `gamma_20261109`, the same prompt gets no new note, and `track` stays `gamma_20261109`.
- **AC-6 (whole words only).** A prompt with `beta_202611090` or `xbeta_20261109` gets the list note.
- **AC-7 (only `[~]` tracks count).** `gamma_20261109` is `[x]` in `tracks.md`. A prompt that names `gamma_20261109` gets the list note with 2 lines.
- **AC-8 (the title clue).** The fake title function gives `Review of gamma_20261109`. The first prompt `hello` gets the Gamma note. A later prompt names `beta_20261109` and gets the Beta note. The prompt after it, `again`, gets no new note: the title does not replace the track.
- **AC-9 (a failed or slow title).** The title function throws in one Guard and never resolves in a second Guard. In each Guard, the prompt `hello` gets the list note. In the second Guard, the prompt hook returns in less than 2000 ms.
- **AC-10 (the path clue).** In a session with no track, a completed `write` call to `measure/tracks/gamma_20261109/plan.md` gets the Gamma note in its result. In a second session with no track, a completed `write` to `notes/gamma_20261109/x.md`, outside `measure/`, also gets the Gamma note.
- **AC-11 (a failed call gives no clue).** A `write` call to `measure/tracks/gamma_20261109/plan.md` with status `error` does not set `track`. The next prompt `hello` gets the list note.
- **AC-12 (a named track with no task).** The plan of `beta_20261109` has no `[~]` task and has one `[ ]` task. A prompt that names `beta_20261109` gets `Active track: Beta (measure/tracks/beta_20261109/).` and `No task is in progress.`.
- **AC-13 (one working track keeps the old note).** Only the plan of `beta_20261109` has a `[~]` task. The prompt `hello` gets the Beta note, as before this track.
- **AC-14 (the list key).** After the list note, a task change in `alpha_20261109` gives no new note on the next prompt. When the plan of `gamma_20261109` loses its `[~]` task, the next prompt gets a list note with 2 lines.
- **AC-15 (compaction).** In a session with the track `gamma_20261109`, the compaction system part contains the Gamma note. In a session with no track, it contains the list note.
- **AC-16 (the guards keep the project rule).** In a session with no track, the edit guard allows a `write` to `src/x.ts`. In a session with the track `beta_20261109` and a Beta plan with no `[~]` task, the edit guard also allows a `write` to `src/x.ts`, because Alpha has a `[~]` task.
- **AC-17 (the old suite).** `bun test` in `plugins/opencode-measure-guard` passes with no change to the old test files. `bun x tsc --noEmit -p .` and `bash scripts/check-parity.sh` exit 0.
- **AC-18 (install).** `bin/install-measure-skill` exits 0, and `bin/install-measure-skill --check` exits 0. `diff -r` of `plugins/opencode-measure-guard/src` and the installed `src` shows no difference.
- **AC-19 (live check).** In a temporary git project with the AC fixture, two sessions run through the OpenCode service HTTP API. The stored user message of the session that names `beta_20261109` holds the Beta note. The stored user message of the session that names no track holds the list note with 3 lines.

## Out of scope

- The guards, the band, `/measure-status`, and the status tool keep the project rule (D6).
- The Claude Code mod (`mods/measure-guard/`) and the dsh plugin (`plugins/dsh-measure-guard/`) keep their notes.
- A child session does not get the track of its parent session.
- The rule that takes the first `[~]` track when no plan has a `[~]` task does not change.

## Known limits

- A session that changes a plan only with shell commands gets no path clue. Its prompts and its title are its clues.
- A prompt that quotes another track id by mistake moves the track of the session. The next prompt that names the right id moves it back.
- The track of a session lives in the memory of the plugin instance. A reload of the plugin starts each session with `null` again.
