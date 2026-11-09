# Specification: DSH idle-session compaction

## Overview

The standard preset compacts a session only when token pressure or a confirmed context
overflow asks for it, and `/compact` compacts only when a person types it. A session left
idle keeps its full history until the next prompt arrives: the next turn pays the whole
prefill and starts its own compaction only after the request has begun. This track adds
one zero-dependency DeepSeek Harness Host plugin that compacts a live session while it is
idle, once at least 55 minutes have passed with no new session activity, but only when the
log holds activity after the last successful compaction. The compaction is the backend's
own idle-session transaction (`ctx.compaction.compactNow`, a standalone marker pair between
turns), so the session converges to the same state a manual `/compact` produces.

The plugin is mounted inside the standard preset's isolated `compaction` group, next to
`compaction-basic`, because the Web app disables the host-plane compaction backend: the
preset's group is the single engine instance a session's turns use. A preset plugin mounts
once per preset revision and is shared by every session bound to that preset, so the
watcher keeps one state per session and never assumes a per-session plugin instance. The
"no new activity" rule closes the loop: the session records the idle compaction as its
newest transaction, the gate stays closed while the session does nothing, and any later
activity re-arms the same idle window.

## Functional Requirements

- **FR-1 (plugin package).** New package `plugins/dsh-idle-compaction/` holds a plain ESM
  Host plugin (`index.js`, `package.json`) plus one pure policy module (`src/policy.js`)
  and `node --test` tests. It imports no `@deepseek-ai/*` package (a path-loaded plugin
  resolves only Node builtins), has no dependency and no build step, and declares
  `name`, `inject`, and `apply`.
- **FR-2 (preset placement).** The install copies the package into the resolved DSH
  profile's `plugins/` folder and adds exactly one row inside the standard preset's
  `compaction` group. It injects the group's `compaction`, `agents`, and `timer` services.
  The README documents the copy, the row, the reload, and the upgrade hazard (the preset
  override must be refreshed from the shipped preset on a DSH upgrade).
- **FR-3 (session binding).** On apply the watcher binds every live root agent from
  `ctx.agents.list()`, and then binds each `agent/created` payload; `agent/disposed`
  drops the state. The created-payload path matters because a session's scope is bound to
  the preset before the creation announcement, so preset-scoped listeners see it.
- **FR-4 (activity classification).** An event is activity unless it is a compaction
  machinery event (`compaction/start`, `compaction/summary`, `compaction/end`,
  `compaction/prune`), a surface replacement (the compaction checkpoint user message), a
  seed boundary (`session/end-seed`), or an ignorable plugin record. The newest activity
  event's seq and time are the idle clock.
- **FR-5 (last successful compaction).** The newest `compaction/end` without an `error`
  is the last successful compaction; a failed or interrupted attempt does not count.
  Activity after that seq means the session holds un-compacted work.
- **FR-6 (idle gate).** The watcher checks on a timer (60 s default). It compacts one
  session when its agent status is `idle`, no compaction of its own is in flight, the
  newest activity seq is after the last successful compaction end seq, and
  `now − max(lastActivityAt, lastAttemptAt) >= idleMinutes` (55 default). A
  fractional `idleMinutes` is accepted so a live probe can prove the behavior quickly.
- **FR-7 (one compaction per idle window).** A successful compaction records its end seq,
  which is newer than the activity it compacted, so the gate stays closed while the
  session stays idle; new activity re-arms it. A no-op (`compactNow` returns null) or a
  failure records the attempt time, so the plugin retries only after another full idle
  window, never once per tick.
- **FR-8 (root sessions only by default).** Child agents (subagents) are skipped unless
  `includeSubagents` is true; a root session is one of `ctx.agents.roots()`.
- **FR-9 (configuration).** Settings are `enabled` (default `true`), `idleMinutes`
  (default `55`, positive number), `checkSeconds` (default `60`, positive number), and
  `includeSubagents` (default `false`). An unknown key or an invalid value fails the
  plugin at load with a clear error; a disabled plugin registers nothing.
- **FR-10 (failure containment).** No failure escapes into the session: busy means the
  agent became active again and the next tick retries; any other error is reported once
  through the Host logger and backs off one idle window. Disposal aborts an in-flight
  compaction and awaits it.
- **FR-11 (live proof).** The plugin is installed in the running Web profile and proved
  live with a short idle budget: one idle compaction appears in a fresh session's log as a
  standalone `compaction/start` with `turn: null`, a second wait without new activity adds
  no second compaction, and one new activity followed by another idle window adds exactly
  one more. The normal 55-minute setting is restored afterwards.
- **FR-12 (records and regressions).** The track records the live evidence under
  `measure/runs/dsh_idle_compaction_20261110/`, adds the tooling exception and a
  `CHANGELOG.md` entry, and keeps every existing suite green: the new plugin's node tests,
  `bash tests/dsh/run.sh` (14), `bash tests/spec_review_gate/run.sh` (12), and both parity
  gates.

## Non-Functional Requirements

- **NFR-1 (no new file or state store).** The plugin writes nothing of its own: the only
  session writes are the backend's compaction transaction, and the only process state is
  the in-memory watcher map.
- **NFR-2 (bounded work).** A tick with no eligible session performs no model call and no
  log write; a no-op attempt costs one token-meter read. The plugin adds one timer per
  preset revision, not per session.
- **NFR-3 (testability).** Activity classification, the initial scan, and the gate are
  pure functions over event objects, so the node suite proves them without a Harness.
- **NFR-4 (idempotent reload).** A reload or profile recomposition re-scans live sessions;
  no session is compacted twice for one idle window by a re-mount.

## Acceptance Criteria (track level)

- Given a session idle for 55 minutes with activity after its last successful compaction,
  When the watcher ticks, Then the backend compacts it once and its log records a
  standalone `compaction/start` with `turn: null`.
- Given the same session still idle after that compaction with no new event, When the
  watcher ticks again, Then it compacts nothing.
- Given one new activity in that session followed by another 55 idle minutes, When the
  watcher ticks, Then it compacts exactly once more.
- Given a session whose agent is running, or a child agent under the default settings,
  Then no compaction is requested.

## Out of Scope

- Changing the compaction backend's pressure policy, retention, or summary prompting.
- A host-plane mount (the Web app disables that backend) or another harness adapter.
- Per-session configuration overrides, a UI control, or a persisted attempt history.
- Windows-specific behavior.
