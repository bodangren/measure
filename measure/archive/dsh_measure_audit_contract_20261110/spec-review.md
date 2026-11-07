# Spec Review: dsh_measure_audit_contract_20261110

Author model: deepseek-official/deepseek-flash

## Round 1

Date: 2026-11-10
Reviewer: subagent (fresh context, default model)

### What this track proposes

Moving the audit role's example to schema version 1, adding an
`orchestrator-audit` role gate (aliases, `--result-file`, payload validation,
`PASS: orchestrator-audit gate passed`), making Outputs #2/#3 proposals, and
pinning the doc's schema version and the gate with tests; rows, CHANGELOG,
metadata, archive, closeout; gates srg 11/11, CLI 13/13, node 318/318, parity.

### How the current system works, per this spec

`ROLE_ALIASES` has no audit-role name, so `role-gate` and `audit-result` reject
`orchestrator-audit`; the audit-role branch requires `--result-file` and routes
through `passing_audit_feedback`/`validate_audit_payload`. The doc's example uses
schema version 2 against `AUDIT_SCHEMA_VERSION = 1`, and its Outputs #2/#3 ask the
role to append to the catalog and write guard tests although permissions allow
only `measure/runs/**`.

### Findings

- F1 [Major] FR-3/Task 1.2: Outputs #2/#3 were fixed but the role doc still ordered denied edits in Detectors item 3 ("you may write a focused guard test") and implied them in Inputs item 1 ("New entries get appended"), so the recorded contradiction remained.
- F2 [Major] FR-3/Task 1.2: nothing defined where a candidate lives in the audit result, so the proposal format was left to the implementer.
- F3 [Major] FR-4/Task 1.3: the S4 assertion was positive-only and file-wide, so it could pass while a write instruction remained.
- F4 [Major] FR-4: no case covered the `measure-orchestrator-audit` alias used in the skill/dev workflow.
- F5 [Nit] Overview: "only audit-result validation" was inaccurate — `audit-result` also resolves the role, so it rejects the role too.
- F6 [Nit] NFR-1: "one alias table entry" contradicts the two entries FR-2 requires.
- F7 [Nit] Out of Scope: the remaining Group (b)/(f)/(g) wording omitted the Group (d)/(e) remainders.
- F8 [Nit] Task 2.2/task count: metadata estimated 4 while the plan lists 8 task lines.

### Author Response

- F1: FIX (delivered by `dsh_measure_audit_contract_fix2_20261110`: Inputs item 1 and Detectors item 3 say proposals, not appends/writes)
- F2: FIX (fix2 defines the format: a candidate is a nonblocking finding whose text starts with `PROPOSAL:` with the proposed path and assertion)
- F3: FIX (fix2 adds whole-file negative checks for "entries get appended" and "you may write a focused guard test" alongside the positive format check)
- F4: FIX (fix2 adds the `measure-orchestrator-audit` alias gate case)
- F5: FIX (the correction note corrects the Overview wording)
- F6: FIX (the correction note states two alias lines plus one role-set membership)
- F7: FIX (the correction note says Group (b)/(f)/(g) and the Group (d)/(e) remainders remain out of scope)
- F8: FIX (the fix2 metadata uses its own plan count; this track's archive records 8/8)

Delivered by the fix2 track; this track's code/doc/tests shipped here.
