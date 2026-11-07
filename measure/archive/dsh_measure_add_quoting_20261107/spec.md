# Specification: DSH Measure commit guard: quote-aware `git add` arguments

## Overview

The strict commit guard must see every file a commit will take. It reads the
staged files and adds the files the command itself stages, so a commit that also
runs `git add` cannot hide a file. The `git add` arguments are parsed with a
regex that splits on whitespace and strips one leading/trailing quote pair
(`plugins/dsh-measure-guard/src/commit.js`, `addedPaths`), so a quoted path such
as `git add "src/file with space.ts"` is captured as `"src/file` and a path with
several spaces or an inner quote can hide a staged file from the guard — the
under-approximation the tech-debt row names.

This track replaces the whitespace split with a small shell-word tokenizer
(single quotes literal, double-quote escapes, backslash escapes, `#` comment
start, `--` end-of-options) so quoted and escaped paths are captured exactly. An
unterminated quote fails closed by treating the segment as `all` (the
conservative over-approximation the guard already uses for `.`/pathspecs).

## Functional Requirements

- **FR-1 (the tokenizer).** `src/commit.js` gains a private `shellWords(text)`:
  whitespace separates words; a single-quoted span is literal; a double-quoted
  span takes `\"` and `\\` escapes; a backslash outside quotes escapes the next
  character; a `#` that starts a word ends the segment (comment); an unterminated
  quote returns `null`.
- **FR-2 (the exact paths).** `addedPaths(command)` tokenizes every `git add`
  segment and preserves the current semantics: `-A`/`--all` sets `all`,
  `-u`/`--update` sets `trackedOnly`, other `-…` options are skipped, `--` makes
  the following words paths (even when they start with `-`), `.`/a `:/` pathspec/
  a `*` wildcard sets `all`, empty words are ignored, and duplicate paths are
  unique. An unterminated quote sets `all` (fail closed). The returned shape stays
  `{ all, trackedOnly, paths }`.
- **FR-3 (the tests).** `plugins/dsh-measure-guard/tests/commit.test.js` gains:
  `git add "src/a b.ts" && git commit …` → `paths: ['src/a b.ts']`; a single-quoted
  path; a `--`-separated path starting with `-`; `-u` plus a quoted path; a
  trailing comment ignored; an unterminated quote → `all: true`; the existing
  `.`/`-A`/`-u`/plain cases unchanged.
- **FR-4 (records).** The plugin README's commit-guard limit sentence is updated
  (a shell-word tokenizer, quoted paths exact, unterminated quote conservative);
  `measure/tech-debt.md`'s regex row resolves; the CHANGELOG has a bug-fix entry.

## Non-Functional Requirements

- **NFR-1 (scope).** Only `src/commit.js` and its tests/docs change; the guard
  decision logic and both shared-core files are untouched, and both parity gates
  stay green.
- **NFR-2 (POSIX).** Windows stays out of scope.

## Acceptance Criteria (track level)

- Given the plugin package, Then `node --test plugins/dsh-measure-guard/tests/*.test.js`
  passes with the new tokenizer cases.
- Given the live plugin, Then a command with a quoted, space-containing staged
  path yields that exact path from the installed `addedPaths` (evidence recorded),
  and `--check --live` PASSes.
- Given both parity gates, Then both print `parity: ok`; `bash tests/dsh/run.sh`
  and `bash tests/spec_review_gate/run.sh` pass.
- Given the docs, Then the README limit sentence, CHANGELOG entry, and resolved
  tech-debt row are updated.

## Out of Scope

- Full shell parsing (subshells, substitutions, wrapper scripts); the tokenizer is
  a bounded improvement, documented as such.
- The commit staged-read race and the heredoc grammar rows.
