# Specification: DSH Measure commit wrapper closure

## Overview

The strict commit guard's in-command `git add` scan understands a nested shell only when
it carries the command string (`bash -c "…"`, `eval "…"`). A nested shell that runs a
*script file* — `bash scripts/add.sh`, `sh -e add.sh` — and a directly invoked script
(`./scripts/add.sh`, `/tmp/add.sh`, `source add.sh`) are invisible to it, so a script that
stages a file and then commits can hide the add from the no-task rule. That is the last
"wrapper script" residual of the commit-guard row; the bounded parser cannot read the
script, so the honest behavior is to fail closed: count every working-tree change.

This track makes a nested shell with a non-option argument (a script path) and a
command-position script token (a `.sh` file or a `./`/`../` path) fail closed, while
`bash -c`/`eval` string scanning, options, and ordinary commits keep their behavior.
Shell functions defined inline stay the documented residual (their body is not a command
position for the bounded tokenizer).

## Functional Requirements

- **FR-1 (nested shell script).** In `addedPaths`, a `bash`/`sh`/`zsh` run that carries no
  `-c` command string but has a remaining non-option argument (the script path) sets
  `all` (every working-tree change counts).
- **FR-2 (direct script and source).** A command-position token that ends in `.sh` or
  starts with `./`/`../` sets `all`, and so does a `source`/`.` command with a file
  argument, because the script cannot be read by the bounded parser.
- **FR-3 (unchanged).** `bash -c "git add x"`, `bash -lc 'git add x'`, `eval "git add x"`,
  a plain `bash` with no argument, quoted text, and ordinary `git add` scanning keep their
  present results.
- **FR-4 (tests).** `commit.test.js` covers the wrapper forms (all fail closed), the
  unchanged forms (paths), and the negatives (`bash` alone, `git status`).
- **FR-5 (records).** The guard README's commit bullet states the fail-closed wrapper
  behavior; the commit-guard tech-debt row records the closure (shell functions remain);
  `CHANGELOG.md` records it; the installed plugin is reloaded and the live check passes.
- **FR-6 (verification).** node suite green with the new cases, parity/srg/CLI green; the
  track is archived with a manifest-only closeout FAIL.

## Non-Functional Requirements

- **NFR-1 (fail closed, not open).** An unreadable script over-approximates (the deny lists
  more paths); it never silently misses an add.
- **NFR-2 (bounded).** One branch per form; no script reading, no shell parser.

## Acceptance Criteria (track level)

- Given `bash scripts/add.sh && git commit …`, Then `addedPaths` reports `all: true`.
- Given `./scripts/add.sh && git commit …`, `source add.sh && git commit …`, Then `all: true`.
- Given `bash -c "git add src/app.js" && git commit …`, Then the path list is unchanged.
