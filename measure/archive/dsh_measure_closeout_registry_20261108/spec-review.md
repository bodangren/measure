# Spec Review: dsh_measure_closeout_registry_20261108

Author model: deepseek-official/deepseek-flash

## Round 1

Date: 2026-11-09
Reviewer: subagent (fresh context, default model)

### What this track proposes

Closeout gains a registry-entry guard for the archived track: the
`measure/tracks.md` entry must exist, the following line must be a `*...*`
description, and that description must equal the whitespace-collapsed
`metadata.json` description, with at most one of three new messages per run and
no flag. A new test builds a temporary Measure repo and covers matching records, a
changed metadata description, a removed description line, and a removed entry.
Docs and CHANGELOG are updated; CLI, node, parity, and srg run.

### How the current system works, per this spec

`closeout_feedback()` verifies the archive move, the absence from the active
section, the plan's complete tasks with SHAs, metadata done with a date, and the
manifest; its only registry read is `active_registry_contains()`. The
description comparison lives in `tests/dsh/test-registry.sh`, which collapses each
metadata description and falls back to the label-stripped bold title when the
metadata description is empty.

### Findings

- F1 [Blocker] FR-1/FR-5: FR-1 compared only against the collapsed `metadata.json` description and never defined "collapsed" or the empty-description fallback; under the literal rule `visual_refresh_20260425` (metadata description empty, registry line is its title) would get a new FAIL, contradicting FR-5.
- F2 [Major] Overview/FR-1/plan Task 1.2: the Overview required the entry to "exist once" but the check finds the first match and returns one message, and the four fixtures have no duplicate-entry case, so a duplicate entry could pass closeout while the registry test rejects it.
- F3 [Major] FR-4/plan Task 2.1: the plan named `skills/measure-orchestrator/references/checks.md`, which does not exist; the closeout checks live in `skills/measure-orchestrator/SKILL.md` under `## Closeout Standard`.

### Author Response

- F1: FIX (the shipped guard already collapses the metadata description with `" ".join(str(...).split())` and falls back to the entry's label-stripped bold title when the metadata description is empty, matching `tests/dsh/test-registry.sh`; the correction note defines both)
- F2: FIX (the record no longer claims an "exist once" rule: the duplicate-entry rule stays with `tests/dsh/test-registry.sh`, and closeout reports at most one registry problem; the correction notes this division)
- F3: FIX (the documentation target was `skills/measure-orchestrator/SKILL.md` `## Closeout Standard`, which was updated with the new check bullet)

The verification is unchanged and green: the guard caught this track's own
post-archive metadata drift before the sync, then reported only the expected
manifest FAIL; CLI 12/12, srg 10/10, node 301/301, parity ok.
