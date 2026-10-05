# Contract: `bin/install-measure-skill`

The tests in Phase 2 and the code in Phase 3 follow this contract. A change to the contract needs a spec change first.

## Acceptance criteria (Task 1.3)

- The contract defines the command line, the targets file, the stamp file, each decision for each file, the exit codes, the log line, and the cron line.
- Each rule maps to a functional requirement (FR) in `spec.md`.
- `tech-stack.md` has a Tooling Exceptions row for this track before the first test.

## Command line

```
bin/install-measure-skill [--ref <ref>] [--check | --adopt] 
bin/install-measure-skill --cron install | --cron remove
```

| Option | Meaning | FR |
| --- | --- | --- |
| (none) | Install every bundle in the targets file from the ref. | FR-1 |
| `--ref <ref>` | The git ref to install from. Default: `main`. | FR-1 |
| `--check` | Write nothing. Report each file that is missing, different, locally edited, or stale. | FR-7 |
| `--adopt` | First install only: in a target that has no stamp file, overwrite each different file. | FR-5 |
| `--cron install` | Add the cron line. If it exists, do nothing. | FR-8 |
| `--cron remove` | Remove the cron line. If it does not exist, do nothing. | FR-8 |

The script finds the repository from its own path (`<script folder>/..`). It reads the bundles and the targets file from the ref with `git archive` and `git show`, never from the working tree. The working tree can be on any branch.

## Targets file

Path in the repository: `bin/install-targets.tsv`. The installer reads it from the ref.

```
# bundle<TAB>target<TAB>files
skills/measure	~/.claude/skills/measure	*
skills/measure	~/.agents/skills/measure	*
skills/measure-orchestrator	~/.agents/skills/measure-orchestrator	*
skills/build-graph	~/.claude/skills/build-graph	*
skills/build-graph	~/.agents/skills/build-graph	*
agents	~/.agents/agents	measure-*.md
```

- A line has 3 fields, separated by a tab. Lines that start with `#` and empty lines are ignored.
- `~` at the start of a target is the value of `HOME`.
- `files` is a bash pattern on the path relative to the bundle. `*` also matches `/`.
- Each target folder has 1 bundle only. A second line for the same target is an error (exit 3).
- If the parent of a target folder does not exist, the installer skips that target with a note. If only the target folder is missing, the installer creates it. (FR-2)
- `~/.agents/agents` shares each `measure-*.md` file (hard link) with `~/Desktop/pi-measure-harness/agents/`. The in-place write keeps the link, so an install also changes that working tree. This is intended: this repository is the source (spec decisions).
- Not a target: `claude-skills/measure` in the repository (git tracks it, and the Definition of Done keeps it equal to `skills/measure`), and `~/.config/opencode/agents` (another format, see `spec.md`).

## Stamp file

Each target folder gets `.measure-install` after each install that changes the folder or finds it equal. (FR-4)

```
# measure install stamp v1
ref main
commit 2892fc5c3f0e...   (40 characters)
installed_at 2026-10-05T07:17:00Z
bundle skills/measure
file 3b1f...e9  SKILL.md
file 77a0...c2  references/review.md
```

- `file` lines have the SHA-256 of the installed content and the path relative to the target folder, separated by 2 spaces (the `sha256sum` format).
- The stamp lists only the files that the installer wrote or found equal.

## Decision for each file

The source is the file in the ref. The stamp hash is the hash in `.measure-install`, if one exists.

| Case | Install | `--check` | FR |
| --- | --- | --- | --- |
| Target file is missing | Write it. | `missing` | FR-1 |
| Target equals source | Do nothing. | (equal) | FR-1 |
| Target differs; target equals stamp hash | Overwrite in place. | `different` | FR-3 |
| Target differs; stamp has another hash | Keep it. Warn. Exit 2 at the end. | `local-edit` | FR-5 |
| Target differs; no stamp file in the target | Keep it. Warn. Exit 2. With `--adopt`: overwrite in place. | `unstamped` | FR-5 |
| In stamp, not in source; target equals stamp hash | Remove it. | `stale` | FR-6 |
| In stamp, not in source; target differs from stamp | Keep it. Warn. Exit 2. | `local-edit` | FR-5, FR-6 |
| In target, not in stamp, not in source | Never touch it. | (not reported) | FR-6 |

- **In place:** write with `cat source > target`, so the inode and every hard link stay. The mode of the target is set to the mode of the source (644 or 755). (FR-3)
- A file that the installer keeps is not written to the new stamp with a new hash. The stamp keeps its old hash, so the next run gives the same result.

## Exit codes

| Code | Meaning |
| --- | --- |
| 0 | Success. With `--check`: no differences. |
| 1 | `--check` only: at least 1 difference. |
| 2 | Install: at least 1 file was kept because of a local edit or a missing stamp. All other files are installed. |
| 3 | Error: not a git repository, an unknown ref, a bad targets file, or a bad option. Nothing is written. |

## Log

Each run, except `--check`, appends 1 line to `~/.local/state/measure/install.log`, and 1 more line for each warning. (FR-9)

```
2026-10-05T07:17:00Z ref=main commit=2892fc5 written=3 removed=0 kept=1 exit=2
2026-10-05T07:17:00Z warn local-edit ~/.agents/skills/measure/references/review.md
```

## Cron line

```
17 * * * * /home/<user>/Desktop/measure/bin/install-measure-skill >/dev/null 2>>$HOME/.local/state/measure/install.log # measure-skill-install
```

- The comment `# measure-skill-install` identifies the line. `--cron install` and `--cron remove` change only that line and keep all other lines. Running either twice gives the same crontab. (FR-8)
- The path is the absolute path of the script when `--cron install` runs. If the repository moves, run `--cron install` again.
- The script uses only `/usr/bin` and `/bin` tools (`git`, `tar`, `sha256sum`, `crontab`, `mktemp`, `date`), so the short cron `PATH` is sufficient.
- The script calls each tool by name through `PATH`, never by an absolute path. The tests put a fake `crontab` first on `PATH`, so a test never changes the real crontab.
- All paths under `~` come from `HOME`. The tests set `HOME` to a temporary folder.
