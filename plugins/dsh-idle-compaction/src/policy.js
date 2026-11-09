// The pure policy of dsh-idle-compaction: activity classification, the session
// scan, and the idle gate. This module has no Harness dependency and no I/O, so
// the node suite proves every decision without a running Cordis context. The
// Host glue in ../index.js owns the timer, the agent binding, and the backend
// call; nothing here may import a `@deepseek-ai/*` package (the plugin is
// loaded from a profile path, whose resolver has no package dependencies).
//
// Contract (pinned by the README and the tests):
//
//   createState(agent, events)      -> IdleState
//   isActivityEvent(event)          -> boolean
//   isSuccessfulCompactionEnd(event)-> boolean
//   observe(state, event)           -> void
//   compactGate(state, GATE)        -> boolean
//   parseSettings(config)           -> Settings
//
// IdleState:
//   { agent, lastActivitySeq, lastActivityAt, lastCompactionEndSeq,
//     lastAttemptAt, controller }
//   * lastActivitySeq is -1 before any activity; lastActivityAt is the event
//     time in Unix epoch milliseconds (null before any activity).
//   * lastCompactionEndSeq is -1 before a successful compaction end.
//   * lastAttemptAt is 0 before the first compaction attempt this process made.
//   * controller is null unless a compaction is in flight for this session.

/** The compaction transaction's events; none of them is session activity. */
export const COMPACTION_EVENT_TYPES = [
  'compaction/start',
  'compaction/summary',
  'compaction/end',
  'compaction/prune',
]

const COMPACTION_TYPES = new Set(COMPACTION_EVENT_TYPES)

const DEFAULTS = {
  enabled: true,
  idleMinutes: 55,
  checkSeconds: 60,
  includeSubagents: false,
}

const SETTING_NAMES = new Set(Object.keys(DEFAULTS))

const MINUTE_MS = 60_000

const messageOf = error => (error instanceof Error ? error.message : String(error))

/** Read the optional object config; an absent config means every default. */
const configObject = config => {
  if (config === undefined || config === null) return {}
  if (typeof config !== 'object' || Array.isArray(config)) {
    throw new Error(`dsh-idle-compaction: config must be an object, got ${typeof config}`)
  }
  return config
}

const positiveFinite = (name, value) => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    throw new Error(`dsh-idle-compaction: ${name} must be a positive number, got ${String(value)}`)
  }
  return value
}

const booleanValue = (name, value) => {
  if (typeof value !== 'boolean') {
    throw new Error(`dsh-idle-compaction: ${name} must be true or false, got ${String(value)}`)
  }
  return value
}

/**
 * Whether one committed event counts as session activity. Compaction machinery,
 * the checkpoint replacement, the seed boundary, and ignorable plugin records
 * are bookkeeping, not conversation work.
 * @param {object} event - committed session event.
 * @returns {boolean} true for conversation work.
 */
export function isActivityEvent(event) {
  if (event === null || typeof event !== 'object') return false
  if (event.ignorable === true) return false
  if (COMPACTION_TYPES.has(event.type)) return false
  if (event.type === 'session/end-seed') return false
  if (event.surfaceOp !== null && typeof event.surfaceOp === 'object') return false
  return true
}

/**
 * Whether one committed event is a successful compaction's closing marker. A
 * failed attempt carries `error`, so it never closes the idle window.
 * @param {object} event - committed session event.
 * @returns {boolean} true when the event is `compaction/end` without an error.
 */
export function isSuccessfulCompactionEnd(event) {
  if (event === null || typeof event !== 'object' || event.type !== 'compaction/end') return false
  const data = event.data
  return data === undefined || data === null || data.error === undefined || data.error === null
}

/**
 * Build the per-session watcher state from an agent and its committed events.
 * @param {object} agent - live agent handle.
 * @param {readonly object[]} events - committed session events, log order.
 * @returns {{ agent: object, lastActivitySeq: number, lastActivityAt: number|null, lastCompactionEndSeq: number, lastAttemptAt: number, controller: object|null }}
 */
export function createState(agent, events) {
  const state = {
    agent,
    lastActivitySeq: -1,
    lastActivityAt: null,
    lastCompactionEndSeq: -1,
    lastAttemptAt: 0,
    controller: null,
  }
  if (Array.isArray(events) || (events !== null && typeof events?.length === 'number')) {
    for (const event of events) observe(state, event)
  }
  return state
}

/**
 * Fold one committed event into the state: an activity event advances the idle
 * clock, a successful compaction end records the window's closing seq.
 * @param {object} state - mutable watcher state.
 * @param {object} event - committed session event.
 * @returns {void}
 */
export function observe(state, event) {
  if (event === null || typeof event !== 'object') return
  if (isActivityEvent(event)) {
    state.lastActivitySeq = event.seq
    state.lastActivityAt = event.time
    return
  }
  if (isSuccessfulCompactionEnd(event)) {
    state.lastCompactionEndSeq = Math.max(state.lastCompactionEndSeq, event.seq)
  }
}

/**
 * Decide whether the gate is open for one session now.
 * @param {object} state - watcher state.
 * @param {{ idleMs: number, now: number, status: string }} gate - window, clock, agent status.
 * @returns {boolean} true only when the one compaction for this idle window may run.
 */
export function compactGate(state, gate) {
  if (state === null || typeof state !== 'object') return false
  if (state.controller !== null && state.controller !== undefined) return false
  if (gate?.status !== 'idle') return false
  if (state.lastActivityAt === null || state.lastActivityAt === undefined) return false
  if (state.lastActivitySeq <= state.lastCompactionEndSeq) return false
  const since = Math.max(state.lastActivityAt, state.lastAttemptAt)
  return gate.now - since >= gate.idleMs
}

/**
 * Validate and normalize the row config.
 * @param {object|undefined} config - the row's config object.
 * @returns {{ enabled: boolean, idleMinutes: number, checkSeconds: number, includeSubagents: boolean, idleMs: number, pollMs: number }}
 * @throws {Error} for an unknown key or an invalid value.
 */
export function parseSettings(config) {
  const source = configObject(config)
  for (const key of Object.keys(source)) {
    if (!SETTING_NAMES.has(key)) {
      throw new Error(`dsh-idle-compaction: unknown setting '${key}'`)
    }
  }
  const enabled = source.enabled === undefined ? DEFAULTS.enabled : booleanValue('enabled', source.enabled)
  const idleMinutes =
    source.idleMinutes === undefined ? DEFAULTS.idleMinutes : positiveFinite('idleMinutes', source.idleMinutes)
  const checkSeconds =
    source.checkSeconds === undefined ? DEFAULTS.checkSeconds : positiveFinite('checkSeconds', source.checkSeconds)
  const includeSubagents =
    source.includeSubagents === undefined
      ? DEFAULTS.includeSubagents
      : booleanValue('includeSubagents', source.includeSubagents)
  if (idleMinutes * MINUTE_MS <= 0 || checkSeconds * 1_000 <= 0) {
    throw new Error('dsh-idle-compaction: idleMinutes and checkSeconds must be positive')
  }
  return {
    enabled,
    idleMinutes,
    checkSeconds,
    includeSubagents,
    idleMs: idleMinutes * MINUTE_MS,
    pollMs: checkSeconds * 1_000,
  }
}

/** Report one error as text without a stack, for a one-line Host log. */
export function describeError(error) {
  return messageOf(error)
}
