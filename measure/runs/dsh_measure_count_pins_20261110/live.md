# count pins: mutation proof and gate evidence

Date: 2026-11-08 (track records use the 2026-11-10 track date)

## Derivation

`test_s4_doc_drift.sh` computes `CATALOG_COUNT` (A-entry headings) and `CATALOG_LAST` (highest A number) from the skills catalog, fails before any use when either is empty/zero, and uses them in: both catalogs' heading count, the orchestrator registry text, the strategy `(A1–A<last> today)`, the audit Inputs `A1–A<last> today`, and the negative "no file contains `A1–A<last-1>`".

## Mutation proof

A temporary `## A12 — Mutation probe` heading appended to the skills catalog (documents unchanged) made the suite fail with:

```
FAIL: measure/anti-patterns.md: A-entry headings: 11, expected 12
FAIL: orchestrator SKILL.md: Anti-Patterns Registry has '12 entries (A1–A12)': missing [12 entries (A1–A12)]
FAIL: agents/measure-strategy.md lacks '(A1–A12 today)'
FAIL: audit role: Inputs section says 'A1–A12 today': missing [A1–A12 today]
FAIL: 'A1–A11' occurs at: agents/measure-strategy.md:28 ...
```

After restoring the catalog the suite passed again (34 checks). The per-suite totals are printed, not asserted.

## Live check

`install` re-synced the skill copies and `reload` recomposed; the check passed:

```
PASS live: HTTP 200 with a band field; digest sha256:5133f1d25ed97daf9 matches the installed copy
```

## Gates

- spec-review-gate: 11 suites (PASS=11, FAIL=0); S4 doc drift 34 checks
- CLI: 13 passed, 0 failed
- node: 351/351 pass
- parity: ok (both gates)
