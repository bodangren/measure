# installer atomicity: evidence

Date: 2026-11-08 (track records use the 2026-11-10 track date)

## The change

`put()` writes `"$dst.measure-install.tmp.$$"` beside the target with the source mode and renames it; the stamp is written the same way; a failure removes the temp and the caller dies with `cannot write <path>` (exit 3). Header documents the atomic replacement and the hard-link trade-off.

## The test

`tests/dsh/test-skill-install.sh` builds a real fixture repository (real installer, custom targets, small bundle): install into an empty target reproduces the source and writes a complete stamp (header, ref/commit, one `file <hash>  <path>` per file); no `measure-install.tmp*` remains; with the target **folders** read-only the install fails and leaves both files byte-identical; restoring the modes lets the same install finish the update.

## Detection proof (old installer vs new)

The same test against the pre-fix installer (from the previous commit) fails at the read-only-folder step: `[FAIL] ... the read-only folder install unexpectedly succeeded` — an in-place `cat > file` writes a writable file inside a read-only folder. The new installer fails closed there, so the test actually distinguishes the atomic path.

## Live check

No plugin code changed; the installed-copy check passes:

```
PASS live: digest matches the installed copy
```

## Gates

- CLI: 14 passed, 0 failed (the new test included)
- spec-review-gate: 11 suites (PASS=11, FAIL=0)
- node: 352/352 pass
- parity: ok (both gates)
