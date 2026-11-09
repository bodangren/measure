# Install record: dsh-idle-compaction

Date: 2026-11-10 (Asia/Shanghai). The applied install, as the README contract describes it.

## 1. Package copy

```console
$ PROFILE_DIR="${DSH_HOME:-$HOME/.dsh}/profiles/${DSH_PROFILE:-web}"
$ rm -rf "$PROFILE_DIR/plugins/dsh-idle-compaction"
$ mkdir -p "$PROFILE_DIR/plugins/dsh-idle-compaction"
$ cp plugins/dsh-idle-compaction/{index.js,package.json,README.md} \
    "$PROFILE_DIR/plugins/dsh-idle-compaction/"
$ cp -r plugins/dsh-idle-compaction/src "$PROFILE_DIR/plugins/dsh-idle-compaction/"
```

`tests/` stays out of the installed copy (and is not in `package.json`'s `files`).

## 2. Preset row

In `$PROFILE_DIR/cordis.patch.yml`, inside the `preset-standard` override's `compaction`
group, after `tool-result-pruner`:

```yaml
- id: idle-compaction
  name: ./plugins/dsh-idle-compaction/index.js
  config:
    idleMinutes: 55
    checkSeconds: 60
```

The row must be inside that group: the Web app disables the host-plane `compaction-basic`,
and the preset group's `isolate` is the only place a session's `ctx.compaction` exists.

## 3. Recompose

Any semantic patch change recomposes the running profile. This track used
`bin/measure-dsh reload`, which also bumped the managed block's `reloadNonce` to 48:

```console
$ bin/measure-dsh reload
PASS reload: incremented the reloadNonce in /home/daniel-bo/.dsh/profiles/web/cordis.patch.yml (now 48) to trigger a live recompose
reload complete: the running profile recomposes on the patch-file change.
```

The composed tree was then read from a separate process (not the running instance):

```console
$ dsh --profile web --dump-config | grep -A3 idle-compaction
          - id: idle-compaction
            name: ./plugins/dsh-idle-compaction/index.js
            config:
              idleMinutes: 55
              checkSeconds: 60
```

For the live proof the same row temporarily carried `idleMinutes: 0.05` /
`checkSeconds: 2`; see `live-evidence.md`. The final profile carries `55`/`60`.

## Upgrade hazard (recorded in the README)

`preset-standard` in the profile patch is a full-config override pinned from the shipped
`@deepseek-ai/dsh-web-app/presets/standard.patch.yml`. On a DSH upgrade it must be
refreshed from that file and this row re-added; otherwise the pinned copy keeps an old
preset (with or without this plugin).
