Author model: opencode-go/muse-spark-1.3-contributor

# Spec Review: late_finding_stop_rule_20261122

## Round 1

Audited HEAD: d309d545a0751765cacf44928ca9c8682c86b2d9. Baseline: d309d545a0751765cacf44928ca9c8682c86b2d9. Status: FAIL (F1 Blocker, F2-F4 Major, F5 Nit).

### What this track proposes

This track documents a stop rule for late findings in the measure-orchestrator skill. After the second review or adversarial round of a phase, a new finding goes to measure/tech-debt.md instead of Green. A finding that can hide a wrong result in the delivered work gets one fix round. The orchestrator records each call and its reason in the phase plan. The rule text, a record-line form, a two-rule fit, and an example go in contracts.md, with pointer lines in SKILL.md and four role files.

### How the current system works, per this spec

Per the spec, contracts.md holds the Re-review scope rule and the Round limit rule. Re-review scope keeps a kept routed finding and a defect in changed lines blocking, and treats other new findings as nonblocking. Round limit sends open findings to the user after the second remediation round for a base track, with an escalation key escape hatch for a third round. SKILL.md points to contracts.md under its Contracts section. The four named role files hold only re-review CONTEST handling and no round logic.

### Findings

- F1 [Blocker] spec.md FR-1: The round count leaves two cases undecided: parallel Review A/B/C results, and a first adversarial run after review rounds. Rationale: The spec calls the first audit result round 1. It adds a round for a re-review or adversarial rerun only. It never says that A/B/C share one round. It never says that a first adversarial pass adds one. The 'after the second round' trigger changes with the reading. The plan leaves the choice to Green.
- F2 [Major] spec.md FR-2: Comprehension gap: The exception 'can hide a wrong result in the delivered work' has no decidable test. Rationale: The spec gives two examples but no rule that separates delivered-work errors from test tooling. The exception is the only path to a fix round after round two. Different orchestrators can classify the same finding differently.
- F3 [Major] spec.md FR-3: The fit does not say which rule wins when an FR-2 fix round would be the third remediation round. Rationale: FR-2 grants one fix round. Round limit forbids a third round without the metadata escalation key. FR-3 only says the fix round counts toward the Round limit count. The boundary needs a stated outcome before Green writes the text.
- F4 [Major] plan.md Task 1.1: The plan claims every Red case fails, but it does not require each case to search only new text. Rationale: 'Round limit', 'base track', and 're-review' already appear in contracts.md. A case matching those strings passes at Red. The failing-first proof then breaks.
- F5 [Nit] spec.md FR-4: The phrase 'the phase's plan.md' can name a per-phase plan file, but the repo holds one plan.md per track. Rationale: The record-line form is exact. Only the file phrase needs a target such as the track plan under the current phase.

### Round 1 disposition

- F1 FIX: FR-1 now counts one audit cycle per HEAD, shares A/B/C, and adds two worked counts.
- F2 FIX: FR-2 now bars tooling with a two-part test and an unsure rule.
- F3 FIX: FR-3 now lets the Round limit win at the third round.
- F4 FIX: Task 1.1 now anchors each case in new text only.
- F5 FIX: FR-4 now names the track plan under the phase heading.
