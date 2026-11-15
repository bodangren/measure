# Implementation Plan: G21 time margin

Track: `g21_time_margin_20261115`
Spec: [./spec.md](./spec.md)

**All commits go on fix/g21-time-margin. Push only to origin/fix/g21-time-margin, never to main. Only Daniel merges the pull request. The pull request stacks on PR #16.**

## Phase 1: G21 time margin [checkpoint: 4726b00]

- [x] Task 1.1: the G18 probe width (Red, Green) and the full-suite run. Run
  `bash tests/spec_review_gate/test_s3_adversarial.sh` before the change,
  show the G21 quadratic FAIL line, and keep the output in
  `measure/runs/g21_time_margin_20261115/` (Red). In
  `tests/spec_review_gate/test_s3_adversarial.sh`, add the constant of FR-1
  near `TIME_LIMIT`, and change the first G18 probe to the form of FR-2; keep
  `TIME_LIMIT`, the 15 s mutant timeout, the other three G18 probes, and
  every other check unchanged (FR-3). Run
  `bash tests/spec_review_gate/test_s3_adversarial.sh` again: it exits 0, the
  G21 quadratic mutant line is PASS with a "killed by:" line, and the first
  G18 probe of the real checker passes; keep the output in
  `measure/runs/g21_time_margin_20261115/` (Green). Run
  `HEAVY_PRIORITY=p2 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh bash tests/spec_review_gate/run.sh`
  with no shell redirection; Storytime has first claim on the heavy lock, so
  a wait is normal; it exits 0. Commit the test file. `d322d79`
- [x] Task 1.2: records and closeout. Finalize `metadata.json` (status done,
  `actual_tasks`, the `completed` key). Update `CHANGELOG.md` with one entry
  at the top of "## Unreleased" / "### Bug Fixes", and `README.md` line 33 to
  name this track as the latest archived track (2026-11-15). Archive the
  track, and after the plan tasks close, move the registry entry from Active
  Tracks to the end of Archived Tracks with `[x]` and the metadata
  description. Run
  `HEAVY_PRIORITY=p2 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh bash tests/dsh/test-registry.sh`
  with no shell redirection (long timeout), then run the closeout check of
  the acceptance criteria, in this order; the closeout check fails only on
  the missing closeout manifest. Record the results. `19a4f29`
- [x] Task: Measure - User Manual Verification 'Phase 1: G21 time margin' (Protocol in workflow.md) `4726b00`

After the last commit of this phase, push fix/g21-time-margin to origin and open the pull request that stacks on PR #16. Never merge the pull request.
