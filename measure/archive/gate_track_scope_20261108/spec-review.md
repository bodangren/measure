# Spec review: Gate track scope

Author model: claude-code/claude-opus-5-5 (Claude family).

## Round 1

- Reviewer: `measure-spec-review`, model `deepseek/deepseek-flash#high` (DeepSeek family), picked by `ra-quota pick review-a --not-family claude`.
- Baseline: `9d67250`. Result: `measure/runs/gate_track_scope_20261108/spec-review-9d67250.json` (committed in `4fd7751`).
- Status: fail. 2 Blocker, 2 Major, 3 Nit. The `role-gate --role spec-review` check fails on `4fd7751` only on the status.

| Id | Severity | Finding (short) | Response |
| --- | --- | --- | --- |
| F1 | Blocker | The AC-18 replay cannot exit 0, because the real Monorepo result has `status: fail`. | FIX. The replay (now AC-21) uses a new passing payload outside the clone. The old checker lists the six files of the other track, and the new checker exits 0. |
| F2 | Blocker | D4 and AC-5 select different messages when a tree is unreadable. | FIX. D4 now runs the tree diff in each mode first, and a tree-diff failure keeps the old message (fail closed). AC-5 uses an own commit that is not HEAD, so the tree diff passes and the D3 message shows. New AC-6 pins a missing baseline tree in the scoped mode. |
| F3 | Major | The spec does not say how `ux_paths` gets the track id. | FIX. D5 adds `ux_relevant(paths)`. `ux_paths(repo, baseline)` keeps its signature and result. |
| F4 | Major | Only AC-5 covers the D3 failure. | FIX. New AC-14 (`ux-browser-review`) and AC-18 (`ux-paths`) cover the D3 failure. |
| F5 | Nit | AC-1 does not say which file each `login_track` commit changes. | FIX. A new paragraph defines the two `login_track` commits: one file each. |
| F6 | Nit | D2 "the same file set" has no meaning for the `jr-green` HEAD check. | FIX. D2 now says that the old mode of `jr-green` keeps the HEAD check. |
| F7 | Nit | The fixture paragraph does not name `webbridge_evidence`. | FIX. The paragraph names `webbridge_evidence` with its three empty lists. |

## Round 2

- Reviewer: `measure-spec-review`, model `deepseek/deepseek-flash#high` (DeepSeek family), the same subagent session as round 1.
- Baseline: `ab95c03`. Result: `measure/runs/gate_track_scope_20261108/spec-review-ab95c03.json` (committed in `1a510ee`).
- Status: pass. 0 Blocker, 0 Major, 1 Nit. F1 to F7 are closed. The `role-gate --role spec-review` check passed on `1a510ee`.

| Id | Severity | Finding (short) | Response |
| --- | --- | --- | --- |
| F8 | Nit | D4 "run first" names no reference point, and the result-file check runs before the baseline checks. | FIX. D4 now says that the result-file check and the checks of `--baseline` keep their order and their messages, and that the tree diff runs after them. |
