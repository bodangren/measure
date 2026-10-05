# Install record (Task 3.3)

Date: 2026-10-05. Machine: the user's workstation. The branch `chore/skill-distribution` (Phases 1-3) was merged into `main` (`96feda1`) first, so that the installer and `bin/install-targets.tsv` are on `main`.

## Acceptance criteria

- Before the first install, `--check` shows the user each difference. (User decision: merge, adopt, cron.)
- After `--adopt`, `--check` exits with 0.
- `~/.claude/skills/measure/SKILL.md` and `~/.agents/skills/measure/SKILL.md` have the "Continuous improvement" section.
- `--cron install` adds 1 line and keeps all other crontab lines. A second run changes nothing.

## Commands and output

```
$ bin/install-measure-skill --check
unstamped ~/.claude/skills/measure/references/review.md
unstamped ~/.claude/skills/measure/SKILL.md
unstamped ~/.agents/skills/measure/SKILL.md
exit=1

$ bin/install-measure-skill --adopt
installed ~/.claude/skills/measure from main (96feda1)
installed ~/.agents/skills/measure from main (96feda1)
installed ~/.agents/skills/measure-orchestrator from main (96feda1)
installed ~/.claude/skills/build-graph from main (96feda1)
installed ~/.agents/skills/build-graph from main (96feda1)
installed ~/.agents/agents from main (96feda1)
written=3 removed=0 kept=0
exit=0

$ bin/install-measure-skill --check
No differences: every target matches main (96feda1).
exit=0
$ bin/install-measure-skill --cron install
Installed the cron line: 17 * * * * /home/daniebo/Desktop/measure/bin/install-measure-skill >/dev/null 2>>"$HOME/.local/state/measure/install.log" # measure-skill-install
exit=0
$ bin/install-measure-skill --cron install   (second time)
The cron line is already installed.
exit=0
```

## Crontab: diff before and after

The 8 lines that were there before (a `PATH` line, 3 jobs, and their comments) did not change.

```
8a9
> 17 * * * * /home/daniebo/Desktop/measure/bin/install-measure-skill >/dev/null 2>>"$HOME/.local/state/measure/install.log" # measure-skill-install
```

## Checks

- `grep -c '^## Continuous improvement'`: 1 in `~/.claude/skills/measure/SKILL.md` and 1 in `~/.agents/skills/measure/SKILL.md`.
- Log `~/.local/state/measure/install.log`:

```
2026-10-05T00:21:30Z ref=main commit=96feda1 written=3 removed=0 kept=0 exit=0
```

- The 13 role files in `~/.agents/agents` were already equal, so the install did not write them, and `~/Desktop/pi-measure-harness/agents/` did not change.
