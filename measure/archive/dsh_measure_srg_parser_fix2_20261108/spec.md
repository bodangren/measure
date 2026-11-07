# Specification: DSH Measure dispositions parser fix2

## Overview

The dispositions-parser track rejected a closed character set (C0 minus tab, DEL,
and five zero-width characters), but its review found:

- **F1:** C1 controls (U+0080–U+009F), line/paragraph separators (U+2028/U+2029),
  and bidi controls (U+202A–U+202E, U+2066–U+2069) still pass inside
  CONTEST/ESCALATE text — the same rendered-line defect the track names.
- **F2:** the rewritten tech-debt row claimed the parser part resolved while the
  old row's "earlier substring check remains" item (`has_agent_result` matches
  the result markers by substring) was neither fixed nor listed.
- **F3:** the role grammar `skills/measure-orchestrator/references/contracts.md`
  does not mention the new rejection and no doc test asserts it.
- **F4:** no probe distinguishes the ordering rule (an invalid item keeps its item
  message even when the value carries a control character).
- F5–F7 are wording nits (the preserved NUL item, spec/plan probe mismatch, and
  the exact message asserted only as a fragment).

This track broadens the rejection to the control/format classes, fixes the
marker matching to exact lines, documents the rejection in the role grammar with
a doc test, adds the ordering probe, and records the corrections with the review.

## Functional Requirements

- **FR-1 (the broadened class).** A dispositions value that parses but contains
  any of: C0 controls except tab, DEL, C1 controls (U+0080–U+009F), U+2028,
  U+2029, bidi controls (U+202A–U+202E, U+2066–U+2069), or the zero-width set
  (U+200B, U+200C, U+200D, U+2060, U+FEFF) is rejected with
  `invalid dispositions line: control or zero-width character`.
- **FR-2 (the exact markers).** `has_agent_result()` recognises the result
  markers only as whole lines (after whitespace stripping), not as substrings, so
  a log whose only marker-looking text is inside another word has no result
  block; a probe covers the look-alike case and the existing substring-in-text
  contract (a real block plus marker text elsewhere) still passes.
- **FR-3 (the ordering probe).** The S3 suite gains a contract probe: a value with
  an invalid item **and** a control character reports the item message and not
  the control message.
- **FR-4 (the grammar and doc test).** `contracts.md`'s dispositions grammar lists
  the new rejection (control characters, C1 controls, line separators, bidi
  controls, zero-width characters); `test_s3_dispositions_docs.sh` asserts the
  exact message and the class description are present.
- **FR-5 (the probes).** S3 gains contract rejects for CONTEST(U+2028),
  CONTEST(U+0085), CONTEST(U+202E), and the full exact message on the existing
  control probes.
- **FR-6 (records).** The tech-debt row lists the resolved items (control/format
  characters, marker substring matching) and keeps the scope rule as the only
  residual; the parser track's spec-review.md records F1–F7 with dispositions;
  the CHANGELOG entry says "control and format characters".

## Non-Functional Requirements

- **NFR-1 (bounded, linear).** One compiled character-class search; no new
  dependency.
- **NFR-2 (contract preserved).** The optional line, `none`, duplicates, the
  multiple-line rule, and existing messages stay unchanged; the gate passes
  10/10 and node stays 301/301 with both parity gates green.

## Acceptance Criteria (track level)

- Given a parseable dispositions value with a C1 control, U+2028, or a bidi
  control in CONTEST/ESCALATE text, Then the gate reports the exact control
  message and exits 1; U+2028 inside an item still yields that rejection.
- Given a log whose marker text is only inside another word, Then the role gate
  reports the missing result block.
- Given a value with an invalid item and a control character, Then the item
  message (not the control message) is reported.
- Given the gates, Then srg is 10/10, node 301/301, both parity gates are ok;
  each phase checkpoint is pushed.

## Out of Scope

- The scope rule comparing trees rather than intermediate commits (the remaining
  parser row item).
- The opencode and A11/recipe rows.

> **Correction (2026-11-08, dsh_measure_srg_parser_fix3_20261108):** the class
> search runs on the raw value (after the `dispositions:` prefix, before
> stripping; a CRLF line ending is excluded), so a leading or trailing separator
> or C1 control is rejected. The class also covers U+061C, U+200E, and U+200F, so
> all Unicode Bidi_Control marks are rejected. The doc test asserts the whole
> class sentence, not only a fragment. The tech-debt row now records the
> trailing-separator and bidi-mark items as resolved, leaving the scope rule as
> the only parser-row residual.
