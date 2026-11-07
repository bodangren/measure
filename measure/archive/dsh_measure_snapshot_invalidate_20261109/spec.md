# Specification: DSH Measure snapshot invalidation narrowing

## Overview

The Host invalidates every cached snapshot on every `tools/result` (the
`dsh_measure_guard_20261107` perf row), so a turn full of read-only tool calls
re-reads `measure/` and the git status for each one. The invalidation exists so a
write tool's result is visible to the next guard decision; a tool that cannot
change the repository does not need it (the `agent/pre-step` hook already
invalidates once per step, which is where external edits are picked up).

This track narrows the invalidation to tools that can change the repository: a
small read-only allowlist (`read`, `grep`, `glob`, `read_image`, `web_search`,
`web_fetch`, `todo_write`) skips it; every other tool, including an unknown name,
still invalidates (fail-safe).

## Functional Requirements

- **FR-1 (the predicate).** A new exported predicate `repoMutationLikely(toolName)`
  in `plugins/dsh-measure-guard/src/hooks.js` returns false only for the
  read-only allowlist and true for everything else (unknown names included).
- **FR-2 (the call site).** `index.js`'s `tools/result` listener calls
  `snapshots.invalidateAll()` only when `repoMutationLikely(exec?.name)` is true;
  the `agent/pre-step` invalidation and the explicit status refresh are unchanged.
- **FR-3 (the tests).** `plugins/dsh-measure-guard/tests/guard-prep.test.js` (or a
  new `hooks` test block) asserts the predicate for the allowlist, for
  `bash`/`write`/`edit`/`apply_patch`/`subagent`, and for an unknown name; and a
  plugin-level test asserts that a `tools/result` for `read` does not invalidate
  while one for `bash` does (observed through the snapshot cache read counter or
  an explicit invalidation spy).
- **FR-4 (records).** The perf row is updated: read-only results no longer
  invalidate; the pre-step invalidation and the fail-safe unknown names remain;
  `CHANGELOG.md` has a bug-fix entry.
- **FR-5 (verification).** node suite 320/320, both parity gates ok (no core
  change), CLI 13/13, srg 11/11.

## Non-Functional Requirements

- **NFR-1 (bounded).** One Set lookup per tool result; no new dependency.
- **NFR-2 (correctness).** Any tool outside the read-only allowlist keeps the
  current invalidation; external edits are still seen at every `agent/pre-step`.

## Acceptance Criteria (track level)

- Given `read`, `grep`, `glob`, `read_image`, `web_search`, `web_fetch`, or
  `todo_write`, Then `repoMutationLikely` is false and `tools/result` does not
  invalidate.
- Given `bash`, `write`, `edit`, `apply_patch`, `subagent`, or an unknown name,
  Then it is true and the result invalidates.
- Given the gates, Then node 320/320, CLI 13/13, srg 11/11, parity ok; each phase
  checkpoint is pushed.

## Out of Scope

- Detecting a file change by any tool more precisely than the allowlist (an
  unknown tool stays conservative).
