# Test Strategy: Allow list for the measure guard

Track: `guard_allow_list_20261101`. Spec: [spec.md](./spec.md). Plan: [plan.md](./plan.md).
Written at `role_base_sha` `148beb3` (branch `feat/guard-allow-list`). It covers Phase 1 and Phase 2.

The "Rules for every phase" section and the "Test commands" table of `plan.md` are binding. The spec passed review, so this strategy does not reopen a design decision. It adds gates, ownership, risk, review applicability, falsification conditions, and anti-pattern defenses. It adds two required test cases (A2b and B5), because Decision 4 (the order of the rules) and Decision 5 (the absolute path form) have no full test in `plan.md` Task 1.1. See section 4.

## 1. Environment facts

- **The track line is not `[~]` yet.** At `148beb3`, `measure/tracks.md` has `- [ ] **Track: Allow list for the measure guard**`, and no task is `[~]`. The installed OpenCode guard then denies every write outside `measure/`, also a write to `tests/`. Before Red writes a test file, the track line and Task 1.1 must be `[~]`. Both edits are inside `measure/`, so the guard allows them.
- **This track changes the guard, but the installed guard does not change during Phase 1.** The cron job installs only from the `main` ref. The branch is not merged until Phase 2. Thus the rules of the old guard apply to every Phase 1 role.
- **Red marks the first Green task `[~]` as its last plan edit.** This keeps the Red record true (A5), satisfies the Red gate, and lets Green edit `src/` and the README files.
- **`measure/runs/` is in `.gitignore`.** No role commits a run artifact or a log.
- **`extensions/` is untracked and stays untracked.** No role stages it. No role uses `git add -A`, `git add .`, or `git commit -a`.
- **The Red gate accepts only commits whose paths contain `/tests/` or `measure/`.** All files of Task 1.1 (`plugins/opencode-measure-guard/tests/*` and `mods/measure-guard/tests/*`) match.
- **Baselines at `148beb3`** (run by this strategy role):

| Command | Result |
| --- | --- |
| `cd plugins/opencode-measure-guard && bun test` | `85 pass`, `0 fail`, 11 files |
| `bun x tsc --noEmit -p .` (plugin) | exit 0 |
| `bash plugins/opencode-measure-guard/scripts/check-parity.sh` | `parity: ok` |
| `claude plugin test mods/measure-guard` | `87 pass`, `0 fail`, 10 files |
| `claude plugin validate mods/measure-guard` | `Validation passed` |
| `bash tests/spec_review_gate/run.sh` | `10 suites (PASS=10, FAIL=0)` |

- **`tsconfig.json` of the plugin includes `tests/**/*.ts`.** Thus `bun x tsc --noEmit -p .` type-checks the new test files. The tests must type-check after Decision 8 lands. At Red, `tsc` is not a gate, and errors about the missing types are expected.
- **The plugin tool path is absolute.** `writtenPaths` in `src/hooks/tools.ts` resolves a relative path against the root before the guard sees it. The relative form of Decision 5 is thus reachable only through `isAllowed` and `parseAllowList`. Case B5 covers it.
- **Commit and end-of-turn paths are relative to the git root.** `commitDecision` gets staged paths relative to the repository root. `turnProblems` gets paths from `git status --porcelain`. `isAllowed` joins a relative path with `snapshot.root`. Thus the match is correct only when `snapshot.root` is the git root. This is the case for both loaders today. Review A checks it.
- **The mod README has no `## Guards` heading.** Plan Task 1.3 says "after `## Guards`" for both README files. The plugin README has that heading. The mod README has `## Edit guard` to `## Commit guard (strict mode)`. Green puts the mod section `## Allow list` directly after `## Commit guard (strict mode)`. This is not a blocker.

## 2. Capture of `phase_base_sha`

- **Phase 1:** run `git rev-parse HEAD` directly after the commit of this file lands. Do this before Red marks the track line or Task 1.1 `[~]`. That SHA is the Phase 1 `phase_base_sha`. If the orchestrator makes a later commit that changes only `measure/` (for example a state commit), capture the SHA after that commit instead. Do it still before Red edits `measure/tracks.md` or `plan.md`.
- **Phase 2:** capture `phase_base_sha` with `git rev-parse HEAD` on the branch `feat/guard-allow-list` after the Task 1.3 plan-evidence commit and before `git switch main`. Phase 2 has no Red or Green role, so the SHA is for the audit record only.
- Do not use `148beb3` as `phase_base_sha`. This file contains no `phase_base_sha` value.

