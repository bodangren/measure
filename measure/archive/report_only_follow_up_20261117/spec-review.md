# Spec Review: report_only_follow_up_20261117

Author model: minimax-cn-coding-plan/MiniMax-M3.1-Flash

## Spec Review

Two rounds. The finding lines and the paraphrase sections are copied unchanged from the review files.

## Round 1

Date: 2026-11-17
Reviewer: measure-spec-review, claude-code/claude-sonnet-5-5#max
Full review text: `measure/runs/report_only_follow_up_20261117/spec-review-e053d64.json` and `.log`. The runs folder is gitignored.

### What this track proposes

This track makes the measure-guard end-of-turn text report-only. A shared REPORT_ONLY line and a reportText() helper in the core tell the agent to write the open problems in its reply and to act only on an order from its orchestrator or the user. The two problem texts state the usual fix as information. The OpenCode plugin, the Claude Code mod, and the DSH adapter use the helper, and each end-of-turn suite pins the new text with a test.

### How the current system works, per this spec

Per the spec, the guard sends a text at the end of a turn: a strict-mode follow-up prompt or stop block, or a guard-mode reminder. Each text tells the agent to fix the open problems. In the incident, the OpenCode synthetic reminder (resume false) started a turn in a finished session after a compaction. That session then edited plan.md, committed, and pushed with no message from its orchestrator.

### Findings

- F1 [Major] Evidence 'The path that fired' and Decided design: The text-only design meets the done-when as written, but it leaves the turn start in place. The OpenCode synthetic call (`index.ts:102`, `resume: false`) still starts a turn in a finished session after a compaction. README.md:111 of the OpenCode plugin still says the agent does not start a new loop, and the spec records no limit for the residual risk. Only the OpenCode adapter can start a turn: the mod and the DSH adapter deliver the reminder at the next prompt or step (`register.tsx:318-321`, `context.js:72-75`). Disposition hint: ESCALATE to the PM, and FIX the spec to record the residual risk in Out of Scope. A follow-up track can cover the turn start, for example with an ignore of the end events of a compaction run, or with the prompt rider at `guard.ts:144-146` as the only path. Rationale: the PM reason is that a hook must never make a role act outside its brief, and a text can only ask.
- F2 [Major] Tests: The test inputs stay open, so part of the regex set cannot fail before the change. The regex literals have no `i` flag; without it, a Code Mode run on the old texts gave no hit for the input `['p1']`. With the flag, only `/\bfix (these|them)\b/i` hits the old follow-up and reminder for `['p1']`, so the two changed problem texts (`guards.ts:320`, `:326`) have no failing case. The spec also leaves open if a test imports `REPORT_ONLY`; a missing export fails the whole suite to load, as in the Red of `role_spawn_route_20261117`. Disposition hint: FIX with the `i` flag, with real `turnProblems()` output for a `[x]` task with no SHA and for a change with no `[~]` task, and with the literal `REPORT_ONLY` sentence in a test constant. Rationale: a pin that cannot fail before the change does not prove the change.
- F3 [Major] Decided design 1 and 3, and section 6 'What stays': The strict text keeps the head `do not end the turn yet` and adds a body that forbids action and asks only for a report. `MAX_BLOCKS` stays 2, so strict mode still sends two follow-ups, and the agent repeats the same report for each (README.md:116 records that the agent answers each follow-up). The head asks the agent to continue and the body asks it to wait, so the two signals conflict. Disposition hint: ESCALATE. The PM decides if strict mode keeps two report-only follow-ups, sends one, or sends none. If the PM keeps the design, FIX the spec to record this consequence. Rationale: the follow-up no longer drives a fix, so each extra follow-up costs a model turn and gives no new information.
- F4 [Major] FR-6 and plan Task 1.2: FR-6 and Task 1.2 fix the date `2026-11-19` in the README sentence and in `completed` of `metadata.json`. This date is the date that the PM needs, not the day that the worker finishes. The precedent track `role_spawn_route_20261117` wrote its real completion date. Disposition hint: FIX. Write the date of the archive commit, or state why 2026-11-19 is right. Rationale: a README sentence that says 'As of' a date that has not come, or a `completed` field with that date, is a false record.
- F5 [Nit] Decided design 3 (comments and docs): The change leaves three statements stale. `turn.ts:14` says a follow-up 'keeps the agent working on the problems', and `turn.ts:44` says the text holds 'the instruction to fix them now'. README.md:112 of the OpenCode plugin also says the strict follow-up 'keeps the agent working'. Disposition hint: FIX. Name the two comments and the README bullet in section 3, or DECLINE. Rationale: a stale comment states the opposite of the new text.
- F6 [Nit] Tests and plan Task 1.1: Two small choices stay open. The Tests section says 'One shared helper per package is fine', and Task 1.1 names only `red-report-only.log` and `green-report-only.log`, not the files of the gate outputs. Disposition hint: FIX. Drop the helper sentence or name the helper, and name each gate log (the precedent used `package-test.log`, `run-suites.log`, and `test-registry-task1.1.log`). Rationale: a bounded worker must not choose a name.
- F7 [Nit] Decided design 1 (placement): The words 'directly before `turnProblems()`' can put the block between the doc comment (`guards.ts:309-312`) and the function, and this detaches the comment. Disposition hint: FIX. Say 'above the doc comment that starts at line 309'. Rationale: the placement is a file-location choice that the plan leaves to the worker.
- F8 [Nit] Out of Scope: The list omits `commitReminder` (`guards.ts:495`), a hook text that tells the agent to add a git note and to edit plan.md after its own commit. The mod, the OpenCode plugin, and the DSH adapter send it (`register.tsx:393`, `src/guard.ts:241`, `src/hooks.js:112`). It is not an end-of-turn text, and the spec rightly leaves it unchanged. Disposition hint: FIX. Add `commitReminder` to Out of Scope, or DECLINE. Rationale: the PM reason covers any hook text that orders an edit, so the record must show that the site was examined.

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

