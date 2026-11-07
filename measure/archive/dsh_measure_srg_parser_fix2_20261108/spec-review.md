# Spec Review: dsh_measure_srg_parser_fix2_20261108

Author model: deepseek-official/deepseek-flash

## Round 1

Date: 2026-11-08
Reviewer: subagent (fresh context, default model)

### What this track proposes

Widening the `dispositions:` rejection from C0-minus-tab/DEL plus five
zero-width characters to C1 controls (U+0080–U+009F), U+2028/U+2029, and bidi
controls (U+202A–U+202E, U+2066–U+2069); making `has_agent_result()` match the
result markers only as whole lines after stripping; adding S3 contract rejects
for U+2028, U+0085, and U+202E, an ordering probe, a marker look-alike probe, and
the exact message; listing the rejection in the `contracts.md` grammar with a
doc-test assertion; recording the prior review, tech-debt, and CHANGELOG.

### How the current system works, per this spec

`role-gate` requires both result markers and validates the last block's optional
dispositions line; each item fullmatches the item pattern, CONTEST/ESCALATE text
is non-blank, repeated ids are rejected, and only when no item failed does the
checker reject a value matching the control class. The class was C0-minus-tab/DEL
and five zero-width characters, and `has_agent_result()` tested substrings, so a
line like `END_MEASURE_AGENT_RESULT2: x` satisfied it.

### Findings

- F1 [Major] spec FR-1/FR-6: the value was `.strip()`-ed before the class search, so a separator or C1 whitespace at the start or end of the value (`dispositions: F2=FIX<U+2028>`) was removed and passed, while the rejection is specified over the value and the old row left trailing separators open.
- F2 [Major] spec Overview/FR-1/FR-6: the bidi set omitted U+061C, U+200E, and U+200F, which hold the Unicode Bidi_Control property, so an invisible direction mark still passed.
- F3 [Nit] spec FR-4: the doc test asserted only the fragment `C1 control`, not the class list (line separators, bidi controls, zero-width characters).

### Author Response

- F1: FIX (the raw value, after the `dispositions:` prefix and before stripping, is searched; a trailing separator and a leading C1 control are contract rejects; a CRLF line ending is excluded so CRLF logs still pass)
- F2: FIX (U+061C, U+200E, and U+200F are in the class; CONTEST text with each is a contract reject with the exact message)
- F3: FIX (`test_s3_dispositions_docs.sh` asserts the whole class sentence — control character, C1 control, line/paragraph separator, bidi control, zero-width character — and the exact message; the doc suite is 73 checks)

Delivered by `dsh_measure_srg_parser_fix3_20261108`; the S3 suite is 106 checks
(PASS=106) and the full gate 10/10.
