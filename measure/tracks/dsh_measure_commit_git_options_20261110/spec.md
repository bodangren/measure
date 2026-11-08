# Specification: DSH Measure commit global options

## Overview

The strict commit guard reads the paths an in-command `git add`/`git stage` contributes by
tokenizing the command and looking for a `git` word at a command position followed by the
subcommand. Its pre-subcommand scan understands only `-C <dir>`, so any other git global
option hides the add completely — measured on the current adapter: `git -c k=v add f`,
`git --no-pager add f`, `git --git-dir dir add f`, `git --git-dir=dir add f`,
`git -p add f`, and `git --literal-pathspecs add f` all return no paths, so a file staged
in the same command is invisible to the no-task commit rule (the pre-command
`git diff --cached` cannot see it either). That is an under-approximation: a commit that
combines a hidden `git add` with `git commit` can pass the check with no task in progress.

This track closes the gap with a bounded option table: known git global options are
skipped with the right arity (separate or attached argument, or none), so the subcommand
is still recognized; an unknown global option fails closed (every working-tree change
counts) instead of silently missing the add. The substitution scanner gets the same
option run. No shell parser: one table of the documented options.

## Functional Requirements

- **FR-1 (option table).** `addedPaths` recognizes, between a command-position `git` and
  the `add`/`stage` subcommand: `-C <dir>`, `-c <name=value>`, `--git-dir <dir>` and
  `--git-dir=<dir>`, `--work-tree`, `--namespace`, `--super-prefix`, `--config-env`,
  `--attr-source`, `--exec-path[=]`, the attached forms `-C<dir>` and `-c<name=value>`,
  and the flag options `-p`, `--paginate`, `--no-pager`, `--bare`, `--no-replace-objects`,
  `--literal-pathspecs`, `--glob-pathspecs`, `--noglob-pathspecs`,
  `--icase-pathspecs`, `--no-optional-locks`, `--version`, `--help`, `-h`,
  `--html-path`, `--man-path`, `--info-path`. Every one keeps the add visible.
- **FR-2 (unknown option fails closed).** A pre-subcommand option outside that table
  cannot be given an arity, so the scan sets `added.all` (every working-tree change is
  considered) instead of returning an empty path set.
- **FR-3 (substitution).** The command-substitution scanner recognizes the same option
  run, so a `$(git -c k=v add f)` still fails closed to the full working-tree set.
- **FR-4 (tests).** `commit.test.js` covers each recognized form, the unknown-option
  fail-closed case, an ordinary `git commit` with no add, and the substitution form.
- **FR-5 (records).** The guard README's commit bullet, tech-debt row 45, and
  `CHANGELOG.md` record the closure; the installed plugin is reloaded and the live check
  passes; the gates are green.

## Non-Functional Requirements

- **NFR-1 (bounded).** One static option table; no attempt to model every git option.
  An option not in the table fails closed, never open.
- **NFR-2 (no behavior change elsewhere).** `-C` handling, `--` semantics, quoted and
  escaped paths, nested shells, and `eval` keep their present behavior.

## Acceptance Criteria (track level)

- Given `git -c k=v add secret && git commit …`, Then `secret` is in the added paths.
- Given `git --no-pager add secret && git commit …` (and the other listed forms), Then
  the path is contributed.
- Given `git --future-option add secret && git commit …`, Then the scan fails closed and
  the commit check considers every working-tree change.
- Given the gates, Then node 324+ pass, both parity gates ok, srg 11/11, CLI 13/13, the
  live check passes, and the checkpoint is pushed.
