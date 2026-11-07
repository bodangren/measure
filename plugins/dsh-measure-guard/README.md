# dsh-measure-guard

Measure guard rails for the DeepSeek Harness (DSH): this is the third adapter
of the shared Measure guard core, after the Claude Code mod
(`mods/measure-guard/`) and the OpenCode plugin
(`plugins/opencode-measure-guard/`). It reads the project's `measure/` files and
keeps the agent on the active track and task; the host registrations and the
client surface are added in the later phases of the track.

## Layout

```
plugins/dsh-measure-guard/
├── package.json          # dsh.bundle.patch and dsh.client declarations
├── cordis.patch.yml      # one self-insert row
├── index.js              # Host half: export name, inject, apply
├── client.js             # Client half: lazy-CJS window.__ModuleLoader__ factory
├── src/
│   ├── core/parse.ts     # parity copy of mods/measure-guard/hooks/parse.ts
│   ├── core/guards.ts    # parity copy (+ .ts on its one value import)
│   └── types.ts          # parity copy of the mod's types, without its module block
├── scripts/check-parity.sh
├── tests/
└── README.md
```

No build step and no dependencies: `index.js` is plain ESM, `client.js` is
served as bytes, and the `.ts` core is loaded by Node's built-in type stripping
(Node >= 24.9).

## Install

Add one row to the profile's `cordis.patch.yml` and let the running DSH
recompose (no restart, no pnpm):

```yaml
- insert:
    - id: measure-guard
      name: /home/daniel-bo/Desktop/measure/plugins/dsh-measure-guard/index.js
      config:
        mode: guard
```

The path form loads both halves: the client half is found through the nearest
`package.json`. Delete the row to unload the plugin.

## Parity rule

The shared core stays the single decision source. `scripts/check-parity.sh`
checks the three copies against `mods/measure-guard/`:

1. `src/core/parse.ts` is byte-identical to `hooks/parse.ts`.
2. `src/core/guards.ts` is identical after exactly one mechanical transform:
   its only extensionless value import `./parse` gains `.ts` (Node ESM needs
   the extension).
3. `src/types.ts` is `types/index.d.ts` without its
   `declare module 'claude-code'` block, plus the DSH header note.

The script prints `parity: ok` and exits 0, or names the file that differs and
exits 1.

## Test

From the repository root:

```bash
node --test 'plugins/dsh-measure-guard/tests/*.test.js'
bash plugins/dsh-measure-guard/scripts/check-parity.sh
```

From this folder, `node --run test` runs both. No npm install and no
`node_modules` are required.
