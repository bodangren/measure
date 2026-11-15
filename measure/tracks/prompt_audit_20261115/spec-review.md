# Spec Review: prompt_audit_20261115

Author model: kimi-code-plan-cn/kimi-for-coding#high

## Round 1

Date: 2026-11-15
Reviewer: measure-spec-review, claude-code/claude-sonnet-5-5#high

### What this track proposes
This track trims old-model wording from the Measure prompts by hand, because the bundled prompt-audit command cannot run in an agent session. A 70-row table lists each same-line rewrite: shouting words in capitals, bold PROTOCOL labels, and DO NOT JUMP YET. The track keeps every Daniel quote, owner rule, human gate, quoted user-facing message, and test-pinned string. It applies each change to skills/measure and to the byte-equal claude-skills/measure copy, in one commit. Then it records the change in CHANGELOG.md and README.md and archives the track.

### How the current system works, per this spec
The Measure prompts (AGENTS.md, the measure and measure-orchestrator skills, the agents/measure-*.md role files, and the plugin command files) hold shouting, PROTOCOL labels, and repeated warnings. Tests pin some strings: S1 pins steps 1 to 8 of the new-track section 2.5 and the bundle equality, S2 pins the role-file sentences, and S4 pins the orchestrator document strings. The spec says no proposed cut text is pinned, and the gates run the S1, S2, S4, DSH, and plugin tests after the edit.

### Findings
- F1 [Major] Audit table: The table and the Audit method claim a full search, but about 25 shouting instances in scope files have no row and no keep reason. They are ANY with HALT in the setup-check Handle Failure lines (skills/measure/references/implement.md:31, new-track.md:30, new-track-set.md:38, revert.md:47, status.md:29, review.md:48); BOTH and AND in implement.md:100, 102, 104 and new-track.md:61, 63, which are the twins of rows 14, 8, and 20; NOT in new-track.md:38 and 226, implement.md:57, 147, and 170, review.md:123, 225, and 245 (also SKIP); ALL in revert.md:111; OR in setup.md:322; STOP in assets/workflow.md:81; and HALT in skills/measure/SKILL.md:56, a file that the clean list names as clean. Rationale: PM rule 2 removes shouting, and the table treats one sentence in new-track.md:59 differently from the same sentence in implement.md:100, so the trimmed bundle stays inconsistent; add a row for each instance, or add a keep reason (HALT and STOP can stay as halt gates).
- F2 [Major] Audit table rows 17, 19, 21, 22, 39, 45, 60: These rows change a MUST or must-be rule into an indicative sentence (cites, treats, includes, is highly opinionated and avoids, follows, handles). Row 60 also drops the verb anticipate, and row 39 turns a design constraint into a description of the design. Rationale: PM rule 3 forbids a change of meaning, and an indicative sentence reads as a description, not as an obligation; use an imperative (Make the design highly opinionated. Avoid generic terms.) or a lowercase must, which ASD-STE100 allows for a requirement.
- F3 [Major] Functional Requirements, Acceptance Criteria, and Out of Scope: FR-1 and the first acceptance criterion say one trim commit holds every change outside measure/, but FR-3 and Task 1.2 also change CHANGELOG.md and README.md outside measure/, and Out of Scope lists README.md and CHANGELOG.md as out of scope. Rationale: the worker must choose which commit holds the two record files; the archived G21 track put them in the Archive commit (19a4f29), so limit the rule to the in-scope prompt files and name the archive commit for CHANGELOG.md and README.md.
- F4 [Major] Audit table row 5: The new text for skills/measure/references/status.md:46 is skip it and continue. It drops the word silently, so a worker can add a note to the status output. Rationale: PM rule 3 forbids a change of meaning; the same file kind keeps skip the sprint sync silently at implement.md:170, so write skip it silently and continue.
- F5 [Nit] Audit table rows 52 and 61: Row 52 changes if you fail to read any of these files to when a read fails, which widens the scope of the stop rule. Row 61 is a human-gate row, and its new text drops the word immediately from halt immediately. Rationale: the gate stays in both rows, but keep the original scope and the original word to stay close to PM rule 1.
- F6 [Nit] Audit table row 67: The new text for agents/measure-jr-green.md:75 ends with no fake consent artifacts., but the old sentence wraps, and line 76 starts with artifacts. The verification-checkpoint rule. Rationale: a literal edit either repeats the word artifacts or joins two lines and breaks the expected count of 113 lines; state that line 75 ends with no fake consent and that line 76 stays unchanged.
- F7 [Nit] Audit table rows 2 and 43: Row 2 changes on the disk to on disk, and row 43 changes based on the project's Tech Stack to based on project's Tech Stack. Rationale: ASD-STE100 and the global AGENTS.md section 2 say to keep the articles a and the; keep the word the in both rows.
- F8 [Nit] plan.md Task 1.2: The task says archive the track without a destination, names no commit message for the record commit or the archive commit, and says run the closeout check in this order without a list of the steps in order. Rationale: the zero-decision rule; the precedent is git mv of the track folder to measure/archive/prompt_audit_20261115/ and the commit messages of the G21 track, so name them in the task line.