## 3. Task ownership and gate markers

| Phase | Red owns | Green owns | Marker that Red leaves |
| --- | --- | --- | --- |
| 1 | Task 1.1 | Tasks 1.2 and 1.3 | Task 1.1 `[x]` with SHA; Task 1.2 `[~]` |
| 2 | none | none (orchestrator operations) | none |

- Task 1.3 (docs) changes README files and `CHANGELOG.md`. They are outside `measure/` and `tests/`, so Green owns them.
- Each task gets one commit, then one plan-evidence commit with the task SHA, then a git note (plan rule).
- Task 1.1 edits four existing test files (`core.test.ts`, `band.test.ts`, `edit-guard.test.ts`, `commands.test.ts`) to add `allow: { folders: [], ignored: [] }`. The edit is mechanical. It must change no assertion.

## 4. Phase 1: Allow list in the guard

**Risk: high.** Reasons: the change is in the guard that every agent session meets; the core is shared by two products through a copy; a parser error can make the guard fail open (allow too much) or fail closed (block all work); the merge in Phase 2 installs the code on this machine within one hour.

### 4.1 Gates

| Gate | Command (from `plan.md`, used as written) | Expected |
| --- | --- | --- |
| Targeted Red (`RED_TEST_COMMAND`) | `cd plugins/opencode-measure-guard && bun test tests/allow.test.ts; p=$?; cd ../.. && claude plugin test mods/measure-guard; m=$?; test $p -eq 0 -o $m -eq 0` | exit 1 (both suites fail) |
| Green (`GREEN_TEST_COMMAND`) | `cd plugins/opencode-measure-guard && bun test && bun x tsc --noEmit -p . && bash scripts/check-parity.sh && cd ../.. && claude plugin test mods/measure-guard` | exit 0 |
| Closeout (`PROJECT_LINT`, `PROJECT_CHECKS`, `PROJECT_TESTS`) | the three commands of the table in `plan.md` | all exit 0 |

- **Green counts.** After Task 1.2, the plugin suite has more than 85 tests and the mod suite has more than 87 tests. Parse the labeled lines `N pass` and `N fail` (A3). The check is `fail` equal to 0 and `pass` greater than the baseline. A digit-only grep is not a valid check.
- **Closeout includes `tests/spec_review_gate/run.sh`.** It must still give `10 suites (PASS=10, FAIL=0)`. This track changes no skill file, so a drop is a regression.
- **`GREEN_TEST_COMMAND` stops at the first failure** (`&&`). A failure in `tsc` hides the parity result. Run `check-parity.sh` alone when `tsc` fails, and report both results.

### 4.2 Red evidence rules

1. **Missing exports must not hide the cases.** A named import of a missing export (`parseAllowList`, `isAllowed`, `ALLOW_FILE`) stops the whole Bun test file at load. Then `0 tests` run and one load error shows. Red uses a namespace import (`import * as parse from '../src/core/parse'`) for the new names. Then each case fails on its own, with a message about the missing function.
2. **Record the failing and passing sets.** The Red note lists the failing test names and the passing test names for each suite, and the labeled counts `fail=<n>` and `pass=<n>` of each suite. The expected sets are:

| Suite | Fail at Red (missing behavior) | Pass at Red (controls; they prove the fixture works) |
| --- | --- | --- |
| Plugin `allow.test.ts` | A1, A2, A2b, A3, B1, B3 (first half), B5, C1, D1 (allow halves), E1, F1, G1 (list halves) | B2, B3 (deny half), B4, D1 (deny halves and message half), E1 (deny half), G1 (empty-list half) |
| Mod `allow.test.ts` | M1, M2, M4 | M3 |

