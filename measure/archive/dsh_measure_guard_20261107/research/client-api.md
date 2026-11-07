# DSH client-side plugin runtime — research notes

Track `dsh_measure_guard_20261107` · DSH **0.2.2-rc.1** · read-only. The plugin under design needs (a) a status
band in the composer dock, (b) a sidebar panel, (c) a client command action.

Paths: `$DSH` = `/home/daniel-bo/.local/lib/node_modules/@deepseek-ai/dsh` · `$P` =
`$DSH/node_modules/@deepseek-ai` · `$SKILL` = `$P/dsh-agent-preset/skills/cordis-plugin-development`.
Legend: **[D]** documented (README / `.d.ts` / shipped template) · **[I]** inferred from shipped implementation ·
**[G]** guessed.

## 0. Composition facts

- Live profile `web` (`$DSH_HOME=/home/daniel-bo/.dsh`, dir `.dsh/profiles/web`): `package.json` lists 8 bundles,
  `cordis.patch.yml` only row overrides [D]. Web roster `$P/dsh-web-app/cordis.patch.yml`; its comment (line 44) is
  the model in one sentence [D]:
  > `dsh.client` rows are the browser roster the modules node half scans into `window.__DSH_BOOT__`; the modules
  > row is simultaneously a host row.
- Each package ships `lib/index.js` (host, ESM), `lib/client.js` (browser, **not** ESM), `lib/types/**/*.d.ts` [D].
- **`dsh-client-ui-slots`, `-primitives`, `dsh-client-store`, `dsh-client-web` are not published** — absent from
  `$P/`, only `devDependencies` of `dsh-web-frontend`; their runtime copies sit inside
  `$P/dsh-web-frontend/dist/assets/index-*.js` [D+I]. So the slot API ships no installable `.d.ts`; the authority
  is the generated catalog in `$P/dsh-cordis-client-runner` (§3.1) plus `cordis_inspect_query` `Slots`.

## 1. Declaring a client plugin
### 1.1 `package.json` — two declarations, both required [D]

```jsonc
{ "name": "@local/my-plugin",                   // == client module id == boot row id
  "type": "module",
  "exports": { ".": "./index.js", "./client": "./client.js",
               "./locale/*.json": "./locale/*.json", "./icon": "./icon.svg" },
  "dsh": { "bundle": { "patch": "./cordis.patch.yml" }, "client": { "platform": "web", "immediately": true,
           "inject": ["@deepseek-ai/dsh-client-ui-conversation"] } } }
```

`DshClientManifest` (`$P/dsh-package-manifest/lib/types/types.d.ts:82`): `platform: string` (Web selects `web`) ·
`inject?: string[]` = **"Informational package-name dependencies, not Cordis service injection"** ·
`immediately?: boolean` = stage-one registration barrier · `external?: string[]` = module-table requests beyond the
baseline. `DshBundleManifest`: `{ platforms?, patch: string | string[], listedByDefault? }`.
### 1.2 There is no separate client row in `cordis.patch.yml` [D+I]

The patch inserts **one** row; the browser half is derived from it. Proof: `$P/dsh-web-app/cordis.patch.yml:262`
lists plain rows (`- id: ui-sidebar / name: '@deepseek-ai/dsh-client-ui-sidebar'`), and `dsh.client` makes that same
package a client module. `ClientModuleRegistry` reconciles **by Loader entry name** (`$P/dsh-client-modules/lib/
index.js:783` `resolveMeta`): locate the row's `package.json`, `parseDshClient`, reject `platform !== 'web'`, then
resolve `<pkg dir>/<exports["./client"]>` — a string, or an object with a string `default` (`clientExportOf`,
`lib/index.js:200`). A missing file fails activation loudly with `MissingClientBundleError` (package + path + build
instruction, `lib/index.js:161`) [D].
### 1.3 Entry shape inside the bundle

The Loader consumes the bundle exports as an **object plugin** [D, `$P/dsh-client-ui-layout/lib/types/index.d.ts`:
"Required services (cordis fiber inject — the loader passes all module exports as an object plugin)"].

```js
const inject = ['slots', 'sessions', 'remote', 'remote.goals', 'locale', 'uiConversation']  // goal client.js:648
function apply (ctx) { /* … */ }
```

