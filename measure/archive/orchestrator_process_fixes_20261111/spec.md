# Specification: Implement the orchestrator process review

## Overview

The 2026-11-10 orchestrator process review
(`measure/reviews/2026-11-10-orchestrator-process-review.md`, reviewer
`claude-code/claude-fable-5-2[1m]`, audited HEAD `e2315b7`) recommends three
improvements and lists five smaller findings. The review is already merged into
`main` (PR #9); this track implements its recommendations, adopting the review's
proposed defaults for its three questions:

1. The orchestrator's default shell effect changes from `ask` to `deny`
   (interactive users use a build session; the allow rules are kept).
2. A light lane (`"lane": "light"` in `metadata.json`) is an approved closeout
   path.
3. The two-round remediation limit applies to the DSH process too, because the
   rule lives in the shared skill.

Each phase is a milestone: its commits are pushed to `origin/main` before the
next phase starts.

## Functional Requirements

### FR-1: Fail-fast dispatch and permissions (review improvement 1)

- `agents/measure-orchestrator.md`: the dispatch paragraph writes the call as
  `session.create` with `agent: "build"` and adds "Never dispatch a session
  without an `agent` value. A session with no `agent` value takes this agent and
  its permissions."
- The same file's frontmatter default shell effect changes from `ask` to `deny`;
  every allow rule stays.
- "Progress And Recovery" gains the rule: list the command classes each brief
  needs, read `session.status` at the next orchestration step after a dispatch,
  and stop/report a session that waits for a permission.
- `tests/spec_review_gate/test_s2_role_docs.sh` pins the `agent: "build"`
  dispatch line and the non-`ask` default shell effect (the two checks fail on
  `e2315b7`).

### FR-2: Remediation round limit and records hygiene (review improvement 2)

- `skills/measure-orchestrator/references/contracts.md`, Finding Dispositions:
  a **Re-review scope** rule (a re-review blocks only a kept routed finding and a
  defect in the lines the remediation changed; every other new finding is
  nonblocking) and a **Round limit** rule (after the second remediation round for
  one base track the orchestrator sends the open findings to the user with the
  cause class; no third round unless `metadata.json` carries an `escalation`
  reason).
- `skills/measure-orchestrator/SKILL.md`, Delegation: do not pin a test/check
  count in `spec.md`, `plan.md`, or `CHANGELOG.md` (cite the log file), and state
  the input-class table requirement before Red for a finding about an input class
  (shell forms, option forms, character classes).
- `tests/dsh/test-registry.sh` rejects a track under `measure/tracks/` whose id
  matches `_fix[3-9]_` and whose `metadata.json` has no non-empty `escalation`
  key; fixture cases cover both sides.

### FR-3: Committed gates and final-acceptance closeout (review improvement 3)

- New `measure/gates.json` with `RED_TEST_COMMAND`, `GREEN_TEST_COMMAND`,
  `PROJECT_LINT`, `PROJECT_CHECKS`, `PROJECT_TESTS`, `PROJECT_DEV_URL`.
- `measure_interphase_checks.py` loads that file (`load_gates`); an environment
  variable wins over the file, and a missing key falls back to the environment
  value/empty as today.
- `closeout_feedback` requires one `measure/runs/<track>/final-acceptance-*.json`
  that passes `passing_audit_feedback("final-acceptance")`; a `metadata.json`
  `"lane": "light"` value is accepted with `INFO: light lane, no final
  acceptance`.
- `skills/measure-orchestrator/references/dsh.md` result block gets the
  `END_MEASURE_AGENT_RESULT` line and the `contracts.md` shape, so a DSH role that
  follows it can pass `role-gate`.
- `tests/spec_review_gate/test_checker.py` gains cases for the gates file, the
  environment override, the missing final acceptance, and the light lane.

### FR-4: The review's other actionable findings

- The Mid Red / Jr Green HEAD-advance check compares the baseline by resolving it
  to a full SHA instead of comparing the short string to `HEAD`.
- The audit roles' shell frontmatter stops denying the common `2>&1` stream
  duplication while keeping the write-redirection deny.
- `skills/measure-orchestrator/SKILL.md` drops the stale TUTOR-001 paragraph
  (`measure/test-all.sh` and `tests/_lib/`).
- `measure/tech-debt.md` returns to the 50-line limit.
- `agents/measure-orchestrator.md` names one model source (the role table is the
  default; `ra-quota pick` can override), removing the two-source ambiguity.

### FR-5: Milestones

After each phase: the phase's commits are committed with a note, pushed to
`origin/main`, and the phase checkpoint is recorded in the plan. The final phase
archives the track, updates the registry and README status line, and records the
expected manifest-only closeout FAIL.

## Non-Functional Requirements

- **NFR-1 (no new dependency).** Python/bash only; no packages, no build.
- **NFR-2 (checker compatibility).** Existing environment-variable use keeps
  working; the file is read only when a key is absent from the environment and the
  file exists. The existing checker suite passes unchanged.
- **NFR-3 (documentation provenance).** Each change cites the review section it
  implements (in the commit note), so the report and the code stay linked.
- **NFR-4 (no product behavior change).** Plugins, skills behavior, validator
  outputs, and the dispatcher's actual `session.create` API are unchanged apart
  from the documented rule texts.
- **NFR-5 (fail open on bad gates file).** An unreadable or malformed
  `measure/gates.json` is reported as a checker error message, not a crash.

## Acceptance Criteria (track level)

- Given the changed files, Then the two new role-doc checks and the registry
  escalation fixture pass, and the full `tests/spec_review_gate/run.sh` and
  `tests/dsh/run.sh` pass.
- Given `measure/gates.json`, Then a checker gate command runs the file value, an
  environment variable overrides it, and the new checker tests cover both.
- Given an archived track with no final acceptance and no light lane, Then
  `closeout` fails; with a passing `final-acceptance-*.json` or `"lane": "light"`
  it passes.
- Given the audit-role frontmatter, Then a `2>&1` command is allowed and a
  `> file` write stays denied (pinned by a test).
- Given `phase N` complete, Then its commits are on `origin/main` and its plan
  checkpoint points at the pushed checkpoint commit.
- Given the archive, Then the closeout check reports only the missing closeout
  manifest.

## Out of Scope

- Re-running or editing the review report itself.
- Changing the orchestrator's `session.create` API or the OpenChamber SDK.
- Re-archiving the 17 old `_fix3+` tracks with escalation keys (the check applies
  at closeout and to new active tracks only).
- Installing the changed role files into `~/.agents/agents/` or
  `~/.config/opencode/agents/` (the hourly installer does that from `main`).
