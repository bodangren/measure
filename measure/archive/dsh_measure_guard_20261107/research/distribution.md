# DSH measure-guard — distribution research

Track: `dsh_measure_guard_20261107` · 2026-11-07 · Read-only research.
Env: `dsh 0.2.2-rc.1`, Cordis `~4.1.0`, `node v26.7.0`.
Labels: **[D]** documented · **[I]** inferred from code · **[G]** guessed, needs
a spike. There is no `dsh-plugin-manifest` package here; the shared types live
in `@deepseek-ai/dsh-package-manifest`. All `.../` paths below are under
`/home/daniel-bo/.local/lib/node_modules/@deepseek-ai/dsh/node_modules/@deepseek-ai/`.

## 1. Bundle package format

### `package.json` fields — [D]

Source: `.../dsh-package-manifest/lib/types/types.d.ts` and the manifests of
`dsh-experimental-session-search`, `-forge-bundle`, `-auto-review`.

| Field | Contract |
|---|---|
| `dsh.bundle.patch` | one patch path or ordered list, relative to package root; applied as one layer |
| `dsh.bundle.platforms` | optional Host names, e.g. `["darwin"]`; omission = all |
| `dsh.bundle.listedByDefault` | optional bool, default true |
| `dsh.manifestVersion` | optional literal `1`; declaration only — no reader in app-boot/plugin-manager |
| `engines.dsh` | SemVer range, enforced at composition; if present it decides alone, else every `@deepseek-ai/dsh*` peer is checked (`dsh-app-boot/lib/index.js:1097`) |
| `engines.node` | declarative only, not enforced; the DSH root requires `>=24.9.0` (`@deepseek-ai/dsh/package.json`) |
| `icon` | top-level; SVG/PNG/JPEG/WebP, ≤256 KiB, inside the package |
| `exports` | `.` → entry; bundles also export `./cordis.patch.yml` (often `./locale/*.json`, `./package.json`) |
| `files` | npm allow-list: icon, locale, docs, entry, `cordis.patch.yml`, types |

`dsh-package-manifest/README.md` says `engines.dsh` is not enforced; that is
stale — app-boot does enforce it. Trust app-boot + code. **[D]/[I]**

### `cordis.patch.yml` — [D]

- Order: bundle patches in `dsh.profile.bundles` order, then the profile patch,
  then `$DSH_HOME/cordis.patch.yml`, then `--patch` overlays (`dsh/README.md`).
- Top-level YAML array. An entry whose `id` matches overrides that row; its
  `config` replaces the whole object, never merges (`dsh-app-boot/README.md`
  Known Limitations; `dsh-web-app/cordis.patch.yml` header).
- `- insert: [ ... ]` appends rows; later layers can address them by id.
- `cordis:group`: `group: true`, `config:` is a child entry list, `isolate:`
  scopes services. Real example, `dsh-experimental-session-search/cordis.patch.yml`:

```yaml
- insert:
    - id: optional-session-search
      name: cordis:group
      group: true
      isolate:
        sessionQuery: true
      config:
        - id: optional-session-query-sqlite
          name: '@deepseek-ai/dsh-session-query-sqlite'
          config: { path: ':memory:', openAt: first-search }
```

- Id-targeted disable + insert in one layer: `dsh-experimental-session-titles-
  bundle/cordis.patch.yml` (`- id: session-title-llm` / `disabled: true`, then
  `- insert:`).
- Inserted names may be absolute paths, `file:` URLs, or package specifiers;
  patch-relative `./`/`../` names become file URLs. Bare names resolve from the
  dsh installation first, then the profile's `node_modules` (`dsh/README.md`).

### Can the bundle be the plugin? Yes — [D]