`apply(ctx)` gets the client Cordis `Context`; no shipped client half has a `Config` [D]. Services seen: `slots`,
`sessions`, `remote`, `remote.<domain>`, `locale`, `uiConversation`, `layout`, `commandUi`, `remoteAccess`,
`configForms` [D]. `dsh.client.inject` ≠ this `inject`.
### 1.4 A pure-UI plugin still needs a host half

[D] `$P/dsh-client-ui-goal/lib/index.js`, in full:

```js
/** Host plugin body — no host-side behavior for this surface plugin. */
export function apply() {}
```

Its comment gives the reason: the empty `apply` exists so the plugin appears in the Host Loader; the browser half
ships via `exports["./client"]`. Hand-written ESM — no build tool involved.

## 2. How the client bundle is built and served
### 2.1 Wire and bundle format [D]

The node half scans enabled Loader entries and composes `window.__DSH_BOOT__` (`WebBootGraph { rev, release,
entries: WebBootEntry[], batches: WebBootBatch[] }`, `WebBootEntry = { id, url, rev, inject?, immediately?,
external? }`, `$P/dsh-client-modules/lib/types/client/manifest.d.ts`), served under `/plugins` as
one-or-more-plugin "combo" scripts plus maps, chunks and content-revisioned `./assets/*`. A bundle is not ESM and not
a module — it is a **registration call** into a lazy-CJS table [D, `ClientBundleRegistration`]:

```js
window.__ModuleLoader__.load({
  id: '@local/my-plugin',    // MUST equal the package name / graph row
  factory: (require) => {    // runs ONCE, at first materialization; body holds every side effect, CSS included
    const module = { exports: {} }
    return module.exports    // { apply, inject }
  },
})
```

`ClientBundleRequire` = `(specifier) => unknown` + `.async(specifier)` + `.asset(reference)` [D].
### 2.2 Module-table baseline [D]

From the shell bundle (`$P/dsh-web-frontend/dist/assets/index-*.js`, `staticModules` literal): `react`,
`react/jsx-runtime`, `react-dom`, `react-dom/client`, `@deepseek-ai/cordis`, `zod`, `@tanstack/react-virtual`,
`@deepseek-ai/dsh-client-store`, `-ui-slots`, `-ui-primitives`, `-ui-dockkit`. Everything else needs
`dsh.client.external` + a supplier row [D]. **But** `$SKILL/references/practices.md` forbids the Harness client
packages anyway [D]:
> Do not `require('@deepseek-ai/dsh-client-ui-primitives')` or load any other Harness Client package as a module;
> … a plain-JS plugin has no type check, and a throwing component blanks your slot entry.
### 2.3 "`pnpm run build` must have produced client.js" — scope

[D] `$P/dsh-client-modules/README.md:59` says the host serves built bundles, so `pnpm run build` must have produced each
`lib/client.js` before launch — but that targets **repo** packages (tsdown); the host only reads bytes at the
`exports["./client"]` path and concatenates them, it never compiles [D+I].
### 2.4 The documented no-build path — it exists

In the shipped agent skill, not a package README: `$SKILL/templates/decoration/` is a complete hand-written
build-free UI plugin (`package.json`, `cordis.patch.yml`, `index.js`, `client.js`, `locale/*.json`, `icon.svg`).
`$SKILL/references/ui-plugin.md` [D]:
> `templates/decoration/client.js` registers a lazy factory into `conversation.composer.dock` … For compiled
> sources, use the deployment's Client build tooling to emit this format; declare non-baseline runtime imports in
> `dsh.client.external`.

The whole browser half (`$SKILL/templates/decoration/client.js`) [D]:

```js
window.__ModuleLoader__.load({ id: '@local/my-decoration', factory (require) {
  const React = require('react'), h = React.createElement
  function Decoration () { return h('svg', { viewBox: '0 0 64 64', width: 48, height: 48 },
    h('circle', { cx: 32, cy: 32, r: 24, fill: '#247bbf' })) }
  return { inject: ['slots'], apply (ctx) {
    ctx.slots.inject('conversation.composer.dock', () => ctx.slots.register(
      { name: 'conversation.composer.dock', id: 'my-decoration', order: 5 }, Decoration)) } }
} })
```

Install: `plugin_manager({ action: 'install_bundle', target: '/abs/dir' })` [D, `$SKILL/SKILL.md`]. Live reload with
no tooling: `$P/dsh-client-hmr/lib/index.js:92` stat-watches **every** graph row via
`ctx.clientModules.artifactBaseline(row.id)` and publishes a `rebuilt` frame the page swaps in; `pnpm run dev:web` is
only needed to *recompile* tsdown packages [D README:32 + I from code]. Nothing suggests `dev:web` is needed to edit
a plain `client.js` [I].

