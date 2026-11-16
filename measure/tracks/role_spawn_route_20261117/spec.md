# Specification: Role spawn routes

## Overview

The Measure extension enforces the model route of each Measure role. From 2026-11-14 to 2026-11-16 the Measure roles used 85 % of 1.88 B OpenCode Go tokens. The roles used paid routes chosen by hand. The free copy of the same model was available. Daniel orders that the Measure extension enforce the approved routes in `~/.config/ra-quota/routes.json`.

This track adds a spawn-route guard to the shared Measure core. It wires the guard in the OpenCode plugin. The guard maps a `measure-*` agent to a ra-quota role. It reads the routes file on each spawn. It compares the spawn model with the approved routes of that role.

Source: PM order, 2026-11-17, light lane. One PR; the PM merges.

## The order (PM, verbatim)

> "measure-guard blocks a Measure role spawn (subagent/task tool call with agent measure-*) when its model is not in the approved list of that role in ~/.config/ra-quota/routes.json (role map: measure-mid-red=red, measure-jr-green=green, review-a/b/c, adversarial, strategy, spec-review=strategy, phase-acceptance=acceptance, final-acceptance; unknown role or missing file = allow with a warning). Deny text names the approved routes and says: run scripts/jobs/ra-quota pick <role>. Why: on 11-14 to 11-16 the Measure roles used 85 % of 1.88 B OpenCode Go tokens, on paid routes chosen by hand while the free copy of the same model was available; Daniel orders that the Measure extension enforce this. Done when: tests for allow, deny, missing file; PR open."

## Decided change (recorded here; do not choose another design)

### 1. New pure code in the shared core

Add this block to `mods/measure-guard/hooks/guards.ts`, directly after `trackCloseDecision()`:

```ts
/** The ra-quota role of each Measure agent that the spawn-route guard checks. */
export const ROLE_OF_AGENT: Record<string, string> = {
  'measure-mid-red': 'red',
  'measure-jr-green': 'green',
  'measure-review-a-correctness': 'review-a',
  'measure-review-b-security': 'review-b',
  'measure-review-c-ux-api': 'review-c',
  'measure-adversarial-testing': 'adversarial',
  'measure-strategy': 'strategy',
  'measure-spec-review': 'strategy',
  'measure-phase-acceptance': 'acceptance',
  'measure-final-acceptance': 'final-acceptance',
}

/** The ra-quota routes file, relative to the home folder. */
export const ROUTES_FILE = '.config/ra-quota/routes.json'

/** The command that prints one approved route of a role. */
export const ROUTE_PICK = '/home/daniebo/Desktop/advantage-pr/scripts/jobs/ra-quota pick'

/** The agent and the model a spawn call names; model is null when the call names none. */
export type RoleSpawn = { agent: string; model: string | null }

/** The first non-empty string among `values`, trimmed; null when there is none. */
const firstText = (values: readonly unknown[]): string | null => {
  const found = values.find(value => typeof value === 'string' && value.trim() !== '')
  return typeof found === 'string' ? found.trim() : null
}

/** The agent and model of a tool call that spawns a subagent: the OpenCode `subagent` tool (`agent`) or a `task` tool (`subagent_type`). Null for every other call. */
export const roleSpawnOf = (tool: string, input: unknown): RoleSpawn | null => {
  const name = tool.toLowerCase()
  if (name !== 'subagent' && name !== 'task') return null
  if (input === null || typeof input !== 'object') return null
  const fields = input as Record<string, unknown>
  const agent = firstText([fields.agent, fields.subagent_type, fields.subagentType])
  if (agent === null) return null
  return { agent, model: firstText([fields.model]) }
}

/** The approved route strings of one role in the routes file text; null when the file is unreadable or the role has no route. */
export const approvedRoutes = (text: string | null, role: string): string[] | null => {
  if (text === null) return null
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return null
  }
  if (parsed === null || typeof parsed !== 'object') return null
  const roles = (parsed as { roles?: unknown }).roles
  if (roles === null || typeof roles !== 'object') return null
  const list = (roles as Record<string, unknown>)[role]
  if (!Array.isArray(list)) return null
  const routes = list
    .map(item => (item !== null && typeof item === 'object' ? firstText([(item as { route?: unknown }).route]) : null))
    .filter((route): route is string => route !== null)
  return routes.length === 0 ? null : routes
}

/** The spawn-route guard (guard and strict): a `measure-*` spawn must name a route in the approved list of its role. An unknown Measure role, a spawn that names no model, and a missing or unreadable routes file are allowed with a warning note. */
export const roleSpawnDecision = (context: GuardContext, routesText: string | null, spawn: RoleSpawn): { decision: Decision; note: string | null } => {
  if (!isGuarding(context)) return { decision: null, note: null }
  if (!spawn.agent.startsWith('measure-')) return { decision: null, note: null }
  const role = ROLE_OF_AGENT[spawn.agent]
  if (role === undefined) {
    return { decision: null, note: `measure-guard: "${spawn.agent}" is not in the route map, so the guard did not check its model.` }
  }
  const routes = approvedRoutes(routesText, role)
  if (routes === null) {
    return { decision: null, note: `measure-guard: cannot read the approved routes of role "${role}" in ~/${ROUTES_FILE}, so the guard did not check the model of "${spawn.agent}".` }
  }
  if (spawn.model === null) {
    return { decision: null, note: `measure-guard: "${spawn.agent}" names no model, so the guard did not check its route. Pass the route that ${ROUTE_PICK} ${role} prints.` }
  }
  if (routes.includes(spawn.model)) return { decision: null, note: null }
  return {
    decision: {
      deny: [
        `measure-guard: "${spawn.agent}" names the model "${spawn.model}", which is not an approved route of role "${role}".`,
        'The approved routes are:',
        ...routes.map(route => `  - ${route}`),
        `Run ${ROUTE_PICK} ${role} and use the route it prints. ${BYPASS}`,
      ].join('\n'),
    },
    note: null,
  }
}
```

