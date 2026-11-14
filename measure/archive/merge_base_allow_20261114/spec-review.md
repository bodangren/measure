# Spec Review: merge_base_allow_20261114

Author model: volcengine-agent-plan/glm-5.3-flash

## Round 1

Date: 2026-11-14
Reviewer: measure-spec-review, kimi-code-plan-cn/kimi-for-coding#high

### What this track proposes

The track adds one shell allow rule `git merge-base *` directly after the
unchanged `*git merge*` deny rule in the frontmatter of the eight audit role
files, so acceptance roles can run read-only `git merge-base --is-ancestor`
while `git merge`, `git merge-file`, and write redirects stay denied. It also
adds one section to `tests/spec_review_gate/test_s2_role_docs.sh` that
re-evaluates the shell rules of each role with OpenCode V2 matching semantics
and asserts allow for merge-base, deny for merge, and deny for merge-file. The
light lane needs metadata, CHANGELOG, and README updates plus archive and
registry closeout.

### How the current system works, per this spec

Each of the eight audit role files in `agents/` holds the same frontmatter
deny rule `*git merge*` at lines 42 to 44, which also blocks the read-only
`git merge-base --is-ancestor A B`. OpenCode V2 combines permission rules in
order and uses the last match; a shell pattern ending in ` *` also matches
the command without arguments; a compound command may produce several scanner
resources and any deny denies the operation. The Graph project final
acceptance (round 2) worked around the block with `git rev-list --count
HEAD..X` on 2026-11-14.

### Findings

- F1 [Blocker] plan.md Task 1.2: the task runs `bash tests/dsh/test-registry.sh` and the closeout check as its first step, before the metadata finalization (status done, actual_tasks, the completed key) and before the archive and registry move, and it never says to re-run the closeout check after those steps. Rationale: `closeout_feedback` in `skills/measure-orchestrator/scripts/measure_interphase_checks.py` lines 875-893 fails on `track still exists in active tracks`, `metadata status must be done`, `metadata must include a completed date`, and open plan tasks when run at the named point, so the acceptance criterion `the closeout check fails only on the missing closeout manifest` is not observable from the plan order; the worker must decide on its own to re-run the check after the archive steps, which is a sequencing decision the plan leaves open. The sibling light-lane plans (`measure/archive/final_acceptance_head_scope_20261113/plan.md`, `measure/archive/orchestrator_shell_ask_20261111/plan.md`) run the closeout check after the archive and registry move.
- F2 [Nit] spec.md FR-2: the section asserts the three per-role outcomes but no assertion covers the FR-1 edge claim that a compound command such as `git merge-base A B && git merge X` stays denied. Rationale: FR-1 lists the compound-command case as a reason, and the new section leaves it untested; the effect still holds because the deny `*git merge*` matches the extracted subcommand, but an explicit case would pin the claim. The implementer has no open decision, so this is a Nit.

### Author Response
- F1: FIX
- F2: DECLINE

## Round 2

Date: 2026-11-14
Reviewer: measure-spec-review, kimi-code-plan-cn/kimi-for-coding#high

### What this track proposes

The track adds one shell allow rule `git merge-base *` directly after the unchanged
`*git merge*` deny rule in the frontmatter of the eight audit role files, so acceptance
roles can run read-only `git merge-base --is-ancestor` while git merge, git merge-file,
and write redirects stay denied. It also adds one section to
tests/spec_review_gate/test_s2_role_docs.sh that re-evaluates the shell rules of each
role with OpenCode V2 matching semantics and asserts allow for merge-base, deny for
merge, and deny for merge-file. The light lane then needs metadata, CHANGELOG, and
README updates plus archive and registry closeout.

### How the current system works, per this spec

Each of the eight audit role files in agents/ holds the same frontmatter deny rule
`*git merge*` at lines 42 to 44, which also blocks the read-only
`git merge-base --is-ancestor A B`. OpenCode V2 combines permission rules in order and
uses the last match; a shell pattern ending in ` *` also matches the command without
arguments; a compound command may produce several scanner resources and any deny denies
the operation. The Graph project final acceptance (round 2) worked around the block
with `git rev-list --count HEAD..X` on 2026-11-14.

### Findings

- None

