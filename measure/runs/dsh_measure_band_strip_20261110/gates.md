# Band-strip verification results

Date: 2026-11-10

## Package suite

```
cd plugins/dsh-measure-guard && node --test tests/*.test.js
tests 356, pass 356, fail 0
```

The render suite grew from 12 to 14 tests (one-row style, `Problems: <n>` chip
with the full list in its title and click-to-panel, setup buttons absent in a
`measure/` project, setup offer rendering and POST, panel problem section, zh
labels); the state, shell, bundle, and core tests are unchanged.

## Parity and repository gates

```
plugins/dsh-measure-guard/scripts/check-parity.sh      parity: ok
plugins/opencode-measure-guard/scripts/check-parity.sh parity: ok

bash tests/dsh/run.sh
== summary: 14 passed, 0 failed ==                     (EXIT 0)

bash tests/spec_review_gate/run.sh
=== spec_review_gate: 13 suites (PASS=13, FAIL=0) ===   (EXIT=0)
```

The core files and the state route are untouched, so both parity gates stay ok.
