# limits documentation: evidence

Date: 2026-11-08 (track records use the 2026-11-10 track date)

## What is now documented

- **DSH README, Known limits:** the guard root comes from the working directory (a subagent with a `cwd` keeps the parent session root, so its project is outside the guard; a headless profile cannot host the plugin because the band and panel are web-client surfaces; no per-agent re-root API); an extremely wide allow list costs memory (read per snapshot; the operator owns the file).
- **OpenCode README, Known limitations (OpenCode 2.0.32):** a synthetic command reply arrives with the next prompt (the band shows the bypass from the state file); the end-of-turn trigger is `session.execution.*` with a 1 s debounce because `session.idle` does not reach plugin subscriptions (recheck next release); `multiedit` is listed though absent (kept for a later release, ignored while absent).

## The pin

`tests/dsh/test-docs.sh` `check_limits` requires the named `## ` section with at least two bullets in both adapter READMEs, and a fixture without the section is rejected.

## Live check proves the copy check

The first `--check --live` after the README edits reported `FAIL plugin: stale README.md (the source moved on)` — the installed plugin copy lagged the source. After `bin/measure-dsh install` the check is clean:

```
PASS live: HTTP 200 with a band field; digest sha256:a430b66932b86b5cc matches the installed copy
check complete
```

## Rows closed

Resolved: the root resolution, the name-rule approximation, the three OpenCode 2.0.32 runtime rows, and the allow-list memory row (each with its document reference). One Red-gate row from concurrent work remains open.

## Gates

- CLI: 14/14 (with the limits checks)
- srg: 12/12
- node: 354/354
- parity: ok (both gates)
