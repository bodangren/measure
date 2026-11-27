// FR-4, FR-5, FR-8: the column rules, the card, the column view, and the rail
// badge. Pure functions over the registry entry and the parsed plan.
import {
  hasTaskId,
  isOpen,
  taskLabel,
  tasksOf,
} from './parse'
import type { DoneSource } from './registry'
import type { Marker, Plan, Task } from './types'

export type Column = 'planned' | 'in-progress' | 'blocked' | 'waiting' | 'done'

/** The column order of FR-8 at every width. */
export const COLUMNS: readonly Column[] = ['planned', 'in-progress', 'blocked', 'waiting', 'done']

export const COLUMN_LABELS: Readonly<Record<Column, string>> = {
  planned: 'Planned',
  'in-progress': 'In progress',
  blocked: 'Waits for PM',
  waiting: 'Waits for Daniel',
  done: 'Done',
}

export const COLUMN_CAP = 8
export const DONE_SHOWN = 5
export const DONE_WINDOW_DAYS = 14

const DAY_MS = 86_400_000
const STALE_DAYS = 30
const DASH = ' \u2014 '

export type CardPosition = { phase: number; phases: number; task: number; tasks: number }

/** FR-11: the one state of an open card. Done cards carry state `done`. */
export type CardState = 'waits-daniel' | 'running' | 'waits-pm' | 'next' | 'done'

export type Card = {
  repo: string
  title: string
  /** The folder name of the track; empty when the folder is unknown. */
  trackId: string
  column: Column
  state: CardState
  /** FR-11: the one reason line shown on the card; null for Done. */
  reason: string | null
  position: CardPosition | null
  marker: Marker | null
  taskText: string | null
  /** The position slot text when `position` is null; null for Done. */
  note: string | null
  line: string | null
  registered: boolean
  /** The last file change in milliseconds, or null when unknown. */
  lastChange: number | null
  doneDate: string | null
  doneSource: DoneSource | null
  /** D2: true only for a Done track under `archive/`. */
  archived: boolean
}

export type PlanState = { kind: 'plan'; plan: Plan } | { kind: 'missing' } | { kind: 'unreadable' }

export type TrackInput = {
  repo: string
  title: string
  /** null: no registry entry names the folder. */
  registryMarker: Marker | null
  folder: string | null
  plan: PlanState
  lastChange: number | null
  doneDate: string | null
  doneSource: DoneSource | null
  /** The status note of a track under the "Shelved" heading of tracks.md. */
  shelved?: string | null
  /** The time of the load in milliseconds. */
  now: number
}

export type RepoBoard = { repo: string; cards: readonly Card[] }

export type ColumnView = {
  column: Column
  label: string
  total: number
  shown: readonly Card[]
  hidden: number
  stale: readonly Card[]
  staleOpen: boolean
}

export type DoneSummary = {
  shown: readonly Card[]
  more: number
  archived: number
  notArchived: number
}

/** FR-10: one gate and the owner words that name it. */
const GATE_WORDS: ReadonlyArray<{ gate: string; words: readonly string[] }> = [
  { gate: 'deletion', words: ['delete', 'deletion'] },
  { gate: 'paid spend', words: ['paid', 'spend'] },
  { gate: 'deploy', words: ['deploy', 'traffic'] },
  { gate: 'public date', words: ['public'] },
  { gate: 'sudo or login', words: ['sudo', 'login'] },
  { gate: 'proof', words: ['proof'] },
  { gate: 'Thai check', words: ['thai'] },
  { gate: 'look', words: ['look', 'manual'] },
]

/**
 * FR-10: the gate of an owner token. The token is lowercased and split on
 * `-`, `_`, `.`, and `;`. A whole word matches. The first gate in GATE_WORDS
 * wins when the token holds more than one gate word.
 */
export const gateForOwner = (owner: string | null): string | null => {
  if (owner === null || owner === '') return null
  const words = owner.toLowerCase().split(/[-_.;]+/).filter(word => word !== '')
  for (const entry of GATE_WORDS) {
    if (words.some(word => entry.words.includes(word))) return entry.gate
  }
  return null
}

/** FR-11 a0: a verification task that the PM closed without a visible change. */
const isClosedVerification = (text: string): boolean =>
  /user manual verification/i.test(text) && /deferred|no visible change/i.test(text)

const FIRST_NOT_DONE = (task: Task): boolean => task.marker !== 'x'

const lastDoneIndex = (tasks: readonly Task[]): number => {
  let out = -1
  tasks.forEach((task, index) => {
    if (task.marker === 'x') out = index
  })
  return out
}

/**
 * FR-4: the current task. The first `[~]` task wins. Otherwise it is the first
 * open `[ ]` task that is ahead of the last done task. A skipped task never
 * names the current task; an open `[b]` task is a blocker, not the current
 * task, so rule R3a can win over it.
 */
