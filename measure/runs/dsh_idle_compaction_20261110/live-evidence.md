# Live evidence: idle-session compaction

Date: 2026-11-10 (Asia/Shanghai), around 06:57-07:10 local (2026-11-09T22:57-23:10Z).
Harness: DSH 0.2.2-rc.1, `web` profile, main GUI at `http://127.0.0.1:3080`, Node v26.7.0.

## What was installed

The package copy and the preset row (the README's install contract):

- `~/.dsh/profiles/web/plugins/dsh-idle-compaction/` = the repository package without
  `tests/` (index.js, package.json, README.md, src/policy.js).
- One row in the `preset-standard` override's `compaction` group of
  `~/.dsh/profiles/web/cordis.patch.yml`, beside `compaction-basic` and `command-compact`:

  ```yaml
  - id: idle-compaction
    name: ./plugins/dsh-idle-compaction/index.js
    config:
      idleMinutes: 55
      checkSeconds: 60
  ```

The composed configuration was read from a separate process, which proves the row's
resolution and shape without trusting the running instance:

```console
$ dsh --profile web --dump-config | grep -A3 idle-compaction
          - id: idle-compaction
            name: ./plugins/dsh-idle-compaction/index.js
            config:
              idleMinutes: 55
              checkSeconds: 60
```

`bin/measure-dsh reload` bumped the profile's `reloadNonce` to 48 so the running profile
recomposed on the patch change. The plugin has no install stamp of its own; the README
records the copy plus row contract, and the same copy is what the proofs below exercised.

## Main-profile mount (temporary 3 s window)

The first proof ran on the real `web` profile with `idleMinutes: 0.05` (3 s) and
`checkSeconds: 2` while the behavior was proven; the final profile was restored to
`55`/`60` afterwards.

The profile recomposed on the patch edit and the plugin bound the live sessions. A session
that was already live in the running process and had been idle for hours
(`session-a2cfec9d-a80e-473c-9785-3df58bf6f7a5`, cwd `/home/daniel-bo/Desktop/mediarr`)
received one standalone idle compaction:

| event | seq | time (epoch ms) | turn | error |
|---|---|---|---|---|
| `compaction/start` | 329 | 1794265175324 | `null` | - |
| `compaction/summary` | 331 | 1794265197156 | - | - |
| `compaction/end` | 333 | 1794265197159 | - | `null` |

That is the mount proof on the real profile: a plugin that was not mounted could not have
written that transaction, and `turn: null` is `compactNow`'s standalone idle transaction
(the `/compact` path), not the turn-enclosed automatic path. The compaction happened once;
the session stayed idle and received no second transaction.

## Controlled proof (isolated DSH home)

To prove the one-per-window rule and the re-arm without touching other live sessions, a
second Web instance ran on port 3099 with `DSH_HOME=/tmp/dsh-idle-proof-home` (a copy of
the profile, including the plugin and the 3 s window) and a fresh session
(`session-674ede6e-a389-4280-901e-6b4a25eaabfa`, cwd `/tmp/idle-proof-project`).

1. One prompt (`Use the bash tool to run echo idle-proof ...`). After the turn and 3 s of
   idle the log held one idle compaction:

   | event | seq | turn | error |
   |---|---|---|---|
   | `compaction/start` | 31 | `null` | - |
   | `compaction/summary` | 33 | - | - |
   | `compaction/end` | 35 | - | `null` |

2. Twelve more seconds with no new activity: the log stayed at 36 events, the last event
   seq 35 (`compaction/end`), and `compaction/start` still occurred exactly 1 time. The
   session therefore did not compact again without new activity.

3. One new prompt (`Now use the bash tool to run date -u ...`), the turn ended, and after
   the 3 s idle window a second idle compaction appeared while polling:

   | event | seq | turn | error |
   |---|---|---|---|
   | `compaction/start` | 59 | `null` | - |
   | `compaction/summary` | 61 | - | - |
   | `compaction/end` | 63 | - | `null` |

   Total at that point: 64 events, 2 idle compactions, no third one.

## Restore

The main profile's row is back to `idleMinutes: 55` / `checkSeconds: 60` (shown by the
`--dump-config` output above), `reloadNonce` is 48, and the temporary proof home
(`/tmp/dsh-idle-proof-home`) and proof project were left disposable. No session of the
main profile was compacted after the restore.

## Notes and limits of this evidence

- The main-profile proof used the temporary 3 s window, so one pre-existing idle session
  was compacted on bind. That is the intended behavior of the configured window; the
  plugin cannot know that the operator is only probing. The final profile runs with the
  requested 55-minute window.
- At 55 minutes the same code path and gate are exercised only by the unit tests and by
  the 3 s live proof; a 55-minute wall-clock wait is not re-run here.
- The main server's stdout is the terminal of the running `dsh web` process, so the
  plugin's `armed`/`compacted` lines were not captured in a file. The proofs above use the
  session log itself, which is the durable effect that matters.
