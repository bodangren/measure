# agent tools: live and gate evidence

Date: 2026-11-08 (track records use the 2026-11-10 track date)

## The tools

- `measure_verify`: read-only, no parameters; returns `verifyReport` for the calling agent (git-backed problems, metadata `actual_tasks` verdict, or `measure-guard: verification clean (<n> tasks checked).`).
- `measure_mode`: read-only, no parameters; returns `measure-guard: effective mode <value> (<source>).` from `effectiveMode`; no set path.

## Live proof (running Host, after install + reload)

The reloaded plugin registered both tools in the running session: the tool schemas `measure_verify` and `measure_mode` appeared in the session's available tools immediately after the reload, with the exact descriptions the definitions carry. The live check passed with the new digest:

```
PASS live: HTTP 200 with a band field; digest sha256:5133f1d25ed97daf9 matches the installed copy
```

## Tests

- plugin.test.js: three registered tools (`measure_status`, `measure_verify`, `measure_mode`).
- verify.test.js: the tool shape, the clean report, and a problem report (missing git note).
- modes.test.js: the tool shape, the repository/session/config sources, and no write.
- node suite 349 -> 351.

## Gates

- node: 351/351 pass
- parity: ok (both gates)
- spec-review-gate: 11 suites (PASS=11, FAIL=0)
- CLI: 13 passed, 0 failed
