# Specification: DSH Measure dispositions parser fix3

## Overview

The parser fix2 track broadened the rejection and made the markers exact, but
its review found three precision gaps:

- **F1:** the dispositions value was `.strip()`-ed before the class search, so a
  separator or C1 whitespace at the start or end of the value
  (`dispositions: F2=FIX<U+2028>`) is removed and passes, while the rejection is
  specified over the value and the old debt item names "trailing separators".
- **F2:** the bidi set (U+202A–U+202E, U+2066–U+2069) omits U+061C, U+200E, and
  U+200F, which also carry the Unicode Bidi_Control property, so an invisible
  direction mark still passes in CONTEST/ESCALATE text.
- **F3:** the doc test asserts only the fragment `C1 control`, not the class list
  (line separators, bidi controls, zero-width characters) the grammar states, so
  most of the bullet could be deleted with the doc suite green.

This track searches the raw value (after the `dispositions:` prefix, before
stripping), adds U+061C/U+200E/U+200F to the class, strengthens the doc test to
assert the whole class sentence, and records the review with its dispositions.

## Functional Requirements

- **FR-1 (raw value).** The control/format search runs on the value before
  `.strip()`, so a separator or C1 control at the start or end of the value is
  rejected with `invalid dispositions line: control or zero-width character`;
  ordinary surrounding spaces still pass.
- **FR-2 (the bidi marks).** The class also covers U+061C (Arabic letter mark),
  U+200E (left-to-right mark), and U+200F (right-to-left mark), so all Unicode
  Bidi_Control characters in a parseable value are rejected.
- **FR-3 (the probes).** S3 gains contract rejects for
  `dispositions: F2=FIX<U+2028>` (trailing separator) and
  `dispositions: F2=FIX<U+0085>` (leading C1), and CONTEST text with U+200E,
  U+061C, and U+200F; all assert the exact message.
- **FR-4 (the doc test).** `test_s3_dispositions_docs.sh` asserts the full class
  sentence (control character, C1 control, line/paragraph separator, bidi
  control, zero-width character) and the exact message, not only a fragment.
- **FR-5 (the record).** The fix2 review is recorded in
  `measure/archive/dsh_measure_srg_parser_fix2_20261108/spec-review.md` with F1–F3
  and one disposition each, linked from its index; its spec gets a dated
  correction note; the tech-debt row states that the trailing-separator and
  bidi-mark items are resolved, with the scope rule as the only residual.

## Non-Functional Requirements

- **NFR-1 (bounded, linear).** One compiled character-class search over the raw
  value; no new dependency.
- **NFR-2 (contract preserved).** The item validation, ordering rule, messages,
  and the optional-line semantics stay unchanged; srg 10/10, node 301/301, both
  parity gates green.

## Acceptance Criteria (track level)

- Given a dispositions value with a separator or C1 control at its start or end,
  Then the gate reports the exact control message and exits 1.
- Given CONTEST text with U+200E, U+061C, or U+200F, Then the gate reports the
  exact control message and exits 1.
- Given the grammar doc test, Then it asserts the whole class sentence and the
  exact message.
- Given the gates, Then srg is 10/10, node 301/301, both parity gates are ok;
  each phase checkpoint is pushed.

## Out of Scope

- The scope rule comparing trees rather than intermediate commits (the remaining
  parser-row item).
- The opencode and A11/recipe rows.

> **Correction (2026-11-08, after the review):** the searched value is the raw
> slice after the `dispositions:` prefix on the raw line, with exactly one
> trailing `\r` (the CRLF log terminator) and no other stripping; the `none`
> shortcut rejects a raw value carrying a control/format character first. The
> edge probes are `dispositions: <U+0085>F2=FIX` (leading) and
> `dispositions: F2=FIX<U+2028>` (trailing), plus `dispositions: <U+2028>none`.
> The tech-debt row attributes the trailing-separator and full-Bidi_Control
> resolution to this track and keeps the scope rule as the only residual.
