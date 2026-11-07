# Spec Review: dsh_measure_contracts_scope_20261110

Author model: deepseek-official/deepseek-flash

## Round 1

Date: 2026-11-10
Reviewer: subagent (fresh context, default model)

### What this track proposes

Adding a "Marker Matching and Baseline" section to `contracts.md` recording the
shipped rules for whole-line marker matching, the raw dispositions value, finding
scopes, baseline resolution, the changed-file union, and the Mid Red/Jr Green HEAD
check, with S3 docs-test assertions; updating the Group (d) row and CHANGELOG;
gates srg 11/11, CLI 13/13, node 318/318, parity.

### How the current system works, per this spec

The result block requires stripped lines equal to the markers; the dispositions
value is read raw with one trailing CR ignored, items stripped, control/format
characters rejected; audit scopes are role names and spec-review scopes name the
spec/plan section; spec-review resolves `--baseline` with `rev-parse --verify`
(no ancestry requirement), changed files union the tree diff with every commit in
the range, and Mid Red/Jr Green fail while HEAD equals the baseline.

### Findings

- F1 [Major] FR-3: "the phase's changed files" named no shipped set and omitted the unstaged/staged diffs that `changed_files()` unions, while `committed_files()` and the spec-review scope use the committed set only.
- F2 [Major] FR-3: "the required scope word for spec-review" was undefined; the standard says the scope names the spec/plan section.
- F3 [Major] Overview: the Overview said the Group (d) row records "mid-red/green require HEAD to advance", but the row records "HEAD mismatch handling", which may be the spec-review role's audited HEAD, and the spec did not map the row's items to what it writes.
- F4 [Nit] FR-3: the baseline sentence did not say which gate enforces resolution; only spec-review resolves and rejects a bad baseline, while Mid Red/Jr Green compare strings.
- F5 [Nit] Task 1.2: the doc assertion pinned only three of the six scope names in the new section.

### Author Response

- F1: FIX (the section distinguishes the committed set — tree diff plus every commit in `baseline..HEAD` — from the working-tree union of unstaged and staged diffs for roles that read the working tree)
- F2: FIX (the section says a spec-review finding's scope names the section of `spec.md` or `plan.md`; the doc test pins that sentence)
- F3: FIX (the Group (d) row records the resolved matching/value/scope/baseline/changed-set/HEAD-advance items and keeps the audit result JSON identity fields and the model-default wording as the residual; the spec note maps the coverage)
- F4: FIX (the section says the spec-review gate resolves `--baseline` and rejects an unresolvable value, while Mid Red/Jr Green compare the baseline string with HEAD)
- F5: FIX (the doc test pins all six audit scope names in the new section, plus the working-tree union and the spec-review baseline resolution)

Delivered by this track; srg 11/11, CLI 13/13, node 318/318, parity ok.
