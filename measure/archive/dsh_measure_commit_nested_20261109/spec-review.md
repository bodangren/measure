# Spec Review: dsh_measure_commit_nested_20261109

Author model: deepseek-official/deepseek-flash

## Round 1

Date: 2026-11-09
Reviewer: subagent (fresh context, default model)

### What this track proposes

Treating a command-position `git stage` like `git add` and recursively scanning
the inner text of `bash -c`, `sh -c`, `zsh -c`, and `eval` in `addedPaths()`,
merging the inner additions, with a fixed depth cap and fail-closed unreadable
input; unit and integration cases; the residual narrowed; gates re-run.

### How the current system works, per this spec

`commitCheck` reads the staged set and unions in-command additions: explicit paths,
`.`/`:/`/`*`/`-A`, `-u`, executing substitutions. `shellTokens` removes quoting and
splits separators; only a command-position `git` counts. An outer `bash -c` or
`eval`, or `git stage`, contributed nothing; only raw `git add` text made
`parseCommitCommand` set `takesChanges` (for `bash -c` tracked files, not for
`git stage`). `commitDecision` denies a bad message or a no-task commit outside
`measure/`.

### Findings

- F1 [Blocker] FR-3/Task 1.1: the depth cap was named only as "a fixed depth"; the shipped `depth > 3` (four levels) is a security parameter that no document or test pinned.
- F2 [Major] FR-2: `eval` concatenates its arguments, so `eval git add src/app.js` and `eval "git add" src/app.js` run the add while the scan recursed on the next token only.
- F3 [Major] FR-5/Task 2.1: `bash -lc`, `bash -x -c`, `/bin/bash -c`, multi-word `eval`, and `X=$(git stage …)` still contributed nothing and are not wrapper scripts, so narrowing the row to wrapper scripts over-claimed.
- F4 [Major] FR-4/Task 1.2: no `zsh -c`, depth-cap, or unreadable-inner test.
- F5 [Nit] Overview/FR-4: the integration fixture's tracked path was already taken via `GIT_ADD`/`takesChanges`; only an untracked path proves the recursion.

### Author Response

- F1: FIX (the code names `MAX_NESTED_DEPTH = 3` with a four-level comment; the spec records the value; a five-level nesting case asserts `all: true`)
- F2: FIX (`eval` joins all its argument words and scans the joined text; both `eval git add src/app.js` and `eval "git add" src/app.js` return the path)
- F3: FIX (shell recognition uses the command basename and any option cluster containing `c` — `-c`, `-lc`, `-x -c`, `/bin/bash`; the substitution pattern includes `stage`; the residual now names only arbitrary wrapper scripts and shell functions)
- F4: FIX (cases cover `zsh -c`, `bash -lc`, `/bin/bash -c`, `bash -x -c`, multi-word `eval`, five-level nesting, and unreadable inner text)
- F5: FIX (the integration case uses an untracked `src/new.js` with status `??` and the nested add, so only the recursion denies it)

Delivered by `dsh_measure_commit_nested_fix2_20261109`; node 308/308, parity
ok, CLI 13/13, srg 11/11.
