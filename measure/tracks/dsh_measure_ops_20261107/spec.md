# Specification: DSH Measure operator controls — effective mode and on-demand verification

## Overview

**Sprint goal:** The operator can switch the guard mode from the chat (for this session or persisted for a repository), see the effective mode everywhere, and run the git-backed verification on demand.

The hardening track `dsh_measure_hardening_20261107` closed the live-check staleness, made the guard git-backed, and closed the write-path bypasses. Two seams it left are dead or one-shot:

1. **The persisted per-repository mode override is never read.** `src/state.js` stores and returns a `mode` per canonical root (`Repos.modeOf`/`setMode`), but the adapter reads the mode once from the profile config (`parseModeOf(config.mode)`) and passes that static value to every guard. The state seam exists but nothing calls it, so a repository cannot choose `strict` while another keeps `guard`, and there is no chat command to change the mode at all.
2. **The verification is turn-end or edit-triggered only.** The git-backed task problems (`shaProblems`) run at `agent/turn-stopping`; the closeout `metadata.json` check (`closeoutMetadataCheck`) runs only inside a `tracks.md` close edit. The operator cannot ask "is this plan's ceremony actually clean right now?" without waiting for a turn to end or faking a plan edit.

This track makes the mode effective and the verification askable. It touches only the adapter (no shared-core change, no new dependency).

Decisions made for this track (the owner chose the broader-integration direction and autonomous execution):

1. **Spec format:** story-shaped (feature track).
2. **Mode precedence:** repository override (persisted in `~/.local/state/measure/dsh-guard/repos.json`) > session override (in memory) > the profile config default. `/measure-mode <advise|guard|strict>` sets the session override; `/measure-mode <mode> repo` sets and persists the repository override; `/measure-mode default` and `/measure-mode default repo` clear the corresponding override; `/measure-mode` with no argument reports the effective mode and its source (`repository`, `session`, or `config`).
3. **Every guard path reads the effective mode per canonical root.** The decision preparation, the context note/reminder, the end-of-turn hold, and the client view call one `deps.modeOf(root)` seam (an async read that composes the overrides) instead of the static config value. A mode change applies on the next call, like a directory change.
4. **The effective mode is observable.** The state route carries `mode: { value: 'advise'|'guard'|'strict', source: 'repository'|'session'|'config' }`; the band renders both the value and the source with a localized label (`Mode: <value> (<source>)`); `measure_status` and `/measure-status` include `Mode: <value> (<source>)` after the guards line. The route keeps its existing fields; `mode` is additive.
5. **`/measure-verify` is read-only and reports, never mutates.** `verifyReport(deps, agent)` returns a **string**; it refreshes the snapshot (`deps.refreshSnapshot` when present, else `invalidate` + `get`), then checks git availability with one probe (`rev-parse --verify --quiet HEAD^{commit}`: `error` → `measure-guard: nothing to verify (git could not answer).`; `missing` → `measure-guard: nothing to verify (not a git work tree).`), then composes `shaProblems` (the end-of-turn texts) and a metadata verdict read directly from `<plan dir>/metadata.json`: an `actual_tasks` that is a number and differs from the `[x]` count reports the closeout mismatch text; a missing file adds no verdict (so an in-progress project is clean); malformed JSON reports the path text. The clean reply is `measure-guard: verification clean (<n> tasks checked).`, where `<n>` is the number of `[x]` tasks that carry a SHA. Problems are joined by newlines. A project without `measure/` or no active track is `nothing to verify (<reason>)`; nothing throws.
6. **No shared-core change, no new dependency.** All work is adapter-side; both parity gates stay green; the CLI contract tests are unchanged.
7. **Verification:** `node --test plugins/dsh-measure-guard/tests/*.test.js`, `bash plugins/dsh-measure-guard/scripts/check-parity.sh` and `bash plugins/opencode-measure-guard/scripts/check-parity.sh`, `bash tests/dsh/run.sh`, `bash tests/spec_review_gate/run.sh`, and a live check that switches the mode to `strict` through `/measure-mode`, proves a real deny appears, switches back, and records `/measure-verify` output.

## Stories

### Story S1: The effective mode and the mode command
**As a** Measure user on the DeepSeek Harness
**I want** to switch the guard mode from the chat for this session or this repository
**So that** one repository can be strict while the default stays guard, without editing the profile patch

