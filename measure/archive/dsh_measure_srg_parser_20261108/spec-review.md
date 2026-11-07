# Spec Review: dsh_measure_srg_parser_20261108

Author model: deepseek-official/deepseek-flash

## Round 1

Date: 2026-11-08
Reviewer: subagent (fresh context, default model)

### What this track proposes

After the per-item validation, and only when no item failed, rejecting a
dispositions value that contains a control character (C0 except tab, DEL) or one
of five zero-width characters with the exact message
`invalid dispositions line: control or zero-width character`; S3 probes for NUL,
ESC, U+200B in CONTEST text and U+FEFF in ESCALATE text plus a tab pass; the
parser part of the tech-debt row resolved, the scope rule kept; CHANGELOG.

### How the current system works, per this spec

`role-gate` validates the last result block's optional `dispositions:` line;
each item must fullmatch the item pattern, CONTEST/ESCALATE text must be
non-empty, and repeated ids are rejected. `(.+)` accepts every character except
LF, so control or zero-width characters inside CONTEST/ESCALATE text passed;
the S3 probes asserted only prefixes or exit codes for those values.

### Findings

- F1 [Blocker] FR-1/Acceptance: the class was a closed list of C0-minus-tab, DEL, and five zero-width characters, so C1 controls (U+0085), line/paragraph separators (U+2028/U+2029), and bidi controls (U+202E) still parse and pass — the same rendered-line harm.
- F2 [Major] FR-4/Out of Scope: the rewritten row claimed the parser part resolved while the old row's "earlier substring check remains" item (`has_agent_result` matches the markers by substring) was neither fixed nor listed.
- F3 [Major] FR-4: the role grammar `contracts.md` did not mention the new rejection and no doc test asserted it.
- F4 [Major] Plan Task 1.2/FR-2: no probe distinguished the ordering rule (an invalid item keeps its item message); a control check before the loop or an unconditional append would pass every listed probe.
- F5 [Nit] Overview: "NUL in an item stays as it is" read as preserving the current pass, which FR-3 turns into a reject.
- F6 [Nit] FR-3: the spec named `CONTEST(a<NUL>b)`/`CONTEST(a<ESC>b)` while the plan converted `CONTEST(<NUL>)` and added an ESC probe.
- F7 [Nit] FR-3: "with the message" was looser than the exact string; the probes asserted only the fragment.

### Author Response

- F1: FIX (the class now covers C1 controls U+0080–U+009F, U+2028/U+2029, and bidi controls U+202A–U+202E/U+2066–U+2069 on top of C0-minus-tab/DEL and the zero-width set; S3 contract rejects cover U+2028, U+0085, and U+202E)
- F2: FIX (`has_agent_result()` matches the markers as whole lines after stripping; a probe shows marker look-alike text does not count as a result block; the tech-debt row lists both resolved items and keeps only the scope rule)
- F3: FIX (`contracts.md` lists the rejection and its exact message, and `test_s3_dispositions_docs.sh` asserts both — 73 checks)
- F4: FIX (the ordering probe asserts the item message is kept and the control message absent when an item is already invalid)
- F5: FIX (the correction note says the preserved behavior is a NUL that makes an item invalid, not a NUL inside valid CONTEST text)
- F6: FIX (the correction note aligns the probe list with the plan: `CONTEST(<NUL>)`, `CONTEST(<ESC>)`, `CONTEST(U+200B)`, `ESCALATE(U+FEFF)`)
- F7: FIX (the control probes assert the exact full message `invalid dispositions line: control or zero-width character`)

Delivered by `dsh_measure_srg_parser_fix2_20261108`; the S3 suite is 101 checks
(PASS=101) and the doc suite 73 (PASS=73).