3. **A control that passes at Red is not Red evidence.** B2, B4, and M3 guard against a regression. They pass before and after Green. The Red note says so. A case that mixes a control half and a failing half is one test; it must fail at Red through its failing half (A4).
4. **A failure from a fixture is a Red failure to fix.** A `TypeError` about `tempProject`, `withMeasure`, `makeGuard`, `realFiles`, a missing fixture file, or a wrong `[~]` count is a fixture error. The Red role removes it before the commit. The only acceptable failure causes are: a missing export, a missing `allow` field, a missing status line, and an allowed path that the guard still denies.
5. **The mod suite must fail in the new file only.** `claude plugin test mods/measure-guard` at Red gives `fail` greater than 0, and every failing test is in `allow.test.ts`. Any failure in the 87 old tests is a fixture error from the `allow` edits.
6. **Exit code 0 of `RED_TEST_COMMAND` is a Red failure.** It means one suite passes, so one suite did not load the new tests. The Red role checks that `claude plugin test` discovers `tests/allow.test.ts` (the count of test files goes from 10 to 11).

### 4.3 Test cases, falsification conditions, and mutation probes

Each row names a wrong implementation that the test must reject. The adversarial role runs the mutations in section 4.6. A test with no rejectable wrong implementation is vacuous (A4).

| Case | Proves | Falsified by (the test must fail for each) |
| --- | --- | --- |
| A1 | Trim, comment, empty line, `./` strip, `//` collapse, CRLF, duplicate, order | An implementation that skips `trim()` (the CRLF `.drafts/\r` entry survives); keeps `./assets/videos`; keeps `a//b`; keeps a duplicate; sorts the folders |
| A2 | Each entry rule, its reason string, its 1-based line number, its trimmed text | An implementation that skips a rule; mistypes a reason; counts lines from 0; counts only entry lines (comment and empty lines must count); stores the untrimmed text. Compare the whole `ignored` array with `toEqual` on `{ line, text, reason }`. |
| A2b (added) | Decision 4 order: the first rule that fails gives the reason | Rows: `/../x/` gives `absolute path` (rule 1 before 2); `/*/` gives `absolute path` (1 before 3); `../*/` gives `has a .. segment` (2 before 3); `src/*` gives `has a wildcard` (3 before 4); `../` gives `has a .. segment` (2 before 5); `.` gives `not a folder (an entry ends with /)` (4 before 5). An implementation that checks the rules in another order fails at least one row. |
| A3 | `#` inside an entry is data; `''` gives the empty list | An implementation that cuts a line at the first `#`; an implementation that throws or returns `undefined` on `''` |
| B1 | Allowed folder and a sub-folder resolve with no `[~]` task | An implementation that matches only a direct child |
| B2 | The six denied paths of criterion 2 reject with the unchanged deny text | An implementation that matches by `startsWith(folder)` with no slash (`work.md`, `work-old`, `workx` pass wrongly); skips `..` resolution (`work/../collect.py` passes wrongly); matches case-insensitively (`Scripts/...` passes wrongly) |
| B3 | With no `[~]` track, an allowed path resolves and `src/a.ts` gets the "no track is in progress" text | An implementation that checks `active === null` before the allow check |
| B4 | A `[~]` task: the list changes nothing; an ignored entry allows nothing; one denied path in a multi-path call denies the call | An implementation that lets an ignored entry allow `src/a/x.ts`; an implementation that reads only the first path of `apply_patch` |
| B5 (added) | Decision 5 path forms through `isAllowed` | See below |
| C1 | `turnProblems` drops the allowed path; the problem disappears when nothing else remains | An implementation that leaves the filter out of `turnProblems`; an implementation that reports an empty list (`Files changed ...: .`) |
| D1 | `commitDecision` drops the allowed path from `outside`; the message check stays | An implementation that allows the whole commit when one path is allowed; an implementation that skips the message check for an allowed path |
| E1 | `tddDecision` returns `null` for an allowed source file | An implementation that changes `editDecision` only |
| F1 | `loadSnapshot` fills `allow` in each return, and a read error does not throw | An implementation that sets `allow` only on the success return (the `tracks.md`-missing and `parseError` returns lose the folders); an implementation that lets the read of a folder throw (a throw gives `parseError` or a crash) |
| G1 | `statusLines` text, position, and the empty case | An implementation that prints the line after `Guards:`; omits the trailing `/`; prints for an empty list; prints `no folders` for a non-empty list |
| M1 | The mod tool hook allows the list and denies the near misses | An implementation that changes the plugin loader only (the mod loader in `register.tsx` fails here) |
| M2 | `/measure-status` shows the list line | An implementation that updates `statusLines` but not the mod pane |
| M3 | A folder at `measure/guard-allow` gives no list and no crash | An implementation that throws in `$.fs` and fails open (the mod guard then allows everything) |
| M4 | The list survives a `parseError` | An implementation that returns `base` without `allow` after `parseError` |

