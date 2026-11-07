# Spec Review: dsh_measure_reload_20261107

Author model: deepseek-official/deepseek-flash

## Round 1

Date: 2026-11-07
Reviewer: subagent (fresh context, default model)

### What this track proposes

A bug-fix track replacing the `# measure-dsh reload marker` comment toggle with a `reloadNonce: <integer>` in the managed plugin entry's `config`: `bin/measure-dsh reload` and an unchanged-block `install` increment it, the marker is removed, a missing nonce reads as 0, and every other patch entry stays byte-equal with the existing atomic write. The plugin documents and ignores the field; the two CLI contract tests must show the nonce (not a comment) is what changed; a live proof writes a temporary `strict` override and expects the state route to report `strict (repository)`, then clears it and expects `guard (config)`. Docs, README, CHANGELOG, lessons, tech debt, metadata, and the registry/archive are updated.

### How the current system works, per this spec

`bin/measure-dsh` writes one managed `cordis.patch.yml` block whose entry config carries `mode`; `--check --live` compares the running instance's digest header with the installed copy. `reload` and an unchanged-block `install` changed only a comment line, so the loader skipped the recompose and the plugin kept its cached `repos.json` store — a session on `guard (config)` although the file held a `strict` override. The state route is `GET /measure-guard/state?sessionId=<id>`, which answers 404 without a live id and returns `{"mode":{"value":…,"source":…}}`.

### Findings

- F1 [Blocker] spec.md FR-4 and Acceptance Criteria with plan Task 2.1: the live read was not executable as written — the route needs `?sessionId=<live agent>` (404 otherwise), returns a JSON mode object rather than the `<mode> (repository)` string, and the session/cookie transport was unnamed.
- F2 [Blocker] plan Task 2.2 / spec FR-4: cleanup and its evidence were not checkable — no evidence file name, no `repos.json` path, no clearing command, no pre-run value; the operation mutates the store that guards every session in this repository.
- F3 [Blocker] spec FR-1 / plan Task 1.1: three command cases were undefined — a reload on a patch without a complete managed block, the nonce written by a changed-block install, and a non-integer `reloadNonce`.
- F4 [Major] spec FR-3 / plan Task 1.2: the contract tests were not exact — no expected nonce values, no missing-nonce default case, and the new PASS/dry-run strings unnamed although the tests assert exact strings.
- F5 [Major] spec FR-5 / plan Task 3.1: "the stale-reload lesson stays accurate" did not identify the lesson; `measure/lessons-learned.md` still told the reader to toggle a marker comment line.
- F6 [Major] plan Phase 3 / Tasks 3.1-3.2: the docs/closeout phase had no verification run, so `tests/dsh/test-docs.sh` (inside the CLI suite) never gated the doc edits.
- F7 [Nit] spec Overview: "toggled on every reload" contradicted "increments" and reused the defect's vocabulary.

### Author Response

- F1: FIX (the follow-up corrected the archived record to `GET /measure-guard/state?sessionId=<live id>`, the JSON shape, the store path, the evidence file `live-reload.md`, and the digest)
- F2: FIX (cleanup now names the store path, the key-deletion command, the pre-run "no entry" value, the restored values, and the evidence file)
- F3: FIX + tests (no complete block: `FAIL reload: no complete managed block`, exit 1, writes nothing; a changed-mode install keeps the nonce; a non-integer nonce reads as 0 and the next write is 1 — all pinned in `tests/dsh/test-reload.sh`)
- F4: FIX (exact values: fresh install 0, reload 1 then 2, unchanged install 3, old patch 1, changed mode keeps it; exact strings asserted)
- F5: FIX (the lesson now says a comment/trailing-newline change composes nothing and names the nonce as the worked fix)
- F6: FIX (the archived plan gained Task 3.3: re-run `bash tests/dsh/run.sh` after the docs/closeout edits; the follow-up track ran it on the final tree)
- F7: FIX (the Overview says "incremented")

These responses are recorded by the follow-up track `dsh_measure_reload_followup_20261107`.