`dsh-experimental-auto-review` is one package doing both:
`"dsh": {"bundle": {"patch": "./cordis.patch.yml"}}`; its patch inserts
`name: '@deepseek-ai/dsh-experimental-auto-review'` (self-reference);
`lib/index.js` ends `export { apply, inject, name }`; its README installs it
with `pnpm dsh plugin --profile web add ./packages/experimental/auto-review`.
Pure aggregators (`session-titles-bundle`, `-session-search`,
`personalized-recommendations`) instead have `lib/index.js` = `export {}` and
insert *other* packages. Both shapes are valid; mirror auto-review.

## (a) Minimal package skeleton

```
plugins/dsh-measure-guard/{package.json,cordis.patch.yml,index.js,icon.svg,
  locale/{en,zh}.json,src/core/*.ts,scripts/check-parity.sh,tests/*.test.js,README.md}
```

```json
{
  "name": "dsh-measure-guard",
  "version": "0.1.0",
  "private": true,
  "description": "Measure workflow guard for the DeepSeek Harness",
  "type": "module",
  "icon": "./icon.svg",
  "main": "./index.js",
  "exports": { ".": "./index.js", "./cordis.patch.yml": "./cordis.patch.yml",
               "./package.json": "./package.json" },
  "files": ["index.js", "src", "cordis.patch.yml", "icon.svg",
            "locale/*.json", "README.md", "scripts"],
  "engines": { "node": ">=24.9.0", "dsh": ">=0.2.2-rc.1 <0.3.0" },
  "dsh": { "manifestVersion": 1, "bundle": { "patch": "./cordis.patch.yml" } },
  "scripts": { "test": "node --test tests/ && bash scripts/check-parity.sh" }
}
```

```yaml
# cordis.patch.yml — self-reference; the row exists only in bundle mode
- insert:
    - id: measure-guard
      name: dsh-measure-guard
      config:
        mode: guard
```

```js
// index.js — Cordis shape from dsh-experimental-auto-review
export const name = 'measure-guard'
export const inject = []            // add service names once used
export function apply(ctx, config = {}) {
  // ctx.systemPrompt / ctx.tools / ctx.commands / ctx.agents / ctx.sessions
}
```

Notes:
- Do **not** use `lib/`: this repo's `.gitignore` ignores `lib/` at every
  depth. Root `index.js`, or add a negation; `icon.svg` must be real SVG
  ≤256 KiB, and locale meta mirrors `dsh-experimental-auto-review/locale/en.json`. **[D]**
- `engines.dsh` optional. `>=0.2.2-rc.1 <0.3.0` matches `0.2.2-rc.1`,
  `0.2.2`, `0.2.2-rc.2` (checked with installed `semver`); an exact pin
  matches one release. A mismatch needs §5's exemption. **[D]**
- Omit `peerDependencies`: a zero-import plugin passes peer checks trivially
  and avoids pnpm peer resolution. **[I]**
- `Config` is optional; with none, the Loader passes the raw row config. Adding
  one needs `@deepseek-ai/schemastery`, against NFR-2 — omit it for v0, read
  `config` defensively, and record the deviation from the plan task. **[I]**

## (b) Installing into the live `web` profile

Live profile `/home/daniel-bo/.dsh/profiles/web/`: `package.json` has
`"dependencies": {}` and 8 bundles; `cordis.yml` is `[]`; `cordis.patch.yml`
holds id overrides; `pnpm-workspace.yaml` is `packages: [.]`,
`nodeLinker: hoisted`, `autoInstallPeers: false`; no `node_modules` yet.

Resolution: bundles resolve from the dsh installation first, then the profile's
own `node_modules` (`dsh/README.md`; `resolveBundleDir`,
`dsh-app-boot/lib/index.js:1774`). Out-of-tree plugins must be under
`~/.dsh/profiles/web/node_modules`, where pnpm puts them.

### Option A — real bundle install (needs pnpm)

From the repo root:

```sh
dsh plugin --profile web add ./plugins/dsh-measure-guard
```

