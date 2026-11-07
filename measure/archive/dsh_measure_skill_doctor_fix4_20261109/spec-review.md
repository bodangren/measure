# Spec Review: dsh_measure_skill_doctor_fix4_20261109

Author model: deepseek-official/deepseek-flash

## Round 1

Date: 2026-11-09
Reviewer: subagent (fresh context, default model)

### What this track proposes

One temporary skill whose body holds `[top](#top)` and
`[site](https://example.com/x)` must pass and print one extra `[PASS]` line; the
CHANGELOG bullet gains the missing punctuation; the fix2 disposition and the fix3
evidence get the true PASS count; the fix3 review is recorded with dispositions
and a dated correction note; gates run and each phase checkpoint is pushed.

### How the current system works, per this spec

The check parses every description (inline/`|`/`>`), rejects >1024 or `<`/`>`,
rejects Markdown folder links while skipping `#anchor` and scheme targets,
reports a missing description, and rejects bundle symlinks. Fixtures covered the
boundary, both block forms, the character rules, missing description, folder link,
file link, and bundle symlink, but no fixture passed an anchor-only or scheme
link; the fix2 review and fix3 evidence claimed a 12-PASS run while the test
printed 11; the CHANGELOG bullet ran two clauses together; NFR-1 bounded the
track's own writes.

### Findings

- F1 [Major] FR-2/Task 1.2: the fix3 evidence already said 12 PASS and the new fixture makes the test print 12, so "state the true count" had no change to make for that file; the count sentence lives at the fix2 review's closing line, not its F1 disposition.
- F2 [Major] Acceptance Criteria: no criterion covered the record corrections or the dated correction note, so Phase 1 could pass with them unchanged.
- F3 [Nit] Overview/FR-1: the spec said "two passing fixtures"/"each scenario prints its own line" while the plan defines one fixture with one PASS line (the short `|`/folded scenarios print none).
- F4 [Nit] Overview F3/FR-2: the CHANGELOG defect was a missing comma after the parenthetical, not a missing conjunction.
- F5 [Nit] Overview F1: "either as a folder would pass" overstated the anchor case — the real-repository run over the seven anchors fails a broken anchor rule; only the scheme target lacked fixture coverage.
- F6 [Nit] FR-3/NFR-1: the correction note described NFR-1 as being about the test's fixtures, which does not correct it — the note should name the omitted writes (review record, metadata, registry, archive).

### Author Response

- F1: FIX (the fix2 review's closing line and the fix3 evidence both state 12 PASS lines, the value a run now prints with the new fixture; no count remains at 11)
- F2: FIX (this review record plus the fix3 correction note are the record corrections; they are committed and pushed with the review)
- F3: FIX (the record says one fixture with one PASS line; the test prints 12 PASS lines)
- F4: FIX (the CHANGELOG bullet has the missing comma after the parenthetical)
- F5: FIX (the record says the anchor case was partially covered by the real-repository run and the scheme target lacked fixture coverage; the new fixture pins both together)
- F6: FIX (the fix3 correction note now names the omitted writes: the review record, metadata.json, measure/tracks.md, and the archived folder)

The reconciling edits are records-only; the code and tests are unchanged and the
gates are green (CLI 13/13, srg 11/11, node 301/301, parity ok).
