// The plugin's state: one record per session, the bypass per root (session level
// in memory, repository level in the plugin storage), and the state file that
// the terminal plugin reads.
import type { GuardsOff, Mode, RedState, SetupChoice, TurnState } from './types'

/** What the hooks keep for one session. */
export type SessionState = {
  readonly sessionID: string
  /** The agent of the session, from the last prompt or tool call. */
  agent: string | null
  /** The noteKey of the last task note the agent got; null sends the next one. */
  notedKey: string | null
  /** The answer to the setup question; null where no question is asked. */
  setupChoice: SetupChoice | null
  /** The end-of-turn state of the running user turn. */
  turn: TurnState | null
  /** The problems the last end-of-turn check found. */
  problems: string[]
  /** The reminder for the next prompt (guard and strict modes). */
  reminder: string | null
  /** The Red phase of the `[~]` task, for the TDD guard. */
  red: RedState | null
}

/** The subset of the plugin storage the bypass needs. */
export type Storage = {
  get(key: string): Promise<unknown>
  set(key: string, value: string | number | boolean | null): Promise<void>
  remove(key: string): Promise<void>
}

/** What the state file holds for the terminal plugin. */
export type StateFile = {
  root: string
  mode: Mode
  guardsOff: GuardsOff
  problems: string[]
  updatedAt: string
}

/** The storage key of the repository-level bypass. */
export const offKey = (root: string): string => `off:${root}`

/** Per-session records, created on first use. */
export class Sessions {
  sessionOf(_sessionID: string): SessionState {
    throw new Error('not implemented')
  }
  /** Forgets a session (session.deleted). */
  forget(_sessionID: string): void {
    throw new Error('not implemented')
  }
}

/** The bypass for a root: `session` (in memory), `repo` (storage), or null. */
export class Bypass {
  constructor(_storage: Storage) {}
  async get(_root: string): Promise<GuardsOff> {
    throw new Error('not implemented')
  }
  /** Sets the bypass; `repo` is kept in the storage. */
  async set(_root: string, _value: 'session' | 'repo'): Promise<void> {
    throw new Error('not implemented')
  }
  /** Clears the session bypass, and with `repo` also the stored one. */
  async clear(_root: string, _scope: 'session' | 'repo'): Promise<void> {
    throw new Error('not implemented')
  }
}

/** `<base>/<sha1 of root>.json`; base defaults to ~/.local/state/measure/opencode-guard. */
export const stateFilePath = (_root: string, _base?: string): string => {
  throw new Error('not implemented')
}

export const writeStateFile = async (_file: StateFile, _base?: string): Promise<string> => {
  throw new Error('not implemented')
}

/** The state file of a root; null when it does not exist or cannot be parsed. */
export const readStateFile = async (_root: string, _base?: string): Promise<StateFile | null> => {
  throw new Error('not implemented')
}
