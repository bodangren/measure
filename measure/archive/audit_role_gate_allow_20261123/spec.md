# Specification: Audit roles may run role-gate

## Overview

Audit roles could not run the `role-gate` command. The shell denied it with `Permission denied: shell`. This happened on 2026-11-23 on track `readme_heavy_run_form_20261123`. It happened in Review A twice and in phase acceptance once. The orchestrator ran the gate each time.

Source: PM order, light lane, chore track, due 2026-11-26.

## Functional Requirements

- **FR-0 (Root cause).** The audit role files allow `shell *` and then deny unanchored globs such as `*rm *`, `*mv *`, `*cp *`, `*chmod *`, `*chown *`, `*sed -i*`, `*tee *`, and `*truncate *`. The last matching rule wins. The `git merge-base *` allow after the `*git merge*` deny proves the order rule. This was verified in `agents/measure-review-a-correctness.md`. The phase heading `Phase 1: README uses the heavy-run form (due 2026-11-26)` holds the text `rm (`. The glob `*rm *` matches the `role-gate` command because the command holds the phase text. Earlier headings held no such text, so the same command passed.
- **FR-1 (Allow rule).** In each of the 8 audit agent files that hold the `*rm *` deny, add one rule. The files are `agents/measure-ux-browser-review.md`, `agents/measure-final-acceptance.md`, `agents/measure-review-c-ux-api.md`, `agents/measure-phase-acceptance.md`, `agents/measure-orchestrator-audit.md`, `agents/measure-review-a-correctness.md`, `agents/measure-review-b-security.md`, and `agents/measure-spec-review.md`. The rule uses action `shell`. The rule uses resource `python3 */measure-orchestrator/scripts/measure_interphase_checks.py role-gate *`. The rule uses effect `allow`. The rule sits after the `*truncate *` deny and before the `* > *` deny. The rule uses the same YAML style as its neighbours. The three redirection denies stay after it. A command that starts with the role-gate form and holds no matched redirect gives `allow`, also when a chain follows (for example `; rm x` or `&& cp a b`). A command that starts with the role-gate form and holds a matched redirect gives `deny`, because the later redirection denies win. A matched redirect is a space followed by `>` (the globs `* > *` and `* >*`) or `>>` (the glob `*>>*`). An unspaced `>` (for example `>out.txt` with no space before it, or `2>&1`) matches none of the three denies. It was allowed before this track and stays allowed: an existing gap, not changed here, listed in the closeout tech-debt row about the unanchored deny globs. The chained allow is an accepted gap: the deny list of these roles is a guard rail, not a sandbox (the roles can already run `python3 -c` or `node -e`), and the audit roles are audit-only by contract.
- **FR-2 (Change set).** The change set is exactly: the eight agent files (one new rule each), the new test file `tests/spec_review_gate/test_audit_role_gate_allow.sh` (the runner `run.sh` discovers it; no edit of `run.sh` unless the runner needs an entry, then one line), and the track files. No other file changes, except the closeout files named below. The files `agents/measure-adversarial-testing.md`, the Red files, the Green files, the closeout files, the strategy file, and the orchestrator files stay untouched. They stay untouched because they hold no `*rm *` deny or they already pass the gate. The closeout of this track also changes `measure/tracks.md` (registry), `measure/tech-debt.md` (one new row) and the archive folder, as every closeout does; these are not part of the implementation change set.
- **FR-3 (Contract test).** The test `tests/spec_review_gate/test_audit_role_gate_allow.sh` checks the 8 files. It uses the same `v2_shell_effect` helper as `tests/spec_review_gate/test_s2_role_docs.sh`. It follows the same convention as `test_s2_role_docs.sh`, so `tests/spec_review_gate/run.sh` runs it in CI. For each of the 8 files it checks these cases. The exact failing shape `python3 skills/measure-orchestrator/scripts/measure_interphase_checks.py role-gate --repo . --role phase-acceptance --track t --phase "Phase 1: README uses the heavy-run form (due 2026-11-26)" --baseline abc --result-file measure/runs/t/r.json --log-file measure/runs/t/r.log` gives `allow`. The exact shape with `; rm x` and no matched redirect gives `allow` (marked `accepted gap, FR-1`). The exact shape with ` > out.txt` gives `deny`. The exact shape with `; rm x > out.txt` gives `deny`. The exact shape with ` 2>&1` gives `allow` (marked `existing gap, unchanged`). The commands `rm x` alone, `cp a b` alone, and `git commit -m x` still give `deny`. This deny claim applies to commands that do not start with the role-gate form. The command `python3 skills/measure-orchestrator/scripts/measure_interphase_checks.py closeout --repo . --track t` keeps its old effect. The test records the old effect at the base commit `3c694b5` as the expected value. The rule sits after the `*truncate *` deny and before the `* > *` deny. The test fails before the edit.
- **FR-4 (Installer).** The installer does not change. The installer ships `agents/` to `~/.config/opencode/agents`. The post-merge proof is the orchestrator run of the installer, `--check`, and a diff of the installed agent files. That proof is not a task.

## Acceptance Criteria

- The 8 audit files allow a role-gate command with no matched redirect, also with a chain.
- The 8 audit files deny a role-gate command with a matched redirect (a space before `>` or `>>`).
- An unspaced `>` stays allowed (existing gap, unchanged).
- The old deny cases still deny for commands that do not start with the role-gate form.
- The contract test passes after the edit and fails before it.
- The installer needs no change.

## Out of Scope

- No change to the deny globs.
- Anchoring the deny globs or splitting chained commands in the roles' rule lists.
- No change to the other tech-debt rows.

## Tech-debt note for closeout

- Write one tech-debt row at closeout: audit-role deny globs are unanchored and match words inside arguments (for example `form (` matches `*rm *`); a later chore anchors them. It also records the unspaced `>` gap (`>out.txt`, `2>&1`).

## Open Questions

None.
