# Implementation Plan: README uses the heavy-run form

Track: `readme_heavy_run_form_20261123`
Spec: [./spec.md](./spec.md)

**All commits go on chore/readme-heavy-run-form. Push only to origin/chore/readme-heavy-run-form, never to main. Only the PM or Daniel merges.**

Test commands: `bash tests/readme/run.sh`; `bash plugins/opencode-measure-guard/scripts/check-parity.sh`. Run each long local command through `/home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh` with `HEAVY_MIN_AVAIL_MB=1500 HEAVY_PRIORITY=p1`. This wrapper applies to local runs only.

## Phase 1: README uses the heavy-run form (due 2026-11-26)

- [~] Task 1.1 Red: add the contract test `tests/readme/test-readme-heavy-run.sh` and the runner `tests/readme/run.sh` (same shape as `tests/ci/run.sh`; local only, not in CI). The test checks FR-1 through FR-4 and fails before the README edit.
- [ ] Task 1.2 Green: edit `plugins/opencode-measure-guard/README.md` per FR-1 through FR-4. Suites: `bash tests/readme/run.sh` plus `bash plugins/opencode-measure-guard/scripts/check-parity.sh`.
- [ ] Task 1.3 PR and CI: the build session pushes the branch, opens the pull request, and watches check `checks` green. No merge.
- [ ] Task 1.4 Records: record the PR number, the check result, and the diff stat in this plan. Close the README tech-debt row in `measure/tech-debt.md` with the PR number.

## Red evidence (Task 1.1, 2026-11-23)
- `HEAVY_PRIORITY=p1 HEAVY_MIN_AVAIL_MB=1500 /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'bash tests/readme/run.sh'` exits 1: 12 checks, PASS=2, FAIL=10 (bare `bun test`/`bun x tsc`, both heavy-run lines missing, sentence missing, bullet missing, intro lacks shell tools).
- Correct /tmp fixture (spec edit applied in /tmp only) passes 12/12; mutants M1 (bare `bun test`), M2 (sentence removed), M3 (bullet removed), M4 (extra line elsewhere), M5 (prefix stripped) each fail.
