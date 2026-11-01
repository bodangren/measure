# Specification: Allow list for the measure guard

## Overview

The PM sent request A-41 on 2026-11-01 (16:5x ICT). Daniel approved it ("4. Allow list", Google Tasks, 16:52 ICT). At 00:00 on 2026-11-01, the measure guard denied the daily work report in `advantage-pr`. The active track of that repository had no `[~]` task, and the edit guard denies a write outside `measure/` in that state.

The scheduled jobs of `advantage-pr` write output files. These files are not track work. The interim fix is a standing `[~]` task (track `ops_scheduled_jobs_20261101`). A standing `[~]` task opens every path of the repository, so it is weaker than a list of allowed folders.

This track adds a per-repository allow list to the guard. A folder on the list may get writes while no task is `[~]`. The guard does not change for a path that is not on the list.

## Current system

- The pure guard decisions are in `mods/measure-guard/hooks/guards.ts` and `mods/measure-guard/hooks/parse.ts` (the Claude Code mod). The OpenCode plugin has byte copies in `plugins/opencode-measure-guard/src/core/`. The plugin types file `src/types.ts` is a copy of `mods/measure-guard/types/index.d.ts` without the `declare module` block. `plugins/opencode-measure-guard/scripts/check-parity.sh` checks the three copies.
- Each guard reads a `Snapshot` (type in `types/index.d.ts`). The mod builds it in `loadSnapshot` of `mods/measure-guard/hooks/register.tsx` with `$.fs`. The plugin builds it in `loadSnapshot` of `plugins/opencode-measure-guard/src/snapshot.ts` with Node file calls.
- Four path rules ask whether a write belongs to a task. Each rule treats a path inside `measure/` as Measure work:
  1. `editDecision` (edit guard; modes `guard` and `strict`).
  2. `turnProblems` (end-of-turn check): the problem "Files changed outside measure/ while no task is in progress". `changedDuringTurn` removes the `measure/` paths from the changed list before `turnProblems` gets the list. `changedDuringTurn` has no snapshot, so the allow list filter goes into `turnProblems` (Decision 6).
  3. `commitDecision` (commit guard; mode `strict`): the deny for a commit with files outside `measure/` while no task has `[~]`.
  4. `tddDecision` (TDD guard; mode `strict`): a source file needs a Red phase for the `[~]` task.
- `statusLines` in `parse.ts` gives the text of `/measure-guard`, of the `measure_status` tool, and of the terminal sidebar.
- The hourly cron job runs `bin/install-measure-skill`. The installer copies `plugins/opencode-measure-guard/` (without `tests/` and `node_modules/`) from the `main` ref to `~/.config/opencode/plugins/opencode-measure-guard/`. The OpenCode service reloads the plugin when its files change.
- The Claude Code mod is not installed for Claude Code on this machine. It loads only with `claude --plugin-dir`. The scheduled jobs of `advantage-pr` run in OpenChamber sessions, so the OpenCode plugin guards their tool calls.

## Decisions

1. **Track type and branch.** Feature. The work happens on the branch `feat/guard-allow-list` in the main checkout `/home/daniebo/Desktop/measure`. The installer reads only the `main` ref, so the cron job does not install the work before the merge. At the end, the branch merges into `main` with `git merge --no-ff`, and the branch is deleted. The branch is not pushed.
2. **File.** The allow list is the file `measure/guard-allow` of the guarded repository. The path is fixed. `measure/index.md` does not link it. The file is plain UTF-8 text.
3. **Line rules.** The parser splits the text on `\n` and applies `String.prototype.trim()` to each line. Then:
   - An empty line is ignored.
   - A line that starts with `#` is a comment. A comment can only be a whole line.
   - Every other line is an entry.
