# Implementation Plan: DSH Measure shell grammar: heredoc- and quote-aware scanning

Track: `dsh_measure_shell_grammar_20261107`
Spec: [./spec.md](./spec.md)

**Each phase checkpoint is pushed to `origin/main` before the next phase.**

## Phase 1: The masker and its tests [checkpoint: 7e7d5ff]

- [x] Task 1.1: `plugins/dsh-measure-guard/src/shell.js`: add the redirect-view masker — heredoc bodies masked from the marker line through the delimiter (leading tabs ignored for `<<-`), single/double-quoted spans masked (double-quote backslash escapes), and a `#` at a word start masked to the end of the line — and run `redirectTargets` on the masked view while `teeTargets`/`sedTargets` keep the original command
- [x] Task 1.2: Red: `shell.test.js` cases — a heredoc body quoting `> measure/tracks.md` (no target), `cat > measure/a.md <<'EOF' … EOF` (the target), `echo "a > measure/b.md"` (no target), `# > measure/c.md` (no target), `cat > a.md <<'EOF' … EOF; echo x > b.md` (both targets); the current grammar fails the heredoc/quoted/comment cases
- [x] Task 1.3: Green: the suite passes; the existing shell cases unchanged; both parity gates ok
- [x] Task: Measure - User Manual Verification 'Phase 1: The masker and its tests' (Protocol in workflow.md) `7e7d5ff`

## Phase 2: The live evidence

- [ ] Task 2.1: `bin/measure-dsh install --no-skills`; run the installed `shellWritePaths` on the heredoc, quoted, comment, and real-write commands; record the output and the `--check --live` digest PASS under `measure/runs/dsh_measure_shell_grammar_20261107/`
- [ ] Task: Measure - User Manual Verification 'Phase 2: The live evidence' (Protocol in workflow.md)

## Phase 3: Records

- [ ] Task 3.1: update the plugin README shell-write limit sentence (and `docs/dsh.md` if it repeats it), resolve `measure/tech-debt.md`'s heredoc row, add the `CHANGELOG.md` bug-fix entry, and run `bash tests/dsh/run.sh` after the docs edits
- [ ] Task: Measure - User Manual Verification 'Phase 3: Records' (Protocol in workflow.md)

## Phase 4: Closeout

- [ ] Task 4.1: `metadata.json`, archive the track, update `measure/tracks.md`; run `closeout --track dsh_measure_shell_grammar_20261107` and record that it reports only the expected manifest FAIL
- [ ] Task: Measure - User Manual Verification 'Phase 4: Closeout' (Protocol in workflow.md)