**B5 (added, Decision 5).** The case calls `isAllowed` directly with a snapshot of root `<root>` and the folder `scripts/daily-report/work`. It checks:
- an absolute path `<root>/scripts/daily-report/work/a.md` gives true;
- a relative path `scripts/daily-report/work/a.md` gives true;
- `<root>/scripts/daily-report/work/../collect.py` and the relative `scripts/daily-report/work/../collect.py` give false;
- `<root>/scripts/daily-report/work-old/a.md` gives false;
- a path in a sibling root `<root>2/scripts/daily-report/work/a.md` gives false;
- a path equal to the folder itself (`<root>/scripts/daily-report/work`) gives true (Decision 5: `isInside` is true for the folder).

**Added assertions inside existing cases (not new cases).**
- B2 and B3: compare each deny text to the text of the same call in a project with no `measure/guard-allow` (a control run in the same test). The two strings must be equal. Also assert that no deny text contains `guard-allow` (Decision 7). This replaces a `startsWith` check with an exact check.
- B1: after the allowed writes resolve, one write to a denied path in the same test rejects. This proves that the guard is on.
- D1: the staged path list also holds a `measure/...` path. The allowed `measure/` path and the allowed folder path pass together.
- F1: assert `parseError === null` for the folder case, and `parseError !== null` for the unknown-format case. Both with the exact folders.

**Fixtures and mocks.**
- Plugin: real temporary git repositories made by `tempProject` and `withMeasure`. `makeGuard` builds the real `Guard`. No mock replaces git, the file system, or the parser.
- Mod: `realFiles()` of `tests/world.ts`, with the Task 1.4 marker changed to `[x]` as `noTaskFiles()` does. The mod runs under the `claude-code/testing` world. That world is the only fake, and it is the existing harness.
- A new test never reads `measure/tracks/guard_allow_list_20261101/` (A9). It uses temporary files and the frozen fixtures only.

### 4.4 Task 1.2 acceptance details (Green)

- `git diff 148beb3 -- plugins/opencode-measure-guard/src mods/measure-guard/hooks` shows no changed line that contains `deny:` text, `SETUP_DENY`, `BYPASS`, or `PROMPT` strings (Decision 7). A new line in `guards.ts` or `parse.ts` that adds `guard-allow` to a user-visible deny is a block.
- `grep -c "guard-allow" mods/measure-guard/hooks/guards.ts` is 0. The file name is a parse constant (`ALLOW_FILE`) and lives in `parse.ts` and the two loaders.
- Both loaders use `ALLOW_FILE` and `parseAllowList`. No loader has its own parser.
- Every `return` of both `loadSnapshot` functions after the `measure/` check carries `allow`. Review A counts the return sites in each loader and lists them in `evidence`.
- `check-parity.sh` prints the exact line `parity: ok`.

### 4.5 Task 1.3 acceptance details (docs)

Documentation tests are artifact tests. They prove that text exists. They do not prove that the guard obeys the text. The live behavior tests of Task 1.1 prove behavior.
- Each README has exactly one line `## Allow list`. The plugin section is after `## Guards`. The mod section is after `## Commit guard (strict mode)`.
- Each README section contains these exact strings, copied from `parse.ts`: `absolute path`, `has a .. segment`, `has a wildcard`, `not a folder (an entry ends with /)`, `names the project root`, and `measure/guard-allow`. A11 check: take each reason string from `parse.ts`, and search both README files for it with `grep -F`. A reason in the code with no match in the README is doc drift.
- Each section names the four path rules (edit guard, end-of-turn check, commit guard, TDD guard), the two status lines, and the four limits (no wildcards, no file entries, no symbolic link resolution, the list is not named in a deny text).
- `CHANGELOG.md` has exactly one new line under `## Unreleased` / `### Features`. The line names `measure/guard-allow` and the track id. The labeled count of lines with `guard_allow_list_20261101` goes from 0 to 1.
- The README text makes no claim beyond the code. It must not say that the guard "protects" the list file from an agent edit (Decision 15). A5 and A6 apply.

