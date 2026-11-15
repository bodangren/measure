# Spec Review: copywriter_allow_20261115

Author model: kimi-code-plan-cn/kimi-for-coding#high

## Round 1

Date: 2026-11-15
Reviewer: measure-spec-review, opencode-go/deepseek-v4.1-flash (substitution for the Kimi table model)

### What this track proposes

The track puts four subagent allow rules into the source
agents/measure-orchestrator.md. The rules sit directly after the coder rule,
before the change-quality-reviewer rule, in the order copywriter,
fact-gate-checker, thai-writer, print-proof-auditor. It adds one S2 section
to tests/spec_review_gate/test_s2_role_docs.sh that pins the subagent rule
order. It records the change in CHANGELOG.md and README.md line 33, then
archives the track. The proof of placement is that the source file equals the
installed copy.

### How the current system works, per this spec

Per the spec, the installed role file
~/.config/opencode/agents/measure-orchestrator.md already allows the four
subagents, and the source agents/measure-orchestrator.md does not. The
installer holds the installed file as local-edit, so the four rules did not
reach the source. The S2 role-doc test reads the frontmatter rules with a
rules() helper. It does not yet check the subagent rule order. The source and
installed files differ by the twelve lines that the diff reports as
117a118,129.

### Findings

- F1 [Major] spec.md Test and plan.md Task 1.1: the new S2 section names no edge test case for a missing or empty agents/measure-orchestrator.md, or for an empty rule extract. Rationale: the test file header states the A4 defense, which asserts every extract non-empty before a compare. The plan does not repeat it, so the plan leaves the edge behavior to the implementer.
- F2 [Nit] plan.md Task 1.1 and Task 1.2: both write measure/runs/copywriter_allow_20261115/test-registry.log, so the Task 1.1 output is overwritten by the Task 1.2 output. Rationale: one evidence path holds two heavy runs, so the first output is lost. The Task 1.1 run is redundant because the registry does not change in Task 1.1.
- F3 [Nit] plan.md Task 1.2: the plan names actual_tasks but gives no value. Rationale: the field needs a count. The precedent records 3 and estimated_tasks is 3, so the value is derivable, but the plan does not fix it.
- F4 [Nit] spec.md Test: the expected order gives resource|effect pairs, while rules() prints action|resource|effect. Rationale: the section must trim or filter the action field. A verbatim compare with the listed pairs does not match the helper output.

### Author Response

- F1: FIX
- F2: FIX
- F3: FIX
- F4: FIX

Round 1 passed with no Blocker. Orchestrator decision: F1 to F4 FIX now, no Round 2.
