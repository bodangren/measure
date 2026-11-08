# Specification: DSH Measure commit global detection

## Overview

The strict commit guard decides whether a command is a commit through the shared
core's `parseCommitCommand`. Its detector only allows `-C <dir>` and `-c <value>` between
`git` and `commit`/`add`, so any other documented git global option makes the parser
return `null` and the strict guards skip the command entirely — measured on the current
adapter: `git --no-pager commit -m "feat(app): Add"` is not seen as a commit, so the
message-format rule and the no-task rule do not run. `git -p commit`, `git --bare commit`,
`git --literal-pathspecs commit`, `git --git-dir dir commit`, `git --git-dir=dir commit`,
and the attached `-C/tmp` form are the same. That is a fail-open bypass, and it lives in
the core shared by the Claude mod, the OpenCode plugin, and the DSH adapter.

This track makes the detector recognize the documented git global-option run before the
subcommand, in the shared core (so all three adapters get it and the parity gates hold
the copies together), and uses the same run in the DSH adapter's `-a` detector. The
option table is bounded: the documented options only, and a form outside it keeps the
old (skip) behavior rather than guessing.

## Functional Requirements

- **FR-1 (core detector).** `mods/measure-guard/hooks/guards.ts`: `GIT_COMMIT` and
  `GIT_ADD` allow the documented git global options between `git` and the subcommand —
  `-C <dir>` and `-c <value>` (separate and attached), `--git-dir`/`--work-tree`/
  `--namespace`/`--super-prefix`/`--config-env`/`--attr-source` (separate and `=` forms),
  the short flags, and the documented long flags (`--paginate`, `--no-pager`, `--bare`,
  `--no-replace-objects`, `--literal-pathspecs`, `--glob-pathspecs`,
  `--noglob-pathspecs`, `--icase-pathspecs`, `--no-optional-locks`, `--version`,
  `--help`, `--html-path`, `--man-path`, `--info-path`). A `git` command whose
  subcommand is something else (for example `git log`) still does not match.
- **FR-2 (copies).** The DSH and OpenCode core copies stay byte-identical to the mod's
  after their documented transforms; both parity gates pass.
- **FR-3 (`-a` detector).** `plugins/dsh-measure-guard/src/commit.js` `commitTakesAll`
  uses the same option run, so `git --no-pager commit -a -m …` still contributes the
  tracked changes.
- **FR-4 (tests).** `commit.test.js` covers each recognized form through
  `parseCommitCommand`, a non-commit `git log` control, a strict-mode no-task deny
  through `git --no-pager commit`, and the `-a` detection through a global option.
- **FR-5 (records).** The guard README's commit bullet, `contracts.md` (the commit
  detector note), tech-debt row 45, and `CHANGELOG.md` record the closure; the installed
  plugin is reloaded, the live check passes, and the gates are green.

## Non-Functional Requirements

- **NFR-1 (bounded).** One documented option table; no shell parser. A form outside it
  keeps the old behavior.
- **NFR-2 (no regression).** Heredoc/`-m`/`-F` message parsing, `-a` detection, and the
  `parseCommitCommand` return shape are unchanged.

## Acceptance Criteria (track level)

- Given `git --no-pager commit -m "feat(app): Add"`, Then `parseCommitCommand` returns the
  message and the strict guard runs (a no-task commit of a source file is denied).
- Given `git -p commit`, `git --bare commit`, `git --git-dir=dir commit`,
  `git --literal-pathspecs commit`, `git -C/tmp commit`, and `git -c k=v commit`, Then
  each is detected the same way.
- Given `git log --oneline`, Then it is still not a commit.
- Given the gates, Then node, both parity gates, srg 11/11, and CLI 13/13 pass, the live
  check passes, and the checkpoint is pushed.
