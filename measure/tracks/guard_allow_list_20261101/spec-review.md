# Spec Review: guard_allow_list_20261101

Author model: claude-code/claude-opus-5-5[1m]

The `measure-spec-review` role writes each round to `measure/runs/guard_allow_list_20261101/spec-review-<short-head>.json` and `.log`. The orchestrator copies each round below.

## Round 1

Date: 2026-11-01
Reviewer: measure-spec-review, deepseek/deepseek-flash#high (artifacts `spec-review-7f62ec6.json` and `.log`; gate PASS)

### What this track proposes
This track adds a per-repository allow list to the measure guard. The file `measure/guard-allow` holds folder paths, one per line, with comment lines. A write under a listed folder counts as Measure work in the edit guard, the end-of-turn check, the commit guard, and the TDD guard, also while no task is `[~]`. The parser rejects an absolute path, a `..` segment, a wildcard, an entry with no trailing `/`, and an entry that names the project root, and it records the reason. The mod files change first, the plugin copies follow, and the track then writes the list for the four output folders of advantage-pr.

### How the current system works, per this spec
The pure guard decisions are in `mods/measure-guard/hooks/guards.ts` and `parse.ts`, and the OpenCode plugin keeps byte copies in `src/core/` with a parity script. Each guard reads a `Snapshot` that `loadSnapshot` builds from the Measure files, in `register.tsx` for the mod and in `snapshot.ts` for the plugin. Four path rules treat a path inside `measure/` as Measure work: the edit guard, the end-of-turn problem, the commit guard, and the TDD guard. `statusLines` gives the text of the `/measure-guard` reply, the `measure_status` tool, and the terminal sidebar. The hourly installer copies the plugin from the `main` ref.

### Findings
- F1 [Major] plan.md Task 1.1: The mod test names a world with `realFiles()` and no `[~]` task, but `realFiles()` holds the measure-guard plan with `- [~] Task 1.4` (`mods/measure-guard/tests/fixtures/real.ts`), so `editDecision` opens every path (`hooks/guards.ts:55`) and the denies of `collect.py` and `work-old/a.md` cannot happen; the state needs the unmarking that `noTaskFiles()` does in `tests/edit-guard.test.ts:12-17`. Rationale: the named state contradicts the named fixture, so the allow case passes for the wrong reason and the two deny cases fail for a fixture reason, which Task 1.1's own acceptance line forbids.
- F2 [Major] plan.md Task 1.1: The mod loader has no named test for the failure paths of Decision 10 (a folder at `measure/guard-allow`, and `allow` carried on a `parseError` return); only the plugin loader case at plan line 38 tests them. Rationale: Decision 10 applies to both loaders, and `register.tsx` reads the file through `$.fs` with its own outer catch, so a missing inner catch would set `parseError` and no test would catch it.
- F3 [Nit] spec.md Current system: Bullet 2 says `turnProblems` treats a path inside `measure/` as Measure work, but the exclusion is in `changedDuringTurn` (`hooks/guards.ts:194-200`), and `turnProblems` receives the list after that filter. Rationale: the map of the four path rules is inaccurate about where the filter lives; Decision 6 still puts the allow filter in `turnProblems`, so the build does not change.

### Author Response
- F1: FIX
- F2: FIX
- F3: FIX
