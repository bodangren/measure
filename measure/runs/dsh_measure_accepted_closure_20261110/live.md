# accepted-risk closure: evidence

Date: 2026-11-08 (track records use the 2026-11-10 track date)

## The five closures

1. **Three-adapter core duplication** — the triple copies are the design the no-build-tools repository can carry; each copy is held by a parity gate that fails on divergence, and a published package needs a build tool the repository does not have.
2. **Managed profile block, textual edit** — deliberate (a re-serialization would rewrite the user file and comments); fail-closed: marker-delimited, a hand-written row is refused, an unusual reformatting is treated as foreign and stops the CLI.
3. **Cron-free plugin writer** — the CLI is the only writer by design (a second writer races it); drift is detectable: `--check --live` compares the loaded digest with the installed copy, and `test-check.sh` case 3c proves a stale stamped plugin file fails the check.
4. **Commit guard pre-run staged read** — compensated in the decision: `addedPaths` scans the same command for add/stage (substitutions, nested shells, documented global options; unreadable wrappers fail closed) and the union with the staged set feeds the no-task rule; `commit.test.js` pins an in-command add with an empty staged set denying on its own path.
5. **GUI-only mode setting** — deliberate: giving the guarded party a setter would let it loosen its own guard; the read-only tools are the agent surface, and `plugin.test.js` now pins that no registered tool takes a parameter.

## New pin

The plugin registration test asserts every registered tool (`measure_status`, `measure_verify`, `measure_mode`) has empty `parameters.properties`; a mode setter would turn the gate red.

## Live check (no plugin code change; digest unchanged)

```
PASS live: HTTP 200 with a band field; digest sha256:a430b66932b86b5cc matches the installed copy
```

## Gates

- node: 354/354 pass
- parity: ok (both gates; the closure cites them)
- srg: 12/12 suites
- CLI: 14/14 (including test-check case 3c)
