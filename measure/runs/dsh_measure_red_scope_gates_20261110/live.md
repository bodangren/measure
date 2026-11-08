# track-scoped gates: evidence

Date: 2026-11-08 (track records use the 2026-11-10 track date)

## The change

- `scoped_changed_files(repo, baseline, track)`: the sorted union of the own commits paths, or None when the scope cannot be proven (no baseline/track, no other-track commit in range, or an unreadable commit path) — the caller keeps the full range;
- `own_commits_after(repo, baseline, track)`: the own commit list, or None;
- `spec-review` outside-`measure/runs/` rule and `ux_paths` (new `--track`, passed by the UX role gate) read the scoped set;
- Jr Green fails with "only commits of another track" when HEAD advanced only by another track, instead of comparing HEAD with the baseline.

## Tests (test_red_track_scope.py, 19 cases)

Six new cases: the helper returns own-only paths; it returns None without another track (and for an empty track); `ux_paths` with a track keeps its own UI file and drops the other track's; `own_commits_after` is `[]` for another-track-only and None without a track; a passing `spec-review` role gate on a mixed range; and the Jr Green failure when only the other track advanced HEAD. The pre-fix behavior failed the spec-review case (reported `src/login.py` outside measure/runs) and passed the Jr Green case.

## Gates

- spec-review-gate: 12 suites (PASS=12, FAIL=0), including the 19 red-scope cases
- CLI: 14/14
- node: 354/354
- parity: ok (both gates)

## Records

The Medium row is Resolved and deduplicated; `contracts.md` documents the scoped reads (Baseline and HEAD advance bullets). After this closure the tech-debt list has no open row.

## Live check (no plugin code change)

```
PASS live: HTTP 200 with a band field; digest sha256:a430b66932b86b5cc matches the installed copy
check complete
```
