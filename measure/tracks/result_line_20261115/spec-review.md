# Spec Review: result_line_20261115

Author model: kimi-code-plan-cn/kimi-for-coding#high

## Round 1

Date: 2026-11-15
Reviewer: measure-spec-review, claude-code/claude-sonnet-5-5#high

### What this track proposes
This track adds one verdict line, word for word, to 13 source role files in agents/ (all except measure-orchestrator.md). The line goes after the paragraph that tells the role to end with the MEASURE_AGENT_RESULT block, in the same place as in the installed copies. A new S2 test section pins the line. The track then records the change in CHANGELOG.md and README.md and archives itself.

### How the current system works, per this spec
The installer keeps 13 installed role files as local-edit because PM tooling C116 added the verdict line to them only. The source files do not have the line, so the installed copies miss PR #16 and PR #18. The advantage-pr script outcomes_close.py reads a line such as RESULT: PASS in the last message of a role session to record the run result. The spec says that 0 of 135 runs had a verdict line.

### Findings
- F1 [Major] spec.md Test: The S2 section checks only that the RESULT line occurs once and that the next line is empty or the end of the file. A line that is placed anywhere else passes. Rationale: placement in the same place as the installed copies is the core requirement. The heavy-run S2 section pins its position with an awk rule, and the anchor table of spec.md gives the exact anchor of each file, so the section can check that the line before the RESULT line is empty and the line before that is the anchor.
- F2 [Major] plan.md Task 1.1: The plan and FR-1 say 'keep the placement diffs as evidence' and 'Red: the section fails before the change', but name no path, no file name, and no step that keeps the failing Red output before the Green edit. Rationale: a file location is a choice that the plan must not leave to the implementer, and phase acceptance needs a fixed path to read. Name a path, for example measure/runs/result_line_20261115/ (gitignored, as in the Prompt audit track), and add the Red run as a step before the Green edit.
- F3 [Major] spec.md FR-2 and plan.md Task 1.2: The README step says line 33 'starts with' the new sentence 'followed by the rest of the current line 33 unchanged'. The current line 33 starts with the sentence 'As of 2026-11-15, the latest archived track is Prompt audit (...)'. The text does not say that the new sentence replaces the old first sentence. Rationale: a literal reading keeps two 'As of' sentences. The precedent commit 9622461 replaced the old first sentence. Write 'replace the first sentence, up to and including "every owner rule and human gate stays).")' so that the implementer makes no choice.
- F4 [Nit] spec.md Decided design: The placement proof says the diffs show 'only the lines that PR #16 and PR #18 changed' and gives no expected list. Expected result of diff <source> <installed> after the change: 5 files show no diff (adversarial-testing, closeout, spec-review, strategy, ux-browser-review). 5 files show one line that only the source has, the heavy-run paragraph of PR #16 (final-acceptance, phase-acceptance, review-a-correctness, review-b-security, review-c-ux-api). 3 files show only the PR #18 case changes 'Do NOT' to 'Do not' (jr-green 1 line, mid-red 1 line, orchestrator-audit 3 lines). Rationale: an exact list turns a judgment into a check. The installed copies sit outside the repository and change when the PM restores them, so the evidence must be kept as text.
- F5 [Nit] spec.md Test: The section leaves 3 small choices to the implementer: the position relative to the separator line that comes before '# Edge checks'; a whole-line match (grep -cxF) against a substring match (grep -cF) for the word 'exact'; and the handling of a missing or empty role file. Rationale: the file header names the A4 and A7 defenses. State that the section follows them: whole-line match, a fail line for a missing or empty file, and a position after the heavy-run section and before the separator line.
- F6 [Nit] plan.md Task 1.2: The plan does not give the value of the completed key or the text of the deviation_notes record, and does not name the plan-marker, checkpoint, and phase-complete commits that the Prompt audit precedent made (fb2b899, db1a767, 38edcac) between the archive commit and the registry commit. Rationale: measure/workflow.md covers these steps, but the order of the record steps is a stated focus of this review. Name the completed value (2026-11-15) and state that the workflow commits come after the archive commit and before the registry commit, as in the precedent.
- F7 [Nit] spec.md Decided design: The role bodies and contracts.md say that each role must end with the MEASURE_AGENT_RESULT block, and the new line makes the RESULT line the last line of the final message, after the block. Rationale: the role gate reads only the marker lines of the log (has_agent_result and dispositions_feedback in measure_interphase_checks.py), so a RESULT line after the block breaks no gate, and a dispositions line after the block does not count. A reader of the role files still sees two different endings. Add one sentence to the Decided design that records this order. The claim '0 of 135 runs' in the CHANGELOG entry is a volatile count from advantage-pr that this repository cannot check; scripts/jobs/outcomes_close.py exists and its VERDICT pattern reads 'RESULT: PASS'.

### Author Response
- F1: FIX
- F2: FIX
- F3: FIX
- F4: FIX
- F5: FIX
- F6: FIX
- F7: FIX

## Round 2

Date: 2026-11-15
Reviewer: measure-spec-review, claude-code/claude-sonnet-5-5#high

### What this track proposes
This track adds one verdict line, word for word, to 13 source role files in agents/ (all except measure-orchestrator.md). The line goes after the anchor paragraph of each file, in the same place as in the installed copies. A new S2 section pins the line, its single occurrence, and its placement. The track records the change in CHANGELOG.md and README.md and archives itself.

### How the current system works, per this spec
The installer keeps 13 installed role files as local-edit because PM tooling C116 added the verdict line to the installed copies only. The source files do not have the line, so the installed copies miss PR #16 and PR #18. The advantage-pr script outcomes_close.py reads the line to record PASS or FAIL for each role run. The PM reports that 0 of 135 role runs had a verdict line.

### Findings
- F8 [Nit] spec.md FR-2 (README sentence): The new README sentence says '13 role files end with a RESULT: PASS or RESULT: FAIL line'. The role files do not end with that line, because 6 of the 13 installed copies keep text after it (the rating rubric), and the line tells the role what its final message ends with. Rationale: the record text is not exact, but it does not change what the implementer builds. Write for example '13 role files tell the role to end its final message with a RESULT: PASS or RESULT: FAIL line, so the installed copies match the source again'.
- F9 [Nit] spec.md Anchor lines and Acceptance Criteria: The table cells of closeout and jr-green are not a bare verbatim line. The closeout cell adds text after the code span, and the jr-green cell is prose that names the last list line. The first Acceptance Criteria bullet lists only the once-only check and the next-line check, and omits the two placement checks (empty line before, anchor line before) that the Test section pins. Rationale: the installed copies and the source give the exact lines, so the implementer makes no real choice, but the S2 section embeds each anchor line as a fixed string and the criteria should list all four checks. Name the anchor line of closeout and jr-green as a bare line, and add the two placement checks to the first criteria bullet.

Round 2 is the last allowed round. Orchestrator decision: F8 FIX now, F9 DECLINE, no third round; recorded as a deviation in metadata.json deviation_notes.

### Author Response
- F8: FIX
- F9: DECLINE

