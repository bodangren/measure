# Spec Review: dsh_measure_commit_nested_fix3_20261109

Author model: deepseek-official/deepseek-flash

## Round 1

Date: 2026-11-09
Reviewer: subagent (fresh context, default model)

### What this track proposes

Closing the fix2 review's option-argument gap: skipping the argument of
`-o`/`-O` and a `--` token while hunting for `-c`, pinning the `depth > 3` cap
with a three-passes/four-fails pair, and correcting the fix2 review record, the
fix1 review's false F5, the CHANGELOG count, and the residual.

### How the current system works, per this spec

`addedPaths` walks command-position words; for a shell it walked leading `-`
tokens looking for a `c` cluster and recursed into the next word, capped by
`depth > 3`. The option walk stopped at the first non-option token, so `-o
pipefail` and `-O extglob` hid the following `-c`, while `bash -c -- <string>`
already worked through the generic option skip. The adapter passes
`commitTakesAll`, not the core `takesChanges`; the fix1 fixture had empty
staged/status, so only the recursion denied it. The CHANGELOG said `node 306
tests`; the fix2 review had no file in its archive.

### Findings

- F1 [Major] FR-1: only an exact `-o`/`-O` token was skipped, so `bash -euo pipefail -c` and `bash --rcfile FILE -c` still hid the add while `--opt=value` is rejected by bash.
- F2 [Major] FR-1/Task 1.2: the `--` rule was unpinned and only altered a command bash rejects; `bash -c -- <string>` already worked and the acceptance criteria never mention `--`.
- F3 [Major] FR-3/Task 2.1: "the residual wording" named no file; the target is the commit-race row in `measure/tech-debt.md`.
- F4 [Major] FR-3/Task 2.1: the fix2 review it ordered recorded existed in no repository file and the spec gave only five one-line summaries with no severity, scope, disposition, date, or reviewer.
- F5 [Major] FR-3/Overview F4: the false text is the fix1 review's F5 *finding*, not its disposition; editing the disposition would leave the claim standing.
- F6 [Nit] FR-3/Task 2.1: the CHANGELOG replacement count was not pinned (308 at HEAD, 310 after the new tests) and the acceptance omitted the CHANGELOG/residual deliverables.
- F7 [Nit] Overview F2/FR-2: "off by one" did not identify the text; the comment already matched `depth > 3`, and the off-by-one sentence is fix2 spec FR-1's "depth 5 and beyond returns `all: true`".

### Author Response

- F1: FIX (the option loop steps over the argument of `-o`/`-O`, a short cluster ending in `o`/`O` (`-euo`), and `--rcfile`/`--init-file`; cases cover `bash -euo pipefail -c` and `bash --rcfile FILE -c`)
- F2: FIX (the rule now matches bash: a `--` after `-c` is skipped and the following word is the command string; a `--` before any `-c` stops the scan; cases cover `bash -c -- <string>` (path) and `bash -- -c <string>`/`bash -o pipefail -- -c <string>` (no path); the acceptance names them)
- F3: FIX (the residual target is `measure/tech-debt.md`'s commit-race row; it now names option-argument forms outside the known set, arbitrary wrapper scripts, and shell functions)
- F4: FIX (`measure/archive/dsh_measure_commit_nested_fix2_20261109/spec-review.md` holds F1–F5 with severity/scope, dispositions, date, and reviewer, and is linked from that index)
- F5: FIX (a dated correction paragraph is appended under the fix1 review's findings, leaving the original finding as evidence)
- F6: FIX (the CHANGELOG states `node 311 tests`, the count after this track's cases; the acceptance names the CHANGELOG and residual deliverables)
- F7: FIX (the fix2 spec's "depth 5 and beyond" sentence carries a dated off-by-one correction stating `depth > 3` and the boundary pair)

Delivered by `dsh_measure_commit_nested_fix4_20261109`; node 311/311, parity ok,
CLI 13/13, srg 11/11.