`isGuarding` and `BYPASS` already exist in the file above that point.

### 2. Parity copies

The plugin check scripts require byte equality with the new core.

- `plugins/opencode-measure-guard/src/core/guards.ts` is a byte copy of `mods/measure-guard/hooks/guards.ts`.
- `plugins/dsh-measure-guard/src/core/guards.ts` is the same copy with the one transform `from './parse'` to `from './parse.ts'`.

Write the two copies with these commands. Do not edit the two files by hand.

```bash
cp mods/measure-guard/hooks/guards.ts plugins/opencode-measure-guard/src/core/guards.ts
sed "s|from './parse'|from './parse.ts'|" mods/measure-guard/hooks/guards.ts > plugins/dsh-measure-guard/src/core/guards.ts
```

No `types/index.d.ts` file changes. The new types live in `guards.ts`.

### 3. OpenCode wiring

In `plugins/opencode-measure-guard/src/guard.ts`:

- Add `ROUTES_FILE`, `roleSpawnDecision`, and `roleSpawnOf` to the existing import block from `./core/guards`.
- In `onToolBefore`, directly before the line `if (paths.length === 0 && commit === null && shellTargets.length === 0) return`, add:

```ts
    const spawn = roleSpawnOf(event.tool, event.input)
    if (spawn !== null) {
      const context = await this.guardContext(event.sessionID)
      const check = roleSpawnDecision(context, await this.routesText(), spawn)
      this.deny(check.decision)
      if (check.note !== null) this.callNotes.set(event.id, [check.note])
      return
    }
```

- Add this private method directly after the private `closeout` method:

```ts
  /** The ra-quota routes file text; null when HOME is unset or the file cannot be read. */
  private async routesText(): Promise<string | null> {
    const home = process.env.HOME
    if (home === undefined || home === '') return null
    try {
      return await readFile(joinPath(home, ROUTES_FILE), 'utf8')
    } catch {
      return null
    }
  }
```

`readFile` from `node:fs/promises` and `joinPath` are already imported.

