# Implementation Plan: Allow list for the measure guard

Track: `guard_allow_list_20261101`. Spec: [spec.md](./spec.md). The decision numbers below refer to the "Decisions" section of the spec.

## Rules for every phase

- Work on the branch `feat/guard-allow-list` in `/home/daniebo/Desktop/measure`. Make one commit for each task, then one plan-evidence commit with the task SHA. Attach a git note to each task commit.
- Never stage `extensions/`. Never use `git add -A`, `git add .`, or `git commit -a`.
- Change the mod files first. Then copy `mods/measure-guard/hooks/parse.ts` to `plugins/opencode-measure-guard/src/core/parse.ts` and `mods/measure-guard/hooks/guards.ts` to `plugins/opencode-measure-guard/src/core/guards.ts` without changes. Copy the types as `scripts/check-parity.sh` expects.
- Write tests in the style of the existing files: `bun:test` in `plugins/opencode-measure-guard/tests/`, and `claude-code/testing` with `tests/world.ts` in `mods/measure-guard/tests/`.

## Test commands

| Gate | Command |
| --- | --- |
| `RED_TEST_COMMAND` (exit not 0 at Red: both suites fail) | `cd plugins/opencode-measure-guard && bun test tests/allow.test.ts; p=$?; cd ../.. && claude plugin test mods/measure-guard; m=$?; test $p -eq 0 -o $m -eq 0` |
| `GREEN_TEST_COMMAND` | `cd plugins/opencode-measure-guard && bun test && bun x tsc --noEmit -p . && bash scripts/check-parity.sh && cd ../.. && claude plugin test mods/measure-guard` |
| `PROJECT_LINT` | `cd plugins/opencode-measure-guard && bun x tsc --noEmit -p .` |
| `PROJECT_CHECKS` | `bash plugins/opencode-measure-guard/scripts/check-parity.sh && claude plugin validate mods/measure-guard` |
| `PROJECT_TESTS` | `(cd plugins/opencode-measure-guard && bun test) && claude plugin test mods/measure-guard && bash tests/spec_review_gate/run.sh` |

Baseline on `7a6f7d9`: the plugin has 85 Bun tests, the mod has 87 tests, and all pass. `tsc` and the parity check exit 0.

## Phase 1: Allow list in the guard [checkpoint: fc57fdb]

