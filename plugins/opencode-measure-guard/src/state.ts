// The plugin's state: one record per session, the bypass per root (session level
// in memory, repository level in the plugin storage), and the state file that
// the terminal plugin reads.
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
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
  private readonly records = new Map<string, SessionState>()

  sessionOf(sessionID: string): SessionState {
    const found = this.records.get(sessionID)
    if (found !== undefined) return found
    const made: SessionState = {
      sessionID,
      agent: null,
      notedKey: null,
      setupChoice: null,
      turn: null,
      problems: [],
      reminder: null,
      red: null,
    }
    this.records.set(sessionID, made)
    return made
  }

  /** Forgets a session (session.deleted). */
  forget(sessionID: string): void {
    this.records.delete(sessionID)
  }
}

/** The bypass for a root: `session` (in memory), `repo` (storage), or null. */
export class Bypass {
  private readonly session = new Set<string>()

  constructor(readonly storage: Storage) {}

  async get(root: string): Promise<GuardsOff> {
    if ((await this.storage.get(offKey(root))) === true) return 'repo'
    return this.session.has(root) ? 'session' : null
  }

  /** Sets the bypass; `repo` is kept in the storage. */
  async set(root: string, value: 'session' | 'repo'): Promise<void> {
    if (value === 'repo') await this.storage.set(offKey(root), true)
    else this.session.add(root)
  }

  /** Clears the session bypass, and with `repo` also the stored one. */
  async clear(root: string, scope: 'session' | 'repo'): Promise<void> {
    this.session.delete(root)
    if (scope === 'repo') await this.storage.remove(offKey(root))
  }
}

const DEFAULT_BASE = (): string => join(homedir(), '.local', 'state', 'measure', 'opencode-guard')

/** `<base>/<sha1 of root>.json`; base defaults to ~/.local/state/measure/opencode-guard. */
export const stateFilePath = (root: string, base: string = DEFAULT_BASE()): string =>
  join(base, `${createHash('sha1').update(root).digest('hex').slice(0, 16)}.json`)

export const writeStateFile = async (file: StateFile, base: string = DEFAULT_BASE()): Promise<string> => {
  await mkdir(base, { recursive: true })
  const path = stateFilePath(file.root, base)
  await writeFile(path, JSON.stringify(file, null, 1))
  return path
}

/** The state file of a root; null when it does not exist or cannot be parsed. */
export const readStateFile = async (root: string, base: string = DEFAULT_BASE()): Promise<StateFile | null> => {
  try {
    const parsed: unknown = JSON.parse(await readFile(stateFilePath(root, base), 'utf8'))
    if (typeof parsed !== 'object' || parsed === null || !('root' in parsed) || !('problems' in parsed)) return null
    return parsed as StateFile
  } catch {
    return null
  }
}