## 3. `conversation.input.dock`
### 3.1 Declaration [D] `$P/dsh-client-ui-conversation/lib/types/client/contract/slots.d.ts:326`

```ts
'conversation.input.dock': { kind: 'list'; scope: 'session'; owner: InputZone }
export interface InputZone { readonly session: SessionSnapshot; readonly input: InputState }
```

"Full-width entries above the composer card; fixed overlays must portal to the document body because the docked
composer contains them." Declared by the `conversation.content` Factory.
### 3.2 Register options [D, generated catalog at `$P/dsh-cordis-client-runner/lib/client.js`]

| option | required | notes |
|---|---|---|
| `name` | yes | `'conversation.input.dock'` |
| `id` | **yes** for list kind | fresh id = added beside shipped entries; reusing a shipped id replaces that cell |
| `order` | optional | number, ascending, default 0 |
| `label` | optional | `string \| (() => string)`, re-read per projection |
| `locale` | optional | namespace string; component then receives `t` |
| `inject` | optional | registrant-private props; session slots get `(sessionId) => …` |

Shipped occupants: `queue`, `todo`, `goal`, `claude-code-mods`, `forge-panel.worktree`; `replaceRisk: none` [D].
### 3.3 Props the component receives [D]

Owner `{ session, input }` + session standard props: `useSession`, `sessionId`, `useProjection`, `useAccess`,
`useChat`, `useConversation`, `useInput`, `inputActions`, `useTrajectory`, `useSessions`, `useSessionStatus`,
`useSessionRetainInfo`, `useSessionAccess`, `useWorkspaceAccess`, `usePanelInfo`, `useResource`, `useContextMenu`,
`useRemoteAccess`. `InputState` (`…/contract/input.d.ts:273`): `{ draft, attachmentIds, draftRev, phase: 'plain' |
'adjudicating'|'claimed'|'submitting'|'sending', claim?, occurrences, queue }`. `SessionSnapshot`
(`$P/dsh-api-session-controller/lib/types/client/contract/snapshot.d.ts:58`): `{ sessionId, running, blank,
openState, openError, pendingSubmissions, subagent, removed, hasMore, loadingOlder, promptError, lastAgentError,
promptAttempted, awaitingFirstTurn }` — **no title** (titles are the `title` projection).
### 3.4 Real registration [D] `$P/dsh-client-ui-goal/lib/client.js:700`

```js
ctx.slots.inject('conversation.input.dock', () => ctx.slots.register({
  name: 'conversation.input.dock', id: 'goal', order: 10, locale: NS,
  inject: (sessionId) => { const b = sessions.binding(sessionId); return {
    hooks: { goalActivation: createGoalActivationSource({ projection: b.session.projections.faceOf('goal'), … }) },
    onEdit, onPause, onResume, onClear } } }, GoalDock))
```

The component reads `hooks.*` through the renderer-bound selector hook — push, not polling [D].
### 3.5 How data streams from the host — three mechanisms

1. **Session projections — recommended, "zero client code"** [D, `$P/dsh-api-session-controller/lib/types/client/
   sessions/projection-store.d.ts:1`]: "the host is the only computation site; the client holds finished whole values
   per key … a domain ships projection support with zero client code. Per-key bare observable faces feed
   `useProjection`." Host `ctx.sessionProjections.register({ key, stateVersion, apply, view, wire })` (the `wire` view
   is what the client sees, `$P/dsh-session-projection/lib/types/index.d.ts:190`); client `useProjection('myKey')`.
2. **Typert Remote** — `ctx.remote.<ns>.<method>()`, `ctx.remote.$on('domain/event')`. Needs `@Remote` decorators plus
   **generated** `./remote` + `./typert` artifacts (`$P/dsh-typert-protocol/README.md`) ⇒ codegen [D].
3. **Client Cordis events** — `ctx.on('connection/reset'|'command/executed'|… )` + `ctx.effect` disposal [D].

## 4. Sidebar panel: `sidebar.panellist` + keyed `main`
### 4.1 Declarations [D]

