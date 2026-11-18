# Implementation Plan: Role-gate heavy-run wrapper with excludes

Track: `role_gate_heavy_run_20261118`
Spec: [./spec.md](./spec.md)

**All commits go on chore/role-gate-heavy-run. Push only to origin/chore/role-gate-heavy-run, never to main. Only the PM or Daniel merges.**

## Phase 1: Role-gate heavy-run wrapper with excludes

- [x] Task 1.1: Add `tests/spec_review_gate/test_role_gate_heavy_run.py` and confirm it fails before the change `507d58b`
- [x] Task 1.2: Add `--runner` and `--exclude` to `role-gate` in `measure_interphase_checks.py` `507d58b`
- [x] Task 1.3: Document the flags in `SKILL.md` and add one `CHANGELOG.md` line `507d58b`
- [~] Task 1.4: Run the suites through `heavy-run.sh`, report the installer check, commit, push, open the PR
