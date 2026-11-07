# Specification: DSH Measure semantic reload

## Overview

`bin/measure-dsh reload` and the unchanged-block `install` path were meant to make
the running profile recompose so the plugin executes the installed bytes and
re-reads its caches. The isolated-session rehearsal (2026-11-07) proved they do
not: after `bin/measure-dsh reload`, a session created with the fixture as its
working directory still reported `guard (config)` although `repos.json` held a
`strict` override for that root; a managed-block content change
(`install --mode advise`) did reload. The mechanism is the marker: both commands
toggled a `# measure-dsh reload marker` YAML comment, which changes no composed
configuration, so the loader skips the recompose and the plugin keeps its cached
`repos.json` store (and a stale digest would go unnoticed until the next real
change).

This track replaces the comment toggle with a semantic one: the managed plugin
entry's config gains `reloadNonce: <integer>`, incremented on every reload, and
the loader therefore recomposes. It also proves the reload live: an override is
written, `reload` is run, and the state route must report the override without
any other change.

## Functional Requirements

- **FR-1 (semantic nonce in the managed block).** `bin/measure-dsh` writes the
  plugin entry config with `reloadNonce: <n>` (an integer) and, on `reload` and
  on an unchanged-block `install`, increments it. The comment marker line is
  removed. Every other patch entry stays byte-equal; the patch edit keeps its
  existing exact-line and atomic-write behavior. Edge cases are pinned: a
  missing nonce defaults to 0 (an old patch); a non-integer nonce reads as 0, so
  the next write is 1; a **changed-block** install (a new `mode`) keeps the
  existing nonce because the composed configuration already changed; and a
  `reload` on a patch without a complete managed block fails with
  `FAIL reload: no complete managed block`, exits 1, and writes nothing.
- **FR-2 (the plugin accepts it).** The plugin documents and ignores
  `config.reloadNonce` (it has no behavioural effect); the config object reaches
  `apply` unchanged. No schema error, no warning on the default path.
- **FR-3 (the contract tests).** `tests/dsh/test-reload.sh` asserts the exact
  nonce values — a fresh install writes 0, `reload` writes 1 then 2, the
  unchanged-block install writes 3, an old patch without a nonce writes 1, a
  changed `mode` keeps the value, and a non-integer nonce reads as 0 — that
  every non-nonce line stays byte-equal, the exact PASS/dry-run strings, and the
  no-complete-block failure. `tests/dsh/test-install.sh` asserts the
  unchanged-block install also increments it and writes nothing into the plugin.
- **FR-4 (live proof).** With a temporary repository mode override for this
  repository in `~/.local/state/measure/dsh-guard/repos.json`, `bin/measure-dsh
  reload` makes `GET /measure-guard/state?sessionId=<live id>` return
  `{"mode":{"value":"strict","source":"repository"}}` (the route answers 404
  without a session id; the browser/GUI session supplies it) with no other
  change; after deleting the override key (the pre-run value was "no entry"),
  another reload returns `{"mode":{"value":"guard","source":"config"}}`. The
  evidence file `measure/runs/dsh_measure_reload_20261107/live-reload.md` records
  both reads, the exact commands, and the installed digest.
- **FR-5 (docs and closeout).** `bin/measure-dsh`'s usage/help text, the plugin
  README, `docs/dsh.md`, `CHANGELOG.md`, `measure/lessons-learned.md` (the old
  "toggle a marker comment" lesson is corrected to the semantic-value rule),
  `measure/tech-debt.md` (the Medium reload row resolves), metadata, and the
  registry/archive are updated.

## Non-Functional Requirements

- **NFR-1 (no plugin behaviour change).** Only the documented nonce is added;
  the node suite stays 288/288 and both parity gates stay green.
- **NFR-2 (POSIX).** Windows stays out of scope.
- **NFR-3 (safe patch editing).** The existing exact-line/atomic guarantees for
  the managed block hold; a failed edit leaves the patch untouched.

## Acceptance Criteria (track level)

- Given a profile with the managed block, When I run `bin/measure-dsh reload`,
  Then the plugin entry's `reloadNonce` increments and no comment marker is
  written.
- Given `repos.json` with a `strict` override for this repository, When I run
  `reload` and read `GET /measure-guard/state?sessionId=<live id>`, Then the JSON
  mode is `{"value":"strict","source":"repository"}`; after deleting the
  override key and reloading, it is `{"value":"guard","source":"config"}`.
- Given the CLI suite and the plugin suite, Then `bash tests/dsh/run.sh` and
  `node --test plugins/dsh-measure-guard/tests/*.test.js` pass (288/288) and both
  parity gates print `parity: ok`.
- Given the track completes, Then the docs, lessons, tech debt, metadata, and
  archive are updated.

## Out of Scope

- A loader with a true "reload this profile" signal (the nonce is the available
  seam).
- Changing the plugin's mode resolution or the state store.
