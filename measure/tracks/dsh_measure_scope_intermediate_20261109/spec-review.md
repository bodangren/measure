# Spec Review: dsh_measure_scope_intermediate_20261109

Author model: deepseek-official/deepseek-flash

## Round 1

Date: 2026-11-09
Reviewer: subagent (fresh context, default model)

### What this track proposes

Unioning every path a commit in `baseline..HEAD` touched into `changed_files()`
and `committed_files()`, on top of the existing diffs, so an intermediate
add-then-delete production file is visible to the mid-red and audit scope checks;
an S2 probe for the mid-red message and a test-only control; the parser row's last
residual closed; srg 11/11, CLI 12/12, node 301/301, parity.

### How the current system works, per this spec

`changed_files()` unions the `baseline..HEAD` tree diff, the unstaged diff, and the
staged diff; `committed_files()` runs one rename-free `-z` tree diff; the
`spec-review` scope check repeats that inline tree diff in `cmd_role_gate` and does
not call `committed_files()`. All of them compare trees, so a path one commit adds
and a later commit deletes leaves no trace. `non_test_committed_files()` feeds the
mid-red check; `ux_paths()` feeds the UX gate.

### Findings

- F1 [Blocker] FR-1/FR-3: the union named only the two functions, not the inline `spec-review` scope block (the rule the quoted residual and `contracts.md:83` describe), so the row could be closed while that rule still compared trees.
- F2 [Major] FR-2/Task 1.2: the S2 suite's contract is `spec-review`/`audit-result`, and its fixture plan and missing `RED_TEST_COMMAND` make a mid-red probe there noisy; the mid-red fixture lives in `test_checker.py`.
- F3 [Major] FR-1/NFR-2: a `git log --name-only` union without `-z` and `core.quotePath=false` would add quoted non-ASCII names and strip leading whitespace, reopening the G16 leading-space bypass.
- F4 [Major] FR-2/FR-4: only the `committed_files()`/mid-red half had a probe; `changed_files()`/`ux_paths()` had none.
- F5 [Major] FR-4/Task 2.2: "a real phase with no intermediate commits gives the same results" named no phase, baseline, or stored result.
- F6 [Nit] FR-1: "the existing tree diff and the working-tree/staged diffs" read as applying both diffs to both functions.

### Author Response

- F1: FIX (the inline `spec-review` scope block also unions the history paths; the fix covers all three tree-diff listings)
- F2: FIX (the probes live in `test_checker.py`, which already holds the mid-red fixture: intermediate add-then-delete outside tests reports the mid-red message and the path; an intermediate test-file-only case reports no such message; the spec-review intermediate add/delete and inside-runs cases are also there)
- F3: FIX (the history list is exact bytes — `git rev-list baseline..HEAD` then `git diff-tree --no-commit-id --name-only -r -z --no-renames <rev>` — with no quoting and no stripping; G16 stays green)
- F4: FIX (a direct test calls `changed_files()` and `ux_paths()` on an intermediate `app/src/x.ts` add-then-delete)
- F5: FIX (the correction note defines the non-regression check as the full gate set; no stored "before" claim remains)
- F6: FIX (the correction note names each function's existing inputs: `changed_files()` tree + working + staged + history; `committed_files()` tree + history; the spec-review block tree + history)
