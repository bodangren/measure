# Specification: DSH Measure dispositions parser hardening

## Overview

The spec-review gate's optional `dispositions:` line is parsed by
`dispositions_feedback()` in `skills/measure-orchestrator/scripts/measure_interphase_checks.py`.
Its item regex (`F<n>=(FIX|DECLINE|CONTEST(text)|ESCALATE(text))`) lets any
character into the `CONTEST`/`ESCALATE` text, so a line carrying a control
character (for example NUL or ESC) or a zero-width character (U+200B, U+200C,
U+200D, U+2060, U+FEFF) inside that text passes the gate while the rendered
finding text would be invisible or misleading. The tracker's parser row names
exactly this: "CONTEST text accepts control characters".

This track rejects control characters (C0 except tab, and DEL) and zero-width
characters anywhere in a parseable dispositions value, with contract tests for
`CONTEST` and `ESCALATE` text, while every existing behavior (item text with
punctuation, spaces, nested parentheses; a CR or U+2028 line separator that makes
the item invalid; NUL in an item) stays as it is.

## Functional Requirements

- **FR-1 (the rejection).** After the existing per-item validation, when no item
  has reported a problem and the dispositions value contains a control character
  (`\x00`–`\x08`, `\x0b`–`\x1f`, `\x7f`) or a zero-width character (U+200B,
  U+200C, U+200D, U+2060, U+FEFF), `dispositions_feedback()` returns
  `invalid dispositions line: control or zero-width character`.
- **FR-2 (ordering).** The control/zero-width check runs only when no item
  already failed, so a value with an invalid item keeps the existing item
  message (the CR and U+2028 separator tests keep their contract).
- **FR-3 (the tests).** `tests/spec_review_gate/test_s3_adversarial.sh`:
  `F2=CONTEST(a<NUL>b)`, `F2=CONTEST(a<ESC>b)`, `F2=CONTEST(a<U+200B>b)`, and
  `F3=ESCALATE(<U+FEFF>)` are contract rejects with the message; `F2=CONTEST(a<TAB>b)`
  still passes; and the existing G02/G03/G04/G05 cases keep their results.
- **FR-4 (records).** `measure/tech-debt.md`'s parser row records the resolved
  parser part and keeps the remaining scope-rule item; `CHANGELOG.md` has a
  bug-fix entry.

## Non-Functional Requirements

- **NFR-1 (bounded, linear).** One compiled-character-class search of the value;
  no new dependency; the regex cost stays linear in the value length.
- **NFR-2 (contract preserved).** The optional line, `none`, duplicates,
  multiple-line rule, and the existing messages stay unchanged; the gate passes
  10/10.

## Acceptance Criteria (track level)

- Given a parseable dispositions value with a control or zero-width character,
  Then the gate reports `invalid dispositions line: control or zero-width
  character` and exits 1.
- Given `bash tests/spec_review_gate/run.sh`, Then all ten suites pass,
  including the extended S3 adversarial probes.
- Given the node suite and both parity gates, Then node is 301/301 and both
  parity gates are ok; each phase checkpoint is pushed.

## Out of Scope

- The scope rule comparing trees rather than intermediate commits (the remaining
  part of the parser row).
- The opencode and A11/recipe rows.