export const currentIndex = (tasks: readonly Task[]): number | null => {
  const tilde = tasks.findIndex(task => task.marker === '~')
  if (tilde >= 0) return tilde
  const lastDone = lastDoneIndex(tasks)
  for (let index = lastDone + 1; index < tasks.length; index += 1) {
    if ((tasks[index]?.marker ?? 'x') === ' ') return index
  }
  return null
}

const positionOf = (plan: Plan, index: number): CardPosition => {
  let seen = 0
  for (let phase = 0; phase < plan.phases.length; phase += 1) {
    const count = plan.phases[phase]?.tasks.length ?? 0
    if (index < seen + count) {
      return { phase: phase + 1, phases: plan.phases.length, task: index - seen + 1, tasks: count }
    }
    seen += count
  }
  return { phase: 1, phases: plan.phases.length, task: 1, tasks: 1 }
}

/**
 * FR-4: the note of a card with no current task. It is `All tasks closed.`
 * when no task is open. It counts the open tasks otherwise.
 */
const noteOf = (tasks: readonly Task[]): string => {
  const open = tasks.filter(isOpen).length
  if (open === 0) return 'All tasks closed.'
  return open === 1
    ? '1 open task, no current task.'
    : `${open} open tasks, no current task.`
}

const trackIdOf = (folder: string | null): string =>
  folder === null ? '' : (folder.split('/').pop() ?? '')

const r2Card = (
  base: { repo: string; title: string; trackId: string; registered: boolean; lastChange: number | null },
  marker: Marker | null,
  plan: PlanState,
): Card => {
  const note = plan.kind === 'unreadable' ? 'Plan unreadable' : 'No plan.'
  const reasonNote = note.endsWith('.') ? note : `${note}.`
  const registryBlocked = marker === 'b'
  const column: Column = registryBlocked ? 'blocked' : marker === '~' ? 'in-progress' : 'planned'
  return {
    ...base,
    column,
    state: registryBlocked ? 'waits-pm' : 'next',
    reason: registryBlocked ? 'Waits for PM: registry marker [b]' : `Next in line: ${reasonNote}`,
    position: null,
    marker: null,
    taskText: null,
    note,
    line: registryBlocked ? 'Registry marker [b].' : null,
    doneDate: null,
    doneSource: null,
    archived: false,
  }
}

/** FR-4 and FR-5: the column and the card of one track. */
export const classifyTrack = (input: TrackInput): Card => {
  const folder = input.folder
  const base = {
    repo: input.repo,
    title: input.title,
    trackId: trackIdOf(folder),
    registered: input.registryMarker !== null,
    lastChange: input.lastChange,
  }

  const done = input.registryMarker === 'x' || (folder !== null && folder.startsWith('archive/'))
  if (done) {
    return {
      ...base,
      column: 'done',
      state: 'done',
      reason: null,
      position: null,
      marker: null,
      taskText: null,
      note: null,
      line: null,
      doneDate: input.doneDate,
      doneSource: input.doneSource,
      archived: folder !== null && folder.startsWith('archive/'),
    }
  }

  // A shelved track is planned work: never In progress, never Done, never a wait.
  if (input.shelved) {
    return {
      ...base,
      column: 'planned',
      state: 'next',
      reason: `Shelved: ${input.shelved}`,
      position: null,
      marker: null,
      taskText: null,
      note: null,
      line: null,
      doneDate: null,
      doneSource: null,
      archived: false,
    }
  }

  if (input.plan.kind !== 'plan') return r2Card(base, input.registryMarker, input.plan)

  const plan = input.plan.plan
  const tasks = tasksOf(plan)
  if (tasks.length === 0) return r2Card(base, input.registryMarker, input.plan)

  const index = currentIndex(tasks)
  const current = index === null ? null : (tasks[index] ?? null)
  const position = index === null ? null : positionOf(plan, index)
  const marker = current?.marker ?? null
  const taskText = current === null ? null : taskLabel(current.text)
  const note = position === null ? noteOf(tasks) : null
  const noteText = note ?? noteOf(tasks)
  // FR-11 d: the count note belongs to a card with no current task. A card
  // with a current task names that task instead.
  const nextLabel = current === null ? noteText : taskLabel(current.text)
  const empty = { doneDate: null, doneSource: null, archived: false }
  const first = tasks.find(FIRST_NOT_DONE) ?? null

  const cardOf = (
    column: Column,
    state: CardState,
    reason: string | null,
    line: string | null,
  ): Card => ({
    ...base,
    ...empty,
    column,
    state,
    reason,
    position,
    marker,
    taskText,
    note,
    line,
  })

  // FR-11 a0: a verification task closed by the PM wins over every other rule.
  if (first !== null && isClosedVerification(first.text)) {
    return cardOf('blocked', 'waits-pm', `Waits for PM: ${taskLabel(first.text)}`, first.text)
  }

  // FR-11 a: the first not-done task is a [b] line with a four-gate owner
  // (thai, spend, deletion, or public) and a Task id. Nothing else makes a
  // Daniel card.
  if (first !== null && first.marker === 'b') {
    const gate = gateForOwner(first.deferredOwner)
    const danielGate =
      gate === 'deletion' || gate === 'paid spend' || gate === 'public date' || gate === 'Thai check'
    if (danielGate && hasTaskId(first.text)) {
      return cardOf(
        'waiting',
        'waits-daniel',
        `Waits for Daniel: ${gate}${DASH}${taskLabel(first.text)}`,
        first.text,
      )
    }
    if (danielGate) {
      return cardOf(
        'blocked',
        'waits-pm',
        'Waits for PM: gate without a Task: open the Task or decide it',
        first.text,
      )
    }
  }

  // FR-11 b: a task is [~].
  if (current !== null && current.marker === '~') {
    return cardOf('in-progress', 'running', `Running: ${taskLabel(current.text)}`, null)
  }

  // FR-11 c: another [b] owner, a registry marker [b], or all tasks closed.
  if (first !== null && first.marker === 'b') {
    return cardOf('blocked', 'waits-pm', `Waits for PM: ${taskLabel(first.text)}`, first.text)
  }
  if (input.registryMarker === 'b') {
    return cardOf(
      'blocked',
      'waits-pm',
      'Waits for PM: registry marker [b]',
      'Registry marker [b].',
    )
  }
  if (current === null && noteText === 'All tasks closed.') {
    return cardOf('blocked', 'waits-pm', 'Waits for PM: All tasks closed.', null)
  }

  // FR-11 d: every other open track needs no input.
  const progressed = input.registryMarker === '~' || tasks.some(task => task.marker === 'x')
  const column: Column = progressed ? 'in-progress' : 'planned'
  return cardOf(column, 'next', `Next in line: ${nextLabel}`, null)
}

