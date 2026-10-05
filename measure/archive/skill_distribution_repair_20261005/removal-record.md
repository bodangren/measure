# Supervisor removal record (Task 4.2)

Date: 2026-10-05. The user approved the list before any change. Each commit is on the branch that was checked out, contains only the listed paths (`git commit --only`), and is not pushed. Commit message: `chore(measure): remove the superseded automation-supervisor.py` (lowercase subject for the commitlint hook in the Reading Advantage checkouts).

## Results

| Checkout | Branch | Result | Paths |
| --- | --- | --- | --- |
| `advantage-games` | `master` | committed 3a8e9e3 | `AGENTS.md`, `measure/automation-supervisor.py` |
| `advantage-games-template` | `main` | committed 4991120 | `measure/automation-supervisor.py` |
| `advantage-pr` | `master` | committed 7daab91 | `AGENTS.md`, `measure/automation-supervisor.py` |
| `ai-image-generator` | `master` | committed 1fcfcd4 | `AGENTS.md`, `measure/automation-supervisor.py` |
| `Business-Operations` | `main` | committed 4523650 | `AGENTS.md`, `measure/automation-supervisor.py` |
| `bus-math-v2` | `main` | committed 2a1cbcb (untracked file deleted) | `AGENTS.md` |
| `dashboard` | `master` | committed 374f616 | `AGENTS.md`, `measure/automation-supervisor.py` |
| `fleet-commander` | `master` | skipped (user decision: a Fleet test asserts the file) | — |
| `hdkwa-danielson` | `main` | committed 2f85ed9 | `AGENTS.md`, `measure/automation-supervisor.py` |
| `ka-math-companion` | `main` | deleted, no commit (untracked file deleted; AGENTS.md has other uncommitted changes: remove its supervisor rule by hand) | — |
| `manim-videos` | `main` | committed 14833f4 | `measure/automation-supervisor.py` |
| `mastery-advantage` | `main` | committed ba3e0a3 | `measure/automation-supervisor.py` |
| `mediarr` | `main` | committed ecd2f29 | `measure/automation-supervisor.md`, `measure/automation-supervisor.py` |
| `pi-measure-harness` | `master` | committed 7181e12 | `measure/automation-supervisor.py` |
| `pixel-art-benchmark` | `main` | committed 1cd66ff | `AGENTS.md`, `measure/automation-supervisor.py` |
| `pixel-art-generator` | `main` | committed 576562f | `AGENTS.md`, `measure/automation-supervisor.py` |
| `ra-math-advantage` | `master` | committed f19620f | `AGENTS.md`, `measure/automation-supervisor.py` |
| `reading-advantage-llm-benchmark` | `fc/task-frontend_task_domain_expansion_20260514-task-1-frontend-task-domain-expansion-20260514-` | committed 0991af0 | `AGENTS.md`, `measure/automation-supervisor.py` |
| `reading-advantage-monorepo-3d` | `apk3d-games-port` | committed 7088a6c | `AGENTS.md`, `measure/automation-supervisor.py` |
| `reading-advantage-monorepo` | `apk3d-port` | committed 0b93dae | `AGENTS.md`, `measure/automation-supervisor.py` |
| `repo-graph` | `master` | committed 5ed54c5 | `AGENTS.md`, `measure/automation-supervisor.py` |
| `verbal` | `master` | committed 8806001 | `AGENTS.md`, `measure/automation-supervisor.py` |
| `Workbooks` | `master` | committed 4b3e8d2 | `AGENTS.md`, `measure/automation-supervisor.py` |
| `rama-worktrees/integration` | `primary-parity-integration` | committed 49d6aea | `AGENTS.md`, `measure/automation-supervisor.py` |
| `rama-worktrees/lane-a` | `primary/lane-a-cutover-blockers` | committed 3132425 | `AGENTS.md`, `measure/automation-supervisor.py` |
| `rama-worktrees/lane-b` | `primary/lane-b-student-login` | committed 299a972 | `AGENTS.md`, `measure/automation-supervisor.py` |
| `rama-worktrees/lane-c` | `primary/lane-c-ux-rework` | committed f3a1e5e | `AGENTS.md`, `measure/automation-supervisor.py` |
| `rama-worktrees/lane-m` | `primary/lane-m-legacy-migration` | committed 8d10fc6 | `AGENTS.md`, `measure/automation-supervisor.py` |

## Outside git

- `~/.local/bin/measure-supervisor` (a 98 KB copy of the supervisor): deleted. `measure-supervisor` is no longer on `PATH`.

## Left on purpose

- `fleet-commander/measure/automation-supervisor.py`: skipped (user decision). `pivot/src/orchestrator/guards/noSecondScheduler.test.ts:182` asserts that the file exists, so a Fleet track must change that test first.
- `ka-math-companion/AGENTS.md` line 13 still has `Do NOT modify measure/automation-supervisor.py. …`. The file has other uncommitted changes, so the user removes the line by hand. The untracked supervisor copy is deleted.
- The 201 `automation-supervisor-*-manifest.json` files in track archives stay as history.

## Checks

- Each commit has only `measure/automation-supervisor.py`, `measure/automation-supervisor.md` (mediarr), and `AGENTS.md`.
- `ls ~/Desktop/*/measure/automation-supervisor.py ~/Desktop/rama-worktrees/*/measure/automation-supervisor.py` lists only `fleet-commander`.