### 4.6 Review scopes, architecture guardrails, and changed-contract risks

**Changed contracts.** (1) The `Snapshot` type gets a required field `allow`. Any `Snapshot` literal in the repository without the field fails `tsc`. (2) The mod and plugin cores must stay byte copies. (3) The `statusLines` output gets new lines, so any test that compares the full status list can fail. (4) The loaders read one more file for each snapshot.

**Architecture guardrails.**
- The pure functions stay pure: `parseAllowList` and `isAllowed` take text or a snapshot and do no I/O.
- `guards.ts` imports `ALLOW_FILE` or the list only through the `Snapshot`. It does not read a file.
- The change starts in the mod files. The plugin core files are copies. A manual edit of `plugins/opencode-measure-guard/src/core/*.ts` is a block.
- The deny texts, the bypass, the setup deny, the closeout guard, and the advise mode do not change.

**Mutation probes (sensitivity copies).** The adversarial role applies each mutation to a throwaway copy of the changed source in `/tmp`, runs the plugin test file against it, and records the result. A mutation that no test rejects is a finding. Never mutate the repository files.

| Id | Mutation | Test that must reject it |
| --- | --- | --- |
| X1 | `isAllowed` matches with `startsWith(folder)` | B2 |
| X2 | `isAllowed` skips `joinPath` resolution of the path | B2, B5 |
| X3 | `isAllowed` lowercases both sides | B2 |
| X4 | `parseAllowList` skips `trim()` | A1 |
| X5 | `parseAllowList` skips rule 4 | A2 |
| X6 | `parseAllowList` swaps rules 3 and 4 | A2b |
| X7 | `turnProblems` has no allow filter | C1 |
| X8 | `commitDecision` has no allow filter | D1 |
| X9 | `tddDecision` has no allow filter | E1 |
| X10 | The loader drops `allow` on the `parseError` return | F1, M4 |
| X11 | The loader lets the read of a folder throw | F1, M3 |
| X12 | `statusLines` prints the line after `Guards:` | G1 |

**Review A (correctness): applicable, full scope.** Reason: the change is new logic in four rules and two loaders. Scope: the five entry rules and their order; the line numbers; the four rules of Decision 6; the return sites of both loaders; the git root assumption (section 1); the 1-based line count; the copy in the plugin; the test-to-spec map (every Decision 3 to 12 has a test; list any that has none).

**Review B (security): applicable, full scope.** Reason: the code decides which writes the guard allows. A parser error opens the repository to writes. Scope:
- Path matching: whole-segment match, no `startsWith` shortcut, case rules, the folder equal to the path, a path that equals the root.
- Prefix and sibling tricks: `work.md`, `work-old/`, `workx/`, a sibling root `<root>2/`.
- `..` segments: in an entry (ignored, rule 2); in a written path (resolved by `joinPath` before the match); a path that climbs above the root (`joinPath` pops past the start, so check that the result is outside the root and `isInside` is false).
- Fail-open read: a missing file, a folder at the file path, a read error, a binary file, and a very large file. Each gives the empty list. The loader must not throw, and `parseError` must stay `null`. A throw that reaches the hook can make the whole guard allow (the hook allows when the snapshot is `null`).
- The agent can edit the list: `measure/guard-allow` is inside `measure/`, so the edit guard always allows a write to it (Decision 6, 15). Review B records this as the accepted residual risk of the spec. It checks that no deny text names the list (Decision 7) and that the README does not claim a protection.
- Entries that are legal but wide: `.git/` (hooks), `node_modules/`, `measure/`, and a folder with a trailing-space or backslash name. The spec keeps them (an operator owns the list). Review B lists them as Minor items for the user. They are not blocks.
- Symbolic links inside an allowed folder are not resolved (Decision 5, 15). Review B confirms that the README states this limit.
- The `.gitignore` or a git-ignored allowed folder: the end-of-turn check uses `git status`, so an ignored folder is not listed. This is not a security issue.

