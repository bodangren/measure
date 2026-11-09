# dsh-idle-compaction

A DeepSeek Harness Host plugin that compacts a live session while it is idle: after a
window with no new session activity, the plugin asks the session's own compaction backend
for one standalone idle-session compaction (the same transaction `/compact` uses), but it
skips sessions whose log has nothing new since their last successful compaction.

The plugin is a watcher, not a compaction implementation: it adds no summary prompt, no
retention policy, and no threshold. Every decision about what to replace and how to
summarize stays with the mounted `@deepseek-ai/dsh-compaction-basic` backend.

## Behavior

While the plugin is mounted, one in-memory watcher covers every live session bound to its
preset. On a timer it looks for a session where:

- the agent is `idle` (no turn, no maintenance, no other compaction of this plugin);
- the newest activity event is newer than the last successful compaction's end; and
- at least `idleMinutes` have passed since `max(lastActivityAt, lastAttemptAt)`.

For an eligible session it calls the preset's `ctx.compaction.compactNow(agent, signal)`.
On success the compaction's end seq is newer than the activity it replaced, so the same
idle window never compacts twice; any later activity re-arms the window. A no-op
(`compactNow` returns `null`) or a failure records the attempt time, so the next retry
needs a whole new idle window instead of firing on every tick.

### What counts as activity

Activity is any committed session event except the compaction machinery and the bookkeeping
that does not change the conversation:

| Event | Activity? | Why |
|---|---|---|
| `compaction/start`, `compaction/summary`, `compaction/end`, `compaction/prune` | No | The compaction transaction itself. |
| A surface replacement (the checkpoint `user/message` whose `surfaceOp` is `{ op: 'replace' }`) | No | It is the compaction's own summary checkpoint, not new work. |
| `session/end-seed` | No | Restore/fork bookkeeping. |
| An ignorable record (`event.ignorable === true`, e.g. a `plugin:` record) | No | Read-skippable plugin state, not conversation work. |
| Everything else (`turn/start`, `turn/end`, messages, tool calls/results, attempts, request headers, selections, …) | Yes | The session did something. |

The newest activity's event `time` is the idle clock. The newest `compaction/end` without an
`error` is the last successful compaction; a failed attempt never closes the window.

### The initial scan

When an agent is bound, the watcher scans its session's committed events once
(`session.snapshotEvents()`) to seed the activity seq/time and the last successful
compaction seq, so an already-idle session is handled on the first tick after the plugin
mounts (including after a profile reload or a resume). The scan is a one-time mount cost,
not a per-tick read.

## Settings

The row accepts one `config` object. An unknown key or an invalid value fails the plugin at
load with a clear error; `enabled: false` registers nothing.

| Field | Default | Meaning |
|---|---|---|
| `enabled` | `true` | Mount the watcher at all. |
| `idleMinutes` | `55` | Positive number of minutes without activity before compaction. Fractional values are accepted (used to prove the behavior quickly). |
| `checkSeconds` | `60` | Positive number of seconds between watcher ticks. |
| `includeSubagents` | `false` | Also watch child agents. By default only root sessions are watched. |

Example row:

```yaml
- id: idle-compaction
  name: ./plugins/dsh-idle-compaction/index.js
  config:
    idleMinutes: 55
```

## Install

The Web app disables the host-plane compaction backend, so a host row cannot reach a
session's engine. The plugin must live **inside the standard preset's isolated `compaction`
group**, which is the single engine instance the preset's turns use.

1. Copy this package (without `tests/`) into the resolved DSH profile:

   ```bash
   cp -r plugins/dsh-idle-compaction \
     "${DSH_HOME:-$HOME/.dsh}/profiles/${DSH_PROFILE:-web}/plugins/"
   ```

2. In that profile's `cordis.patch.yml`, add one row to the `compaction` group of the
   `preset-standard` override, beside `compaction-basic` and `command-compact`:

   ```yaml
   - id: idle-compaction
     name: ./plugins/dsh-idle-compaction/index.js
     config:
       idleMinutes: 55
   ```

3. Recompose the running profile. Any semantic change to the patch does it; the repository's
   `bin/measure-dsh reload` also works when the Measure guard layer is installed. The plugin
   is not mounted by editing files alone: the `preset-standard` override replaces that
   row's whole `config`, so the row must be part of the override.

4. New sessions (and sessions of new agents) use a preset revision that contains the row.
   Sessions already live in a running process keep the revision they were created with; a
   profile recomposition re-binds them.

### Upgrade hazard

The `preset-standard` override is an editor-style full-config copy of the shipped preset.
When DSH is upgraded, refresh that override from
`@deepseek-ai/dsh-web-app/presets/standard.patch.yml` and re-add this row; the pinned copy
otherwise keeps an old preset. This is the same hazard as any other pinned preset config.

## Verification

```bash
node --test plugins/dsh-idle-compaction/tests/*.test.js
```

The suite proves the classification, scan, gate, backoff, and watcher wiring with pure
functions and a fake Cordis context; no live Harness is needed. The track that shipped the
plugin also records a live proof (a short idle budget on a real Web session) under
`measure/runs/dsh_idle_compaction_20261110/`.

## Known limits

- **Live sessions only.** The plugin watches agents that are alive in the process. A
  session that is not loaded is not compacted until it is loaded (then the one-time scan
  sees the idle window immediately).
- **One global setting.** Every session of the preset shares the same idle window; there is
  no per-session override.
- **Host log only.** A failed idle compaction is reported through the Host logger and
  retried after another idle window; it is not written into the session, so it is not part
  of the transcript.
- **The compaction still costs a model call** (the backend summarizes), exactly like
  `/compact`.
- **Path-loaded plugin.** Like every plugin loaded from a profile path, it may import no
  `@deepseek-ai/*` package; every capability comes from `ctx`.
- **Preset-scoped watcher.** The watcher is shared by every session bound to the preset and
  keyed by session, so it never assumes a per-session plugin instance.
