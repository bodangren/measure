# Specification: DSH Measure commit guard: token-scan `git add` and record corrections

## Overview

The quote-aware `git add` parser shipped (Phase 1 of
`dsh_measure_add_quoting_20261107`), but its review found that the segment
extraction still uses a regex that ends the captured substring at `;`, `&`, `|`,
or newline before the tokenizer ever runs. So:

- a backslash-newline continuation (`git add measure/a.ts \` newline `src/new.ts
  && git commit …`) captures only the first path and leaves an untracked file
  invisible to the strict commit guard — the fail-closed rule never fires;
- a quoted separator is conservative rather than exact (`git add "a;b.ts"` sets
  `all`);
- the comment test is not a real command, the evidence does not name the
  installed module path or invocation, the Overview and FR-2 of the shipped
  track describe the old baseline inaccurately, and its tasks carry no SHAs.

Separately, the mid-red evidence/record track's review (F1–F7) found its ledger
under `measure/runs/` is gitignored and untracked, the archived record track is
not closeout-clean (tasks without SHAs/`[x]`, `actual_tasks` 7 vs 8), the
closeout-clean definition omits the "every non-deferred task `[x]`" rule, and the
Overview's F4 wording overstates what was missing.

This track fixes the extraction with a whole-command token scan and reconciles
both records. No shared core change.

## Functional Requirements

- **FR-1 (the whole-command token scan).** `src/commit.js` replaces
  `GIT_ADD_SEGMENT` + `shellWords(substring)` with a single `shellTokens(command)`
  scan: whitespace separates words; `;`, newline, `&`/`&&`, `|`/`||` are
  separators; single quotes are literal; double quotes take `\"`/`\\`; a
  backslash-newline is a line continuation (dropped); a backslash escapes the
  next character; a `#` at a word start comments to end of line (the newline is a
  separator); an unterminated quote returns `null`.
- **FR-2 (the exact paths).** `addedPaths(command)` walks the tokens: for every
  `git` [-C `<dir>`]* `add` run it collects the following words until a
  separator and applies the current semantics (`-A`/`--all` → all, `-u`/`--update`
  → trackedOnly, other options skipped, `--` ends options, `.`/`:/`/`*` → all,
  empty ignored, paths unique). A quoted separator is part of the path
  (`git add "a;b.ts"` → `paths: ['a;b.ts']`); an unterminated quote sets `all`.
  The returned shape stays `{ all, trackedOnly, paths }`.
- **FR-3 (the tests).** `commit.test.js` adds: a backslash-newline continuation
  (both the tracked and the untracked path are present), a quoted `;` path
  (`paths: ['a;b.ts']`), a real trailing-comment command (`git add src/a.ts #
  note`), a quoted `*` stays conservative (`all: true`), an unterminated quote
  (`all: true`), and the existing `.`/`-A`/`-u`/escaped cases unchanged.
- **FR-4 (the record corrections).** The shipped quoting track's spec/plan are
  corrected: the Overview no longer says the old code captured `"src/file`; FR-2
  records that `--` handling is new, not preserved; its Overview/FR-2 no longer
  claim quoted separators are exact (they were conservative); the installed
  evidence names the module path
  (`~/.dsh/profiles/web/plugins/dsh-measure-guard/src/commit.js`) and the exact
  `node --experimental-strip-types --input-type=module -e` invocation; each task
  line carries its 7-character commit SHA; the README/tech-debt residuals name
  only wrapper scripts and command substitution (quoted separators are exact and
  continuations are handled after this track).
- **FR-5 (the mid-red records).** The evidence review's F1–F7 are reconciled: the
  ledger is force-added and tracked (like the repository's other run evidence);
  the archived record track's plan has every task `[x]` with its SHA and its
  `metadata.json` records 8 tasks; the closeout-clean definition includes "every
  non-deferred task `[x]`" and the active-registry check; the archived record
  track's Overview F4 wording is corrected; the evidence track's own tasks carry
  SHAs; the evidence track gains its `spec-review.md` with F1–F7 verbatim and one
  disposition each, linked from its index.
- **FR-6 (gates and closeout).** `closeout --track dsh_measure_midred_records_20261107`
  and `--track dsh_measure_midred_evidence_20261107` each report only the expected
  missing `automation-supervisor` manifest; node suite, both parity gates, the
  CLI suite, and `bash tests/spec_review_gate/run.sh` pass; the track is archived.
  **Each phase checkpoint is pushed to `origin/main` before the next phase.**

## Non-Functional Requirements

- **NFR-1 (scope).** Only `src/commit.js`, its tests, and records/docs change; the
  shared core and the decision logic are untouched; both parity gates stay green.
- **NFR-2 (POSIX).** Windows stays out of scope.

## Acceptance Criteria (track level)

- Given the parser, Then `git add a \` newline `b && git commit …` returns both
  paths, a quoted `;` path is one path, a real trailing comment is ignored, and an
  unterminated quote fails closed; the suite passes.
- Given the two archived mid-red tracks, Then their closeout checks report only
  the expected manifest FAIL, and the evidence track's `spec-review.md` holds its
  review verbatim with dispositions.
- Given the gates, Then node, both parity gates, the CLI suite, and srg pass.
- Given the repository, Then each phase checkpoint is pushed.

## Out of Scope

- Full shell parsing (subshells, command substitution, wrapper scripts) — the
  remaining, documented residual.
- The commit staged-read race and the heredoc grammar rows.
