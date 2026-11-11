// The band line for the Work Status section and the status view model the
// rail panel and full page render. Pure functions over a Snapshot.
import {
  blockedCount,
  currentTask,
  isOpen,
  nextTask,
  position,
  tasksOf,
} from './parse'
import type { Phase, Plan, Snapshot, Task, TrackEntry } from './types'

/**
 * The band text: `Measure · <track> · Phase p/P · Task t/T [<marker>] <task>`,
 * the `[b]` count, and a warning when 2 or more tracks have `[~]`. Variants
 * for a parse error (the panel shows the error on a second line), no active
 * track, no `[~]` task, and a plan with all tasks closed. Null when the
 * project has no measure/ folder.
 */
export const bandLine = (snapshot: Snapshot): string | null => {
  if (!snapshot.hasMeasure) return null
  if (snapshot.parseError !== null) {
    return 'Measure · cannot read the Measure files'
  }
  const parts = ['Measure']
  const { active } = snapshot
  if (active === null) {
    parts.push('no track in progress')
  } else {
    parts.push(active.entry.name)
    const at = position(active.plan)
    if (at.current === null) {
      parts.push('all tasks closed')
    } else {
      parts.push(`Phase ${at.phase}/${at.phases}`, `Task ${at.task}/${at.tasks} [${at.current.marker}] ${at.current.text}`)
      if (at.current.marker !== '~') parts.push('no task in progress')
    }
    const blocked = blockedCount(active.plan)
    if (blocked > 0) parts.push(`[b] ${blocked}`)
  }
  if (snapshot.inProgressCount >= 2) parts.push(`${snapshot.inProgressCount} tracks in progress`)
  return parts.join(' · ')
}

/** The marker span for the band: gives the line its colour and badge tone. */
export const markerTone = (marker: Task['marker']): 'primary' | 'success' | 'warning' | 'neutral' | 'error' => {
  if (marker === '~') return 'primary'
  if (marker === 'x') return 'success'
  if (marker === 'b') return 'warning'
  return 'neutral'
}

/** The CSS class for the marker span in the band: `marker-<tone>`. */
export const markerClassName = (marker: Task['marker']): string => `marker-${markerTone(marker)}`

/** Renders the marker `[~]` etc. for a track or a task. */
export const markerText = (marker: Task['marker']): string => `[${marker === ' ' ? ' ' : marker}]`

/** The active track id, or null when there is no active track. */
export const activeId = (snapshot: Snapshot): string | null => snapshot.active?.entry.id ?? null

/** The count of `[b]` tasks in the active plan, 0 when there is no active plan. */
export const blockedCountOfActivePlan = (snapshot: Snapshot): number => {
  if (snapshot.active === null) return 0
  return blockedCount(snapshot.active.plan)
}

/**
 * The view model the rail panel and full page render: a track list with the
 * active one marked, the active plan path, the phases of the active plan with
 * their closed counts and checkpoints, and the `[b]` tasks of the plan.
 */
export type StatusView = {
  tracks: TrackRow[]
  activePlanPath: string | null
  phases: PhaseRow[]
  blockedTasks: BlockedRow[]
}

export type TrackRow = {
  id: string
  marker: TrackEntry['marker']
  name: string
  folder: string
  active: boolean
}

export type PhaseRow = {
  index: number
  title: string
  checkpoint: string | null
  closed: number
  total: number
  /** When the phase is the current `[~]` phase, the row carries the task link. */
  current: { line: number; text: string; marker: Task['marker'] } | null
}

export type BlockedRow = {
  text: string
  deferredOwner: string | null
}

/** True when `marker` is `[~]` or the first open task that is not `[~]`. */
const closed = (task: Task): boolean => !isOpen(task)

/** Build the view model from a snapshot. Returns a null shape on empty states. */
export const statusView = (snapshot: Snapshot): StatusView => {
  const tracks: TrackRow[] = snapshot.tracks.map(track => ({
    id: track.id,
    marker: track.marker,
    name: track.name,
    folder: track.folder,
    active: track.id === activeId(snapshot),
  }))
  if (snapshot.active === null) {
    return { tracks, activePlanPath: null, phases: [], blockedTasks: [] }
  }
  const { active } = snapshot
  const phases: PhaseRow[] = active.plan.phases.map((phase, index) => phaseRow(phase, index, active.plan))
  const blockedTasks: BlockedRow[] = tasksOf(active.plan)
    .filter(task => task.marker === 'b')
    .map(task => ({ text: task.text, deferredOwner: task.deferredOwner }))
  return { tracks, activePlanPath: active.planPath, phases, blockedTasks }
}

const phaseRow = (phase: Phase, index: number, plan: Plan): PhaseRow => {
  const total = phase.tasks.length
  const finished = phase.tasks.filter(closed).length
  const currentTaskEntry = currentTask(plan)
  const here = currentTaskEntry !== null && phase.tasks.some(task => task.line === currentTaskEntry.line)
  return {
    index,
    title: phase.title,
    checkpoint: phase.checkpoint,
    closed: finished,
    total,
    current: here && currentTaskEntry !== null
      ? { line: currentTaskEntry.line, text: currentTaskEntry.text, marker: currentTaskEntry.marker }
      : null,
  }
}

/** The text the rail panel writes to the clipboard: the band line plus extras. */
export const copyText = (snapshot: Snapshot): string => {
  const lines: string[] = []
  const band = bandLine(snapshot)
  if (band !== null) lines.push(band)
  if (snapshot.parseError !== null) lines.push(snapshot.parseError)
  const view = statusView(snapshot)
  if (view.tracks.length > 0) {
    lines.push('')
    lines.push('Tracks:')
    for (const track of view.tracks) {
      const tag = track.active ? ' (active)' : ''
      lines.push(`  [${track.marker}] ${track.name} (${track.folder})${tag}`)
    }
  }
  if (snapshot.active !== null) {
    lines.push('')
    lines.push(`Active plan: ${snapshot.active.planPath}`)
    for (const phase of view.phases) {
      const checkpoint = phase.checkpoint === null ? '' : ` · checkpoint ${phase.checkpoint}`
      lines.push(`  ${phase.title} · ${phase.closed}/${phase.total} closed${checkpoint}`)
    }
    const blocked = tasksOf(snapshot.active.plan).filter(task => task.marker === 'b')
    if (blocked.length > 0) {
      lines.push('')
      lines.push('Blocked tasks ([b]):')
      for (const task of blocked) {
        const owner = task.deferredOwner === null ? ' (open: no deferred:<owner>)' : ''
        lines.push(`  [b] ${task.text}${owner}`)
      }
    }
  }
  return lines.join('\n')
}

/** True when the active plan has no `[~]` task (the band line says `no task in progress`). */
export const needsCurrentTaskBanner = (snapshot: Snapshot): boolean => {
  if (snapshot.active === null) return false
  return currentTask(snapshot.active.plan) === null
}

/** The next open task, or null when the plan has no pending task. */
export const nextPendingText = (snapshot: Snapshot): string | null => {
  if (snapshot.active === null) return null
  const task = nextTask(snapshot.active.plan)
  return task?.text ?? null
}