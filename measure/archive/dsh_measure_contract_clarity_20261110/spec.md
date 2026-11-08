# Specification: DSH Measure contract clarity

## Overview

The spec-review-gate acceptance left four "group" rows open. Three of them are pure
contract-clarity gaps that still make the orchestrator guess: Group (f) requires every
prerequisite result to target the same HEAD but does not say what to do when adversarial
testing commits a test-only change after the review (the documented Role Order makes that
happen on purpose); Group (g) leaves four decision points unstated in `new-track.md` step 9
(selecting findings by id, resuming after a Stop, a secret whose location is unknown, and
the approval wording before the report is finalised) and the host-path nit in
`agents/measure-orchestrator.md` is already gone; Group (d) still omits the audit-result
identity fields and the model-default wording from `contracts.md`. Only Group (b) (G19 log
scope, empty-document pipefail, brittle counts) and the Group (e) recipe resid ( `..` claims)
remain real code/test work, not wording.

This track writes those rules down, pins them in the S3 docs test, syncs the
`claude-skills/measure` bundle copy, and flips the three resolved tech-debt rows with
evidence. Group (b) and (e) stay open with their remaining scope stated.

## Functional Requirements

- **FR-1 (Group f, phase acceptance).** `agents/measure-phase-acceptance.md` states the
  test-only HEAD-advance exception: when every commit between a prerequisite result's HEAD
  and the audited HEAD touches only test files or `measure/runs/`, the prerequisite results
  still apply, the acceptance records the exact HEAD it accepted, and it names the test-only
  commits it allowed.
- **FR-2 (Group g, new-track step 9).** `skills/measure/references/new-track.md` step 9
  states: findings are selected by id (for example F1, F3); a Stop leaves the track files
  uncommitted and says how to resume (re-run the step, then commit after approval); a secret
  whose location is unknown is written as `secret redacted (location unknown)`; and the
  commit-approval question says that approving also writes the remaining findings under
  `## Accepted Risks` and finalises the report. The `claude-skills/measure` bundle copy is
  kept identical.
- **FR-3 (Group d, contracts).** `contracts.md` states the audit-result identity fields
  (`role`, `track`, `phase`, `baseline_sha`, `audited_head_sha`, the two SHAs binding the
  result to the diff it judged) and the model-default rule (role files do not pin a model;
  the orchestrator selects it and records the reviewer's model id or `unknown`).
- **FR-4 (pins).** `tests/spec_review_gate/test_s3_dispositions_docs.sh` asserts each new
  sentence (phase acceptance, the four step-9 points, the two contracts bullets).
- **FR-5 (records).** The Group (d), (f), (g) tech-debt rows become `Resolved` with the
  evidence and the Group (b)/(e) remaining scope stays stated; `CHANGELOG.md` records the
  clarity round; the installed plugin is reloaded and the live check passes.
- **FR-6 (verification).** srg 11/11 (S3 with the new pins), CLI 13/13, node unchanged and
  green, both parity gates ok; the archive and closeout (manifest-only FAIL) are recorded.

## Non-Functional Requirements

- **NFR-1 (wording only).** No checker behavior change; the JSON schema, the gates, and the
  role contracts stay as they are.
- **NFR-2 (bundle parity).** `skills/measure` and `claude-skills/measure` stay identical
  (the S3 bundle check decides).

## Acceptance Criteria (track level)

- Given a test-only adversarial commit after a review, Then the acceptance doc says the
  prerequisite results still apply and what the acceptance records.
- Given a Stop at the commit approval, Then new-track says the files stay uncommitted and
  how to resume.
- Given an unknown secret location, Then new-track prescribes the redaction line.
- Given the S3 docs suite, Then every new sentence is asserted and the suite is green.
