// The four state classes of the plugin: the repository config store (the mode
// override and the persisted repo bypass), the per-agent records, the per-turn
// records, and the bypass. The plugin keeps no session projection and no
// storage-domain schema (NFR-2): the repository config is one JSON file under
// ~/.local/state, read on first use and written atomically.
import { randomUUID } from 'node:crypto'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'

/** The accepted guard levels, in increasing strictness. */
export const MODES = ['advise', 'guard', 'strict']

/** The folder under ~/.local/state that keeps the repository config. */
export const DEFAULT_BASE = join(homedir(), '.local', 'state', 'measure', 'dsh-guard')

/** The file inside the base folder. */
export const REPOS_FILE = 'repos.json'

/** The absolute path of the config file for a base folder. */
export const reposFilePath = (base = DEFAULT_BASE) => join(base, REPOS_FILE)

const isRecord = value => typeof value === 'object' && value !== null && !Array.isArray(value)

/** Freezes a JSON-like value deeply (messages are shared, so they never mutate). */
const deepFreeze = value => {
  if (value === null || typeof value !== 'object' || Object.isFrozen(value)) return value
  for (const child of Array.isArray(value) ? value : Object.values(value)) deepFreeze(child)
  return Object.freeze(value)
}

/**
 * The repository configuration, keyed by realpath root:
 * `{ "<root>": { mode?: Mode, off?: true } }`. The file is read once, a missing
 * or corrupt file reads as `{}`, and a write goes through a temp file plus
 * rename so a crash never leaves a half-written file.
 */
export class Repos {
  #base
  #path
  #data = null
  #loading = null
  #queue = Promise.resolve()

  constructor({ base = DEFAULT_BASE } = {}) {
    this.#base = base
    this.#path = reposFilePath(base)
  }

  /** The config file path (tests and debugging). */
  get path() {
    return this.#path
  }

  async #read() {
    if (this.#data !== null) return this.#data
    if (this.#loading === null) {
      this.#loading = (async () => {
        try {
          const parsed = JSON.parse(await readFile(this.#path, 'utf8'))
          this.#data = isRecord(parsed) ? parsed : {}
        } catch {
          this.#data = {}
        } finally {
          this.#loading = null
        }
      })()
    }
    await this.#loading
    return this.#data
  }

  async #write() {
    await mkdir(this.#base, { recursive: true })
    const temporary = `${this.#path}.${randomUUID()}.tmp`
    await writeFile(temporary, JSON.stringify(this.#data, null, 1), 'utf8')
    await rename(temporary, this.#path)
  }

  /** Serializes a mutation so concurrent commands cannot interleave writes. */
  #mutate(change) {
    const run = this.#queue.then(async () => {
      const data = await this.#read()
      change(data)
      await this.#write()
    })
    this.#queue = run.catch(() => {})
    return run
  }

  async #entry(root) {
    const data = await this.#read()
    return isRecord(data[root]) ? data[root] : {}
  }

  /** The persisted mode override of a root; null when none is stored. */
  async modeOf(root) {
    const mode = (await this.#entry(root)).mode
    return MODES.includes(mode) ? mode : null
  }

  /** Stores (or with null clears) the mode override of a root. */
  async setMode(root, mode) {
    if (mode !== null && !MODES.includes(mode)) throw new TypeError(`measure-guard: unknown mode "${String(mode)}"`)
    await this.#mutate(data => {
      const entry = isRecord(data[root]) ? data[root] : {}
      if (mode === null) delete entry.mode
      else entry.mode = mode
      if (Object.keys(entry).length === 0) delete data[root]
      else data[root] = entry
    })
  }

  /** True when /measure-off repo is stored for the root. */
  async isOff(root) {
    return (await this.#entry(root)).off === true
  }

  /** Stores or clears the repository bypass of a root. */
  async setOff(root, on) {
    await this.#mutate(data => {
      const entry = isRecord(data[root]) ? data[root] : {}
      if (on) entry.off = true
      else delete entry.off
      if (Object.keys(entry).length === 0) delete data[root]
      else data[root] = entry
    })
  }
}

