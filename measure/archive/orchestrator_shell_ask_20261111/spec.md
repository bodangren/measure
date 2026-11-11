# Specification: Orchestrator shell default ask

## Overview

Commit `72e20d3` changed the default shell entry of `agents/measure-orchestrator.md`
(the entry with action shell and resource `*`, line 17) from ask to deny. The
installed copy got the change at about 21:24 ICT on 2026-11-11. From 21:24 to
about 22:20 ICT, every shell command failed in 3 orchestrator sessions (PR,
Monorepo, Workbooks): their gates, slot checks, and git status. The PM restored
"ask" in both installed copies (backups in `~/.config/opencode/agent-backups/`).
This track changes the repository entry back to ask.

Source: PM order, 2026-11-11.

## Functional Requirements

- **FR-1 (the ask default).** In `agents/measure-orchestrator.md`, line 17
  changes from `    effect: deny` to `    effect: ask`. No other line of this
  file changes.
- **FR-2 (the rest of 72e20d3 stays).** The agent: "build" text with the rule
  "Never dispatch a session without an agent value", and the section
  "A dispatched session must never wait for a permission" stay.
- **FR-3 (the test pin).** `tests/spec_review_gate/test_s2_role_docs.sh` pins
  the deny default (lines 240 to 248, added by `f280025`). The pin changes to
  expect ask: the echo label, the comparison value, and the pass and fail
  messages. No other line of this file changes.
- **FR-4 (one fix commit, 2 files).** One fix commit holds exactly these 2
  files. `git show --numstat` on it gives 1/1 for
  `agents/measure-orchestrator.md`, and only the pin lines for the test file.
- **FR-5 (the doc tests).** These doc tests pass:
  `tests/spec_review_gate/test_s2_role_docs.sh`,
  `tests/spec_review_gate/test_s3_dispositions_docs.sh`,
  `tests/spec_review_gate/test_s4_doc_drift.sh`, `tests/dsh/test-docs.sh`,
  `tests/dsh/test-reference.sh`. Each test writes its output to
  `measure/runs/orchestrator_shell_ask_20261111/doc-tests.log`, and that log
  holds the counts.
- **FR-6 (installed-copy state after the fix commit).** `git diff --no-index`
  between `agents/measure-orchestrator.md` and each installed copy
  (`~/.config/opencode/agents/measure-orchestrator.md` and
  `~/.agents/agents/measure-orchestrator.md`) shows one hunk only: the
  "### Substitution" paragraph, which `f9ab73c` changed after the PM's backups.
  The shell entry no longer differs. `bin/install-measure-skill --ref HEAD
  --check` shows local-edit rows for
  `~/.config/opencode/agents/measure-orchestrator.md` and
  `~/.agents/agents/measure-orchestrator.md` only. That is expected until the
  PM decides the Substitution paragraph.
- **FR-7 (the PR).** Done when the branch `fix/orchestrator-shell-ask` is
  pushed to origin and a PR to main is open. `origin/main` does not change.
  `metadata.json` declares `"lane": "light"`, because this track runs no final
  acceptance. The closeout check then fails only on the missing closeout
  manifest.
- **FR-8 (the records).** The records state the ask default. `README.md` line
  33 (the Status line) names this track as the latest archived track and no
  longer says deny-by-default shell permissions. `CHANGELOG.md` gets a new
  first bullet under Unreleased, Bug Fixes, for this track, with no test count.
  In the existing bullet on line 7, the clause "the default shell effect is
  `deny` (all allow rules kept)" changes to "the default shell effect was
  `deny` (all allow rules kept; track `orchestrator_shell_ask_20261111`
  restored `ask`)". No other text of the two files changes.

## Out of scope

The installed copies; any other permission entry; the Substitution paragraph; a
merge into main; the full suite `tests/spec_review_gate/run.sh`.
