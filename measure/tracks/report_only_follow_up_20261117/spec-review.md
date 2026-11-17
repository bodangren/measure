# Spec Review: report_only_follow_up_20261117

Author model: minimax-cn-coding-plan/MiniMax-M3.1-Flash

## Spec Review

Date: 2026-11-17
Reviewer: measure-spec-review, claude-code/claude-sonnet-5-5#max
Full review text: `measure/runs/report_only_follow_up_20261117/spec-review-e053d64.json` and `.log`. The runs folder is gitignored.

### What this track proposes

This track makes the measure-guard end-of-turn text report-only. A shared REPORT_ONLY line and a reportText() helper in the core tell the agent to write the open problems in its reply and to act only on an order from its orchestrator or the user. The two problem texts state the usual fix as information. The OpenCode plugin, the Claude Code mod, and the DSH adapter use the helper, and each end-of-turn suite pins the new text with a test.

### How the current system works, per this spec

Per the spec, the guard sends a text at the end of a turn: a strict-mode follow-up prompt or stop block, or a guard-mode reminder. Each text tells the agent to fix the open problems. In the incident, the OpenCode synthetic reminder (resume false) started a turn in a finished session after a compaction. That session then edited plan.md, committed, and pushed with no message from its orchestrator.

### Findings

- F1 [Major] Evidence and Decided design: the synthetic reminder still starts a turn in a finished session after a compaction. Rationale: a hook must never make a role act outside its brief.
- F2 [Major] Tests: the test inputs stay open, so part of the regex set cannot fail before the change. Rationale: a pin that cannot fail before the change does not prove the change.
- F3 [Major] Decided design 1 and 3: the strict head asks the agent to continue while the body asks it to wait. Rationale: each extra follow-up costs a model turn and gives no new information.
- F4 [Major] FR-6 and plan Task 1.2: the fixed date 2026-11-19 is the PM date, not the day the worker finishes. Rationale: a date that has not come is a false record.
- F5 [Nit] Decided design 3: three statements stay stale. Rationale: a stale comment states the opposite of the new text.
- F6 [Nit] Tests and plan Task 1.1: the helper and the gate log names stay open. Rationale: a bounded worker must not choose a name.
- F7 [Nit] Decided design 1: the placement words can detach the doc comment. Rationale: a file-location choice must not reach the worker.
- F8 [Nit] Out of Scope: the list omits commitReminder and the in-turn denies. Rationale: the record must show that the site was examined.

### Author Response

- F1: FIX
- F2: FIX
- F3: FIX
- F4: FIX
- F5: FIX
- F6: FIX
- F7: FIX
- F8: FIX

### Applied Changes

- F1: section 3 drops the synthetic call from the turn-end watch. The reminder stays in the session state. The Tests section adds the case that no prompt and no synthetic message go out. The README bullet at line 111 and the live-check paragraph at line 116 change.
- F2: every regex has the `i` flag. The test inputs are the real `turnProblems()` output for both problem kinds. A test constant holds the literal REPORT_ONLY sentence and asserts equality with the export.
- F3: `FOLLOW_UP_HEAD` and the core stop block head both read `measure-guard (strict): report these problems before you end the turn.` Section 6 records that strict mode can ask for the report up to `MAX_BLOCKS` times.
- F4: FR-6 and Task 1.2 use the date of the archive commit. The spec holds no fixed date.
- F5: the comments at `turn.ts:13`, `turn.ts:15`, and `turn.ts:44` and the README bullet at line 112 carry the new text. The review named the follow-up comment at line 14. The file has it at line 15. Line 14 is the member line of the `remind` case. The header comment at line 4 loses the synthetic message.
- F6: each package names its helper `assertReportOnly`. The Gates section names each log file.
- F7: section 1 places the block above the doc comment that starts at line 309.
- F8: Out of Scope names `commitReminder` and the in-turn denies.