- `dsh plugin --profile <name> <pnpm args>` forwards to pnpm in the profile
  dir (`dsh/README.md`), with args "relative to the invoking directory"
  (`dsh/lib/plugin-DscIHF4k.js`). `anchorPathSpec` rewrites only `.`/`..`-args
  against the invoking cwd (`dsh-plugin-manager/lib/types/operations.js:72`), so
  use `./plugins/...`; a bare `plugins/...` would be a registry name. After
  pnpm, `reconcile()` sees `dsh.bundle.patch` and appends `dsh-measure-guard`
  to `dsh.profile.bundles` (`operations.js:96`); pnpm records
  `"dsh-measure-guard": "link:../../..."` relative to the profile.
- HMR is on (`dsh-base/cordis.patch.yml:28`: `hmr` disabled only when
  `!ctx.get('profileContext')`, config `root: []`). Patch edits apply live;
  module files are not watched (`root: []`), so code edits need a restart.
  Verify without booting: `dsh --profile web --dump-config | grep -A5
  measure-guard` (`dsh/README.md`).

**Blocker here:** `command -v pnpm` finds nothing; `dsh plugin` then prints
`dsh: pnpm was not found; install pnpm and make it available on PATH.`
(`dsh/lib/plugin-DscIHF4k.js`). Don't run it until pnpm exists.

### Option B — no pnpm, profile patch row (fastest manual check)

Append to `/home/daniel-bo/.dsh/profiles/web/cordis.patch.yml`:

```yaml
- insert:
    - id: measure-guard
      name: /home/daniel-bo/Desktop/measure/plugins/dsh-measure-guard/index.js
      config:
        mode: guard
```

`./` in a profile patch resolves against the profile dir, not the repo, so use
the absolute path (or a `file://` URL). Saving triggers HMR recomposition;
delete the block to unload. This bypasses `dsh.bundle.patch`, and
`ctx.pluginPackages` returns no display metadata for path rows
(`dsh-app-boot/README.md`), so Plugins shows the technical id. **[D]**

### Option C — `plugin_manager` tool

`install_bundle` takes the same pnpm spec. `parseInstallSpec` accepts
`link:`/`file:` and absolute paths; relative ones are rejected with
`plugin-manager: a local path must be absolute: <spec>`
(`dsh-plugin-manager/lib/types/install-spec.js:65`). Every tool action needs
`danger-full-access` or approval (`dsh-plugin-manager/README.md`), so this
session cannot use it; the Web Plugins page "Add plugin" takes the same spec.

## (c) Test-runner story

**Crown answer: yes.** A plain-JS, no-build plugin can run `node --test` and
import its own plain `.js`. Evidence:
- DSH root requires `node >=24.9.0`; installed `node v26.7.0` loads
  `node:test` (verified via `import('node:test')`).
- `"type": "module"` gives ESM; `node --test tests/` discovers
  `tests/**/*.test.js`.
- No installed DSH package ships test scripts (only `bundle`/`watch`; tests are
  excluded by `files`). DSH's own repo uses Vitest
  (`dsh-session-projection/README.md:86`), but that needs its toolchain;
  `node --test` is the zero-dependency choice.

From the repo root: `node --test plugins/dsh-measure-guard/tests/`.
From the package dir: `node --run test` (runs the script above; `node --run`
needs no npm).

Test shape **[I]**: keep `apply()` thin and import-free; test the pure core
(`src/core/parse.ts`, `guards.ts`) against a string fixture project, as
`plugins/opencode-measure-guard/tests/*.test.ts` does. A smoke test may import
`../index.js` and call `apply(fakeCtx, {})` only if it has no bare imports.
Parity: extend `plugins/opencode-measure-guard/scripts/check-parity.sh`
(already diffs `mods/measure-guard` → OpenCode copies) to the DSH copies, or
copy it with the same `ROOT=$HERE/../../..` depth and call it from `test`.

Caveat: the parity copies are `.ts`. Node 24+/26 strips types by default
(`--[no-]strip-types`; verified on v26.7.0). Node refuses to strip types under
`node_modules` — a `link:` install resolves through the symlink realpath, so it
should stay outside **[G]** (spike it) — and a user could pass
`--no-strip-types`. Tests importing the `.ts` core from the repo are safe; the
runtime import is the part to verify by boot.

