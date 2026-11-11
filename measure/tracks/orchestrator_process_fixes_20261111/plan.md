# Implementation Plan: Implement the orchestrator process review

Track: `orchestrator_process_fixes_20261111`
Spec: [./spec.md](./spec.md)
Source: [the 2026-11-10 orchestrator process review](../../reviews/2026-11-10-orchestrator-process-review.md)

**Each phase is a milestone: its commits are pushed to `origin/main` and its checkpoint is recorded before the next phase starts.**

## Phase 1: Fail-fast dispatch and permissions [checkpoint: 0aee627]

- [x] Task 1.1: `agents/measure-orchestrator.md`: the dispatch paragraph writes `session.create` with `agent: "build"` and forbids an `agent`-less dispatch; the default shell effect becomes `deny` with every allow rule kept; "Progress And Recovery" gains the command-classes/`session.status`/stop-waiting rule (review improvement 1) `72e20d3`
- [x] Task 1.2: `tests/spec_review_gate/test_s2_role_docs.sh`: pin the `agent: "build"` dispatch line and the non-`ask` default shell effect; both checks fail on `e2315b7` `f280025`
- [x] Task: Measure - User Manual Verification 'Phase 1: Fail-fast dispatch and permissions' (Protocol in workflow.md) `0aee627`

## Phase 2: Remediation limit and records hygiene [checkpoint: PENDING]

- [ ] Task 2.1: `skills/measure-orchestrator/references/contracts.md`: Re-review scope and Round limit rules (two rounds, then escalate with the cause class; a third round needs a non-empty `metadata.json` `escalation` reason)
- [ ] Task 2.2: `skills/measure-orchestrator/SKILL.md` Delegation: no pinned test/check counts in `spec.md`/`plan.md`/`CHANGELOG.md` (cite the log), and the input-class table requirement before Red
- [ ] Task 2.3: `tests/dsh/test-registry.sh`: reject an active `_fix[3-9]_` track without a non-empty `metadata.json` `escalation` key; fixture cases cover accepted and rejected
- [ ] Task: Measure - User Manual Verification 'Phase 2: Remediation limit and records hygiene' (Protocol in workflow.md)

## Phase 3: Committed gates and final acceptance [checkpoint: PENDING]

- [ ] Task 3.1: add `measure/gates.json` and the checker's `load_gates` (environment variable wins over the file; malformed/missing file falls back with a message); tests for the file and the override
- [ ] Task 3.2: `closeout_feedback`: require a passing `measure/runs/<track>/final-acceptance-*.json` or a `"lane": "light"` metadata value with the INFO line; tests for failing, passing, and light-lane archives
- [ ] Task 3.3: `skills/measure-orchestrator/references/dsh.md`: replace the result block with the `contracts.md` shape including `END_MEASURE_AGENT_RESULT`
- [ ] Task: Measure - User Manual Verification 'Phase 3: Committed gates and final acceptance' (Protocol in workflow.md)

## Phase 4: Other findings, verification, and closeout [checkpoint: PENDING]

- [ ] Task 4.1: fix the Mid Red / Jr Green HEAD-advance check to compare the resolved full baseline SHA with `HEAD`; add a checker test with a short baseline
- [ ] Task 4.2: the audit roles' shell permissions: keep the write-redirection deny and allow `2>&1`; pin an allow/deny test
- [ ] Task 4.3: remove the stale TUTOR-001 paragraph from `skills/measure-orchestrator/SKILL.md`, return `measure/tech-debt.md` to 50 lines, and name the role table as the single default model source in `agents/measure-orchestrator.md`
- [ ] Task 4.4: run the full gates (`bash tests/dsh/run.sh`, `bash tests/spec_review_gate/run.sh`), both parity gates, and the plugin suites; record the results
- [ ] Task 4.5: finalize `metadata.json`, archive the track, update the registry and the README status line, run the closeout check, and record the manifest-only FAIL
- [ ] Task: Measure - User Manual Verification 'Phase 4: Other findings, verification, and closeout' (Protocol in workflow.md)
