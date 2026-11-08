# A11 dotdot scope: live and gate evidence

Date: 2026-11-08 (track records use the 2026-11-10 track date)

## The residual and the bound

Group (e) recorded that the A11 doc-drift recipe tested `..` claims outside the repository. Both catalogs now skip any claim containing a `..` segment before the existence check, and the paragraph states the rule plus that the candidates are reports, not confirmed drift. The blocks stay byte-identical (G1 equality).

## Contract proof

`tests/spec_review_gate/test_s4_adversarial.sh` replaces the old `dotdot_absent` row (which expected a line for `../absent_zz.txt`) with:

- `dotdot_outside`: a `..` claim that leaves the repository gives no line;
- `dotdot_inside`: a `..` claim that resolves inside the repository also gives no line (conservative rule).

The inside-repository rows (`existing`, `missing`, `space`, `nul_*`, `nonutf8_*`, …) keep their exact lines and ordering. S4 93 → 94 checks.

## Live install and digest

`bin/measure-dsh install` re-synced the skill copies and `reload` (nonce 21) recomposed; the check passed every item:

```
PASS live: HTTP 200 with a band field; digest sha256:b165cc649f4e31f96 matches the installed copy
```

## Gates

- spec-review-gate: 11 suites (PASS=11, FAIL=0); S4 94 checks
- CLI: 13 passed, 0 failed
- node: 342/342 pass
- parity: ok (both gates)