**Review C (API/UX contract): applicable, full scope.** Reason: the change adds a file format, two types, two exports, a status line format, and README text that users and agents read. Scope: the exact reason strings; the status lines (`Allow list (measure/guard-allow): ...`, `  ignored line <n>: <text> (<reason>)`); the type shapes of Decision 8 against `types/index.d.ts`; the unchanged deny texts; the README and `CHANGELOG.md` text against the code (A11); the advantage-pr list text against the format rules (every entry passes the five rules).

**Adversarial testing: applicable, limited to the probes below.** Reason: a guard is an attack surface, and the anti-pattern catalog names A4 and A7 as classes of vacuous or over-broad filter. The role runs the mutation probes X1 to X12 and these input probes against the real `parseAllowList` and `isAllowed`, with no change to the repository files:
- entries `/*/`, `//`, `///a/`, `a/./b/`, `a/b/../`, `\`, `a\b/`, `a b/`, `a/ /`, an entry of 10 000 characters, a NUL byte in a line, a file with a BOM, a file with only `\r` line ends, a file with 50 000 lines;
- the paths `<root>/scripts/daily-report/work//a.md`, `<root>/scripts/daily-report/./work/a.md`, `<root>/scripts/daily-report/work` (the folder itself), and a path with a trailing slash;
- a symbolic link inside the allowed folder that points to `src/` (expected: allowed, a documented limit);
- a write to `measure/guard-allow` itself with no `[~]` task (expected: allowed, the accepted residual risk).
The role puts the probe results in the audit JSON. It commits a test file only when the orchestrator has set a task `[~]`. Otherwise the probes stay under `measure/runs/guard_allow_list_20261101/` or `/tmp`.

**UX browser review: not applicable.** `UX_REQUIRED=never`. The track has no browser UI. The terminal sidebar only prints the existing status lines.

## 5. Phase 2: Merge, install, and the advantage-pr list

**Risk: medium.** Reasons: the steps are operations, not new logic. The merge is local (no push) and git can revert it. The install changes the live guard of this machine, and a plugin fault would affect all sessions. The live check and the `diff -r` check limit that risk. A write in another repository is one untracked file, the PM commits it.

**Roles.** Phase 2 has no Red role and no Green role. The orchestrator runs Tasks 2.1 and 2.2. The orchestrator does not run `role-gate` for Red or Green in Phase 2. No new test file is required. The tests of Phase 1 are the behavior proof; Phase 2 proves the install and the live result.

**Verification (the acceptance lines of the tasks).**

