// FR-4, FR-5, FR-8: the column rules, the card, the column view, and the rail
// badge. Pure functions over the registry entry and the parsed plan.
import {
  isGateText,
  isOpen,
  ownerToken,
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
  blocked: 'Blocked',
  waiting: 'Waiting on Daniel',
  done: 'Done',
}

export const COLUMN_CAP = 8
export const DONE_SHOWN = 5
export const DONE_WINDOW_DAYS = 14

const DAY_MS = 86_400_000
const STALE_DAYS = 30

export type CardPosition = { phase: number; phases: number; task: number; tasks: number }

export type Card = {
  repo: string
  title: string
  /** The folder name of the track; empty when the folder is unknown. */
  trackId: string
  column: Column
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

const DANIEL_TOKENS = new Set([
  'daniel',
  'user',
  'owner',
  'po',
  'product-owner',
  'human',
  'human-gated',
  'both-owners',
])

const isDanielToken = (token: string | null): boolean => {
  if (token === null) return false
  const lower = token.toLowerCase()
  return DANIEL_TOKENS.has(lower) || lower.startsWith('owner-') || lower.startsWith('daniel-')
}

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

/** FR-15 C1: rule R3a applies only when the Updated age is 14 days or less. */
const gateAgeOk = (lastChange: number | null, now: number): boolean =>
  lastChange !== null && now - lastChange <= DONE_WINDOW_DAYS * DAY_MS

const trackIdOf = (folder: string | null): string =>
  folder === null ? '' : (folder.split('/').pop() ?? '')

const r2Card = (
  base: { repo: string; title: string; trackId: string; registered: boolean; lastChange: number | null },
  marker: Marker | null,
  plan: PlanState,
): Card => {
  const note = plan.kind === 'unreadable' ? 'Plan unreadable' : 'No plan.'
  const column: Column = marker === 'b' ? 'blocked' : marker === '~' ? 'in-progress' : 'planned'
  return {
    ...base,
    column,
    position: null,
    marker: null,
    taskText: null,
    note,
    line: column === 'blocked' ? 'Registry marker [b].' : null,
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
  const empty = { doneDate: null, doneSource: null, archived: false }

  if (current !== null && isGateText(current.text) && gateAgeOk(input.lastChange, input.now)) {
    return {
      ...base,
      ...empty,
      column: 'waiting',
      position,
      marker,
      taskText,
      note: null,
      line: current.text,
    }
  }

  const openBlocker = tasks.find(task => task.marker === 'b' && isOpen(task))
  if (openBlocker !== undefined) {
    return {
      ...base,
      ...empty,
      column: 'blocked',
      position,
      marker,
      taskText,
      note,
      line: openBlocker.text,
    }
  }

  if (current !== null && current.marker === '~') {
    return {
      ...base,
      ...empty,
      column: 'in-progress',
      position,
      marker,
      taskText,
      note: null,
      line: null,
    }
  }

  if (current !== null) {
    const blocked = input.registryMarker === 'b'
    const progressed =
      input.registryMarker === '~' || tasks.some(task => task.marker === 'x')
    const column: Column = blocked ? 'blocked' : progressed ? 'in-progress' : 'planned'
    return {
      ...base,
      ...empty,
      column,
      position,
      marker,
      taskText,
      note: null,
      line: blocked ? 'Registry marker [b].' : null,
    }
  }

  const danielBlocker = tasks.find(
    task => task.marker === 'b' && isDanielToken(ownerToken(task.text)),
  )
  if (danielBlocker !== undefined) {
    return {
      ...base,
      ...empty,
      column: 'waiting',
      position: null,
      marker: null,
      taskText: null,
      note,
      line: danielBlocker.text,
    }
  }

  const otherBlocker = tasks.find(task => task.marker === 'b')
  if (otherBlocker !== undefined) {
    return {
      ...base,
      ...empty,
      column: 'blocked',
      position: null,
      marker: null,
      taskText: null,
      note,
      line: otherBlocker.text,
    }
  }

  return {
    ...base,
    ...empty,
    column: 'in-progress',
    position: null,
    marker: null,
    taskText: null,
    note,
    line: null,
  }
}

/** The board of one repo, in the card order of FR-2. */
export const buildBoard = (repo: string, inputs: readonly TrackInput[]): RepoBoard => ({
  repo,
  cards: inputs.map(classifyTrack),
})

/** FR-5 and FR-15 C1: the label of a blocked or waiting card. */
export const cardLabel = (card: Card): 'BLOCKER' | 'MANUAL CHECK' | 'GATE' | null => {
  if (card.column === 'blocked') return 'BLOCKER'
  if (card.column !== 'waiting') return null
  return card.line !== null && card.line.includes('User Manual Verification')
    ? 'MANUAL CHECK'
    : 'GATE'
}

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

/** FR-9: the Blocked tracks of all loaded boards. */
export const blockedTracks = (boards: readonly RepoBoard[]): number =>
  boards.reduce(
    (sum, board) => sum + board.cards.filter(card => card.column === 'blocked').length,
    0,
  )
