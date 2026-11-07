# Specification: DSH Measure audit contract fix3

## Overview

The audit-contract fix2 track finished the proposal wording and pinned the schema
version, the `PROPOSAL:` token, and the absence of two write phrases — but its
review found four real weaknesses. The audit status rule for a proposed guard that
would fail was reworded to a pass/fail choice no requirement or test pins (F1).
The new negative doc checks are line-based greps, so a reintroduced instruction
whose wrap falls inside either phrase still passes (F2). The positive check is two
independent file-wide greps, so "nonblocking finding", "path", or "assertion" can
drop out of the format sentence and still pass (F3). The fix2 Overview misstates
the baseline as positive-only (F4), and the Group (a) tech-debt row keeps Status
`Open` while its note says resolved (F5).

This track closes all five findings: the role doc states and a test pins the audit
status for a proposed failing guard; the doc checks collapse whitespace over the
whole file and pin the full format sentence; the fix2 record carries the review
with dispositions and a dated correction note; the tech-debt row is marked
resolved.

## Functional Requirements

- **FR-1 (audit status for a proposal).** `agents/measure-orchestrator-audit.md`
  states that a proposed guard which would fail is a nonblocking candidate and
  does not change the audit result (`status` stays `"pass"`); `test_s4_doc_drift.sh`
  pins that sentence.
- **FR-2 (whole-file negatives).** The negative checks in
  `tests/spec_review_gate/test_s4_doc_drift.sh` normalize the whole file
  (collapse every whitespace run to one space) before searching for
  "entries get appended" and "you may write a focused guard test", so a wrap
  inside either phrase fails the suite.
- **FR-3 (full-format positive).** The positive check pins the required sentence
  containing "nonblocking finding", "`PROPOSAL:`", the proposed path, and the
  assertion, not just two independent tokens.
- **FR-4 (records).** `measure/archive/dsh_measure_audit_contract_fix2_20261110/spec-review.md`
  records F1–F5 with dispositions and a dated note; the fix2 spec gets a dated
  correction note for F4; the Group (a) row's Status becomes `Resolved`;
  `CHANGELOG.md` is updated.
- **FR-5 (verification).** srg 11/11, CLI 13/13, node 318/318, both parity gates
  ok; the archive and closeout (manifest-only FAIL) are recorded.

## Non-Functional Requirements

- **NFR-1 (bounded).** Role-doc wording, two doc-test checks, records; no checker
  behavior change.
- **NFR-2 (contract preserved).** The `PROPOSAL:` format and the role gate stay
  unchanged; the audit schema example stays version 1.

## Acceptance Criteria (track level)

- Given a proposal for a failing guard, Then the role doc calls it nonblocking and
  keeps `status: "pass"`, and the suite fails if that sentence changes.
- Given a reintroduced append or write instruction, Then the negative check fails
  even when the phrase wraps across lines.
- Given a format sentence missing "nonblocking finding", the path, or the
  assertion, Then the positive check fails.
- Given the records, Then F1–F5 are dispositioned and the Group (a) row is
  `Resolved`.
- Given the gates, Then srg 11/11, CLI 13/13, node 318/318, parity ok, and the
  checkpoint is pushed.