## (d) Installer / target-row plan

`bin/install-measure-skill` reads `bin/install-targets.tsv` **from the git
ref**, requires exactly 3 tab-separated fields (`bundle`, `target`, `pattern`),
expands a leading `~`, skips a target whose parent dir is missing, copies with
`cat` (keeps inodes), filters by bash extglob, and writes `.measure-install`
(per-file sha256) into the target.

Proposed row (literal tabs):

```tsv
plugins/dsh-measure-guard	~/.dsh/profiles/web/plugins/dsh-measure-guard	!(tests/*)
```

`~/.dsh/profiles/web` exists, so the parent check passes; the installer creates
`plugins/dsh-measure-guard/`, `!(tests/*)` drops tests (the OpenCode precedent),
and the stamp lands inside the folder (DSH ignores it). Activation for the
installed copy is one documented insert — the installer edits no YAML and runs
no pnpm:

```yaml
- insert:
    - id: measure-guard
      name: ./plugins/dsh-measure-guard/index.js
```

`./` resolves against the profile dir, so this is user-independent. Keep
`dsh.bundle.patch`: the same folder stays installable as a real bundle via
`dsh plugin --profile web add <abs path>` and later via a registry.

Add `plugins/dsh-measure-guard/tests/install.sh` modeled on
`plugins/opencode-measure-guard/tests/install.sh`: temp `HOME`, temp git repo,
the DSH rows filtered from `bin/install-targets.tsv`, a copy of the installer;
assert the plugin lands, `tests/` is absent, `.measure-install` exists,
`--check` is clean, a local edit is kept with exit 2, and a file removed from
the ref is pruned. Risks: the installer copies from `main`, so the row reaches
users only once committed there; `--from-default-profile` can drop the patch
row while `plugins/` survives; a later move to `lib/index.js` is invisible to
git unless `.gitignore` gets a negation.

## 5. `plugin_manager` operations and exemptions — [D]

From `dsh-plugin-manager/README.md`: `list_plugins`, `list_bundles`,
`set_plugin` (toggles a row's `disabled` in the profile patch), `set_bundle`
(edits `dsh.profile.bundles`; enabling appends, changing precedence),
`install_bundle`, `remove_bundle`, `list_version_exemptions`,
`set_version_exemption`. `install_bundle(target, enabled?, approvedBuilds?,
registry?)` takes a pnpm spec; registry targets use `saveExact: true`; a local
target keeps the ordinary `link:` dependency. pnpm 11 build-script blocks return
`pendingBuilds`; approve only after explicit user approval, then retry with
`approvedBuilds`. `dependencySpec` normalizes `file:`/`link:` against the
profile; every action needs `danger-full-access` or approval. Exemptions map
exact `name@version` to exact DSH runtime versions in
`~/.dsh/profiles/web/compatibility.json` (absent today); grant with
`set_version_exemption` (`enabled: true`, `acceptRisk: true` after a
crash/data-loss warning) or `dsh plugin --profile web allow-version
<pkg>@<ver> --dsh-version 0.2.2-rc.1 --accept-risk`. A live profile recomposes
and reports `applied`.

## Remaining risk: the Client half

`dsh-client-modules` requires `dsh.client: {platform:"web"}`, a `./client`
export, and a **built** `lib/client.js` in the loader format
`window.__ModuleLoader__.load({id, factory})`; "pnpm run build must have
produced each lib/client.js before launch" (`dsh-client-modules/README.md`).
That contradicts NFR-2's "plain JS, no build" for the Client half: ship
host-only first, then choose a hand-written bundle (brittle **[G]**) or a build
step before Phase 4.

## Source map

Citations are inline; the roots are `~/.local/lib/node_modules/@deepseek-ai/dsh/`,
`~/.dsh/profiles/web/`, and `~/Desktop/measure/`.
