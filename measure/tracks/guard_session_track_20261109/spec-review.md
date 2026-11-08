# Spec review: Guard session track

Author model: claude-code/claude-opus-5-5 (Claude family).

## Round 1

- Reviewer: `measure-spec-review`, model `deepseek/deepseek-flash#high` (DeepSeek family), picked by `ra-quota pick review-a --not-family claude`. Subagent session `ses_e43a4abbfffe44jtjFY1KGCCDt`.
- Baseline: `79140c0`. Result: `measure/runs/guard_session_track_20261109/spec-review-79140c0.json` (committed in `c4fc3bd`; the log block in `5ab36a9`).
- Status: pass. 0 Blocker, 4 Major, 3 Nit. The `role-gate --role spec-review` check passed on `5ab36a9`.

| Id | Severity | Finding (short) | Response |
| --- | --- | --- | --- |
| F1 | Major | The note for a parse error, no `measure/` folder, or no track is not defined. | FIX. D4 step 1 keeps the old `taskNote` note for these cases. New AC-20 pins the parse-error note. |
| F2 | Major | The note and the edit guard can use different tracks (D6, AC-16). | KEEP, with the reason in D6. The PM's WHY names the sessions and the role gates of the orchestrator, which read the note. A plugin guard that allows a call names no track. A session-scoped edit guard can deny edits that parallel sessions make today. |
| F3 | Major | The plan does not say how the work meets "one commit, with the install step recorded". | FIX. A plan rule: the plugin source change lands in one commit (Task 3.1), after the Red commit. The plan and the PM line record the install step. |
| F4 | Major | FR-1 gives no return types and no meaning of `null`. | FIX. FR-1 gives each signature, the `SessionSnapshot` type, and the meaning of `null`. New AC-21 calls the pure functions. |
| F5 | Nit | The list key has no exact string. | FIX. D5 gives the key with an example: `list|alpha_20261109,beta_20261109,gamma_20261109`. |
| F6 | Nit | D3 does not state the case rule. | FIX. D3: the match is case-sensitive. AC-6 adds `BETA_20261109`. |
| F7 | Nit | With 2 or more `[~]` tracks and no `[~]` task, the note names the first `[~]` track. | FIX. D4 step 5 and D5 add the idle list. New AC-22. |