`$P/dsh-client-ui-sidebar/lib/types/client/contract/slots.d.ts:36`: `'sidebar.panellist': { kind: 'list'; scope:
'root'; owner: SidebarPanelIconOwnerProps }` with `{ size: number; active: boolean }`. `$P/dsh-client-ui-layout/
lib/types/client/index.d.ts`: `'main': { kind: 'keyed'; scope: 'root' }` — "Central panel selected by sidebar entry
id. The reserved `conversation` key hosts the Conversation; other keys receive no Session binding."
### 4.2 Registering the pair [D] — sidebar README:42

> Plugins add an icon component to the root-scoped `sidebar.panellist` list with an `id`, optional `order`, and a
> string or locale-aware `label`. The same id addresses the component registered in the layout's root-scoped `main`
> keyed slot; selecting a missing main entry throws without changing the selection.

Shipped reference `$P/dsh-client-ui-plugin-manager/lib/client.js:7750` and `:7820`:

```js
yield ctx.slots.inject('main', function* () {                    // keyed slot: one panel per key
  const handle = createNavigationStore(), instance = handle.create()
  yield ctx.slots.register({ name: 'main', key: PANEL_ID, locale: NS, store: { ...handle, create: () => instance },
    inject: () => ({ ...face, createHeaderRef }), children: { 'plugins.tab': { kind: 'list', scope: 'root' } } },
    PluginManagerPage)
  ctx.reflect.provide('pluginNavigation', { openList () { ctx.layout.selectPanel(PANEL_ID); … } })
})
yield ctx.slots.inject('sidebar.panellist', () => ctx.slots.register(   // list slot: the icon row
  { name: 'sidebar.panellist', id: PANEL_ID, order: 0, label: () => t('panel'), locale: NS }, PluginsPanelIcon))
```

`PANEL_ID` is a plain string (`'plugins'`, `lib/client.js:7680`); `MainPanelId` is branded only at compile time
(`$P/dsh-client-ui-layout/lib/types/client/service.d.ts:13`).
### 4.3 Opening it [D] `$P/dsh-client-ui-layout/lib/types/client/service.d.ts`

```ts
interface ILayout {
  readonly panelInfo: HostObservable<{ activePanelId: MainPanelId | null }>
  selectPanel(panelId: MainPanelId | null): void   // throws if the main key is not registered
  beginNavigation(): AbortSignal; toggleSidebar(): void
  openRightbar(track: boolean, fullscreen: boolean): void; closeRightbar(): void }
```

`ctx.layout.selectPanel(id)` with `inject: ['layout']`; inside the panel `usePanelInfo()` returns `{ activePanelId }`.
Clicking the sidebar row needs no code of ours (the row's `onClick` calls the sidebar's injected `selectPanel`) [D,
`SidebarRootInjected`]. `[G]` A new `main` key renders only our component, with no Session binding and no
`SessionProvider` — the panel must not call session-scoped hooks and must fetch its own data.

## 5. Client `commandUi` actions

`$P/dsh-client-ui-commands/lib/types/client/contract.d.ts` [D]:

```ts
export interface CommandContribution { readonly name: string; label?(): string; description?(): string;
  readonly icon?: ComponentType<IconProps>; available(s: ClientSessionContext): boolean; readonly ui: CommandUiSpec }
export interface CommandDecoration { readonly name: string; available(s): boolean; readonly ui: CommandUiSpec }
export type CommandUiSpec = PopupSelectSpec | ActionSpec
export interface ActionSpec { readonly kind: 'action'; run(session: ClientSessionContext): void }
export interface CommandUiContract {                     // ctx.commandUi
  register(c: CommandContribution): () => void          // duplicate names throw
  decorate(d: CommandDecoration): () => void            // duplicate names throw
  dismiss(name: string): void; popupFor(actx: ClientContext): unknown }
```

- Service `ctx.commandUi` (`…/client/index.d.ts:19`). A `run()` action consumes the trigger token and submits nothing [D].
- Client contributions merge with the **host** catalog by name; a collision with a host command fails loud, it never
  shadows [D, README:32].
- `PopupSelectSpec = { kind: 'popupSelect', searchMode?, searchLabels?(), options(session, signal), onSelect(option,
  session) }`; `SelectOption` supports `confirmation`, `group`, `active`, `badge`, `detail` [D].
### 5.1 Host-registered slash command → client panel

No direct host→client callback exists. Two documented routes [D + I]:

1. **Decorate** the host command (`ctx.commandUi.decorate`) — keeps its catalog row and argument claim, and makes the
   bare invocation an `action` that calls `ctx.layout.selectPanel(PANEL_ID)`.