4. **Entry rules.** An entry names one folder, relative to the project root (the folder that holds `measure/`). The parser checks each entry in this order, and it ignores the entry at the first rule that fails. The reason strings are exact.

   | Order | Rule | Reason string |
   | --- | --- | --- |
   | 1 | The entry starts with `/`. | `absolute path` |
   | 2 | A `/`-separated segment of the entry is `..`. | `has a .. segment` |
   | 3 | The entry contains `*`, `?`, `[`, `]`, `{`, or `}`. | `has a wildcard` |
   | 4 | The entry does not end with `/`. | `not a folder (an entry ends with /)` |
   | 5 | `joinPath(entry)` of `parse.ts` is the empty string (for example `./`). | `names the project root` |

   An entry that passes all five rules is kept as `joinPath(entry)`: no leading `./`, no repeated `/`, and no trailing `/`. The parser keeps each folder once, in the order of its first line. An entry inside `measure/` is kept; it changes nothing, because the path rules already treat `measure/` as Measure work.
5. **Matching.** `isAllowed(snapshot, path)` is true when the list has a folder `F` and `isInside(joinPath(snapshot.root, F), P)` is true. `P` is `joinPath(path)` for an absolute path, and `joinPath(snapshot.root, path)` for a relative path. Thus the match is by whole path segments and is case-sensitive, and `..` segments resolve before the match. The guard does not resolve symbolic links.
6. **Effect.** A path on the allow list counts as Measure work, as a path inside `measure/` does, in the four path rules of "Current system":
   1. `editDecision` returns `null` for the path, also when no track is `[~]`.
   2. `turnProblems` leaves the path out of the "Files changed outside measure/" problem. When no other changed path remains, that problem is not reported.
   3. `commitDecision` leaves the path out of the `outside` list. A commit with only allowed paths and `measure/` paths passes while no task has `[~]`. The message format check does not change.
   4. `tddDecision` returns `null` for the path.

   The setup deny (a git repository without `measure/`), the closeout guard, the bypass, and the advise mode do not change. A tool call that writes several paths is denied when one of its paths is denied, as now.
7. **Deny texts.** No deny text changes, and no deny text names the allow list. Reason: an agent must not learn from a deny to add its own path to the list.
8. **Types.** `mods/measure-guard/types/index.d.ts` gets two exported types, and `Snapshot` gets one field:

   ```ts
   /** A line of measure/guard-allow that the guard ignores. */
   export type AllowIgnored = {
     /** The 1-based line number. */
     line: number
     /** The trimmed line text. */
     text: string
     /** The reason string of the first rule that failed. */
     reason: string
   }

   /** The allow list of measure/guard-allow. */
   export type AllowList = {
     /** The kept folders, relative to the root, without a trailing slash. */
     folders: string[]
     /** The ignored entry lines, in file order. */
     ignored: AllowIgnored[]
   }
   ```

   In `Snapshot`, after `parseError`: `/** The allow list of measure/guard-allow; empty when the file is absent or cannot be read. */ allow: AllowList`. The empty list is `{ folders: [], ignored: [] }`.
9. **Pure functions.** `parse.ts` gets `export const ALLOW_FILE = 'guard-allow'` and `export const parseAllowList = (text: string): AllowList`. `guards.ts` gets `export const isAllowed = (snapshot: Snapshot, path: string): boolean` and uses it in the four path rules.
10. **Loaders.** Both `loadSnapshot` functions set `allow` on every snapshot that they return. When `<root>/measure/` does not exist, or the root is not a git repository, `allow` is the empty list. Otherwise the loader reads `<root>/measure/guard-allow` before it reads `measure/index.md`. When the file does not exist, or the read throws (for example, the path is a folder), `allow` is the empty list, and the loader continues. All later returns of the loader, also the returns with `parseError`, carry the same `allow`.
11. **Status lines.** `statusLines` adds lines directly before the `Guards:` line, only for a snapshot with `hasMeasure`, and only when `allow.folders` or `allow.ignored` is not empty:
    - First line: `Allow list (measure/guard-allow): <folders>`. `<folders>` is each folder with a trailing `/`, joined by `, `. With no kept folder, the line ends with `no folders`.
    - Then one line for each ignored entry: `  ignored line <line>: <text> (<reason>)`.