### 4. Role map

`ROLE_OF_AGENT` maps each checked agent to one ra-quota role. The map is `measure-mid-red` to `red`, `measure-jr-green` to `green`, `measure-review-a-correctness` to `review-a`, `measure-review-b-security` to `review-b`, `measure-review-c-ux-api` to `review-c`, `measure-adversarial-testing` to `adversarial`, `measure-strategy` to `strategy`, `measure-spec-review` to `strategy`, `measure-phase-acceptance` to `acceptance`, and `measure-final-acceptance` to `final-acceptance`. The code block in section 1 is the authoritative list.

### 5. The comparison

The route comparison is exact and case-sensitive. The guard compares the whole model string. A route with a `#variant` matches only the same string with that variant. The guard reads the routes file on each spawn call, so a change to the file applies to the next call.

### 6. Warning cases

The guard allows a spawn with a warning note on the tool output in three cases.

- The agent starts with `measure-`, but `ROLE_OF_AGENT` has no role for it.
- The agent has a role, but the spawn call names no model.
- The routes file is missing, unreadable, or not valid JSON, or the role has no non-empty route list in it.

Every other `measure-*` spawn with a model outside the approved routes of its role gets a deny. The deny text names the approved routes and the command `${ROUTE_PICK} ${role}`.

## Test

A new self-contained suite `plugins/opencode-measure-guard/tests/role-spawn.test.ts`. Python is not used here; bun runs it.

- Copy the `before` and `after` event helpers of `tests/closeout.test.ts`.
- Use `makeGuard` and `tempProject` from `tests/fake.ts`.
- Build a temp HOME with `mkdtempSync` and restore `process.env.HOME` in `afterEach`.
- Write the routes fixture with this content:

```json
{"roles":{"red":[{"route":"opencode-go/deepseek-v4.1-flash","family":"deepseek"}],"green":[{"route":"opencode/deepseek-v4.1-flash-free#high","family":"deepseek"}]}}
```

Each case gets its own name.

- Allow: agent `measure-mid-red`, model `opencode-go/deepseek-v4.1-flash`; `onToolBefore` resolves.
- Deny: agent `measure-mid-red`, model `claude-code/claude-opus-5-5[1m]#high`; the thrown message contains "not an approved route", the line "  - opencode-go/deepseek-v4.1-flash", and "ra-quota pick red".
- Missing file: a temp HOME with no routes file, the deny model; `onToolBefore` resolves; `onToolAfter` on the completed event, and the output text contains "cannot read the approved routes".
- Unknown role: agent `measure-ux-browser-review`; resolves, and the after output contains "is not in the route map".
- No model: agent `measure-jr-green` with no model; resolves, and the after output contains "names no model".
- Task tool shape: tool `task`, input `{subagent_type: 'measure-jr-green', model: 'claude-code/claude-opus-5-5[1m]#high'}`; denied.
- Non-Measure agent: agent `coder`, model anything; resolves, and the after output does not contain "measure-guard".
- Advise mode: `makeGuard(root, 'advise')`, the deny case; resolves.

Red: before the change, every case fails because `guards.ts` has no `roleSpawnOf` export. Keep the run output in `measure/runs/role_spawn_route_20261117/red-role-spawn.log`. Green: every case passes, in `green-role-spawn.log`. The runs folder is gitignored.

## Functional Requirements