| Task | Acceptance line | How it is verified (falsifiable) |
| --- | --- | --- |
| 2.1 | The merge has no conflict | `git merge --no-ff feat/guard-allow-list` exits 0 on `main`. On a conflict, stop and report. |
| 2.1 | The installer exits 0 and keeps 0 files | Run `bin/install-measure-skill` once. Exit 0. Parse the labeled kept count from its output (a labeled integer, not a digit grep). On exit 2, stop and report the kept paths. If the cron job installed first, the output says `No differences`; the other checks still apply. |
| 2.1 | `--check` exits 0 | `bin/install-measure-skill --check` exits 0. |
| 2.1 | No difference between the repository and the installed plugin | `diff -r plugins/opencode-measure-guard/src ~/.config/opencode/plugins/opencode-measure-guard/src` prints nothing and exits 0. The test folder is not compared. The installer skips it. |
| 2.1 | The installed guard allows and denies | A script under `/tmp` (in its own empty folder) imports the installed `src/guard.ts` with `bun`. Run `bun` with the working directory `/tmp/<new folder>`, not inside a repository. The script makes a temporary git repository with the Measure files, one `[~]` track, no `[~]` task, and the list `scripts/daily-report/work/`. It runs `onToolBefore` for `scripts/daily-report/work/x.md` (must resolve) and `src/x.md` (must reject with the text that starts with `measure-guard:`). It also runs a control: the same repository with no list, where `scripts/daily-report/work/x.md` must reject. The control proves that the guard is on (A4). The script prints labeled lines (`allowed=true`, `denied=true`, `control_denied=true`) and the orchestrator parses them. |
| 2.1 | The branch is deleted | `git branch -d feat/guard-allow-list` exits 0. The `-d` option fails when the merge is not complete, so it is a check. |
| 2.2 | The file equals the spec text | Extract the fenced `text` block under `## advantage-pr list` of `spec.md` with `awk` into `/tmp/<new folder>/expected`. `cmp expected /home/daniebo/Desktop/advantage-pr/measure/guard-allow` exits 0. |
| 2.2 | The file is untracked and no other file changed | Save `git -C /home/daniebo/Desktop/advantage-pr status --porcelain` before the write and after it. The only difference is the added line `?? measure/guard-allow`. The repository can be dirty by the PM work already, so compare the two listings, not an empty status. |
| 2.2 | The installed `loadSnapshot` reads 4 folders and 0 ignored lines | A read-only `bun` script in `/tmp/<new folder>` imports the installed `src/snapshot.ts` and prints `folders=<n>` and `ignored=<n>`. The orchestrator parses the labeled integers: `folders=4`, `ignored=0`. The script runs `git rev-parse` and reads files only. |
| 2.2 | The installed guard on a copy of the file | In a temporary git repository with a copy of the file and no `[~]` task, the guard allows `scripts/daily-report/work/x.md`, `scripts/daily-reel/work/x.json`, `assets/videos/fb-caption-2026-11-02.txt`, and `.drafts/x.md`, and denies `src/x.md` and `scripts/daily-report/send.py`. The script prints one labeled line for each path (`path=<p> result=allowed|denied`), and the orchestrator compares the six results. |

**Review applicability in Phase 2.** Review A, Review B, Review C, adversarial testing, and UX browser review are not applicable, because Phase 2 adds no code. The merge commit carries only the Phase 1 files, and those files get all reviews in Phase 1. Phase acceptance and final acceptance read the recorded command outputs and may repeat the read-only checks: `cmp`, `diff -r`, `--check`, and the two `bun` scripts. They do not run `bin/install-measure-skill` again without the orchestrator.

**Guardrails for Phase 2.**
- The write to `advantage-pr` is one file at one path. It is allowed by Decision 14 and the PM request A-41 (the cross-project rule of `AGENTS.md`). The orchestrator writes no other file there and does not commit.
- The orchestrator sends the PM the "facts changed" list at close: the allow list is live, and the file is untracked in `advantage-pr`.
- If the live check fails after the install, the orchestrator reverts the merge on `main` (`git revert -m 1 <merge sha>`) and reports. It does not push.

## 6. Intentionally-red aggregate-suite handling

- **At Red (Task 1.1), the two new test files fail on purpose.** The full suites fail only in `allow.test.ts` (section 4.2, rule 5). `RED_TEST_COMMAND` is the only gate at Red. The orchestrator does not run `PROJECT_TESTS` at Red.
- **Between Red and Green, `main` is not touched.** The red state exists only on the branch `feat/guard-allow-list`, so the hourly install never sees it.
- **At Green, the aggregate must be green.** `GREEN_TEST_COMMAND` exits 0. No test file is skipped, deleted, or marked `skip` to reach Green. A diff of `tests/` between the Red commit and the Green commits must show no removed `expect(` line and no new `.skip`. The Green role may add a test only for a case it finds uncovered.
- **No test is left red at the end of Phase 1.** The track has no intentionally-red test after Task 1.2.

## 7. Artifact tests and live behavior tests

- **Live behavior tests:** `allow.test.ts` (plugin and mod) run the real parser, the real guards, and the real loaders in real temporary git repositories. B2, B3, D1, and the loader cases F1 and M1 to M4 test behavior.
- **Artifact tests:** the README and `CHANGELOG.md` checks of section 4.5, `check-parity.sh` (byte copies), and `claude plugin validate`. They prove that text and copies exist. They do not prove behavior.
- **Live proof after the install:** the `bun` scripts of section 5. They run the installed code, not the repository code. They make no model call.