12. **Parity.** The change starts in the mod files (`hooks/parse.ts`, `hooks/guards.ts`, `types/index.d.ts`, `hooks/register.tsx`). Then the three core files are copied to the plugin by the existing parity rules, and `plugins/opencode-measure-guard/src/snapshot.ts` changes. `bash plugins/opencode-measure-guard/scripts/check-parity.sh` must print `parity: ok`.
13. **Install and live check.** After the merge, one run of `bin/install-measure-skill` installs the plugin. A live check imports the installed `src/guard.ts` with `bun`, runs `onToolBefore` in a temporary git repository, and makes no model call.
14. **advantage-pr list.** After the install, this track writes the file `/home/daniebo/Desktop/advantage-pr/measure/guard-allow` with the text of "advantage-pr list" below. It does not commit the file and writes no other file in `advantage-pr`. The PM commits it and closes the interim track.
15. **Out of scope.** File entries and wildcards; a reload of the terminal sidebar when only `measure/guard-allow` changes (the sidebar shows the new list at its next refresh); symbolic link resolution; a check that an agent changed `measure/guard-allow` during a turn; the `skills/measure/` documents.

## advantage-pr list

```text
# measure-guard allow list. A write to a folder below passes while no task is [~].
# One folder per line, relative to the repository root, with a trailing "/". No wildcards.
# Source: track ops_scheduled_jobs_20261101, FR-1. Owner: the PM.

# Daily work report (00:00): the report work files.
scripts/daily-report/work/
# Daily reel (weekdays 06:15): the script, the post log, and the last reel id.
scripts/daily-reel/work/
# Daily reel: the mp4 files, the frames, and the fb-caption-<date>.txt caption files.
assets/videos/
# Facebook morning check (08:15): the report-only drafts.
.drafts/
```

## Acceptance Criteria

1. With the list `scripts/daily-report/work/` and no `[~]` task, the edit guard allows `scripts/daily-report/work/report.md` and `scripts/daily-report/work/sub/x.json`.
2. With the same list and state, the edit guard denies, with the deny text of today: `scripts/daily-report/collect.py`, `scripts/daily-report/work.md`, `scripts/daily-report/work-old/a.md`, `scripts/daily-report/workx/a.md`, `scripts/daily-report/work/../collect.py`, and `Scripts/daily-report/work/a.md`.
3. With the same list and no `[~]` track, the edit guard allows `scripts/daily-report/work/report.md` and denies `src/a.ts` with the "no track is in progress" deny text of today.
4. `parseAllowList` keeps and ignores the entries of Decisions 3 and 4, with the exact reason strings and line numbers.
5. The end-of-turn check, the commit guard, and the TDD guard follow Decision 6.
6. Both loaders fill `allow` as Decision 10 states. Without `measure/guard-allow`, every existing test passes without change.
7. `statusLines` gives the lines of Decision 11.
8. `bun test` in `plugins/opencode-measure-guard`, `bun x tsc --noEmit -p .` in `plugins/opencode-measure-guard`, `claude plugin test mods/measure-guard`, and `bash plugins/opencode-measure-guard/scripts/check-parity.sh` pass.
9. After the merge, `bin/install-measure-skill --check` exits 0, and the live check of Decision 13 passes.
10. `/home/daniebo/Desktop/advantage-pr/measure/guard-allow` holds the text of "advantage-pr list". The installed `loadSnapshot`, run read-only on `/home/daniebo/Desktop/advantage-pr`, gives the 4 folders and 0 ignored lines. The installed guard, run on a temporary git repository with a copy of that file and no `[~]` task, allows `scripts/daily-report/work/x.md`, `scripts/daily-reel/work/x.json`, `assets/videos/fb-caption-2026-11-02.txt`, and `.drafts/x.md`, and denies `src/x.md` and `scripts/daily-report/send.py`.
