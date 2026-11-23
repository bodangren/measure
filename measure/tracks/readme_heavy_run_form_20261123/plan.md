# Implementation Plan: README uses the heavy-run form

Track: `readme_heavy_run_form_20261123`
Spec: [./spec.md](./spec.md)

**All commits go on chore/readme-heavy-run-form. Push only to origin/chore/readme-heavy-run-form, never to main. Only the PM or Daniel merges.**

Test commands: `bash tests/readme/run.sh`; `bash plugins/opencode-measure-guard/scripts/check-parity.sh`. Run each long local command through `/home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh` with `HEAVY_MIN_AVAIL_MB=1500 HEAVY_PRIORITY=p1`. This wrapper applies to local runs only.

## Phase 1: README uses the heavy-run form (due 2026-11-26)

- [x] Task 1.1 Red: add the contract test `tests/readme/test-readme-heavy-run.sh` and the runner `tests/readme/run.sh` (same shape as `tests/ci/run.sh`; local only, not in CI). The test checks FR-1 through FR-4 and fails before the README edit. — 74717f1
- [x] Task 1.2 Green: edit `plugins/opencode-measure-guard/README.md` per FR-1 through FR-4. Suites: `bash tests/readme/run.sh` plus `bash plugins/opencode-measure-guard/scripts/check-parity.sh`. — 20ecf85
- [x] Task 1.3 PR and CI: the build session pushes the branch, opens the pull request, and watches check `checks` green. No merge.
- [x] Task 1.4 Records: record the PR number, the check result, and the diff stat in this plan. Close the README tech-debt row in `measure/tech-debt.md` with the PR number.

## Red evidence (Task 1.1, 2026-11-23)
- `HEAVY_PRIORITY=p1 HEAVY_MIN_AVAIL_MB=1500 /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'bash tests/readme/run.sh'` exits 1: 12 checks, PASS=2, FAIL=10 (bare `bun test`/`bun x tsc`, both heavy-run lines missing, sentence missing, bullet missing, intro lacks shell tools).
- Correct /tmp fixture (spec edit applied in /tmp only) passes 12/12; mutants M1 (bare `bun test`), M2 (sentence removed), M3 (bullet removed), M4 (extra line elsewhere), M5 (prefix stripped) each fail.

## Green evidence (Task 1.2, 2026-11-23)
- Local part, run with Task 1.2 marked `[~]`: `HEAVY_PRIORITY=p1 HEAVY_MIN_AVAIL_MB=1500 /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'bash tests/readme/run.sh'` exits 0: 12 checks, PASS=12, FAIL=0. The same wrapper with `-c 'bash plugins/opencode-measure-guard/scripts/check-parity.sh'` prints `parity: ok` and exits 0.
- Implementation commit 20ecf85 edits only `plugins/opencode-measure-guard/README.md`: the two Checks commands in heavy-run form, the new sentence after the code block, the Heavy-run guard bullet after the Edit guard bullet, and one clause of the Guards intro. No other README line changed.
- Task 1.3 and Task 1.4 are closed in the records round; see the Records evidence section below.

## Records evidence (Tasks 1.3 and 1.4, 2026-11-23)
- Task 1.3 (orchestrator verified): branch `chore/readme-heavy-run-form` pushed at head f5d2806; PR #47 (https://github.com/bodangren/measure/pull/47) is open; check `checks` passed on run https://github.com/bodangren/measure/actions/runs/45126292036 (6m15s); origin/main had not moved beyond cd3c41b; nothing merged.
- Task 1.4 (orchestrator verified): Red 74717f1 ran the contract test that failed first and later passed after the README edit 20ecf85; parity check ok. PR number and check result are recorded above; the diff stat is `git diff --stat 6cbbe7b..HEAD` = 4 files changed, 321 insertions(+), 5 deletions(-). The README tech-debt row in `measure/tech-debt.md` closes with PR #47 and commit 20ecf85.
