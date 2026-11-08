# commit global options: live and gate evidence

Date: 2026-11-08 (track records use the 2026-11-10 track date)

## The gap, measured on the adapter before the fix

`addedPaths` returned an empty path set for every one of these, so a hidden `git add` in the same command was invisible to the no-task commit rule:

```
git -c core.quotepath=false add secret.txt   -> paths []
git --no-pager add secret.txt               -> paths []
git --git-dir /tmp/g add secret.txt         -> paths []
git --git-dir=/tmp/g add secret.txt         -> paths []
git -p add secret.txt                       -> paths []
git --literal-pathspecs add secret.txt      -> paths []
git -c a=b -C /tmp add secret.txt           -> paths []
```

## After the bounded option table

All ten documented forms contribute the path; `git --future-option add secret.txt` sets `added.all` (fail closed), and `X=$(git -c k=v add secret.txt)` also fails closed. See commit.test.js: "addedPaths sees the add through the documented git global options", "an unknown git global option before the add fails closed", "a command substitution with a global option fails closed too".

## Live install and digest

`bin/measure-dsh install` + `reload` (nonce 9) recomposed the running Host; the check passed every item:

```
PASS live: HTTP 200 with a band field; digest sha256:66ae3f7c65bbb0151 matches the installed copy
WARN plugin: edited src/core/parse.ts (preserved local edit)
```

## Gates

- node: 327/327 pass (324 -> 327 with the option-table, fail-closed, and substitution cases)
- parity: ok (both gates)
- spec-review-gate: 11 suites (PASS=11, FAIL=0)
- CLI: 13 passed, 0 failed
