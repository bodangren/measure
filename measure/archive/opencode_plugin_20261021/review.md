# Review Report: OpenCode plugin (opencode_plugin_20261021)

## Summary

The track delivers the full plugin scope, but its own test suite fails at HEAD, so the track is not ready to archive.

## Verification Checks

- [ ] **Plan Compliance**: Yes - All 48 plan tasks are `[x]` with SHAs, and all 9 phases carry checkpoints.
- [ ] **Style Compliance**: Pass - The changed Markdown files follow the style guide. No secrets or unsafe input handling were found.
- [ ] **New Tests**: Yes - `plugins/opencode-measure-guard/tests/` holds 11 test files with 85 tests.
- [ ] **Test Coverage**: Partial - Guards, hooks, commands, state, snapshot, and TUI model are covered. One closeout test fails.
- [ ] **Test Results**: Failed - `bun test plugins/opencode-measure-guard` gives 84 pass and 1 fail (exit 1).
- [ ] **Browser Console Errors**: Skipped (no frontend changes; browser check not run per review brief).
- [ ] **Network Errors**: Skipped (browser check not run per review brief).
- [ ] **Visual Check**: Skipped (browser check not run per review brief).
- [ ] **Graph Caller Check**: Skipped (graph.db is missing).

## Findings

### High: Closeout test fails because the fixture depends on mutable repo content

- **File**: `plugins/opencode-measure-guard/tests/closeout.test.ts` (Lines L41-L55)
- **Context**: The test builds its fixture from the live repo files (`measure/tracks.md` and the track `plan.md`). It expects a `[b]` note on an allowed track close. That note only exists when the plan holds `[b]` tasks. During the track the plan held 9 `[b]` verification lines, so the test passed. Commit `0a0a75c` marked those 9 lines `[x]`. The plan now holds zero `[b]` lines. `trackCloseDecision()` returns `note: null`, and the assertion `toContain('[b] tasks')` fails. The plugin source is correct; the test is brittle. This breaks track acceptance criterion 2 (`bun test` passes).
- **Suggestion**:
```diff
- const closed = readFileSync(planPath, 'utf8')
-   .replace(/^- \[~\] /gm, '- [x] ')
-   .replace(/^- \[ \] (Task[^\n]*)$/gm, '- [x] $1 `abc1234`')
+ const closed = readFileSync(planPath, 'utf8')
+   .replace(/^- \[~\] /gm, '- [x] ')
+   .replace(/^- \[ \] (Task[^\n]*)$/gm, '- [x] $1 `abc1234`')
+   .concat('\n- [b] Task: fixture deferred task deferred:owner\n')
```

### Low: Type-check lockfile side effect is uncommitted

- **File**: `plugins/opencode-measure-guard/bun.lock` (Lines L1-L1)
- **Context**: Running `bun install` for the type check may update the lockfile. The diff stays out of this review commit.
- **Suggestion**:
```diff
- (no code change; verify `git status` before the fix track commits)
+ (no code change; verify `git status` before the fix track commits)
```

## Check Evidence

| Check | Command | Exit |
|---|---|---|
| Parity gate | `bash plugins/opencode-measure-guard/scripts/check-parity.sh` | 0 (`parity: ok`) |
| Unit tests | `bun test plugins/opencode-measure-guard` | 1 (84 pass, 1 fail; `closeout.test.ts:54`) |
| Type check | `bun x tsc --noEmit -p plugins/opencode-measure-guard` (after `bun install`) | 0 |
| Mod unchanged | `git diff main -- mods/measure-guard` | empty |
| Installer rows | `grep opencode bin/install-targets.tsv` | 3 rows present (plugin, commands, agents) |
| Live OpenCode service | not run (excluded by review brief) | n/a |
| Browser runtime check | not run (excluded by review brief) | n/a |

## Spec Acceptance Comparison

1. Parity script exits 0: met.
2. `bun test` passes: NOT met (1 failure, see High finding).
3. `tsc --noEmit` passes: met.
4. Service log load check and live deny: not run (excluded by review brief; plan records them as done in Tasks 4.4 and 8.4).
5. Installer `--check` lists new targets: met in part (rows exist in `bin/install-targets.tsv`; `--check` itself exits 1 on this machine from pre-existing local edits of installed copies, unrelated to this track).
6. Claude Code mod byte-identical to `main`: met.

## Recommendation

I recommend we fix the important issue I found before moving forward. The archive step is stopped. A fix needs its own track. The High finding is test-only; no shipped guard logic is wrong.

## Open Questions

- None taken from defaults. The live service checks and the browser check were skipped per the review brief.

## Remediation

The High finding is fixed by commit `e90486d`. The plugin tests now read frozen copies in `plugins/opencode-measure-guard/tests/fixtures/` (source commit `a64c01f`). No test reads a live track path.

Re-run results:

- `bun test plugins/opencode-measure-guard`: exit 0 (85 pass, 0 fail).
- `bun x tsc --noEmit -p plugins/opencode-measure-guard`: exit 0.
- `bash plugins/opencode-measure-guard/scripts/check-parity.sh`: exit 0.
- `grep -rn "join(REPO, 'measure" plugins/opencode-measure-guard/tests`: no output.
