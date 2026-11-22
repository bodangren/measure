# Specification: Late-finding stop rule for the measure-orchestrator skill

## Overview

This chore track adds a stop rule for late findings to the measure-orchestrator skill. After the second review or adversarial round of a phase, a new finding goes to `measure/tech-debt.md` instead of Green. A finding that can hide a wrong result in the delivered work gets exactly one fix round. The orchestrator records each call and its reason in the phase plan.

Source: PM request, 2026-11-22. Type chore, lane light. Due 2026-11-24. The PM words: "add a stop rule for late findings to the measure-orchestrator skill (and the adversarial and review role prompts if they hold the round logic): after the second review or adversarial round of a phase, a new finding goes to tech-debt.md unless it can hide a wrong result in the delivered work; such a finding gets one fix round; each call and its reason go in the plan."

Two tracks on 2026-11-22 kept growing on test tooling instead of the delivered work. Math D1 ran 4 rounds on its own gate script. The Lending `model_guide` track grew the same way. The PM gave both tracks this rule by hand. This track writes the rule down so the orchestrator applies it without a hand call.

## Scope

- `skills/measure-orchestrator/references/contracts.md`: the rule, the record-line format, the fit with the Round limit, and the worked example.
- `skills/measure-orchestrator/SKILL.md`: one pointer line under `## Contracts`.
- `agents/measure-review-a-correctness.md`, `agents/measure-review-b-security.md`, `agents/measure-review-c-ux-api.md`, `agents/measure-adversarial-testing.md`: one pointer line each to the rule.
- `tests/spec_review_gate/test_s5_late_finding_stop.sh`: the Red doc test for this track.
- No other files change. No behavior changes except the documented rule. Historical mentions of the Round limit in `measure/reviews/2026-11-10-orchestrator-process-review.md` and `measure/archive/orchestrator_process_fixes_20261111/` stay unchanged. A grep on 2026-11-22 found no live copy of the skill text elsewhere (no match in `claude-skills/` or `skills/measure-orchestrator-workspace/`), so no copy needs an update.

## Functional requirements

- FR-1: `contracts.md` gains a `**Late-finding stop rule.**` paragraph directly after the `**Round limit.**` paragraph. A round is one audit cycle on one audited HEAD. Review A, B, and C that run in parallel on the same HEAD form one round together. The adversarial pass is its own round. Each re-review after a remediation commit adds one round. A finding that a role raises in round 3 or later of a phase is a late finding. After the second round, each new finding goes to `measure/tech-debt.md` instead of Green, unless FR-2 applies. A kept routed finding and a defect in the lines that the remediation changed keep the `**Re-review scope.**` treatment and do not count as new findings. Two worked counts fix the count: (a) Reviews A/B/C on HEAD1 form round 1. The re-review on HEAD2 is round 2, and the adversarial pass on HEAD2 is round 3, so its new findings are late. (b) Review A alone is round 1. The adversarial pass is round 2, and the re-review after the fix is round 3, so its new findings are late.
- FR-2: A new finding that can hide a wrong result in the delivered work gets exactly one fix round. The finding meets this bar only when both hold: (1) it names a file, value, or behavior that the phase delivers (the product files that the plan lists for the phase, not test tooling, gate scripts, fixtures, logs, or records); (2) it states the wrong output that a user or a downstream consumer would see or receive. Else the finding goes to `measure/tech-debt.md`. When the orchestrator cannot decide, it takes the careful call (one fix round) and records "unsure" in the reason. Green fixes the finding once. Further findings from that fix round go to `measure/tech-debt.md`. No second fix round follows from this rule.
- FR-3: The two rules fit without contradiction. The `**Round limit.**` rule counts remediation rounds per base track and sends open findings to the user after the second, with the `metadata.json` `escalation` escape hatch for a third round. The stop rule counts review or adversarial rounds per phase and stops late new findings from reaching Green at all. The Round limit bounds fix rounds that already started. The stop rule stops new fix rounds from starting late in a phase. The Round limit wins. When the one fix round would be the third remediation round of the base track, the orchestrator does not start it. It sends the finding to the user as the Round limit says. The escalation key rule stays. The stop rule never grants a round beyond the Round limit. A one-fix-round finding under FR-2 counts toward the Round limit count.
- FR-4: The orchestrator records each call in the track `plan.md` under the current phase heading, one line per finding, in this exact form: `- Late finding <id>: <tech-debt|one-fix-round> (<reason>)`. The reason names why the finding did or did not meet the FR-2 bar.
- FR-5: `contracts.md` carries the worked example. A fourth-round finding on the phase's own gate script (the Math D1 case) goes to tech-debt. A finding that the delivered dashboard number is wrong gets one fix round.
- FR-6: `SKILL.md` holds one pointer line under `## Contracts` that names the stop rule and points to `references/contracts.md`. Each of the four role files in Scope holds one pointer line that names the rule and points to it. The review and adversarial role prompts hold no round logic today (grep on 2026-11-22 found only the re-review CONTEST-handling line in each), so they get the pointer line and no logic change.
- FR-7: Work is pushed to `origin/docs/late-finding-stop-rule` only. Only the PM or Daniel merges.

## Commands

- `bash tests/spec_review_gate/run.sh`
- PROJECT_CHECKS: `bash tests/dsh/run.sh` (from `measure/gates.json`)
- PROJECT_LINT: `bash plugins/dsh-measure-guard/scripts/check-parity.sh && bash plugins/opencode-measure-guard/scripts/check-parity.sh` (from `measure/gates.json`)
- Each long command runs through `/home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh` with `HEAVY_MIN_AVAIL_MB=1500`.

## Acceptance criteria

- The new doc test fails before the Green text lands and passes after it.
- `bash tests/spec_review_gate/run.sh`, PROJECT_CHECKS, and PROJECT_LINT all exit 0 after Green.
- The rule, the record-line form, the two-rule fit, and the example are all in `contracts.md`. The pointer lines are in `SKILL.md` and the four role files.

## Out of scope

- Changes to the `**Round limit.**` and `**Re-review scope.**` semantics stay out of scope.
- Changes to `measure-ux-browser-review.md` and `measure-phase-acceptance.md` stay out of scope. The PM named review and adversarial rounds.
- Merges to main stay out of scope. Only the PM or Daniel merges.