2. **Observe** `ctx.on('command/executed', (sessionId, name, result) => …)`, emitted after a matched Host execution
   (`…/lib/types/client/service.d.ts:40`; emit site `lib/client.js:1685`). Other clients see only durable events.

## 6. `ui-layout` / `ui-renderer` / `ui-theme` / `locale`

**Slots** [D]. Root: `main` (keyed), `shell.bottom` (single), `shell.overlay` (list, click-through — "the additive
seat for a frame-wide surface of your own: a badge, a toast stack or a status pill"), `sidebar.panellist{,.actions}`,
`sidebar.toggle.badge`, `sidebar.footer.action`; `sidebar`/`rightbar`/`shell.leading` are occupied. Session:
`conversation.input.{dock,overlay,left,right,activity,model,plan,permission}`, `conversation.composer.dock`,
`conversation.chat.node`, `conversation.session.header.actions`.

**React contract** [D]. A slot entry is an ordinary component; props = owner props + scope standard props + `t` (when
`locale` is passed) + the `inject` face + `store`/`children` where declared (`PropsRuntime<S> & PropsRenderSlots<…> &
InjectFace<…> & PropsLocale<NS>`). A plugin never imports the renderer or wires subscriptions — the renderer binds
bare observables into selector hooks at the render position (`$P/dsh-client-ui-renderer/README.md:36`); fixed
overlays inside the composer seats must `createPortal` to `document.body`; no Suspense or per-entry lazy loading [D].

**Theme** [D]. `--dsw-alias-*` tokens only; literal colors are for artwork (`$P/dsh-client-ui-theme/README.md:28`).
Useful: `--dsw-alias-bg-*`, `-label-*`, `-border-l1|l2|l3`, `--dsw-elevation-{stroke,panel,prominent,soft}`,
`--dsw-specific-menu`, `--dsw-focus-ring-color`, `--dsw-alias-state-{done,error,warning,business}-primary`,
`--dsh-hairline-width`, `--dsh-content-font-size`. Dark mode = `body[data-ds-dark-theme]`; live list via
`cordis_inspect_query` `Theme`.

**i18n — two different mechanisms** [D]:

| file | reader | content |
|---|---|---|
| `<pkg>/locale/{en,zh,…}.json` | host `readPluginMeta` (`$P/dsh-app-boot/lib/index.js:2986`, `dictionariesOf` / `localizedText`), via `<specifier>/locale/en.json` | **display metadata only**: `{ "meta": { "title", "description" } }` |
| runtime strings | `ctx.locale.register(...)` in `apply` | typed namespace dictionaries |

`ctx.locale.register(ns, { zh, en, ja, … })` requires **both** baselines [D]; `ctx.locale.bind(ns)` is stable per
namespace; `addLanguage({ id, label, fallback })` adds a pack; untyped `register(ns, locale, dict)` overloads exist for
namespaces outside the merge table [D]. Slot-rendered copy follows a locale switch live; captured text does not [D].

## 7. `dsh-client-ui-entry-customization`

[D] README:47 + `apply`: registers `EntryMenuContent` into **`sidebar.panellist.actions`**,
`conversation.session.header.views.actions`, `sidebar.right.tab.guide.actions` via `ctx.slots.inject`; it is the
"More" menu row source (Browse other plugins / Create your plugin), stores nothing, calls
`ctx.get('pluginNavigation')?.openList()`. There is **no** host-streamed status-widget API there — "panellist" in its
README means the More-menu rows. Real status surfaces are `conversation.input.dock`, `shell.overlay`,
`sidebar.toggle.badge`, `sidebar.footer.action` [D].

## 8. Real bundle/client splits

| package | split | client JS | evidence |
|---|---|---|---|
| `dsh-experimental-forge-bundle` | bundle only; `dsh.bundle.patch` inserts 6 rows, one being the client package | — | `$P/dsh-experimental-forge-bundle/cordis.patch.yml` |
| `dsh-experimental-client-ui-forge` | separate client package: own `dsh.client`, `./client` (+ `./remote`, `./typert`), tsdown build | built | `$P/dsh-experimental-client-ui-forge/package.json` |
| `dsh-client-ui-goal` | one package, both halves; host half `apply(){}` | built, 30 KB | `$P/dsh-client-ui-goal/lib/{index,client}.js` |
| `dsh-client-ui-plugin-manager`, `-schedule` | one package, both halves + `sidebar.panellist` + `main` | built | `lib/client.js:7680,7750,7820` |
| `$SKILL/templates/decoration` | one package, both halves, **hand-written** | **plain JS, no build** | `$SKILL/templates/decoration/` |

Forge bundle patch [D]: a `cordis:group` row (`group: true`, `isolate: { worktrees: true }`) whose `config` lists
`{ id: forge-worktree, name: '@deepseek-ai/dsh-experimental-worktree' }` and `{ id: forge-panel, name:
'@deepseek-ai/dsh-experimental-client-ui-forge' }`, beside four sibling host rows. So a bundle package is a thin
manifest of `insert` rows whose `name`s are npm dependencies, and a third-party client JS loads from
`<pkg>/<exports["./client"]>` exactly like a shipped one — the two-package split is a convention, not a requirement [D+I].

## 9. What is actually feasible for a plain-JS client plugin

**Verdict: all three surfaces (dock band, sidebar panel, command action) are feasible with no build tool, on a
supported path** (shipped template + generic live reload + `install_bundle`), with three hard limits and one
significant data limit.
### 9.1 Recipe that works

1. One directory: `package.json` (`dsh.bundle.patch` + `dsh.client`), `cordis.patch.yml` with one `insert` row,
   `index.js` = `export function apply() {}`, `client.js` = `window.__ModuleLoader__.load({ id: '<pkg name>', factory
   (require) { … } })`.
2. In the factory: `const React = require('react')`, components via `React.createElement` (no JSX), returning
   `{ inject: ['slots','layout','commandUi','locale', …], apply (ctx) { … } }`; register inside `ctx.effect` /
   `ctx.slots.inject` so unload disposes it [D].
3. Strings: `ctx.locale.register('myNs', { zh: {...}, en: {...} })`, then pass `locale: 'myNs'` per registration for `t`.
4. Ship `locale/en.json` + `locale/zh.json` (Plugins-list title/description) and `icon.svg` as `./icon` [D]; install
   with `plugin_manager install_bundle` on the absolute directory [D].
### 9.2 Hard limits (each from a documented rule)

- **No JSX / TS / own module imports.** The factory protocol "supports self-contained chunks only"; relative
  `client.<chunk>.js` files are reachable only through compiler-generated `require.async` [D]. Concatenate.
- **No Harness Client packages as modules** — `ui-primitives`/`ui-slots`/`ui-dockkit` are forbidden despite being in
  the module table [D]. Hand-write controls; copy markup/behavior (renaming CSS classes) from shipped ones.
- **No custom host RPC without codegen.** `ctx.remote.*` requires generated `./remote` + `./typert` artifacts from
  `@Remote`-decorated classes [D]. Build-free host→client channels: a session **projection** with a `wire` view, an
  **HTTP** route (`ctx.webServer.register({ path, resource })` + browser `fetch`; host-webserver README [D]), or events.
- **No types.** `ui-slots` is unpublished; types come from the generated catalog (§3.1) and `cordis_inspect_query` [D].
### 9.3 Biggest feasibility risks, in order

1. **Status-band data availability.** `useProjection` only exposes projections some *host* package already registers
   with `wire` (title, goal, inbox, todo, …). Guard state is not among them, so the band needs its own host value: a
   plugin-registered projection unit (`register({ key, stateVersion, apply, view, wire })` — plain JS suffices) or an
   HTTP route polled by the band. Neither appears in the shipped template, and `wire`/`view` is a typed contract:
   **the one place with no worked plain-JS example** [D+G].
2. **Session-scope coupling.** `conversation.input.dock` is `scope: 'session'`, so per-session values must be addressed
   through `inject: (sessionId) => …`; a single global "active task" must not assume one Session.
3. **No compile-time safety net.** A throwing component blanks its slot entry (console: `slot entry crashed in
   '<slot>'`) and the page reports a page-local sync error [D]. Also **`main` has no Session binding** [D] — the panel
   cannot use `useSession`, so all its data must come through the plugin's own host channel.
### 9.4 To verify on first install

[G] whether the per-row HMR watch fires for an installed (non-repo) `client.js` (the code path is generic but unproven
here) · [D] `dsh.client.immediately: true` only moves factory registration earlier, activation order still follows
`inject` service waiting · [G] seat choice: `conversation.input.dock` is "above the card" (occupants queue/todo/goal —
right for a status band) while `conversation.composer.dock` is "ambient below the card".
