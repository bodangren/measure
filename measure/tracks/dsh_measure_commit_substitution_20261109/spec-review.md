# Spec Review: dsh_measure_commit_substitution_20261109

Author model: deepseek-official/deepseek-flash

## Round 1

Date: 2026-11-09
Reviewer: subagent (fresh context, default model)

### What this track proposes

Making the DSH strict commit guard fail closed when a `git add` hides inside a
command substitution: `addedPaths()` returns `all: true` for a `$(...)` or
backtick span that runs a `git add`, so `stagedFiles` unions every working-tree
status path; substitutions without an add and existing token cases keep their
behavior. Unit cases in the DSH adapter, the commit-race row resolved, CHANGELOG,
node/parity/CLI/srg gates.

### How the current system works, per this spec

`commitCheck` parses a `git commit`, reads the staged set, and unions the paths an
in-command `git add` contributes: explicit paths exact, `.`/`:/`/`*`/`-A` set
`all`, `-u` sets `trackedOnly`. `shellTokens` strips quoting and splits on
separators, so `X=$(git add secret.txt)` yields no command-position `git add`; the
staged read happens before the command runs. `commitDecision` denies a bad message
or a no-task commit of files outside `measure/`.

### Findings

- F1 [Blocker] FR-1/Task 1.1: "a substitution mentions a git add" was undefined — single-quoted and escaped `$(...)` are literal, nesting needs balancing, and `git -C <dir> add`/`git "add"` are real forms — so a literal text test over-blocks messages and a strict test misses real adds.
- F2 [Major] FR-3/Task 1.2: the named cases did not pin literal single-quoted/escaped text, nested substitution, or `git -C`/quoted add.
- F3 [Major] Overview/Acceptance: the example used `git commit -m x`, which the format rule already denies, so it did not demonstrate the bypass.
- F4 [Major] Overview/FR-4: the row was to be resolved, but wrapper scripts, `git stage`, and `bash -c "git add …"` remain invisible; closing one shape of the class over-claimed.
- F5 [Major] NFR-1: "the adapters share the core change" is false — `addedPaths` is DSH-adapter-local and the parity scripts compare only the core files; the parity gates are not evidence for this change.
- F6 [Nit] FR-5: the expected node count was ambiguous (the suite becomes 303).
- F7 [Nit] Overview: "Decision 9" was cited without its document.

### Author Response

- F1: FIX (the rule is defined by a scanner: single-quoted and backslash-escaped text is removed first, `$(...)` is matched with balanced parentheses, backticks are matched to their closing delimiter, and the spans are tested with a pattern accepting `git -C <dir> add` and a quoted `"add"`; only executing spans count)
- F2: FIX (cases now cover single-quoted literal, escaped `\$`, nested `$(echo $(date); git add x)`, double-quoted substitution, `git "add"`, `git -C . add`, backticks, and plain/no-add commands; one integration case with a conforming message shows the no-task rule denying the hidden file)
- F3: FIX (the integration case and the record use `feat(app): Add the app`; the unit-only examples use a conforming message)
- F4: FIX (the row stays Open with the substitution case resolved and the wrapper-script/`git stage`/`bash -c` forms named as the residual; the end-of-turn check remains the backstop)
- F5: FIX (the record states the rule is DSH-adapter-local; the parity gates verify only the shared core and are not claimed as evidence)
- F6: FIX (the record states the node suite is 303 tests)
- F7: FIX (the record cites decision 9 in `measure/archive/dsh_measure_hardening_20261107/spec.md`)

Gates: node 303/303, parity ok, CLI 13/13, srg 11/11.
