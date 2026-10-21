# opencode-measure-guard

An OpenCode 2 plugin that makes the agent follow the Measure workflow. It is the OpenCode counterpart of the Claude Code mod `mods/measure-guard/`: it reads the Measure files of the project, shows the plan position, sends the active task to the agent, and stops work that the active plan does not cover.

Track: `measure/tracks/opencode_plugin_20261021/` (spec and plan). The decision log is in the spec.

## Layout

```
plugins/opencode-measure-guard/
├── package.json          # exports "." (server) and "./tui" (terminal); dev-only type deps
├── tsconfig.json
├── src/
│   ├── index.ts          # server plugin: Plugin.define({ id: "measure.guard" })
│   ├── tui.tsx           # terminal plugin: Plugin.define({ id: "measure.guard.tui" })
│   ├── types.ts          # copy of mods/measure-guard/types/index.d.ts (no `declare module` block)
│   └── core/
│       ├── parse.ts      # copy of mods/measure-guard/hooks/parse.ts
│       └── guards.ts     # copy of mods/measure-guard/hooks/guards.ts
├── commands/             # markdown commands installed into ~/.config/opencode/commands
├── scripts/check-parity.sh
└── tests/                # bun test
```

## Parity rule

The plugin decides with the same code as the Claude Code mod. `src/core/parse.ts` and `src/core/guards.ts` are byte copies of the mod's modules, and `src/types.ts` is the mod's types file without its `declare module 'claude-code'` block. The copies keep their `../types` import, so `types.ts` sits one folder up from `core/`.

```bash
bash plugins/opencode-measure-guard/scripts/check-parity.sh   # exits 1 and names the file that differs
```

Change the mod first, then copy. The Claude Code mod never imports from this folder.

## Checks

```bash
cd plugins/opencode-measure-guard
bun test                      # unit tests; no install needed
bun install && bun x tsc --noEmit -p .   # type check against the published @opencode/plugin types
```

`node_modules/` and `bun.lock` are not committed. OpenCode provides `@opencode/plugin`, `@opencode/plugin/tui`, `solid-js`, and the OpenTUI packages at runtime.