## 8. Anti-pattern coverage (A1–A11)

| Id | Status | Defense per phase |
| --- | --- | --- |
| A1 | Retired. Not applicable. | — |
| A2 | Not applicable. No publish gate. | — |
| A3 | Applicable. | Phase 1: parse `N pass` and `N fail` as labeled integers; A2 compares whole `{ line, text, reason }` objects, not a digit. Phase 2: parse `folders=<n>` and `ignored=<n>` as labeled integers; parse the installer kept count by its label. |
| A4 | Applicable. | Phase 1: B2, B4, and M3 are controls that also pass at Red, so Red evidence lists them apart. Each allow test also has a deny half in the same test (B1, B3, D1, E1, M1), so a guard that is off cannot pass. A2b and X1 to X12 reject wrong rule orders and filters. Phase 2: the live check runs a control with no list that must deny. A `--check` exit 0 with `No differences` is not proof by itself; `diff -r` and the live check also run. |
| A5 | Applicable. | Phase 1 and 2: no plan line or git note says "all pass" unless the cited command exits 0. The Red note records the real counts. The README claims no protection of the list (Decision 15). |
| A6 | Applicable at closeout. | The `tracks.md` note for this track must not say "resolved" or "fully solved". It states what shipped: the list, the four path rules, and the advantage-pr file as an untracked file. |
| A7 | Applicable. | Phase 1: the deny-text check uses an exact equality with the control text and `not.toContain('guard-allow')`. It does not use a filter on bare English words. The doc check uses `grep -F` with the exact reason strings. Phase 2: the six path results are compared one by one, not by a coarse grep of the output. |
| A8 | Retired. Not applicable. | — |
| A9 | Applicable. | No test reads `measure/tracks/guard_allow_list_20261101/`. After the archive move, the Phase 2 `awk` step reads `spec.md` before closeout. The orchestrator runs it before the archive move, or reads the path under `measure/archive/` when the move has happened (track-dir resolve). |
| A10 | Not applicable. No `measure/doctor.sh`, no `measure/generated/`. | — |
| A11 | Applicable. | Phase 1, Task 1.3: the README reason strings are compared to the strings in `parse.ts` with `grep -F`. The type shapes in the README match `types/index.d.ts`. The recipe in `measure/anti-patterns.md` runs on `measure/product.md` and `measure/tech-stack.md`; if either file names `plugins/opencode-measure-guard/src/core` behavior, Review C checks that it still holds. Final acceptance runs the recipe and reports the labeled candidate count. |

## 9. Track-level gates

Use these values for `measure-adversarial-testing` and `measure-final-acceptance`. Each command exists at `148beb3`.

```bash
PROJECT_LINT='cd plugins/opencode-measure-guard && bun x tsc --noEmit -p .'
PROJECT_CHECKS='bash plugins/opencode-measure-guard/scripts/check-parity.sh && claude plugin validate mods/measure-guard'
PROJECT_TESTS='(cd plugins/opencode-measure-guard && bun test) && claude plugin test mods/measure-guard && bash tests/spec_review_gate/run.sh'
UX_REQUIRED=never
```

- Final acceptance also checks spec acceptance criteria 1 to 10 directly. Criteria 9 and 10 need the Phase 2 outputs.
- `bash measure/doctor.sh` does not exist in this repository. Final acceptance records that line as not applicable in `evidence`, with the reason "no `measure/doctor.sh` in this repository". It is not a blocking finding.
- Open item to carry: the terminal sidebar does not reload when only `measure/guard-allow` changes (spec Decision 15). Final acceptance lists it as a known limit, not a failure.

## 10. Summary of the risk and review matrix

| Phase | Risk | Review A | Review B | Review C | Adversarial | UX browser |
| --- | --- | --- | --- | --- | --- | --- |
| 1: Allow list in the guard | high | applicable | applicable | applicable | applicable (probes of section 4.6) | not applicable (`UX_REQUIRED=never`) |
| 2: Merge, install, and the advantage-pr list | medium | not applicable | not applicable | not applicable | not applicable | not applicable |
