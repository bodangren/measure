# Specification: DSH Measure commit scan fix2

## Overview

The command-boundary rule shipped (a `git` word counts only at a command start)
and its review found it **fails open** for env-prefixed and wrapper commands:

- `FOO=1 git add secret.ts && git commit …`, `env git add …`, and
  `sudo git add …` return no paths, while the guard still reads the commit, so
  the file is neither in the index nor in the added set — a class of commands
  silently stops being checked.
- The ledger that a record task cites mixes several tracks and names the wrong
  track in its header; the record task does not cite a section.
- The follow-up spec's Overview and FR-4 describe the pre-fix record slightly
  inaccurately (Task 4.1 and the verification lines do carry SHAs; the task
  commits and the phase checkpoints are different SHAs).

This track fixes the command-start rule (environment assignments and a small
wrapper set are command prefixes), adds the tests, and corrects the records.

## Functional Requirements

- **FR-1 (command prefixes).** `addedPaths` counts a `git` word at a command
  start: the first word, directly after a separator, or after any run of
  *command prefixes* — an environment assignment (`NAME=value`, matching
  `^[A-Za-z_][A-Za-z0-9_]*=`), or one of `env`, `sudo`, `command`, `exec`,
  `nice`, `time`, including a wrapper's option words and the arguments of
  `-u`/`-n`/`-C`/`--user`/`--nice`/`--chdir`/`--unset` (so `sudo -u root git
  add`, `env -i git add`, and `nice -n 5 git add` count). A preceding ordinary
  word (for example `echo`) still means no path. The rule is documented in the
  function header.
- **FR-2 (the tests).** `commit.test.js` adds: `FOO=1 git add secret.ts && git
  commit …` → `paths: ['secret.ts']`; `env git add a.ts && git commit …` →
  `['a.ts']`; `sudo git add b.ts && git commit …` → `['b.ts']`; `env FOO=1 sudo
  git add c.ts …` → `['c.ts']`; the `echo git add .` negative and the existing
  cases unchanged. The old scan fails the env/wrapper cases.
- **FR-3 (the ledger).** `measure/runs/dsh_measure_midred_records_20261107/closeout.txt`
  gets a track index at the top and a clearly named section per track and run
  (follow-up closeout, mid-red evidence gates, token-scan follow-up gates,
  this track's gates); the archived `dsh_measure_add_quoting_followup_20261107`
  plan's Task 3.4 cites the ledger **and** its "Token-scan follow-up gates"
  section.
- **FR-4 (the spec wording).** The archived `dsh_measure_token_scan_followup_20261107`
  spec's Overview states the exact pre-fix record (Task 4.1 and the verification
  lines carried SHAs; eight task lines lacked one and the checker reported seven
  because it skips the deferred task), and its FR-4 distinguishes the task
  commits from the phase checkpoint SHAs.
- **FR-5 (gates, pushes, closeout).** Node suite, both parity gates, the CLI
  suite, and `bash tests/spec_review_gate/run.sh` pass; each phase checkpoint is
  pushed to `origin/main`; this track is archived closeout-clean except the
  expected `automation-supervisor` manifest FAIL.

## Non-Functional Requirements

- **NFR-1 (scope).** Only `src/commit.js`, its tests, and records/docs change;
  the shared core and the decision logic are untouched; both parity gates stay
  green.
- **NFR-2 (POSIX).** Windows stays out of scope.

## Acceptance Criteria (track level)

- Given the parser, Then `FOO=1 git add x`, `env git add x`, `sudo git add x`,
  and a chained prefix yield the path, while `echo git add .` still yields none;
  the suite passes and the old scan fails the new cases.
- Given the ledger, Then it has a track index and named sections, and the
  archived Task 3.4 cites the right section.
- Given the gates, Then node/parity/CLI/srg pass and each phase checkpoint is
  pushed; the track archives closeout-clean except the manifest FAIL.

## Out of Scope

- Arbitrary wrapper scripts and command substitution (documented residual).
- The commit staged-read race and the heredoc grammar rows.
