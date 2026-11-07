# Spec Review: dsh_measure_skill_doctor_fix3_20261109

Author model: deepseek-official/deepseek-flash

## Round 1

Date: 2026-11-09
Reviewer: subagent (fresh context, default model)

### What this track proposes

Adding the folded `description: >` fixture, correcting the `skill_doctor` row and
the CHANGELOG bullet to name the N3 Markdown folder-link rule while keeping the
bundle-symlink rule separate, writing the fix2 review with dispositions, and
running the gates.

### How the current system works, per this spec

The check parsed inline/`|`/`>` descriptions, failed above 1024 or on `<`/`>`,
skipped `#anchor`-only and scheme targets before the folder-link rejection,
reported a missing description, and separately rejected bundle symlinks; only the
`|` form had a fixture. The tech-debt row and CHANGELOG named the symlink scan for
the folder-link debt, and the fix2 archive had no review record or correction
note.

### Findings

- F1 [Major] FR-3: the fix2 review record marked F1 FIX while "no fixture pinned a scheme target as passing" was still open — no scheme fixture existed, and the claim that "the fixtures include an anchor-only file" was false (anchors were exercised only by the real-repository run).
- F2 [Nit] FR-3: the fix2 record and fix3 evidence said the test prints 12 PASS lines, but a run printed 11.
- F3 [Nit] FR-2: the CHANGELOG bullet had no conjunction before "rejects a SKILL.md Markdown link…", running the two rules together.
- F4 [Nit] NFR-1: "no write in the real repository except the record corrections and the test fixture" contradicted the plan's review-record/metadata/registry/archive writes.

### Author Response

- F1: FIX (the test now has a temporary skill with `[top](#top)` and `[site](https://example.com/x)` that must pass and prints its own PASS line, so the fix2 claim is literal; the record's disposition is updated)
- F2: FIX (the test now prints 12 PASS lines — the passing-link fixture adds the twelfth — and the fix3 correction note records the true count)
- F3: FIX (the CHANGELOG bullet gains the missing conjunction)
- F4: FIX (the correction note scopes NFR-1 to the test fixtures and states that the track's own bookkeeping writes are expected)

Delivered by `dsh_measure_skill_doctor_fix4_20261109`; CLI 13/13, srg 11/11.
