# shell redirect safety: live and gate evidence

Date: 2026-11-08 (track records use the 2026-11-10 track date)

## The gap, measured before the fix

`shellWritePaths` returned no targets for these, so the closeout/edit/TDD shell denies never saw the write:

```
echo hi >| measure/tracks.md          -> []
echo hi >|out.txt                    -> []
echo hi >| /repo/measure/tracks/a/plan.md -> []
```

## After the grammar change

`>|`/`2>|` are redirects (stream devices still excluded), and the `ln` destination joins the `cp`/`mv`/`install` family; `-t`/`--target-directory` stays the documented residual. The edit-guard shell-deny test now includes `echo hi >| /repo/measure/tracks/x/plan.md`, so the closeout deny is proven end to end for the new form.

## Live install and digest

`bin/measure-dsh install` + `reload` (nonce 13) recomposed the running Host; the check passed every item:

```
PASS live: HTTP 200 with a band field; digest sha256:b165cc649f4e31f96 matches the installed copy
WARN plugin: edited src/core/parse.ts (preserved local edit)
```

## Gates

- node: 333/333 pass (331 -> 333: the >| forms and the ln destination)
- parity: ok (both gates)
- spec-review-gate: 11 suites (PASS=11, FAIL=0)
- CLI: 13 passed, 0 failed