/** What the plugin keeps for one agent (Agent.id is the Session.id). */
export const emptyAgentState = () => ({
  /** The noteKey of the last task note; null sends the next one. */
  notedKey: null,
  /** The setup answer in a git repository with no measure/ folder. */
  setupChoice: null,
  /** The end-of-turn reminder for the next step. */
  reminder: null,
  /** The problems the last end-of-turn check found. */
  problems: [],
  /** The Red phase of the `[~]` task (strict mode). */
  red: null,
  /** The session bypass, when the setup answer turned the guards off. */
  bypass: null,
})

/** Per-agent records, created on first use and forgotten on agent/disposed. */
export class Agents {
  #records = new Map()

  /** The record of an agent, created on first use. */
  sessionOf(id) {
    const found = this.#records.get(id)
    if (found !== undefined) return found
    const made = emptyAgentState()
    this.#records.set(id, made)
    return made
  }

  /** Removes the record of an agent. */
  forget(id) {
    this.#records.delete(id)
  }
}

const turnKey = (agentId, turn) => `${agentId}:${turn}`

/** Per-turn records, keyed by `${agentId}:${turn}`; deleted on turn/end. */
export class Turns {
  #records = new Map()

  /** The record of one turn of one agent; undefined before the first step or after turn/end. */
  turnOf(agentId, turn) {
    return this.#records.get(turnKey(agentId, turn))
  }

  /** Stores the record of one turn (a copy, so the caller cannot leak it later). */
  setTurn(agentId, turn, state) {
    this.#records.set(turnKey(agentId, turn), {
      status: [...(state?.status ?? [])],
      unsha: [...(state?.unsha ?? [])],
      blocks: state?.blocks ?? 0,
    })
  }

  /** Deletes the record of one turn. */
  endTurn(agentId, turn) {
    this.#records.delete(turnKey(agentId, turn))
  }

  /** Deletes every turn record of an agent (agent/disposed). */
  forgetAgent(agentId) {
    const prefix = `${agentId}:`
    for (const key of this.#records.keys()) {
      if (key.startsWith(prefix)) this.#records.delete(key)
    }
  }
}

/**
 * The bypass of a root: `repo` (persisted in Repos, wins), `session` (in
 * memory), or null (guards on).
 */
export class Bypass {
  #session = new Set()

  constructor(repos) {
    this.repos = repos
  }

  /** The bypass state: repo > session > null. */
  async get(root) {
    if (await this.repos.isOff(root)) return 'repo'
    return this.#session.has(root) ? 'session' : null
  }

  /** Sets the session bypass, or the persisted repository bypass. */
  async set(root, value) {
    if (value === 'repo') await this.repos.setOff(root, true)
    else if (value === 'session') this.#session.add(root)
    else throw new TypeError(`measure-guard: unknown bypass "${String(value)}"`)
  }

  /** Clears the session bypass, and with `repo` also the persisted one. */
  async clear(root, scope) {
    this.#session.delete(root)
    if (scope === 'repo') await this.repos.setOff(root, false)
  }
}

/** The four state classes wired together for one plugin instance. */
export function createState(options = {}) {
  const repos = new Repos(options)
  return {
    repos,
    agents: new Agents(),
    turns: new Turns(),
    bypass: new Bypass(repos),
  }
}

/**
 * The local equivalent of `createUserMessage` (design §2): a deep clone of the
 * input, `role: 'user'`, a fresh id, and deep-frozen so a shared message cannot
 * be mutated by a later listener.
 */
export function newUserMessage(input) {
  if (typeof input !== 'object' || input === null) throw new TypeError('measure-guard: newUserMessage needs an object')
  if (!Array.isArray(input.content)) throw new TypeError('measure-guard: newUserMessage content must be an array')
  const cloned = structuredClone(input)
  return deepFreeze({ ...cloned, role: 'user', id: randomUUID() })
}

/**
 * The `mode` config value: `advise`, `guard`, or `strict`; unset reads as
 * `guard`, and an unknown value logs one warning through `log` and reads as
 * `guard` (design §2). `log` defaults to a no-op so tests stay quiet. Both the
 * plugin config object and a raw value are accepted, so `apply` can pass
 * `config?.mode`.
 */
export function parseModeOf(config, log = () => {}) {
  const value = typeof config === 'string' ? config : config?.mode
  if (value === undefined || value === null) return 'guard'
  if (MODES.includes(value)) return value
  log(`measure-guard: unknown mode "${String(value)}"; using "guard".`)
  return 'guard'
}
