# Specification: DSH Measure audit contract fix2

## Overview

The audit-contract track aligned the schema example, added the
`orchestrator-audit` role gate, and made Outputs #2/#3 proposals — but its review
found the write instructions remain elsewhere in the role doc (Inputs #1 and the
Detectors item 3), the candidate format was undefined, the doc tests were
positive-only and did not cover the `measure-orchestrator-audit` alias, and the
metadata task count was wrong.

This track finishes the alignment: Inputs #1 and the Detectors item 3 state that
catalog entries and guard tests are *proposed* (not written); Outputs defines the
candidate format as a nonblocking finding whose text starts with `PROPOSAL:`;
tests pin the `measure-orchestrator-audit` alias and assert the removed write
instructions are gone; the metadata task count matches the plan.

## Functional Requirements

- **FR-1 (remaining write instructions).** In `agents/measure-orchestrator-audit.md`:
  Inputs item 1 says new catalog classes are reported as proposals (not appended),
  and the Detectors item 3 says to report the proposed guard test path and
  assertion as a candidate (not write it); no instruction to append to the catalog
  or write a test remains.
- **FR-2 (candidate format).** Outputs states: a candidate (a catalog entry or a
  guard test) is reported as a nonblocking finding whose text starts with
  `PROPOSAL:`, with the proposed path and assertion; the orchestrator or a track
  applies it.
- **FR-3 (tests).** `test_checker.py` adds the `measure-orchestrator-audit` alias
  case (exit 0, PASS line); `test_s4_doc_drift.sh` asserts the candidate format
  sentence exists and the removed instructions are absent (whole-file negative
  checks for the exact phrases "entries get appended" and "you may write a focused
  guard test").
- **FR-4 (records).** The Group (a) row notes the fix2 completion; the audit-track
  review (F1–F8) is recorded in its archive with dispositions and a correction
  note; `CHANGELOG.md` is updated; the fix2 metadata task count equals the plan's
  task lines.
- **FR-5 (verification).** srg 11/11, CLI 13/13, node 318/318, both parity gates
  ok.

## Non-Functional Requirements

- **NFR-1 (bounded).** Doc wording, tests, and records; no checker behavior change.
- **NFR-2 (contract preserved).** The role gate and the audit schema are unchanged.

## Acceptance Criteria (track level)

- Given the role doc, Then Inputs #1 and Detectors item 3 say proposal, no append/
  write instruction remains, and Outputs defines `PROPOSAL:`.
- Given the suites, Then the alias case passes and the negative doc checks fail
  when the old phrases return.
- Given the gates, Then srg 11/11, CLI 13/13, node 318/318, parity ok; the
  checkpoint is pushed.

> **Correction (2026-11-10, after the review):** the Overview's claim that "the doc
> tests were positive-only" is inaccurate for the baseline: `test_s4_doc_drift.sh`
> already had file-wide negative checks (no `"schema_version": 2` line, no `A1–A10`
> text) before this track; only the audit-outputs assertion was positive-only, and it is
> the one this track hardened. Separately, the status rule this track delivered ("A
> proposed guard that would fail produces `status: "fail"`") was inconsistent with the
> nonblocking candidate definition and with `passing_audit_feedback()`; the fix3 track
> replaces it with a nonblocking proposal that leaves the audit status `pass`, pins the
> full candidate-format sentence, and moves the two negatives to whole-file
> whitespace-collapsed searches.

