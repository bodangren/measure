# Specification: DSH Measure audit role contract alignment

## Overview

The Group (a) row records three mismatches around the
`measure-orchestrator-audit` role: its example audit JSON uses
`schema_version: 2` while the checker requires 1; the checker has no role gate for
`orchestrator-audit` (only `audit-result` validation); and the role's Outputs
section asks it to append to `measure/anti-patterns.md` and write guard tests in
`tests/`, although its permissions allow edits only under `measure/runs/**`.

This track aligns them: the example uses schema version 1; `role-gate --role
orchestrator-audit` (and `measure-orchestrator-audit`) validates the audit result
payload like the other audit roles; and the Outputs section says the audit
*proposes* catalog entries and guard tests (reported as candidates) rather than
editing files its permissions deny. Tests pin the schema version in the doc and
the new role gate.

## Functional Requirements

- **FR-1 (the example).** The audit role's Outputs example uses
  `"schema_version": 1` (the checker's `AUDIT_SCHEMA_VERSION`), and the doc
  contains no `"schema_version": 2`.
- **FR-2 (the role gate).** `ROLE_ALIASES` maps `orchestrator-audit` and
  `measure-orchestrator-audit` to the role; `cmd_role_gate` accepts the role with
  an audit role's behavior: `--result-file` required, the payload validated by
  `validate_audit_payload` (schema version, status, summary, list fields, retry
  recommendation, confidence), and a pass payload gives
  `PASS: orchestrator-audit gate passed`.
- **FR-3 (the outputs).** The role's Outputs #2/#3 say the audit reports the
  proposed `measure/anti-patterns.md` entry and the proposed guard test as
  candidates (the orchestrator or a track applies them), matching its
  `measure/runs/**`-only edit permissions.
- **FR-4 (the tests).** `tests/spec_review_gate/test_checker.py` gains an
  `orchestrator-audit` role-gate case with a passing payload (exit 0, PASS line)
  and a `schema_version: 2` payload (exit 1, `schema_version must be 1`); the S4
  doc-drift suite asserts the example's `"schema_version": 1`, the absence of
  `"schema_version": 2`, and the proposal wording in the outputs.
- **FR-5 (records).** The Group (a) row records the resolved items and any
  residual (the "step 1 names path claims only" limitation stays documented in
  the A11 recipe); `CHANGELOG.md` has a bug-fix entry.
- **FR-6 (verification).** srg 11/11, CLI 13/13, node 318/318, both parity gates
  ok.

## Non-Functional Requirements

- **NFR-1 (bounded).** One alias table entry, one role-set membership, doc edits,
  and tests; no new dependency.
- **NFR-2 (contract preserved).** The other audit roles and the existing
  `audit-result` validation are unchanged.

## Acceptance Criteria (track level)

- Given the audit doc, Then its example uses schema version 1 and the outputs say
  the catalog entry and guard test are proposals.
- Given `role-gate --role orchestrator-audit` with a valid payload, Then it
  passes; given a schema-2 payload, Then it fails with the schema message.
- Given the gates, Then srg 11/11, CLI 13/13, node 318/318, parity ok; each phase
  checkpoint is pushed.

## Out of Scope

- The remaining Group (b)/(f)/(g) items.

> **Follow-up correction (2026-11-10, dsh_measure_audit_contract_fix2_20261110):**
> Inputs item 1 and the Detectors item 3 are also proposals (no append or write
> instruction remains), and Outputs defines the candidate format: a nonblocking
> finding whose text starts with `PROPOSAL:` with the proposed path and assertion.
> The fix2 track also pins the `measure-orchestrator-audit` alias and adds
> whole-file negative checks. The Overview's "only audit-result validation" is
> corrected: `audit-result` also resolves the role. NFR-1's bound is two alias
> lines plus one role-set membership. Group (b)/(f)/(g) and the Group (d)/(e)
> remainders stay out of scope. This track's plan has 8 task lines (metadata 8/8).
