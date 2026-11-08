# commit wrapper closure: live and gate evidence

Date: 2026-11-08 (track records use the 2026-11-10 track date)

## The gap

`addedPaths` ignored an unreadable wrapper: `bash scripts/add.sh`, `sh -e add.sh`, `source add.sh`, `. add.sh`, `./scripts/add.sh`, and `/tmp/add.sh` all contributed nothing, so a script that staged a file then committed hid the add from the no-task rule.

## After the fix (fail closed)

```
bash scripts/add.sh        -> all=true (every working-tree change counts)
source add.sh              -> all=true
./scripts/add.sh           -> all=true
bash -c "git add x"        -> paths [x] (unchanged)
eval "git add x"           -> paths [x] (unchanged)
bash                       -> no paths
git add x                  -> paths [x]
```

A `--` before `-c` now fails closed too, because bash treats `-c` as a script file name in that position.

Shell functions defined inline and a future git global option remain the documented residual (the parser is bounded, not a shell).

## Live check

`install` + `reload` recomposed the running Host; the check passed:

```
PASS live: HTTP 200 with a band field; digest sha256:0809cb69a4b4f97d3 matches the installed copy
```

## Gates

- node: 352/352 pass
- parity: ok (both gates)
- spec-review-gate: 11 suites (PASS=11, FAIL=0)
- CLI: 13 passed, 0 failed
