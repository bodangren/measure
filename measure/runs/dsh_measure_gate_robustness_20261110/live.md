# gate robustness: live and gate evidence

Date: 2026-11-08 (track records use the 2026-11-10 track date)

## G19 committed corpus (the foreign-log proof)

A foreign untracked log was planted at `measure/runs/foreign_proof/bad.log` with an invalid `dispositions:` line. The old filesystem walk would have included it (rglob logs: 95, foreign included: True) and the corpus assertion "no log gives dispositions feedback" would have failed; the new `git ls-files` corpus ignored it and S3 stayed green:

```
PASS: G19 live corpus: the committed corpus holds at least one log
REPORT: G19 live corpus: 94 logs, 94 with both exact lines
PASS: G19 live corpus: no log gives dispositions feedback or a Traceback
PASS: G19 live corpus: each log with both exact lines exits 0
```

A git failure is a recorded FAIL, so the corpus cannot silently pass when it cannot be listed.

## A11 pipefail tolerance

Before: `bash -o pipefail` on empty documents exited 1 (the first `grep` finds no match). After the `done || true` change the S4 report row shows `rc=0 stdout=[] stderr=` and the new pin "G3 report: bash -o pipefail: an empty document exits 0" passes; both catalogs hold byte-identical recipe blocks (the G1 equality check passes).

## Unreleased brittleness

The CHANGELOG credit check now searches the whole file, so moving the credit into a released section cannot fail S4 doc drift (33 checks).

## Live install and digest

`bin/measure-dsh install` re-synced the skill copies and `reload` (nonce 17) recomposed; the check passed every item:

```
PASS live: HTTP 200 with a band field; digest sha256:b165cc649f4e31f96 matches the installed copy
```

## Gates

- spec-review-gate: 11 suites (PASS=11, FAIL=0); S3 107 checks, S4 93 checks, S4 doc drift 33 checks
- CLI: 13 passed, 0 failed
- node: 333/333 pass
- parity: ok (both gates)
