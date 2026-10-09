# Tech Debt Registry

> This file is curated working memory, not an append-only log. Keep it at or below **50 lines**.
> Remove or summarize resolved items when they no longer need to influence near-term planning.
>
> **Severity:** `Critical` | `High` | `Medium` | `Low`
> **Status:** `Open` | `Resolved`

| Date | Track | Item | Severity | Status | Notes |
|------|-------|------|----------|--------|-------|
| 2026-05-25 | scrum_tracks_20260525 | `templates/` directory does not exist in this repo; if reintroduced, copies of `workflow.md`, `lessons-learned.md`, `tech-debt.md` must be re-synced with `claude-skills/measure/assets/` | Low | Resolved | Several workflow docs and the lessons_learned spec assume a `templates/` mirror of `claude-skills/measure/assets/`. Currently only `claude-skills/` exists, so parity instructions are no-ops. Either remove the parity language or restore the `templates/` dir. Resolved 2026-10-05 (skill_distribution_repair_20261005): `workflow.md` and `tech-stack.md` no longer name `templates/`. |
| 2026-10-04 | measure_guard_20261004 | `measure/automation-supervisor.py` regex `^- \[([~xb])\] (.+)` ignores `[ ]` tasks, so the supervisor counts pending tasks as closed | Medium | Resolved | Found in the measure-guard design. Resolved 2026-10-05 (skill_distribution_repair_20261005): the supervisor was removed from this repository and 26 other checkouts. |
| 2026-10-04 | measure_guard_20261004 | measure-guard edit guard does not see file writes through Bash (`sed -i`, `cat >`) | Low | Open | The end-of-turn check is the backstop. A Bash pattern check is possible but incomplete. |
| 2026-10-04 | measure_guard_20261004 | measure-guard end-of-turn check assumes the session root is the repository root, and does not report a file that was dirty before the turn | Low | Open | Porcelain paths are relative to the repository root. |
| 2026-10-04 | measure_guard_20261004 | measure-guard TDD and commit guards use name rules (test files, test commands, commit message forms) | Low | Open | They block some valid work and miss some tests. `/measure-off` is the bypass. |
| 2026-10-09 | track_sets_20261009 | `new-track` §2.5 step 4 writes only the Measure metadata schema. A project whose doctor requires more keys (advantage-forge: `workstream`, `retrospective`, `evidence`, `dependencies`) fails until someone adds them. The track set workflow copies the keys (`new-track-set.md` §2.9 step 4 item 5); a single track does not | Low | Open | Exit: `new-track` applies the same rule. |
| 2026-10-05 | measure_guard_20261004 | `mods/measure-guard/tests/fixtures/sync-real.sh` reads the benchmarking and measure-guard plans from `measure/tracks/`, but both tracks are now in `measure/archive/` | Low | Open | `real.ts` is a frozen snapshot, so the tests pass. Fix the paths before the next fixture refresh. |
