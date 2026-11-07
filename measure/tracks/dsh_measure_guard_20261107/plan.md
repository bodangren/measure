# Implementation Plan: DSH measure-guard

Track: `dsh_measure_guard_20261107`
Spec: [./spec.md](./spec.md) · Design: [./design.md](./design.md)

Every phase follows the Task Workflow in `measure/workflow.md`. Test files are
`plugins/dsh-measure-guard/tests/*.test.js`; the gate is
`node --test plugins/dsh-measure-guard/tests/*.test.js` plus
`bash plugins/dsh-measure-guard/scripts/check-parity.sh`.

## Phase 1: Shared core and package skeleton [checkpoint: 1d64eb9]

- [x] Task 1.1: Record the plugin runtime in the tech stack `3afbb9a`
    - [ ] `measure/tech-stack.md` Distribution Formats row for `plugins/dsh-measure-guard/`: a Host plugin and a hand-written `client.js` in the documented lazy-CJS format, loaded by a DSH profile row, Node >= 24.9 type stripping for the shared `.ts` core, no build and no package manager
    - [ ] `measure/tech-stack.md` Tooling Exceptions row for `dsh_measure_guard_20261107`: `node --test plugins/dsh-measure-guard/tests/*.test.js` and `bash plugins/dsh-measure-guard/scripts/check-parity.sh`; the live check is one DSH profile row
    - [ ] `measure/tech-stack.md` Architecture tree line under `plugins/`
- [x] Task 1.2: Scaffold the bundle package `401e0be`
    - [ ] `plugins/dsh-measure-guard/package.json` with the exact fields of `design.md §1` (`dsh.bundle.patch`, `dsh.client`, `engines.node >=24.9.0`, no `lib/`)
    - [ ] `plugins/dsh-measure-guard/cordis.patch.yml` with the self-insert row `measure-guard`
    - [ ] `plugins/dsh-measure-guard/index.js` with `export const name`, `export const inject`, `export function apply`
    - [ ] `plugins/dsh-measure-guard/README.md` skeleton: layout, parity rule, test command
- [x] Task 1.3: Copy the shared core with parity `38428e4`
    - [ ] `src/core/parse.ts` (byte copy), `src/core/guards.ts` (with `./parse.ts`), `src/types.ts` (transformed copy per `design.md §9`)
    - [ ] `scripts/check-parity.sh` with the three checks; exits 1 and names the file that differs
    - [ ] `package.json` script `test` = `node --test tests/ && bash scripts/check-parity.sh`
- [x] Task 1.4: Test harness `afd9884`
    - [ ] `tests/fixtures.js`: in-memory Measure files (index.md, tracks.md, plan.md, guard-allow) plus a repository fixture builder
    - [ ] `tests/core.test.js`: parse the fixture; assert active track, `[~]` task, band line, `[b]` count; assert the parity gate passes
- [x] Task 1.5: Measure - User Manual Verification 'Phase 1: Shared core and package skeleton' (Protocol in workflow.md) `1d64eb9`

## Phase 2: Context layer

- [x] Task 2.1: State model `f3db431`
    - [ ] `src/state.js`: `ReproStore` (mode override, repo bypass) over `~/.local/state/measure/dsh-guard/repos.json`; `Agents` keyed by agent id; `Turns` keyed by `agent.id:turn`; `Bypass`; `newUserMessage()`
    - [ ] `tests/state.test.js`: store round trip, bypass precedence, turn keys, message shape
- [~] Task 2.2: Snapshot service
    - [ ] `src/snapshot.js`: `canonicalRoot` (`ctx.workingDirectory.get` + `ctx.fs.resolve` + `git rev-parse --show-toplevel` via `ctx.subprocess`), `loadSnapshot` (index.md, tracks.md, plans, guard-allow), per-root cache, invalidation
    - [ ] `tests/snapshot.test.js`: real repository, temp repository, no `measure/`, parse error, canonical root of a subdirectory
- [ ] Task 2.3: Second-writer detection (FR-12)
    - [ ] `src/roots.js`: `RootWriters` (one writer per canonical root; the second agent gets one warning note and the band suffix)
    - [ ] `tests/roots.test.js`: one writer no notice, second writer one notice, same agent re-entry no second notice, different root no notice
- [ ] Task 2.4: Rule section and task note
    - [ ] `src/context.js`: fixed `ctx.systemPrompt.section`; note from `agent/pre-step` (`{kind:'enter', messages}`); re-note after `compaction/end` and after cache invalidation; `agent/created` attach for existing agents
    - [ ] `tests/context.test.js`: rule text static; note appears exactly once per task change; note after compaction; no note without `measure/`
- [ ] Task 2.5: `measure_status` tool
    - [ ] `src/status.js` + `ctx.tools.register`: tracks, active track, position, `[b]` count, next action, spec path; never the whole spec
    - [ ] `tests/status.test.js`: normal, no active track, no `measure/`, parse error
- [ ] Task 2.6: Commands
    - [ ] `src/commands.js` + `ctx.commands.register`: `measure-off` [repo], `measure-on` [repo], `measure-status`
    - [ ] `tests/commands.test.js`: session and repo scope, unknown argument defaults to session, status text
- [ ] Task 2.7: Setup offer (NFR-1)
    - [ ] `src/setup.js`: `needsSetup`, `setupChoice` transitions (`pending`/`off`/`setup`), `SETUP_PROMPT`, `setupBandText`; the state lives in agent state
    - [ ] `tests/setup.test.js`: git repo without `measure/` asks, non-repo does not, `off` silences, `setup` keeps the prompt text
