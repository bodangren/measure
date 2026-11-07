# Spec Review: dsh_measure_scan_fix2_20261107

Author model: deepseek-official/deepseek-flash

## Round 1

Date: 2026-11-07
Reviewer: subagent (fresh context, default model)

### What this track proposes

Widening the command-start rule in the commit guard's `git add` scan so a `git`
word also counts after a run of command prefixes — an env assignment
`NAME=value` and `env`/`sudo`/`command`/`exec`/`nice`/`time` — documenting the
rule and adding tests. It also indexes the mid-red ledger with named sections and
corrects the archived quoting-follow-up Task 3.4 citation, the archived
token-scan follow-up Overview/FR-4 wording, and this track's own closeout check.

### How the current system works, per this spec

`addedPaths` counts a `git add` only at a command start; the shipped rule was the
first word or the word directly after a separator, so an env-prefixed or wrapper
command failed open (the file was in neither the staged set nor the added set).
The ledger mixed several tracks' runs under one track's title, and the archived
quoting-follow-up Task 3.4 cited the ledger without a section. The archived
token-scan follow-up spec's Overview said the earlier tasks carried no SHAs (Task
4.1 and the verification lines did), and its FR-4 did not distinguish task
commits from phase checkpoints.

### Findings

- F1 [Major] spec.md FR-3 (also plan.md Task 2.1): the section Task 3.4 was
  ordered to cite ("Token-scan follow-up gates") is the
  `dsh_measure_token_scan_followup_20261107` block (296/296), while the quoting
  follow-up's Task 3.4 ran 294/294 and no 294 appeared in the ledger; FR-3's
  section list gave that run no section. Rationale: the "correction" would point
  at another track's numbers.
- F2 [Major] spec.md FR-4 (also plan.md Task 2.2): "the checker reported seven
  because it skips the deferred task" is false — no task in that plan is
  deferred; `plan_closeout_feedback` skips any line whose text contains
  "deferred", and the skipped line is the completed Task 3.2 ("every
  non-deferred task `[x]`").
- F3 [Major] spec.md FR-1 / Overview: the rule still counted `git` only after
  bare prefix words, so `sudo -u <user> git add`, `env -i git add`, and
  `nice -n <n> git add` still failed open, with no test and no recorded residual.
- F4 [Nit] spec.md Overview: "names the wrong track in its header" — the ledger's
  title named the track of its first block; the defect is that a multi-track
  ledger was titled for one track.
- F5 [Nit] plan.md Task 3.1: Phase 3 had no step that runs
  `closeout --track dsh_measure_scan_fix2_20261107`, so FR-5's
  "closeout-clean except the manifest FAIL" was unverifiable from the plan.

### Author Response

- F1: FIX (the ledger's gates section for the token-scan follow-up is named for
  that track; a new `dsh_measure_add_quoting_followup_20261107 — gates` section
  records its 294/294 run, and Task 3.4 cites that section)
- F2: FIX (the archived token-scan follow-up FR-4 states the exact skip cause:
  the checker skips a plan line containing "deferred", which is the completed
  Task 3.2's "every non-deferred task `[x]`" line, not a deferred task)
- F3: FIX (Task 1.4 extends `atCommandStart` to wrapper option words and the
  arguments of `-u`/`-n`/`-C`/`--user`/`--nice`/`--chdir`/`--unset`; tests cover
  `sudo -u root`, `env -i`, and `nice -n 5`; the previous scanner fails them and
  the suite is 297/297)
- F4: FIX (the Overview says the ledger mixed several tracks under one title)
- F5: FIX (Phase 3 Task 3.1 runs and records the closeout check; it reports only
  the expected `automation-supervisor` manifest FAIL, recorded in the ledger)
