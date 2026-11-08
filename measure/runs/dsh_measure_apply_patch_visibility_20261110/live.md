# apply_patch visibility: live and gate evidence

Date: 2026-11-08 (track records use the 2026-11-10 track date)

## Live install and digest (Story S1)

`bin/measure-dsh install` copied the changed plugin into the web profile; `bin/measure-dsh reload` bumped the reloadNonce to 7 so the running Host recomposed and loaded the new bytes. The live check then passed every item:

```
PASS live: HTTP 200 with a band field; digest sha256:a15cb4530e220c51d matches the installed copy
WARN plugin: edited src/core/parse.ts (a preserved local edit in the installed copy)
```

Before the install the same check reported `FAIL plugin: stale src/hooks.js, src/shell.js, src/guard.js ...` and `FAIL live: the running host loaded stale plugin code`. The pre-existing `FAIL skill-orchestrator` was a generated `scripts/__pycache__` directory in the source tree (gitignored); removing it made the copy count match and the check pass.

## Gates

- `node --test plugins/dsh-measure-guard/tests/*.test.js`: 324/324 pass, 0 fail (318 -> 324: new reconstruction/closeout/shell-copy cases)
- `bash plugins/dsh-measure-guard/scripts/check-parity.sh`: parity: ok
- `bash plugins/opencode-measure-guard/scripts/check-parity.sh`: parity: ok
- `bash tests/spec_review_gate/run.sh`: 11 suites (PASS=11, FAIL=0)
- `bash tests/dsh/run.sh`: 13 passed, 0 failed

## Behavior proved

- A readable `apply_patch` that closes a track is checked by the closeout guard and denied with the open-task list; an unreadable hunk still fails closed with the "cannot read the after-text" text.
- `str_replace_editor` `str_replace` on a plan with a valid replacement is allowed; the same operation closing a track is denied.
- `cp`/`mv`/`install` destinations are write targets (`-t`/`--target-directory` stay residuals), so a copied plan/registry reaches the shell deny.