- [ ] Task 2.8: Measure - User Manual Verification 'Phase 2: Context layer' (Protocol in workflow.md)

## Phase 3: Guard layer

- [ ] Task 3.1: Decision preparation
    - [ ] `src/guard.js`: decision `Map` keyed by `exec.token` filled in `tools/pre-execute`, read by the synchronous `ctx.tools.guard`, cleared on `tools/result`; try/catch defaults to allow
    - [ ] `tests/guard-prep.test.js`: decision lifecycle, deny text reaches the guard, parse error allows, a throwing preparation or a failed git/fs read allows (fail open)
- [ ] Task 3.2: Tool mutation normalization
    - [ ] `src/hooks.js`: `normalizeMutation` for `edit`, `write`, `apply_patch`, `str_replace_editor`, `bash`, `pwsh`; multi-path call denied when any path is denied
    - [ ] `tests/mutation.test.js`: every tool shape, relative paths, multi-path deny, non-mutation tools
- [ ] Task 3.3: Edit guard
    - [ ] `src/guard.js`: `editDecision` on every normalized path; deny text names the next task and `/measure-off`
    - [ ] `tests/edit-guard.test.js`: deny without `[~]`, allow with `[~]`, allow inside `measure/`, allow list, bypass, `advise` mode
- [ ] Task 3.4: Closeout guard
    - [ ] `src/guard.js`: track close (`closedTracks`) and phase start (`phaseStartDecision`) on `tracks.md`/`plan.md` edits; after-text only for `edit`/`write`, fail open for every other tool
    - [ ] `tests/closeout.test.js`: close with open tasks denied, close with `[b]` + `deferred:` allowed with a note, phase N+1 without checkpoint denied, `apply_patch`/`str_replace_editor` fail open, an unreadable plan fails open
- [ ] Task 3.5: End-of-turn check
    - [ ] `src/guard.js`: baseline at the first `agent/pre-step`; problems at `agent/turn-stopping`; strict holds the turn open by `agent.steer` at most `MAX_BLOCKS` (2) times; guard mode reminder at the next `pre-step`; band problems
    - [ ] `tests/end-of-turn.test.js`: changed files with no `[~]` reported, `[x]` without SHA reported, strict steer bounded to 2, advise records only
- [ ] Task 3.6: Measure - User Manual Verification 'Phase 3: Guard layer' (Protocol in workflow.md)

## Phase 4: Client surface

- [ ] Task 4.1: Host state resource
    - [ ] `src/client-state.js` + `ctx.webServer.register({ path: '/measure-guard/state', resource })`: JSON `{ band, status, guardsOff, problems, updatedAt }` for `?sessionId=`; 404 for an unknown session
    - [ ] `tests/client-state.test.js`: session lookup, no `measure/`, unknown session
- [ ] Task 4.2: Band
    - [ ] `client.js`: `window.__ModuleLoader__.load` factory; `conversation.input.dock` registration; 2 s fetch; theme tokens only; en/zh copy
    - [ ] `tests/client-bundle.test.js`: the bundle text parses, its `id` equals the package name, it requires only `react`, it registers the three surfaces
- [ ] Task 4.3: Panel and command action
    - [ ] `client.js`: `main` keyed slot key `measure` + `sidebar.panellist` id `measure`; `ctx.commandUi.decorate('measure-status')` action selects the panel
    - [ ] `tests/client-bundle.test.js`: panel pair and decoration present
- [ ] Task 4.4: Live load check
    - [ ] Add one `- insert:` row to `~/.dsh/profiles/web/cordis.patch.yml` with `name: /home/daniel-bo/Desktop/measure/plugins/dsh-measure-guard/index.js`; HMR recomposes without a restart
    - [ ] Verify from the running GUI's HTTP surface: the boot graph carries a `dsh-measure-guard` entry and `/plugins/dsh-measure-guard/client.js` serves the bundle; record the evidence and the user confirmation in the task git note
- [ ] Task 4.5: Measure - User Manual Verification 'Phase 4: Client surface' (Protocol in workflow.md)

## Phase 5: Distribution and docs

- [ ] Task 5.1: Documentation and display resources
    - [ ] `README.md` (install, parity, layout, behavior, known limits), `locale/en.json`, `locale/zh.json`, `icon.svg`
- [ ] Task 5.2: Distribution
    - [ ] `bin/install-targets.tsv` row: `plugins/dsh-measure-guard<TAB>~/.dsh/profiles/web/plugins/dsh-measure-guard<TAB>!(tests/*)`
    - [ ] `tests/install.sh` modeled on the OpenCode installer test: the copy, no `tests/`, the stamp, `--check`, local-edit protection
    - [ ] `README.md` names the one selection step the installer cannot do: the profile `cordis.patch.yml` insert row `name: ./plugins/dsh-measure-guard/index.js`, which makes both halves load (the client half is found through the nearest `package.json`); the `dsh plugin --profile web add <abs path>` route stays documented for pnpm users
- [ ] Task 5.3: Track closeout documents
    - [ ] `measure/lessons-learned.md`, `measure/tech-debt.md`, `CHANGELOG.md` entries for this track
- [ ] Task 5.4: Measure - User Manual Verification 'Phase 5: Distribution and docs' (Protocol in workflow.md)

## Deferred to a follow-up track

- Strict-mode TDD and commit guards (FR-13)
- Subagent inheritance and goal binding (FR-14)
- Windows path support
