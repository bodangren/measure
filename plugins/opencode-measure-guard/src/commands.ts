// The plugin commands: /measure-off, /measure-on, and /measure-guard. The
// definitions are host-free: `execute` gets the Guard and a `reply` that puts
// a text into the session (index.ts wires ctx.session.synthetic with
// resume: false). The eight Measure workflow commands are markdown files in
// commands/ and need no code.
import { statusLines } from './core/parse'
import type { Guard } from './guard'

/** What a command gets: the session, the text after the command name, the Guard, and the reply channel. */
export type CommandRun = {
  sessionID: string
  /** The arguments after the command name, trimmed. */
  args: string
  guard: Guard
  reply: (text: string) => Promise<void>
}

/** A host-free command definition. */
export type MeasureCommand = {
  name: string
  description: string
  execute: (run: CommandRun) => Promise<void>
}

/** The reply after `/measure-off [repo]`. */
export const offText = (scope: 'session' | 'repo'): string =>
  scope === 'repo'
    ? 'measure-guard: the guards are off for this repository. /measure-on repo turns them on.'
    : 'measure-guard: the guards are off for this session. /measure-on turns them on.'

/** The reply after `/measure-on [repo]`. */
export const onText = (scope: 'session' | 'repo', wasOff: boolean): string => {
  const where = scope === 'repo' ? 'this repository' : 'this session'
  return wasOff ? `measure-guard: the guards are on again for ${where}.` : `measure-guard: the guards were not off for ${where}; nothing changed.`
}

/** `repo` when the arguments name the repository scope, else `session`. */
export const scopeOf = (args: string): 'session' | 'repo' => (args.trim().split(/\s+/)[0] === 'repo' ? 'repo' : 'session')

/** The three plugin commands. */
export const measureCommands = (): MeasureCommand[] => [
  {
    name: 'measure-off',
    description: 'Turn the measure-guard checks off for this session (or "repo" for this repository, kept across restarts)',
    execute: async ({ args, guard, reply }) => {
      const scope = scopeOf(args)
      await guard.bypass.set(guard.root, scope)
      await guard.publish(guard.session(sessionIDOf(args)).problems)
      await reply(offText(scope))
    },
  },
  {
    name: 'measure-on',
    description: 'Turn the measure-guard checks on again for this session (or "repo" for the repository switch)',
    execute: async ({ args, guard, reply }) => {
      const scope = scopeOf(args)
      const wasOff = (await guard.bypass.get(guard.root)) !== null
      await guard.bypass.clear(guard.root, scope)
      await guard.publish([])
      await reply(onText(scope, wasOff))
    },
  },
  {
    name: 'measure-guard',
    description: 'Show the Measure position: the tracks, the active task, the [b] count, and the guard state',
    execute: async ({ guard, reply }) => {
      const snapshot = await guard.refresh()
      await reply(statusLines(snapshot, await guard.bypass.get(guard.root)).join('\n'))
    },
  },
]

/** The commands do not need the session for the bypass (it is per root); kept for the publish call. */
const sessionIDOf = (_args: string): string => 'command'

/** The text of the command argument of an OpenCode command invocation (the prompt text without the `/name`). */
export const argsOf = (name: string, promptText: string): string => {
  const text = promptText.trim()
  const prefix = `/${name}`
  return (text.startsWith(prefix) ? text.slice(prefix.length) : text).trim()
}
