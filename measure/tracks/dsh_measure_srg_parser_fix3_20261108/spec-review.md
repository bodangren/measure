# Spec Review: dsh_measure_srg_parser_fix3_20261108

Author model: deepseek-official/deepseek-flash

## Round 1

Date: 2026-11-08
Reviewer: subagent (fresh context, default model)

### What this track proposes

Closing three precision gaps: searching the dispositions value before `.strip()`
so an edge separator or C1 control is rejected; adding U+061C, U+200E, and
U+200F to the control/zero-width class; strengthening the grammar doc test to the
whole class sentence; S3 contract rejects for a trailing U+2028, a leading
U+0085, and CONTEST text with U+200E/U+061C/U+200F; recording the fix2 review
with dispositions, its spec correction note, and the tech-debt row update.

### How the current system works, per this spec

`role-gate` validates the last block's optional dispositions line; the log opens
with `newline=""` and splits on LF only, each line is stripped, the value is
stripped, the `none` shortcut returns before any class search, and only when no
item failed is the stripped value searched against the class (C0-minus-tab/DEL,
C1, U+2028/2029, two bidi ranges, zero-width, U+FEFF). Edge separators stripped
from the value pass; U+061C/200E/200F pass; the doc test asserts only `C1
control`.

### Findings

- F1 [Blocker] FR-1/plan Task 1.1: the raw-value requirement did not say whether the slice comes from the raw line or the stripped line, and the raw line keeps the CR of a CRLF log, which the class matches via `\x0b-\x1f`, flipping the existing CRLF contract probe to a rejection.
- F2 [Major] FR-1/plan Task 1.1: the class search kept its place after the `none` shortcut, so `dispositions: <U+2028>none` still exited 0 although the spec allows only the plain value.
- F3 [Major] FR-5/plan Task 2.1: the required tech-debt end state already existed (attributed to the earlier tracks) and did not name the track that implements the trailing-separator rejection, so the phase could not be verified and the premature attribution was left to the implementer.
- F4 [Nit] FR-3: the spec's "(leading C1)" example put U+0085 at the end of the value while the plan asks for a leading case.

### Author Response

- F1: FIX (the slice comes from the raw line after the prefix and one trailing `\r` — the CRLF terminator — is excluded before the class search; the CRLF contract probe stays green, and the S3 suite is 107 checks)
- F2: FIX (the `none` shortcut now rejects a raw value carrying a control/format character first; `dispositions: <U+2028>none` is a contract reject)
- F3: FIX (the tech-debt row now attributes the trailing-separator and full-Bidi_Control resolution to this track and keeps the scope rule as the only residual)
- F4: FIX (the correction note states the leading U+0085 probe is `dispositions: <U+0085>F2=FIX`, and the trailing case is `dispositions: F2=FIX<U+2028>`)
