# shell visibility for every adapter: live and gate evidence

Date: 2026-11-08 (track records use the 2026-11-10 track date)

## What changed

- the bounded grammar moved from `plugins/dsh-measure-guard/src/shell.js` into the shared core (`mods/measure-guard/hooks/guards.ts`), the mod source of truth; the DSH module is a one-line re-export and its 14 shell tests pass unchanged; the parity gates hold the three copies together;
- the mod `tool.call` and the OpenCode `onToolBefore` resolve each `shellWritePaths` target (absolute kept, relative against the root) and run the edit guard and the strict TDD guard, first denial wins; the commit handling is unchanged;
- each adapter's edit-guard TS suite gained the cases (source sed denied without a [~] task, `measure/` target allowed, clean Bash untouched). Those bun runners are not available in this workspace; the wiring was verified by review and the shared grammar by the DSH node suite.

## Gates

- node: 352/352 pass (including the 14 shell grammar tests through the re-export)
- parity: ok (both gates)
- spec-review-gate: 12 suites (PASS=12, FAIL=0)
- CLI: 14 passed, 0 failed

## Live check (the DSH plugin digest changed because shell.js and core/guards.ts changed)

```
PASS live: HTTP 200 with a band field; digest sha256:7e5004466b047ea46 matches the installed copy
```
