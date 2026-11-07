# Implementation Plan: DSH Measure commit guard: quote-aware `git add` arguments

Track: `dsh_measure_add_quoting_20261107`
Spec: [./spec.md](./spec.md)

A bug-fix track: tokenizer and tests, live evidence, then docs and closeout.
**Each phase checkpoint is pushed to `origin/main` before the next phase starts.**
Gates: `node --test plugins/dsh-measure-guard/tests/*.test.js`,
`plugins/dsh-measure-guard/scripts/check-parity.sh`,
`plugins/opencode-measure-guard/scripts/check-parity.sh`, `bash tests/dsh/run.sh`,
and `bash tests/spec_review_gate/run.sh`.

## Phase 1: The tokenizer and its tests [checkpoint: 0ec5b42]

- [x] Task 1.1: `plugins/dsh-measure-guard/src/commit.js`: add `shellWords(text)` (single quotes literal, double-quote `\"`/`\\` escapes, backslash escape outside quotes, `#` at a word start ends the segment, unterminated quote → `null`) and rewrite `addedPaths` to use it with the current semantics (`-A`/`--all` → all, `-u`/`--update` → trackedOnly, other options skipped, `--` ends options, `.`/`:/`/`*` → all, empty ignored, paths unique); an unterminated quote sets `all` `f263480`
- [x] Task 1.2: Red: add the new `commit.test.js` cases (quoted path with a space, single-quoted path, `--` path starting with `-`, `-u` plus a quoted path, trailing comment, unterminated quote → all, plus the existing cases unchanged); with the old whitespace split the quoted-space case fails `f263480`
- [x] Task 1.3: Green: the suite passes; both parity gates stay ok `f263480`
- [x] Task: Measure - User Manual Verification 'Phase 1: The tokenizer and its tests' (Protocol in workflow.md) `0ec5b42`

## Phase 2: The live evidence [checkpoint: 6b81be2]

- [x] Task 2.1: reinstall (`bin/measure-dsh install --no-skills`), then run the installed `addedPaths` against quoted/escaped `git add` commands and a real scratch `git add "file with space.ts"`; record the output under `measure/runs/dsh_measure_add_quoting_20261107/`, and record `bin/measure-dsh --check --live` PASS with the installed digest `d7977eb`
- [x] Task: Measure - User Manual Verification 'Phase 2: The live evidence' (Protocol in workflow.md) `6b81be2`

## Phase 3: Docs and closeout [checkpoint: 3e7ab3b]

- [x] Task 3.1: plugin README commit-guard limit sentence, `CHANGELOG.md` bug-fix entry, and the resolved `measure/tech-debt.md` regex row; `bash tests/dsh/run.sh` after the docs edits `6cc0346`
- [x] Task 3.2: `metadata.json`, archive the track, update `measure/tracks.md` `6cc0346`
- [x] Task: Measure - User Manual Verification 'Phase 3: Docs and closeout' (Protocol in workflow.md) `3e7ab3b`

> **Follow-up correction (2026-11-07, dsh_measure_add_quoting_followup_20261107):**
> the segment regex was replaced by a whole-command token scan; the residual is
> wrapper scripts and command substitution, and the archived spec carries the
> dated note.
