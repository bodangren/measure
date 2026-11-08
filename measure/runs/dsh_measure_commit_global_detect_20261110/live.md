# commit global detection: live and gate evidence

Date: 2026-11-08 (track records use the 2026-11-10 track date)

## The fail-open gap, measured before the fix

`parseCommitCommand` returned null for every one of these, so the strict commit guard treated the command as a non-commit and skipped the message-format and no-task rules:

```
git --no-pager commit -m "feat(app): Add"   -> null
git -p commit -m "feat(app): Add"           -> null
git --bare commit -m "feat(app): Add"       -> null
git --literal-pathspecs commit -m "..."      -> null
git --git-dir /tmp/.git commit -m "..."    -> null
git --git-dir=/tmp/.git commit -m "..."    -> null
git -C/tmp commit -m "feat(app): Add"       -> null
git -c user.name=x commit -m "feat(app): Add" -> null
```

## After the core detector change

Every form returns `{ message, takesChanges }`, and `git log` / `git --no-pager log` / `git --no-pager status` still return null. The no-task rule now fires through `git --no-pager commit` (test: "the strict no-task deny fires through a git global option") and `-a` through a global option still contributes the tracked files (test: "commitTakesAll reads -a through a global option"). Copies synced; both parity gates ok.

## Live install and digest

`bin/measure-dsh install` + `reload` (nonce 11) recomposed the running Host; the check passed every item:

```
PASS live: HTTP 200 with a band field; digest sha256:364937c00b1a9f1ed matches the installed copy
WARN plugin: edited src/core/parse.ts (preserved local edit)
```

## Gates

- node: 331/331 pass (327 -> 331: the parse forms, the git log controls, the strict deny, and the -a case)
- parity: ok (both gates)
- spec-review-gate: 11 suites (PASS=11, FAIL=0); S3 docs 87 -> 88 checks with the commit-detection pin
- CLI: 13 passed, 0 failed