### Author Response
- F1: FIX
- F2: FIX
- F3: FIX
- F4: FIX
- F5: FIX
- F6: FIX
- F7: FIX
- F8: FIX

## Round 2

Date: 2026-11-15
Reviewer: measure-spec-review, claude-code/claude-sonnet-5-5#high

### What this track proposes
This track trims old-model wording from the Measure prompts by hand, because the bundled prompt-audit command cannot run in an agent session. A 101-row table lists each same-line rewrite: shouting words in capitals, bold PROTOCOL labels, and DO NOT JUMP YET. The track keeps every Daniel quote, owner rule, human gate, quoted user-facing message, and test-pinned string, and it names each capital-letter word that stays. It applies each edit to skills/measure and to the byte-equal claude-skills/measure copy in one commit. Then it records the change in CHANGELOG.md and README.md and archives the track.

### How the current system works, per this spec
The Measure prompts (AGENTS.md, the measure and measure-orchestrator skills, the agents/measure-*.md role files, and the plugin command files) hold shouting, PROTOCOL labels, and repeated warnings. Tests pin some strings: S1 pins steps 1 to 8 of the new-track section 2.5 and the bundle equality, S2 pins the role-file sentences, and S4 pins the orchestrator document strings. The spec says that no proposed cut text is pinned, and the gates run the S1, S2, S4, DSH, and plugin tests after the edit.

### Findings
- F9 [Major] Audit table and Capital-letter hits kept: Ten in-scope capital-letter hits have no row and no keep reason: IMMEDIATELY JUMP (references/setup.md:99), EVERY (references/new-track.md:205 and references/setup.md:454), AFTER (references/revert.md:127), the CONDITIONAL and PURPOSE labels (references/review.md:132 and :134), the AI AGENT INSTRUCTION label (assets/workflow.md:195), NO (references/review.md:223), and EITHER with AND (skills/measure-orchestrator/references/anti-pattern-catalog.md:45 and :91, a file that the clean list names as clean). Rationale: PM rule 2 removes shouting, and the Audit method says each instruction-prose hit gets a row or a keep reason; setup.md:99 sits in the same section as row 48 (DO NOT JUMP YET), so add a row for each hit or a keep reason.
- F10 [Nit] Out of Scope: The first bullet says any file outside the scope list is out of scope, but FR-3 changes CHANGELOG.md and README.md, which the scope list does not name. Rationale: the Scope section already carves out the two files, so the text agrees in meaning; add an exception for the Task 1.2 archive commit to remove the apparent conflict.
- F11 [Nit] Capital-letter hits kept and Audit table rows 8, 26, and 77: The keep list does not name the output and test tokens PASS, FAIL, INCOMPLETE, WARN, DRIFT, PROPOSAL, INFO, and BANNED, and the Reason column of rows 8, 26, and 77 names NOT but not HALT. Rationale: the new text of the three rows already removes HALT and the tokens are code names, so only the record is incomplete; name them to keep the Audit method claim true.
- F12 [Nit] Functional Requirements FR-3 and plan Task 1.2: No text is given for the CHANGELOG.md entry or for README.md line 33, so the worker writes both. Rationale: the G21 archive commit 19a4f29 shows the format (one bullet with a bold lead, one replaced sentence), and the wording does not change what the worker builds; name that precedent in the task line.

Round 1 findings F1 to F8: all fixed in 271adc4 (see the evidence list of the result JSON). No CONTEST item existed, so no withdraw or keep decision was needed.

Checks run:
- HEAD equals audited_head_sha 271adc41c8a92f27ac44d29b959ff44cf2b02b7d.
- 101 rows: file and line exist and match the old text; the line counts of the spec equal wc -l; diff -r skills/measure claude-skills/measure exits 0.
- Pin check (grep -rlF of each full old line in tests/, plugins/dsh-measure-guard/tests, plugins/opencode-measure-guard): no hit for any row. No hit for the F9 words either.
- Capital-letter search: ten instruction-prose hits without a row or a keep reason (F9).
- Zero-decision check: only the CHANGELOG.md and README.md wording is open (F12).

### Author Response
- F9: FIX
- F10: FIX
- F11: FIX
- F12: FIX
