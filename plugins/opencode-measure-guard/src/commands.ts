// The plugin commands: /measure-off, /measure-on, and /measure-guard. The
// definitions are host-free: `execute` gets the Guard and a `reply` that puts
// a text into the session (index.ts wires ctx.session.synthetic with
// resume: false). The eight Measure workflow commands are markdown files in
// commands/ and need no code.
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
export const offText = (scope: 'session' | 'repo'): string => {
  throw new Error(`not implemented: offText(${scope})`)
}

/** The reply after `/measure-on [repo]`. */
export const onText = (scope: 'session' | 'repo', wasOff: boolean): string => {
  throw new Error(`not implemented: onText(${scope}, ${wasOff})`)
}

/** `repo` when the arguments name the repository scope, else `session`. */
export const scopeOf = (args: string): 'session' | 'repo' => {
  throw new Error(`not implemented: scopeOf(${args})`)
}

/** The three plugin commands. */
export const measureCommands = (): MeasureCommand[] => {
  throw new Error('not implemented: measureCommands()')
}

/** The text of the command argument of an OpenCode command invocation (the prompt text without the `/name`). */
export const argsOf = (name: string, promptText: string): string => {
  throw new Error(`not implemented: argsOf(${name}, ${promptText.length})`)
}
