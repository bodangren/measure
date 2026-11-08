# Audit contract fix3 evidence

Date: 2026-11-08 (track records use the 2026-11-10 track date)

## Phase 1 (e0d9eac / checkpoint f3abe17)

Role doc: Detectors item 3 now says a proposed guard that would fail is a nonblocking candidate, does not change the audit result, and `status` stays `"pass"`; only a catalog violation the audit itself blocks produces `status: "fail"`.

Test: `tests/spec_review_gate/test_s4_doc_drift.sh` 31 -> 33 checks; the whole-file collapsed negatives and the full format sentence plus status rule pass.

Mutation proofs (audit doc restored after each):

- wrapped "entries get / appended" and "you may write a focused / guard test": 2 FAIL (the old line-based greps passed this);
- dropped "nonblocking finding" from the format sentence: FAIL "the candidate format sentence is missing or incomplete";
- flipped "does not change the audit result": FAIL "the proposed-failing-guard status rule is missing or incomplete".

## Gates (Task 2.1)

- node --test plugins/dsh-measure-guard/tests/*.test.js: 318/318 pass, 0 fail
- check-parity.sh (dsh): parity: ok
- check-parity.sh (opencode): parity: ok
- tests/spec_review_gate/run.sh: 11 suites (PASS=11, FAIL=0)
- tests/dsh/run.sh: 13 passed, 0 failed

## Records

- fix2 review F1-F5 recorded in measure/archive/dsh_measure_audit_contract_fix2_20261110/spec-review.md with dispositions and a dated note; index links it; fix2 spec carries the dated correction note (F4).
- Group (a) tech-debt row Status is Resolved with the fix3 note (F5).
- CHANGELOG updated.
