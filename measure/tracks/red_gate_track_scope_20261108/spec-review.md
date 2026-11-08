# Spec review: Red gate track scope

Author model: claude-code/claude-opus-5-5 (Claude family).

## Round 1

- Reviewer: `measure-spec-review`, model `deepseek/deepseek-flash#high` (DeepSeek family), picked by `ra-quota pick review-a --not-family claude`.
- Baseline: `4cc7406`. Result: `measure/runs/red_gate_track_scope_20261108/spec-review-4cc7406.json` (committed in `9bb364f`).
- Status: pass. 0 Blocker, 5 Major, 4 Nit. The `role-gate --role spec-review` check passed on `9bb364f`.

| Id | Severity | Finding (short) | Response |
| --- | --- | --- | --- |
| F1 | Major | A role can tag its own production commit with the id of another real track, and the gate passes. | DECLINE. The PM chose the tag as the scope key. The Known limits section now states the risk and says that the phase acceptance and the reviews read the INFO lines. |
| F2 | Major | AC-7 does not pin the `--cc` rule against a first-parent diff. | FIX. AC-7 now requires that the output does not name `src/login.py`. A first-parent diff, a diff against each parent, and a plain `diff-tree` each fail the case. |
| F3 | Major | FR-6 does not say to change the `Baseline` bullet of `contracts.md`. | FIX. FR-6 now names the `Baseline` bullet and the `HEAD advance` bullet. |
| F4 | Major | Plan Task 4.1 allows a declined Blocker. | FIX. Task 4.1 now says to fix each Blocker. |
| F5 | Major | The acceptance criteria do not name `--phase`, the plan file, or the `[~]` task. | FIX. The fixture paragraph now names each file, the phase heading, the task, and the gate command. |
| F6 | Nit | AC-3 names no observation. | FIX. AC-3 now names the exit code, the PASS line, and the INFO line. |
| F7 | Nit | D2 does not fix the spaces inside the tag. | FIX. D2 now says: exactly one space after the colon, and no other space. |
| F8 | Nit | The plan names `scripts/jobs/slot` with no repository. | FIX. The plan now gives the absolute path. |
| F9 | Nit | D7 does not fix the separator, the order of several ids, or the output on a fail. | FIX. D7 now gives the line form `INFO: - <sha> <ids>`, the `,` separator, the D2 order, and the output on a pass and on a fail. |

Other changes in the same revision: D5 now states the failure of `diff-tree` and of `git log`. D7 lines now start with `INFO: `, as the `FAIL: ` lines of the gate do.
