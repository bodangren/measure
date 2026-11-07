# Spec Review: dsh_measure_shell_grammar_20261107

Author model: deepseek-official/deepseek-flash

## Round 1

Date: 2026-11-07
Reviewer: subagent (fresh context, default model)

### What this track proposes

Making the shell-write scan see shell structure before looking for `>`/`>>`:
mask heredoc bodies, neutralize `>`/`>>` inside quoted spans, and mask `#`
comments, then run `redirectTargets` on that view while `teeTargets`/
`sedTargets` keep the original command. The recognized write forms and the
decision functions stay the same, so the change removes false-positive denies on
prose. `shell.test.js` gains the heredoc/quoted/comment cases and the records
(README limit sentence, `docs/dsh.md`, tech-debt row, CHANGELOG) are updated.

### How the current system works, per this spec

`shellWritePaths` concatenates `redirectTargets(command)`, `teeTargets(command)`,
and `sedTargets(command)`; `redirectTargets` runs the REDIRECT regex over the
whole string, and `tee`/`sed` split their segments on whitespace with a local
quote placeholder for the sed script. Nothing knows heredoc bodies, quoted text,
or comments, so prose that looks like a redirect is a write: at HEAD a heredoc
body quoting `> measure/tracks.md`, `echo "a > measure/tracks.md"`, and
`# > measure/plan.md` each yield that target, while `cat > measure/a.md <<'EOF'`
already yields only `measure/a.md`. The guard records the limit in the README's
known-limits list and as an open tech-debt row.

### Findings

- F1 [Major] spec Overview / FR-2 + plan Task 1.1: "single/double-quoted spans masked" would delete a quoted redirection target the grammar recognizes today (`echo x > "measure/tracks.md"`), while FR-2 only requires that a `>`/`>>` inside quotes not count; the plan must say only the redirect characters are blanked and keep a quoted-target test.
- F2 [Major] spec FR-1 vs FR-4: "through the delimiter line" would mask `EOF; echo x > b.md`, and POSIX does not end a heredoc on a delimiter line with trailing text; the mask boundary (marker line scanned, body masked up to the delimiter line) and the FR-4 example must agree.
- F3 [Blocker] spec FR-1/FR-2/FR-3 + plan Task 1.1: the order of the masks is never stated; heredoc detection before quoting turns `printf "x << y"` into a bogus heredoc that swallows a real redirect on the next line (a false negative), and comments before quotes lose `echo "a # b" > out.md`.
- F4 [Major] spec FR-4 + plan Task 1.2: only `<<'EOF'` is named; `<<-` with a tab-indented delimiter and `<<"WORD"` have no test, so a broken tab rule still goes Green.
- F5 [Major] plan Task 1.1 vs 1.2: the masker is added before the Red tests run, so the Red evidence cannot be produced without a named old-code command; reorder or record the exact command.
- F6 [Major] spec FR-5: "heredocs, quoted spans, and comments are handled" overclaims because `teeTargets`/`sedTargets` keep the raw command (prose containing `tee measure/tracks.md` still yields the target); the sentence must be scoped to the redirect scan and the tee/sed residual named.
- F7 [Nit] plan Task 1.3: "the suite" and "both parity gates" name no commands.

### Author Response

- F1: FIX (only `>`/`>>` inside quoted spans is blanked and quoted text is kept, so `echo x > "measure/tracks.md"` still yields the target; a test covers it)
- F2: FIX (the marker line stays scanned and the body masks up to, not through, the delimiter line; the FR-4 example uses a separate delimiter line, as the committed test does)
- F3: FIX (heredoc markers are detected by a quote-skipping per-line scan, so `printf "x << y"` is not a heredoc; comments are masked outside quotes, so `echo "a # b" > out.md` keeps its target; both have tests and the previous shell.js fails the quoted-marker case, 9/10 vs 10/10)
- F4: FIX (tests cover `<<-` with a tab-indented delimiter and `<<"WORD"`, plus the quoted target and `#` inside quotes)
- F5: FIX (the executed order was Red tests first — two failed on the old grammar — then the masker; the plan records that order)
- F6: FIX (README/docs are scoped to the redirect scan and name the tee/sed raw-command residual and command substitution/helper scripts)
- F7: FIX (the plan names `node --test plugins/dsh-measure-guard/tests/*.test.js`, both `check-parity.sh` scripts, and `bash tests/dsh/run.sh`)
