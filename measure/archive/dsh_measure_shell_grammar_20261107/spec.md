# Specification: DSH Measure shell grammar: heredoc- and quote-aware scanning

## Overview

The bounded shell-write grammar (`src/shell.js`) scans the whole command string
for `>`/`>>` redirections, `tee` arguments, and `sed -i` files. Because it does
not know heredoc bodies, quoted strings, or comments, prose that contains a
redirect-looking word is treated as a write: a heredoc body that quotes
`> measure/tracks.md` is denied, `echo "a > measure/tracks.md"` is denied, and a
comment line `# > measure/plan.md` is denied. The guard documents this as a
fail-closed limit ("use write/edit for such documents"), which costs real work
and was hit repeatedly when appending evidence.

This track makes the redirect scan see only shell structure: heredoc bodies,
quoted spans, and comments are masked before the `>`/`>>` scan. The `tee` and
`sed -i` argument parsing keeps the original command (its quoting rules are
unchanged). The recognized write forms stay the same; this only removes false
positives.

## Functional Requirements

- **FR-1 (heredoc bodies).** A heredoc marker is recognized only outside quotes
  (`printf "x << y"` is not a heredoc; `printf 'x << y'` likewise), and its body
  — the lines after the marker line up to (not including) the delimiter line
  (`<<-` trims leading tabs from the candidate delimiter line) — is not scanned
  for redirects. The marker line itself stays scanned, so `cat <<'EOF' >
  measure/a.md` and `cat > measure/a.md <<'EOF'` both yield `['measure/a.md']`.
- **FR-2 (quoted spans).** For the redirect scan, only the `>`/`>>` characters
  inside a single- or double-quoted span are blanked (inside double quotes a
  backslash escapes the next character); the rest of the span is kept so a
  quoted target still parses: `echo x > "measure/tracks.md"` yields
  `['measure/tracks.md']`, while `echo "a > measure/b.md"` yields no target. A
  `#` inside quotes is not a comment. The `tee`/`sed -i` parsing is unchanged and
  keeps its own quoting rules.
- **FR-3 (comments).** A `#` that starts a word outside quotes masks to the end of
  the line for the redirect scan: `# > measure/c.md` yields no target.
- **FR-4 (tests).** `shell.test.js` adds: the heredoc body case (no target), the
  real-heredoc-write case (the target), the quoted-redirect case (no target), the
  comment case (no target), a masked-then-real case (`cat > a.md <<'EOF' … EOF;
  echo x > b.md` → both targets), a quoted heredoc marker (`printf "x << y"` is
  not a heredoc), `<<-` with a tab-indented delimiter, `<<"WORD"`, a quoted
  redirect target (`echo x > "measure/tracks.md"` → the target), and a `#`
  inside quotes is not a comment; the current grammar fails the heredoc, quoted,
  and comment cases.
- **FR-5 (records).** The plugin README's shell-write limit sentence (and
  `docs/dsh.md` if it repeats it) is corrected and scoped: the **redirect scan**
  masks heredoc bodies, quoted `>`, and comments; `tee`/`sed -i` keep the raw
  command, so prose containing those words can still be denied, and command
  substitution/helper scripts remain the residual. `measure/tech-debt.md`'s
  heredoc row resolves with those residuals, and `CHANGELOG.md` has a bug-fix
  entry.

## Non-Functional Requirements

- **NFR-1 (scope).** Only `src/shell.js`, its tests, and records/docs change; the
  guard decisions and both parity gates are untouched and stay green.
- **NFR-2 (bounded).** The masker is line/quote based, not a shell parser; nested
  quotes in heredoc bodies and multiple heredocs on one line may still be
  conservative, and that residual is documented.
- **NFR-3 (POSIX).** Windows stays out of scope.

## Acceptance Criteria (track level)

- Given the plugin package, Then the shell grammar tests pass with the new cases
  and the old grammar fails them.
- Given the installed plugin, Then the installed `shellWritePaths` returns no
  target for a heredoc body quoting `> measure/tracks.md` and returns the real
  target for `cat > measure/a.md <<'EOF'`, and `--check --live` passes.
- Given the gates, Then node, both parity gates, the CLI suite, and
  `bash tests/spec_review_gate/run.sh` pass; each phase checkpoint is pushed.

## Out of Scope

- Command substitution, helper scripts, and eval-like forms (the documented
  residual).
- The commit staged-read race and the remaining spec_review_gate rows.