Date: 2026-11-18
Reviewer: measure-spec-review, claude-code/claude-sonnet-5-5#max
Full review text: `measure/runs/report_only_follow_up_20261117/spec-review-3f87d5a.json` and `.log`. The runs folder is gitignored.

### What this track proposes

This track makes the measure-guard end-of-turn text report-only. A shared REPORT_ONLY line and a reportText() helper tell the agent to write the open problems in its reply and to act only on an order from its orchestrator or the user. The OpenCode plugin also stops sending the synthetic reminder, so only a real user prompt carries it. The three adapters use the helper, and each end-of-turn suite pins the new text.

### How the current system works, per this spec

Per the spec, the guard sends a text at the end of a turn: a strict-mode follow-up prompt or stop block, or a guard-mode reminder. Each text tells the agent to fix the open problems. In the incident, the OpenCode synthetic reminder (resume false) started a turn in a finished session after a compaction. That session then edited plan.md, committed, and pushed with no message from its orchestrator.

### Findings

- F5 [Nit] Decided design 3 (comments and docs): The F5 fix leaves three statements stale. The doc comment of watchIdle (`index.ts:84-88`) says the watch sends 'a synthetic reminder'. The doc comment of reminderText (`turn.ts:48`) says 'for the synthetic message and the next prompt'. The root `README.md:159` says 'a synthetic reminder (guard mode)'. After the change, none of the three statements is true. Disposition hint: FIX. Add the three statements to section 3, or DECLINE. Rationale: a stale statement says the opposite of the new code.
- F9 [Major] Decided design 3 (turn.ts comments): The spec names `turn.ts:13` and `turn.ts:15` as the comment lines. At HEAD, these lines hold the union members `| { kind: 'remind' ... }` and `| { kind: 'follow-up' ... }`. The two doc comments sit at `turn.ts:12` and `turn.ts:14`. The F5 record in spec-review.md ('The file has it at line 15. Line 14 is the member line of the remind case') misreads the file. Disposition hint: FIX with the lines 12 and 14. Rationale: a worker who follows the line numbers replaces a union member, and no gate catches it, because bun test does not type-check.
- F10 [Nit] FR-6 (CHANGELOG entry): The entry says 'so no turn starts in a finished session'. This is false for strict mode, because the follow-up prompt (`ctx.session.prompt`) still starts a turn after a turn-end event with problems. Disposition hint: FIX. Write 'so a reminder no longer starts a turn in a finished session'. Rationale: the worker copies the sentence into a public record, and the sentence overstates the change.
- F11 [Nit] Tests (the watchIdle case): The new case is the first test that loads `src/index.ts`, and that file imports `@opencode/plugin`. The package has no node_modules (`plugins/opencode-measure-guard/README.md:156`). On this host Bun resolves the package from its install cache, and the probe loaded the file in 177 ms. A cold cache needs the network, and the load can exceed the Bun test timeout. The spec names no fallback. Disposition hint: FIX. Record this precondition in the Tests section, or DECLINE. Rationale: a failed load in Green leaves a second failing case, and the worker must then choose a workaround.

### Author Response

- F5: FIX
- F9: FIX
- F10: FIX
- F11: FIX

## Applied Changes

- F1: section 3 drops the synthetic call from the turn-end watch. The reminder stays in the session state. The Tests section drives the exported `watchIdle` with a fake context and checks that no synthetic message and no prompt go out. The plugin README lines 111 and 116 change.
- F2: every regex has the `i` flag. The test inputs are the real `turnProblems()` output for both problem kinds. A test constant holds the literal REPORT_ONLY sentence and asserts equality with the export.
- F3: `FOLLOW_UP_HEAD` and the core stop block head both read `measure-guard (strict): report these problems before you end the turn.` Section 6 records that strict mode can ask for the report up to `MAX_BLOCKS` times.
- F4: FR-6 and Task 1.2 use the date of the archive commit. The spec holds no fixed date.
- F5: the comments at `turn.ts:12`, `turn.ts:14`, `turn.ts:44`, and `turn.ts:48`, the comment at `index.ts:84-88`, the plugin README bullets at lines 111 and 112, the live-check paragraph at line 116, and the root README bullet at line 159 carry the new text. The header comment at `turn.ts:4` loses the synthetic.
- F6: each package names its helper `assertReportOnly`. The Gates section names each log file.
- F7: section 1 places the block above the doc comment that starts at line 309.
- F8: Out of Scope names `commitReminder` and the in-turn denies.
- F9: section 3 names the doc comments at `turn.ts:12` and `turn.ts:14`. Lines 13 and 15 hold the union members and stay unchanged.
- F10: the FR-6 entry says that a reminder no longer starts a turn in a finished session. It names the strict follow-up prompt.
- F11: the Tests section records the `@opencode/plugin` install-cache precondition and the infrastructure-failure rule.

### Seam Decision

Date: 2026-11-17
A source pin is too weak. The F1 case drives the exported `watchIdle` with a fake context. The named export changes no runtime behavior.