- **FR-1 (the core and the two copies).** Add the block of section 1 to `mods/measure-guard/hooks/guards.ts`, directly after `trackCloseDecision()`. Write the two parity copies with the commands of section 2. No `types/index.d.ts` file changes.
- **FR-2 (the OpenCode wiring).** Add the import names, the spawn check, and the `routesText()` method of section 3 to `plugins/opencode-measure-guard/src/guard.ts`.
- **FR-3 (the test and the gates).** Add the suite of the Test section (Red first). Keep the logs in `measure/runs/role_spawn_route_20261117/`. Commit on `chore/role-spawn-routes` with the message `feat(guard): Block a Measure role spawn on an unapproved route`.
- **FR-4 (the records).** `CHANGELOG.md` gets one entry as the first of the list under the first `### Features` heading of `## Unreleased`, directly above the "idle-session compaction" entry. The entry has this exact text (one physical line, then one empty line):

  ```
  * **role spawn routes:** the OpenCode plugin now blocks a Measure role spawn whose model is not an approved route of that role in `~/.config/ra-quota/routes.json`. The guard maps the agent to a ra-quota role (for example `measure-mid-red` to `red`), reads the routes file on each spawn, and compares the spawn model with the routes of that role. An unknown Measure role, a spawn that names no model, and a missing or unreadable routes file are allowed with a warning. The deny lists the approved routes and points to `ra-quota pick <role>`. Track `role_spawn_route_20261117`.
  ```

  `plugins/opencode-measure-guard/README.md`, "## Guards": add this bullet directly after the "Closeout guard." bullet:

  ```
  - **Role spawn routes.** In mode `guard` or `strict`, a `subagent` or `task` call that names a `measure-*` agent must name a model in the approved list of its role in `~/.config/ra-quota/routes.json`. The guard maps the agent to a ra-quota role and compares the `model` of the call with the route strings of that role, exactly and including a variant. An unknown Measure role, a spawn that names no model, and a missing or unreadable routes file are allowed, with a warning note on the tool output. The deny lists the approved routes and names `ra-quota pick <role>`. The Claude Code mod and the DSH adapter carry the same core but do not call it yet.
  ```

  `README.md` line 33: replace its first sentence, up to and including its closing bracket and full stop, with:

  ```
  As of 2026-11-17, the latest archived track is Role spawn routes (the OpenCode plugin blocks a Measure role spawn whose model is not an approved route of that role in ~/.config/ra-quota/routes.json).
  ```

  The rest of line 33 stays unchanged. Both the CHANGELOG entry and the two README changes ride in the Task 1.2 archive commit.
- **FR-5 (the closeout).** Archive the track to `measure/archive/role_spawn_route_20261117/`, move the registry entry to Archived Tracks with `[x]`, and record the gate results.

## Acceptance Criteria

- `cd plugins/opencode-measure-guard && bun test tests/role-spawn.test.ts` fails before the change (Red) and passes after the change (Green). Keep both outputs in `measure/runs/role_spawn_route_20261117/`.
- `cd plugins/opencode-measure-guard && bun test` (whole package): record every failure and whether it already fails on origin/main `a2bb10e`. Do not fix it.
- `bash plugins/opencode-measure-guard/scripts/check-parity.sh` exits 0.
- `bash plugins/dsh-measure-guard/scripts/check-parity.sh` exits 0.
- `cd plugins/opencode-measure-guard && bun x tsc --noEmit -p .`: the package has no `node_modules` and `bun install` hangs here. If the gate does not finish in 120 s, record it as stopped with the reason. Never bypass it.
- Through the heavy-job wrapper with no shell redirection (`>`, `>>`, `tee`):
  `HEAVY_PRIORITY=p2 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh bash tests/spec_review_gate/run.sh`
  (evidence `run-suites.log`) and
  `HEAVY_PRIORITY=p2 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh bash tests/dsh/test-registry.sh`
  (Task 1.1 evidence `test-registry-task1.1.log`; Task 1.2 evidence `test-registry.log`) exit 0.
- The closeout check fails only on the missing closeout manifest (`closeout-check.log`).

## Out of Scope

- No wiring in the Claude Code mod (`mods/measure-guard/hooks/register.tsx`) and none in the DSH adapter. They receive the same core copy through the parity rule, but this track does not check their spawn calls. Reason: this order covers the OpenCode plugin, which runs the Measure extensions; the other two adapters need their own hook and a model-surface confirmation.
- No change to the DSH closeout metadata check, the allow list, the edit guard, the TDD guard, the commit guard, and the end-of-turn check.
- No change to ra-quota itself or to `~/.config/ra-quota/routes.json`.
- No change to any role file under `agents/`.