- [x] Task 1.1: Red: write the failing tests. `c8315cb`
  - New file `plugins/opencode-measure-guard/tests/allow.test.ts`. Use `tempProject`, `withMeasure`, and `makeGuard` of `tests/fake.ts` for the cases that need files. Cases:
    - A1 `parseAllowList`: comments, empty lines, a line with spaces around `scripts/daily-report/work/`, `./assets/videos/`, `a//b/`, the CRLF line `.drafts/` + `\r`, and a second `assets/videos/` give `folders` `['scripts/daily-report/work', 'assets/videos', 'a/b', '.drafts']` and no `ignored` item.
    - A2 `parseAllowList`: each entry of Decision 4 is ignored with its line number, trimmed text, and exact reason: `/etc/` and `/` (`absolute path`); `scripts/../src/` and `..` (`has a .. segment`); `src/*/`, `src/?/`, `src/[ab]/`, and `src/{a,b}/` (`has a wildcard`); `scripts/daily-report/work` (`not a folder (an entry ends with /)`); `./` (`names the project root`).
    - A3 `parseAllowList`: `a#b/` is kept as the folder `a#b`, and `''` gives the empty list.
    - B1 edit guard (`guard.onToolBefore`, mode `guard`): the list `scripts/daily-report/work/` and no `[~]` task. The writes of `scripts/daily-report/work/report.md` and `scripts/daily-report/work/sub/x.json` resolve (acceptance criterion 1).
    - B2 edit guard, same state: each path of acceptance criterion 2 rejects with the deny text of today (it starts with `measure-guard: no task in the track`).
    - B3 edit guard, the list and no `[~]` track: `scripts/daily-report/work/report.md` resolves, and `src/a.ts` rejects with the text that starts with `measure-guard: no track is in progress` (acceptance criterion 3).
    - B4 edit guard: with a `[~]` task, all paths of B1 and B2 resolve. With the ignored entry `src/*/` as the only line, `src/a/x.ts` rejects. An `apply_patch` call that adds `scripts/daily-report/work/a.md` and `src/a.ts` rejects.
    - C1 `turnProblems`: a snapshot with the list and no `[~]` task. The changed paths `scripts/daily-report/work/r.md` and `src/a.ts` give the problem that lists `src/a.ts` and not the allowed path. The changed path `scripts/daily-report/work/r.md` alone gives no problem.
    - D1 `commitDecision`, mode `strict`, no `[~]` task: the staged path `scripts/daily-report/work/r.md` with the message `chore(jobs): Add the report` gives no deny. The staged paths `scripts/daily-report/work/r.md` and `src/a.ts` give the deny that lists `src/a.ts` and not the allowed path. The staged allowed path with the message `add report` gives the message format deny.
    - E1 `tddDecision`, mode `strict`, a `[~]` task, no Red state: `<root>/scripts/daily-report/work/x.py` gives `null`, and `<root>/src/a.ts` gives the deny.
    - F1 `loadSnapshot`: a `measure/guard-allow` file gives its folders. No file gives the empty list. A folder at `measure/guard-allow` gives the empty list and `parseError` stays `null`. No `tracks.md` with the file gives the folders. A root without `measure/` gives the empty list. A `tracks.md` in no known format gives a `parseError` and the folders.
    - G1 `statusLines`: the folders `scripts/daily-report/work` and `assets/videos` and one ignored line 3 `src/*/` give, directly before the `Guards:` line, `Allow list (measure/guard-allow): scripts/daily-report/work/, assets/videos/` and `  ignored line 3: src/*/ (has a wildcard)`. Only ignored lines give `Allow list (measure/guard-allow): no folders`. The empty list gives no line that starts with `Allow list`.
  - New file `mods/measure-guard/tests/allow.test.ts`. Start from `realFiles()`, and change `- [~] Task 1.4:` to `- [x] Task 1.4:` in the measure-guard plan, as `noTaskFiles()` of `tests/edit-guard.test.ts` does, so that no task is `[~]`. Cases:
    - M1: with `measure/guard-allow` holding `scripts/daily-report/work/`, the mod's tool hook allows a Write of `scripts/daily-report/work/report.md` and denies a Write of `scripts/daily-report/collect.py` and of `scripts/daily-report/work-old/a.md`.
    - M2: with the files of M1, `/measure-status` opens the pane, and the pane has the text `Allow list (measure/guard-allow): scripts/daily-report/work/` (find it as `tests/commands.test.ts` finds a status line).
    - M3: with a file at `measure/guard-allow/x` (so `measure/guard-allow` is a folder) in place of the list, the pane has no text that starts with `Allow list`, and a Write of `scripts/daily-report/work/report.md` is denied.
    - M4: with the list of M1 and a `measure/tracks.md` whose track lines are in no known format (`- [~] Track one` with no link line), the pane shows the line `The Measure files cannot be read: ...` and the line `Allow list (measure/guard-allow): scripts/daily-report/work/`.
  - Add `allow: { folders: [], ignored: [] }` to each `Snapshot` object literal of the existing tests (`plugins/opencode-measure-guard/tests/core.test.ts`, `mods/measure-guard/tests/band.test.ts`, `mods/measure-guard/tests/edit-guard.test.ts`, `mods/measure-guard/tests/commands.test.ts`).
  - Acceptance: `RED_TEST_COMMAND` exits 1. Each failure comes from a missing export or a missing behavior of this track, not from a fixture error. Record the failure count of each suite in the git note.
  - Red evidence (role `mid-red`; `phase_base_sha` `e07934a57234fe12a3ce8e0f6b51ebf5b740e334`, `role_base_sha` `da879b0`):
    - Command: `cd plugins/opencode-measure-guard && bun test tests/allow.test.ts; p=$?; cd ../.. && claude plugin test mods/measure-guard; m=$?; test $p -eq 0 -o $m -eq 0`. It exits 1. Both suites fail.
    - Plugin `tests/allow.test.ts`: 27 tests, `fail=19`, `pass=8`. Fail: A1, A2, A2b, A3, B1, B3 (allow half), B5, C1, D1 (allow half), D1 (the deny does not name the allowed path), E1 (allow half), F1 (6 tests), G1 (2 list tests). Pass (controls): B2, B3 (deny half), B4 (2 tests), D1 (deny half), D1 (message half), E1 (deny half), G1 (empty-list half).
    - Mod suite: 11 files, 91 tests, `fail=3`, `pass=88`. Fail: M1, M2, M4. Pass (control): M3. No old test fails. The file count goes from 10 to 11.
    - Causes: `parse.parseAllowList is not a function`, `guards.isAllowed is not a function`, `snapshot.allow` is `undefined` at each loader return, no `Allow list` status lines, and allowed paths still denied by the edit, commit, and TDD guards.
    - No fixture error: `tempProject`, `withMeasure`, `makeGuard`, `realFiles`, and the fixture files load. No test reads `measure/tracks/guard_allow_list_20261101/`.
    - The four existing test files get `allow: { folders: [], ignored: [] }` in each `Snapshot` literal. No assertion changes.
    - The log is `/home/daniebo/Desktop/measure/measure/runs/guard_allow_list_20261101/mid-red-p1-da879b0.log`. It is not committed.
