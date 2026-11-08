// The effective guard mode (Story S1). Precedence: the persisted per-repository
// override (state.Repos) wins over an in-memory session override, which wins
// over the profile config default. The repository override survives a reload;
// the session override dies with the plugin instance.
import { MODES } from './state.js'

/** The in-memory session mode overrides, keyed by canonical root. */
export class SessionModes {
  #byRoot = new Map()

  /** The session override of a root, or null. */
  get(root) {
    return this.#byRoot.get(root) ?? null
  }

  /** Sets (or with null clears) the session override of a root. */
  set(root, mode) {
    if (mode === null) {
      this.#byRoot.delete(root)
      return
    }
    if (!MODES.includes(mode)) throw new TypeError(`measure-guard: unknown mode "${String(mode)}"`)
    this.#byRoot.set(root, mode)
  }

  /** Clears the session override of a root. */
  clear(root) {
    this.#byRoot.delete(root)
  }
}

/**
 * The effective mode of a canonical root as `{ value, source }`. The source is
 * `repository` (persisted override), `session` (in-memory override), or
 * `config` (the profile default). A failing repository read fails open to the
 * next level.
 */
export async function effectiveMode(deps, root) {
  try {
    const repository = await deps.state.repos.modeOf(root)
    if (repository !== null) return { value: repository, source: 'repository' }
  } catch {
    // Fail open to the session/config levels.
  }
  const session = deps.sessionModes === undefined ? null : deps.sessionModes.get(root)
  if (session !== null) return { value: session, source: 'session' }
  return { value: deps.configMode, source: 'config' }
}

/** The usage reply of `/measure-mode`. */
export const MODE_USAGE = 'measure-guard: usage: /measure-mode [advise|guard|strict|default] [repo]'

/** The scope label of a parsed token; null for an unknown token. */
const scopeOf = token => (token === 'repo' ? 'repository' : token === undefined ? 'session' : null)

/**
 * The `/measure-mode` command (Story S1): report, set, or clear the mode for
 * this session or for the repository. Every reply is a success text; a bad
 * argument changes nothing.
 */
export function measureModeCommand(deps) {
  return {
    name: 'measure-mode',
    description: 'Show or change the measure-guard mode for this session, or persist it for this repository',
    handler: async invocation => {
      const root = await deps.rootOf(invocation.agent)
      const tokens = String(invocation.rawInput ?? '').trim().split(/\s+/).filter(Boolean)
      if (tokens.length === 0) {
        const mode = await deps.modeOf(root)
        return { kind: 'success', text: `measure-guard: mode ${mode.value} (${mode.source}).` }
      }
      if (tokens.length > 2) return { kind: 'success', text: MODE_USAGE }
      const scope = scopeOf(tokens[1])
      if (scope === null) return { kind: 'success', text: MODE_USAGE }
      const requested = tokens[0]
      if (requested === 'default') {
        if (scope === 'repository') await deps.state.repos.setMode(root, null)
        else deps.sessionModes.clear(root)
        const mode = await deps.modeOf(root)
        return {
          kind: 'success',
          text: `measure-guard: mode override cleared (${scope}); effective mode ${mode.value} (${mode.source}).`,
        }
      }
      if (!MODES.includes(requested)) return { kind: 'success', text: MODE_USAGE }
      if (scope === 'repository') await deps.state.repos.setMode(root, requested)
      else deps.sessionModes.set(root, requested)
      const mode = await deps.modeOf(root)
      return {
        kind: 'success',
        text: `measure-guard: mode set to ${requested} (${scope}); effective mode ${mode.value} (${mode.source}).`,
      }
    },
  }
}

/** The `measure_mode` tool: the effective mode and its source, read-only. */
export function measureModeTool(deps) {
  return {
    name: 'measure_mode',
    description: 'Report the effective measure-guard mode and its source: config, session, or repository (read-only)',
    parameters: { type: 'object', properties: {}, additionalProperties: false },
    output: { schema: { type: 'string' }, render: (_args, value) => [{ type: 'text', text: value }] },
    async execute(_args, exec) {
      const root = await deps.rootOf(exec === undefined ? undefined : exec.agent)
      const mode = await effectiveMode(deps, root)
      return `measure-guard: effective mode ${mode.value} (${mode.source}).`
    },
  }
}
