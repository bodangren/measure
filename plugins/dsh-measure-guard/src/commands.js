// The three host commands (FR-4): measure-off, measure-on (both with an
// optional `repo` argument), and measure-status. Handlers return
// { kind: 'success', text }; the texts mirror plugins/opencode-measure-guard.
import { statusText, refreshSnapshotOf } from './status.js'

/** The scope of `/measure-off|on`: `repo` when the first token says so, else session. */
export const scopeOf = args => (String(args ?? '').trim().split(/\s+/)[0] === 'repo' ? 'repo' : 'session')

/** The reply after `/measure-off [repo]`. */
export const offText = scope =>
  scope === 'repo'
    ? 'measure-guard: the guards are off for this repository. /measure-on repo turns them on.'
    : 'measure-guard: the guards are off for this session. /measure-on turns them on.'

/** The reply after `/measure-on [repo]`. */
export const onText = (scope, wasOff) => {
  const where = scope === 'repo' ? 'this repository' : 'this session'
  return wasOff
    ? `measure-guard: the guards are on again for ${where}.`
    : `measure-guard: the guards were not off for ${where}; nothing changed.`
}

/** The three `ctx.commands.register` definitions. */
export function measureCommands(deps) {
  return [
    {
      name: 'measure-off',
      description:
        'Turn the measure-guard checks off for this session (or "repo" for this repository, kept across restarts)',
      handler: async invocation => {
        const root = await deps.rootOf(invocation.agent)
        const scope = scopeOf(invocation.rawInput)
        await deps.state.bypass.set(root, scope)
        return { kind: 'success', text: offText(scope) }
      },
    },
    {
      name: 'measure-on',
      description:
        'Turn the measure-guard checks on again for this session (or "repo" for the repository switch)',
      handler: async invocation => {
        const root = await deps.rootOf(invocation.agent)
        const scope = scopeOf(invocation.rawInput)
        const wasOff = (await deps.state.bypass.get(root)) !== null
        await deps.state.bypass.clear(root, scope)
        return { kind: 'success', text: onText(scope, wasOff) }
      },
    },
    {
      name: 'measure-status',
      description: 'Show the Measure position: the tracks, the active task, the [b] count, and the guard state',
      handler: async invocation => {
        const root = await deps.rootOf(invocation.agent)
        const snapshot = await refreshSnapshotOf(deps, root)
        const guardsOff = await deps.state.bypass.get(root)
        return { kind: 'success', text: statusText({ snapshot, guardsOff, mode: deps.mode }) }
      },
    },
  ]
}
