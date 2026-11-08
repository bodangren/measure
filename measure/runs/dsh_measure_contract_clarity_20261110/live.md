# contract clarity: live and gate evidence

Date: 2026-11-08 (track records use the 2026-11-10 track date)

## What was written and pinned

- Group (f): `agents/measure-phase-acceptance.md` test-only HEAD-advance exception (test files or `measure/runs/` only; the acceptance records the exact HEAD and the allowed commits).
- Group (g): `new-track.md` step 9 — findings/items selected by id, Stop/resume wording, `secret redacted (location unknown)`, and approval that finalises the report; the `claude-skills/measure` copy is byte-identical (the S3 bundle check passes).
- Group (d): `contracts.md` role-result identity fields and model-selection rule.
- The host-path nit in `agents/measure-orchestrator.md` is already gone (no `/home/daniel-bo` under `agents/`).

## Pins

`tests/spec_review_gate/test_s3_dispositions_docs.sh` adds ten checks (88 -> 98): contracts identity/model, phase-acceptance exception, and the six step-9 decisions.

## Tech-debt

Group (d), (f), and (g) rows are now `Resolved` with the evidence; Group (b) states its refined remaining scope and stays open; Group (e) keeps its recipe residual (`..` claims).

## Live install and digest

`bin/measure-dsh install` re-synced the skill copies and `reload` (nonce 15) recomposed; the check passed every item:

```
PASS live: HTTP 200 with a band field; digest sha256:b165cc649f4e31f96 matches the installed copy
PASS skill-measure: all 24 files present
PASS skill-orchestrator: all 6 files present
```

## Gates

- spec-review-gate: 11 suites (PASS=11, FAIL=0); S3 98 checks
- CLI: 13 passed, 0 failed
- node: 333/333 pass
- parity: ok (both gates)
