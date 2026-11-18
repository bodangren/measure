// The band line for the Work Status section. Pure functions over a Snapshot.
// The board has its own renderer; the band keeps the status surface of FR-9.
import { blockedCount, position } from './parse'
import type { Snapshot, Task } from './types'

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
