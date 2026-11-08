# Spec Review: dsh_measure_audit_contract_fix2_20261110

Author model: deepseek-official/deepseek-flash

## Round 1

Date: 2026-11-10
Reviewer: subagent (fresh context, default model)

### What this track proposes

The track finishes the audit-role contract that `dsh_measure_audit_contract_20261110`
left partly aligned. It turns Inputs item 1 and Detectors item 3 into proposals, so the
role no longer appends catalog entries or writes guard tests, and Outputs defines a
candidate as a nonblocking finding whose text starts with `PROPOSAL:` and names the
proposed path and assertion. It adds a `measure-orchestrator-audit` alias case to
`test_checker.py` and a format-plus-absence check to `test_s4_doc_drift.sh`. It also
records the prior review's F1–F8 with dispositions and a dated correction note, updates
the Group (a) row and `CHANGELOG.md`, fixes the metadata task count, and verifies srg
11/11, CLI 13/13, node 318/318, and both parity gates.

### How the current system works, per this spec

At the baseline the audit role doc already used schema version 1 and the checker already
accepted `orchestrator-audit`, but Inputs item 1 still said new catalog entries "get
appended" and Detectors item 3 still said the role "may write a focused guard test",
although the role's edit permission covers only `measure/runs/**`. Outputs #2/#3 already
called both artifacts candidates but defined no candidate format, and Detectors item 3
still said a new failing guard produces `status: "fail"`. `ROLE_ALIASES` maps both
`orchestrator-audit` and `measure-orchestrator-audit` to the canonical role, and
`role-gate` requires `--result-file` and validates the payload through
`passing_audit_feedback`; `test_checker.py` covered the canonical role only.
`test_s4_doc_drift.sh` pinned the schema version and the candidate wording with positive
greps plus schema-2 and A1–A10 negatives, and had no check for the two write phrases; the
metadata listed 4 tasks against 7 plan lines.

### Findings

- F1 [Major] FR-1 / plan Task 1.1: Detectors item 3's fail rule is left stale — at the
  baseline it said a new failing guard produces `status: "fail"`
  (agents/measure-orchestrator-audit.md:145-146), and once the role only proposes a
  guard, FR-2's "nonblocking finding" leaves open whether a proposal that would fail
  sets the audit status to `fail`; the delivered doc rewords it to "A proposed guard
  that would fail produces `status: "fail"`" (line 146), a pass/fail choice no FR or
  test pins. Rationale: the audit status for a proposal is an edge-case behavior the
  implementer must decide, and the delivered choice makes a nonblocking candidate fail
  the audit.
- F2 [Major] FR-3 / plan Task 1.2: the "whole-file" negative checks are line-based
  greps in the delivered test (tests/spec_review_gate/test_s4_doc_drift.sh:95-96), so a
  reintroduced instruction whose wrap falls inside "entries get appended" or "you may
  write a focused guard test" passes; the suite's `flat`/`in_flat` helpers that collapse
  whitespace are not required. Rationale: the guard can stay green while the exact
  regression the track forbids returns, the same weakness the archived review's F3
  recorded.
- F3 [Major] FR-3 / plan Task 1.2: the positive case is only "the candidate format
  sentence exists", with no literal or required substrings; the delivered check is two
  independent file-wide greps for `as a candidate` and `PROPOSAL:`
  (tests/spec_review_gate/test_s4_doc_drift.sh:94), so Outputs could drop "nonblocking
  finding", "path", or "assertion" from the FR-2 format and still pass. Rationale: the
  format the archived review's F2 found undefined is pinned by two tokens rather than
  by the required sentence.
- F4 [Nit] Overview: "the doc tests were positive-only" is inaccurate — at the baseline
  `test_s4_doc_drift.sh` already had file-wide negative checks (no schema-version-2
  line, no `A1–A10`), and only the audit-outputs assertion was positive-only. Rationale:
  the Overview misstates the baseline the FRs build on, though FR-3's requirement is
  unaffected.
- F5 [Nit] FR-4 / plan Task 2.1: "the Group (a) row notes the fix2 completion" does not
  say whether the row's Status changes; the delivered row adds "Resolved 2026-11-10 … +
  fix2" to Notes but keeps Status `Open` (measure/tech-debt.md:23), so the registry still
  lists the item open while its note says resolved. Rationale: two readers of the same
  row disagree, and the plan leaves the status bit to the implementer.

### Author Response

- F1: FIX — `dsh_measure_audit_contract_fix3_20261110` (`e0d9eac`): Detectors item 3 now
  states that a proposed guard which would fail is a nonblocking candidate and does not
  change the audit result — `status` stays `"pass"` — because the role only proposes it;
  only a catalog violation the audit itself blocks produces `status: "fail"`.
  `test_s4_doc_drift.sh` pins the sentence and fails on the removed "produces
  `status: "fail"`" wording. This is also the only coherent rule: `role-gate` requires a
  passing status, so a proposal that failed the audit could never be delivered through
  the gate that carries it.
- F2: FIX — the two negatives now run against the whole file after whitespace collapse
  (the suite's existing `flat` helper); a mutation inserting the phrases wrapped across
  lines fails both checks, while the old line-based greps passed it.
- F3: FIX — the positive check now pins the full sentence: "is a nonblocking finding
  whose text starts with `PROPOSAL:` and names the proposed path and assertion"; a
  mutation dropping "nonblocking finding" fails.
- F4: FIX — a dated correction note is appended to this track's `spec.md`; the baseline
  had file-wide schema-2 and A1–A10 negatives, and only the audit-outputs assertion was
  positive-only.
- F5: FIX — the Group (a) row's Status is now `Resolved`, with the note naming the
  contract track, fix2, and fix3.

Delivered by the fix3 track; this track's spec and index carry the corrections.

> **Correction (2026-11-10, after the review):** the F1 status rule the fix2 doc
> delivered ("A proposed guard that would fail produces `status: "fail"`") was
> inconsistent with the candidate definition and with `passing_audit_feedback()`, which
> requires `status: "pass"`; fix3 replaces it with a nonblocking proposal that leaves the
> status `pass` and pins the wording. The fix2 doc-test negatives were line-based and
> the format check pinned two tokens; fix3 makes both whole-file and sentence-complete.