**Acceptance Criteria:**
- Given no override, When any guard path runs, Then the mode is the profile config value and the source is `config`.
- Given no repository override, When `/measure-mode strict` runs, Then the next tool call is prepared with `strict` and the source is `session`; the override lives in memory and is dropped when the plugin unloads.
- Given `/measure-mode strict repo`, Then the repository override is persisted in `repos.json` and survives a plugin reload; a later session starts in `strict` for that root.
- Given both a repository and a session override, Then the repository override wins.
- Given `/measure-mode default` or `/measure-mode default repo`, Then that override is cleared and the next effective mode falls through the precedence.
- Given `/measure-mode` with no argument, Then the reply names the effective mode and its source.
- Given an unknown mode value or an unknown third token, Then the reply is a usage error text and nothing changes.
- Given the state route, Then it carries `mode: { value, source }`; the band renders both with a localized `Mode` label; `measure_status` and `/measure-status` append `Mode: <value> (<source>)`.
- Given both parity gates, Then they print `parity: ok` (no core change).

**Estimate:** M
**Priority:** Must

### Story S2: On-demand verification
**As a** Measure user on the DeepSeek Harness
**I want** to ask whether the active plan's ceremony is clean
**So that** I do not have to end a turn or fake a closeout edit to find out

**Acceptance Criteria:**
- Given an active plan with a fake `[x]` SHA or a commit without a note, When the user runs `/measure-verify`, Then the reply lists exactly those problems (the same texts the end-of-turn check uses) and nothing is mutated.
- Given a clean active plan, Then the reply is `measure-guard: verification clean (<n> tasks checked).`, where `<n>` is the `[x]` tasks that carry a SHA.
- Given an in-progress track whose `metadata.json` still has `actual_tasks: null`, Then the report stays clean (no verdict until closeout); a missing `metadata.json` also adds no verdict.
- Given a track whose `metadata.json` `actual_tasks` disagrees with its plan, Then the reply also reports that mismatch with both numbers (the closeout problem text).
- Given no `measure/` project, no active track, a non-work-tree, or a git whose probe returns `error`, Then the reply is `measure-guard: nothing to verify (<reason>).` and the command never throws.
- Given `/measure-verify`, Then no file, plan, repository, or metadata changes (the command is read-only).
- Given the measure commands list, Then `measure-verify` appears with a description and its handler.

**Estimate:** S
**Priority:** Must

### Story S3: Documentation, live check, and track closeout
**As a** Measure maintainer
**I want** the operator controls documented and proven live
**So that** the next session starts from accurate docs

**Acceptance Criteria:**
- Given the plugin README and `docs/dsh.md`, Then `/measure-mode` (precedence, persistence, reporting), the effective mode in the band/route/status, and `/measure-verify` are documented with their limits.
- Given `CHANGELOG.md`, Then one Unreleased entry names this track.
- Given the running web profile, When I switch to `strict` with `/measure-mode`, Then a source edit is denied with the strict TDD text; switching to `default` restores the config mode; `/measure-verify` output is recorded.
- Given the track completes, Then `metadata.json` records the real counts and the track is archived with a registry update.

**Estimate:** S
**Priority:** Must

## Non-Functional Requirements

- **NFR-1 (inert outside Measure).** The mode command and verification do nothing meaningful without a project; the existing inert behavior stays.
- **NFR-2 (no new dependency, no build).** Adapter-side only; the client half gains only the localized mode label.
- **NFR-3 (shared core parity).** No core change; both parity gates pass.
- **NFR-4 (fail open).** An unreadable state file, a git failure, or a missing metadata file degrades to the config mode / a `nothing to verify` reply; no new throw escapes a command or listener.
- **NFR-5 (localization boundary).** The new band mode label is localized; the status/verify texts stay English like the rest of the parity-bound output.
- **NFR-6 (POSIX).** Windows stays out of scope.

## Acceptance Criteria (track level)

- Given the plugin package, When I run `node --test plugins/dsh-measure-guard/tests/*.test.js`, Then every test passes and the count grows from 251 by the mode, command, and verification tests.
- Given both parity gates, Then both print `parity: ok`.
- Given the environment CLI, When I run `bash tests/dsh/run.sh`, Then its contract tests pass; `bash tests/spec_review_gate/run.sh` passes 10/10.
- Given the running web profile, When the live sequence runs, Then a `/measure-mode strict` deny and a `/measure-verify` reply are recorded under `measure/runs/dsh_measure_ops_20261107/`.

## Out of Scope

- The DSH agent-team orchestrator rehearsal (a separate follow-up).
- Per-task mode changes or mode changes mid-call.
- Verifying the git note content or `metadata.json` fields beyond `actual_tasks`.
- Windows paths, platform packaging.
- Changes to the shared core or the other two adapters.
