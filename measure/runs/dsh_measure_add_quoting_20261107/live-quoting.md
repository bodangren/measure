# Live evidence — quote-aware git add (installed plugin)

Date: 2026-11-07

Installed digest: sha256:3d732c439b706149b (from bin/measure-dsh --check --live PASS).

## Installed addedPaths on tricky commands

{"command":"git add \"src/a b.ts\" && git commit -m \"feat(a): B\"","added":{"all":false,"trackedOnly":false,"paths":["src/a b.ts"]}}
{"command":"git add 'docs/x y.md' && git commit -m 'docs: Y'","added":{"all":false,"trackedOnly":false,"paths":["docs/x y.md"]}}
{"command":"git add -- -x.ts && git commit -m \"fix(X): Z\"","added":{"all":false,"trackedOnly":false,"paths":["-x.ts"]}}
{"command":"git add -u \"src/a b.ts\" && git commit -m \"fix: Y\"","added":{"all":false,"trackedOnly":true,"paths":["src/a b.ts"]}}
{"command":"git add src/a.ts # not a path && git commit -m \"x\"","added":{"all":false,"trackedOnly":false,"paths":["src/a.ts"]}}
{"command":"git add \"src/half.ts && git commit -m \"x\"","added":{"all":true,"trackedOnly":false,"paths":[]}}

## Real scratch repository with a space in the filename

staged: file with space.ts
addedPaths: {"all":false,"trackedOnly":false,"paths":["file with space.ts"]}