/** The board of one repo, in the card order of FR-2. */
export const buildBoard = (repo: string, inputs: readonly TrackInput[]): RepoBoard => ({
  repo,
  cards: inputs.map(classifyTrack),
})

/** FR-13: the BLOCKER, GATE, and MANUAL CHECK labels are gone. */
export const cardLabel = (_card: Card): null => null

const sortCards = (cards: readonly Card[]): Card[] =>
  [...cards].sort((one, two) => {
    if (one.lastChange === null && two.lastChange === null) return 0
    if (one.lastChange === null) return 1
    if (two.lastChange === null) return -1
    return two.lastChange - one.lastChange
  })

/**
 * FR-8: the cards of one column. The newest card comes first and an unknown
 * change comes last. The cap of 8 applies to the cards that are not stale.
 * The Done column ignores `expanded` and the stale group.
 */
export const columnView = (
  board: RepoBoard,
  column: Column,
  expanded: boolean,
  staleOpen: boolean,
  now: number,
): ColumnView => {
  const cards = board.cards.filter(card => card.column === column)
  const label = COLUMN_LABELS[column]
  const total = cards.length
  const sorted = sortCards(cards)

  if (column === 'done') {
    return { column, label, total, shown: sorted, hidden: 0, stale: [], staleOpen: false }
  }

  const staleCards =
    column === 'planned' || column === 'in-progress'
      ? sorted.filter(
          card => card.lastChange !== null && now - card.lastChange > STALE_DAYS * DAY_MS,
        )
      : []
  const fresh = sorted.filter(card => !staleCards.includes(card))
  const shown = expanded ? fresh : fresh.slice(0, COLUMN_CAP)
  return {
    column,
    label,
    total,
    shown,
    hidden: fresh.length - shown.length,
    stale: staleCards,
    staleOpen: staleCards.length > 0 ? staleOpen : false,
  }
}

/** The closed date of a Done card: the last change, else the done date at UTC midnight. */
const closedTime = (card: Card): number | null => {
  if (card.lastChange !== null) return card.lastChange
  if (card.doneDate === null) return null
  const time = Date.parse(`${card.doneDate}T00:00:00Z`)
  return Number.isNaN(time) ? null : time
}

/** FR-16 D2: the closed 5-card group of the Done column and its counts. */
export const doneSummary = (board: RepoBoard, now: number): DoneSummary => {
  const done = board.cards.filter(card => card.column === 'done')
  const closed = done
    .map(card => ({ card, time: closedTime(card) }))
    .filter(
      (one): one is { card: Card; time: number } =>
        one.time !== null && now - one.time <= DONE_WINDOW_DAYS * DAY_MS,
    )
  closed.sort((one, two) => two.time - one.time)
  const shown = closed.slice(0, DONE_SHOWN).map(one => one.card)
  return {
    shown,
    more: done.length - shown.length,
    archived: done.filter(card => card.archived).length,
    notArchived: done.filter(card => !card.archived).length,
  }
}

/** FR-15: the rail badge counts the Waits for Daniel cards of all boards. */
export const blockedTracks = (boards: readonly RepoBoard[]): number =>
  boards.reduce(
    (sum, board) => sum + board.cards.filter(card => card.column === 'waiting').length,
    0,
  )