- [x] Task 1.2: Green: implement Decisions 3 to 12. `b44ac93`
  - Mod: `mods/measure-guard/types/index.d.ts` (Decision 8), `mods/measure-guard/hooks/parse.ts` (`ALLOW_FILE`, `parseAllowList`, the `statusLines` lines of Decision 11), `mods/measure-guard/hooks/guards.ts` (`isAllowed`, and its use in `editDecision`, `turnProblems`, `commitDecision`, and `tddDecision`), and `loadSnapshot` in `mods/measure-guard/hooks/register.tsx` (Decision 10, with `$.fs`).
  - Plugin: copy the three core files (Decision 12), and change `loadSnapshot` in `plugins/opencode-measure-guard/src/snapshot.ts` (Decision 10, with `readFile`).
  - Acceptance: `GREEN_TEST_COMMAND` exits 0. `check-parity.sh` prints `parity: ok`. No deny text changes (`git diff` of the deny strings is empty).
- [x] Task 1.3: Docs: add a section `## Allow list` to `plugins/opencode-measure-guard/README.md` (after `## Guards`) and to `mods/measure-guard/README.md`. Each section gives the file path, the line and entry rules with the five reasons, the matching rule, the four path rules that it changes, the status lines, and the limits (no wildcards, no file entries, no symbolic link resolution, the list is not named in a deny text). Add one line under `## Unreleased` / `### Features` of `CHANGELOG.md`. `ceccfdc`
  - Acceptance: both sections exist. `GREEN_TEST_COMMAND` exits 0.
- [x] Task 1.4: Adversarial: commit `plugins/opencode-measure-guard/tests/allow-adversarial.test.ts` (role `measure-adversarial-testing`). The orchestrator added this task on 2026-11-01, because the guard denies the test file while no task is `[~]`. c59ee94
  - Acceptance: the file is committed, and `PROJECT_TESTS` exits 0.

## Phase 2: Merge, install, and the advantage-pr list [checkpoint: 3b54a4b]

- [x] Task 2.1: In `/home/daniebo/Desktop/measure`, switch to `main` and run `git merge --no-ff feat/guard-allow-list`. Run `bin/install-measure-skill` once, then `bin/install-measure-skill --check`. Run the live check of Decision 13 with a script under `/tmp`. Delete the branch with `git branch -d`. d61d6cc
  - Acceptance: the merge has no conflict. The installer exits 0 and keeps 0 files. `--check` exits 0. `diff -r` of `plugins/opencode-measure-guard/src` and `~/.config/opencode/plugins/opencode-measure-guard/src` shows no difference. In the live check, the installed guard allows a write of `scripts/daily-report/work/x.md` and denies `src/x.md` in a temporary git repository with the list and no `[~]` task.
  - Edge cases: when the merge has a conflict, stop and report it. When the installer exits 2 (it kept a local edit), stop and report the kept paths. When the cron job installed the merge first, the installer prints `No differences`, and the other checks still apply.
- [x] Task 2.2: Write `/home/daniebo/Desktop/advantage-pr/measure/guard-allow` with the text of "advantage-pr list" in the spec. Do not commit it. Run the checks of acceptance criterion 10 with the installed plugin. `8e62ad2` (the plan commit that holds the evidence note; the file stays untracked in advantage-pr)
  - Acceptance: `cmp` of the file and the spec text exits 0. `git -C /home/daniebo/Desktop/advantage-pr status --porcelain -- measure/guard-allow` shows `?? measure/guard-allow`, and no other file of `advantage-pr` changed by this track. The checks of acceptance criterion 10 pass.
