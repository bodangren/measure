# Spec Review: superseded_close_20261117

Author model: opencode-go/deepseek-v4.1-flash

## Spec Review

Reviewer: claude-code/claude-sonnet-5-5#max
Date: 2026-11-17
Input: `measure/runs/superseded_close_20261117/spec-review-d9fa504.json` and `.log`
Baseline: `d9fa504`
Verdict: fail, with 2 Blockers (F1, F2), 4 Majors (F3 to F6), and 5 Nits (F7 to F11).

Round 1 dispositions of the orchestrator, 2026-11-17:

- F1 [Blocker] FIX. `ClosingTrack.plan` is a parsed `Plan`, so the core cannot read the plan text. The design now keeps `supersededTarget(planText, metadataText)` pure and exported. `ClosingTrack` gains `supersededBy?: string | null` in place of `metadata`. Each adapter reads its plan text and `metadata.json`, and sets `supersededBy`. `trackCloseDecision` skips the open-task check for a non-empty `supersededBy`. `metadataProblem` skips the `actual_tasks` check for it. Spec sections 1, 2, and 4 hold the design. `git-verification.js` imports nothing new.
- F2 [Blocker] FIX. The mod gate is `claude plugin test mods/measure-guard`, the command of `measure/tech-stack.md` line 40. The command runs here. At HEAD `d9fa504` it exited 0, with 97 pass and 0 fail. The spec records this result, and the plan uses the command for the Red and Green runs. No adapter test covers the mod path instead.
- F3 [Major] FIX. The allow note keeps the `[b]` list, then adds the header `Superseded tracks:` and one item per superseded closing track. A superseded track with no open task gets the same item. Spec section 3 holds the note in order. The note stays `null` when both parts are absent.
- F4 [Major] FIX. Cases (a) to (c) now run through each adapter, with a real `metadata.json` beside `plan.md`. The three suites are the OpenCode suite, the mod suite, and the DSH suite. Case (a), case (d), and the DSH skip case are the Red cases. Cases (b) and (c) and the DSH no-line case are controls.
- F5 [Major] FIX. The tests gain five groups. Near-miss plan lines give a deny. A null metadata text gives `null`, and so does a status other than `superseded`. One registry edit closes a superseded track and an open track together, and the deny names only the open track. A superseded line with metadata status `done` gives a deny. A superseded track with no open task gets the note item.
- F6 [Major] FIX. Task 1.2 updates the closeout rule text in all three READMEs. The lines are `plugins/opencode-measure-guard/README.md` line 71, `mods/measure-guard/README.md` near line 89, and `plugins/dsh-measure-guard/README.md` near line 158.
- F7 [Nit] FIX. The count is eight plans. Seven carry the line at the start of a line, and the regex rejects the eighth. The spec records that two real plans give the target `the`, that the note shows the captured word as is, and that the status check is the real guard. The regex does not change.
- F8 [Nit] FIX. The plan holds the exact CHANGELOG entry, the three README sentences, and the `README.md` line 33 sentence, in its Documentation text section.
- F9 [Nit] FIX. The plan says that the closeout check exits 1, with only the missing-manifest FAIL and the light-lane INFO line.
- F10 [Nit] FIX. The new prose splits into short sentences. Each task stays on one physical line.
- F11 [Nit] FIX. Task 1.1 names the two parity copies, the `cp` and `sed` commands, the three types files, and the identical `ClosingTrack` text rule.
