# TDD name rules: live and gate evidence

Date: 2026-11-08 (track records use the 2026-11-10 track date)

## The gaps, measured on the adapter before the fix

`isTestFile` returned false for nested test-directory paths and `isTestCommand` returned false for the `node --test` runner:

```
tests/unit/x.py                                -> false (single-segment rule)
src/__tests__/deep/x.ts                        -> false
plugins/a/tests/deep/y.js                      -> false
node --test tests/*.test.js                    -> false
node --experimental-strip-types --test x.ts    -> false
```

## After the widened rules

All five are true; `tests/README.md`, `src/app.js`, `docs/spec/guide.md`, `node -e "run()"`, and `node script.js` stay false, and `npm test`/`pytest -q`/`go test ./...` keep matching. Tests: core.test.js pins the positives and the negative controls; node suite 348 → 349.

## Live check

```
PASS live: HTTP 200 with a band field; digest sha256:37bb91fd5db36d24f matches the installed copy
```

## Gates

- node: 349/349 pass
- parity: ok (both gates; the DSH and OpenCode core copies are byte-identical after their transforms)
- spec-review-gate: 11 suites (PASS=11, FAIL=0)
- CLI: 13 passed, 0 failed
