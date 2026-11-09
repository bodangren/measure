# Spec review: Guard phase start

Author model: claude-code/claude-opus-5-5 (Claude family).

## Round 1

- Reviewer: `measure-spec-review`, model `deepseek/deepseek-flash#high` (DeepSeek family), picked by `ra-quota pick review-a --not-family claude`. Subagent session `ses_e41ad5b81ffexNj2MjDEFWRu54`.
- Baseline: `5cc8604`. Result: `measure/runs/guard_phase_start_20261109/spec-review-5cc8604.json` (committed in `78d7ccf`).
- Status: pass. 0 Blocker, 3 Major, 3 Nit. The `role-gate --role spec-review` check passed on `78d7ccf`.

| Id | Severity | Finding (short) | Response |
| --- | --- | --- | --- |
| F1 | Major | The removal drops the only reminder of the checkpoint protocol; a note in place of the deny keeps it and still allows each change. | FIX. D1 and D2: `phaseStartDecision` becomes `phaseStartNote`, and the closeout functions return its text as a note. AC-1 to AC-4 assert the note. |
| F2 | Major | FR-4 omits item 6 of `mods/measure-guard/DESIGN.md`. | FIX. FR-4 and Task 3.2 name the file. |
| F3 | Major | AC-6 gives no working directory for the commands. | FIX. AC-6 names the folder of each command. |
| F4 | Nit | The `[x]` and the checkpoint assertions pass before the change, so they give no Red evidence. | FIX. Task 2.1 states that these assertions guard the old behavior. The note assertions are the Red evidence. |
| F5 | Nit | D2 "before it reads the file" does not fit the DSH loop. | FIX. The new D2 keeps the read, because the note needs the before-text and the after-text. |
| F6 | Nit | AC-7 names no revision. | FIX. AC-7 compares the installed files with the commit of the install stamp. |
