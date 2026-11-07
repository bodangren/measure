# Spec Review: dsh_measure_snapshot_invalidate_20261109

Author model: deepseek-official/deepseek-flash

## Round 1

Date: 2026-11-10
Reviewer: subagent (fresh context, default model)

### What this track proposes

Adding an exported `repoMutationLikely(toolName)` predicate (false for a seven-name
read-only allowlist, true otherwise) and calling `snapshots.invalidateAll()` on
`tools/result` only when it is true, keeping the `agent/pre-step` invalidation and
the explicit status refresh; tests for the predicate and one read-vs-bash
plugin-level case; the perf row and CHANGELOG updated; gates node 320/320, parity,
CLI 13/13, srg 11/11.

### How the current system works, per this spec

Every finished tool call fired `tools/result`, whose listener called
`snapshots.invalidateAll()` unconditionally, so the next `snapshots.get()` reloaded
the measure files (plus a `git rev-parse --is-inside-work-tree`). Guard decisions
read that cached snapshot; the `agent/pre-step` hook invalidates the root once per
entered step; `recordRed` reads the snapshot only for file/shell mutations.

### Findings

- F1 [Blocker] plan Task 1.2/FR-3: the plan named no test file and the spec offered alternatives (guard-prep.test.js "or a new hooks block"; a cache read counter "or an invalidation spy"), leaving the file and seam to the implementer.
- F2 [Major] FR-5/Acceptance: the gate said `node 320/320` while the tree is 317 (315 before the track's two cases).
- F3 [Major] Overview/FR-1/FR-3: the new READ_ONLY_TOOLS set is a second classification next to the existing `MUTATION_TOOLS` set, nothing keeps them disjoint, and the write-tool list omitted `pwsh`/`str_replace_editor`.
- F4 [Major] NFR-2/Overview: several tool calls can share one step, so an external edit between two calls of the same step is now seen at the next pre-step, not the next call — a new within-step window the spec did not state.
- F5 [Major] FR-4/Task 2.1: the row update was unpinned and ended contradictory (Status Open with a "Resolved" note), and "read-only results no longer invalidate" over-claimed since only seven names skip.
- F6 [Nit] Overview: the cost claim attributed a per-result `git status` read; the reload runs the work-tree check and measure re-reads, while `git status --porcelain` is per turn.

### Author Response

- F1: FIX (the files are `plugins/dsh-measure-guard/tests/guard-prep.test.js` for the predicate and disjoint-set checks and `plugins/dsh-measure-guard/tests/plugin.test.js` for the invalidation spy; the spec correction names them)
- F2: FIX (the node suite is 318 after the new block, 317 before it; the spec correction and CHANGELOG state 318)
- F3: FIX (`MUTATION_TOOLS` is exported from `src/guard.js`; a test asserts every mutation tool is `repoMutationLikely` true and the two sets are disjoint)
- F4: FIX (the row and the spec correction name the within-step external-edit window as the residual; the next pre-step sees it)
- F5: FIX (the row has Status Resolved and states that only the seven allowlisted names skip, unknown/write names stay conservative, the pre-step invalidation remains, and the window is the residual)
- F6: FIX (the cost is the per-result measure/ reload; no per-result `git status`)

Delivered by `dsh_measure_snapshot_invalidate_fix2_20261109`; node 318/318,
parity ok, CLI 13/13, srg 11/11.
