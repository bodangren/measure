// Pure parse functions over the text of the Measure files. No host calls, so
// the tests call them directly.
import type { Marker, Phase, Plan, Position, Task, TrackEntry } from './types'

const TRACK_BOLD = /^- \[([ ~xb])\] \*\*Track: (.+?)\*\*/
const TRACK_LINKED = /^- \[([ ~xb])\] \[([^\]]+)\]\(([^)\s]+)\)/
const LINK_LINE = /\*Link: \[[^\]]*\]\(([^)\s]+)\)\*/
const ENTRY = /^- \[[ ~xb]\] /
const MD_LINK = /\]\(([^)\s]+)\)/

const PHASE = /^## Phase\b/
const SECTION = /^#{1,2} /
const TASK = /^- \[([ ~xb])\] (.*)$/
const SHA = /(?:^|\s)`?([0-9a-f]{7})`?\s*$/
const CHECKPOINT = /\s*\[checkpoint: ([0-9a-f]{7,40})\]/
const DEFERRED = /\bdeferred:([^\s`]+)/

/** Joins path parts and resolves `.` and `..` segments. */
export const joinPath = (...parts: string[]): string => {
  const out: string[] = []
  for (const segment of parts.join('/').split('/')) {
    if (segment === '' || segment === '.') continue
    if (segment === '..') out.pop()
    else out.push(segment)
  }
  return (parts[0]?.startsWith('/') ? '/' : '') + out.join('/')
}

/** The folder part of a path. */
export const dirname = (path: string): string => joinPath(path, '..')

/** The target of the first markdown link on a line that matches `label`. */
export const findLink = (md: string, label: RegExp): string | null => {
  for (const line of md.split('\n')) {
    if (!label.test(line)) continue
    const link = MD_LINK.exec(line)
    if (link) return link[1] ?? null
  }
  return null
}

/** `./tracks/<id>/` or `archive/<id>/index.md` as `tracks/<id>`, `archive/<id>`. */
const folderOf = (target: string): string => joinPath(target.replace(/\/index\.md$/, ''))

const entryOf = (line: number, marker: string, name: string, target: string): TrackEntry => {
  const folder = folderOf(target)
  return { line, marker: marker as Marker, name: name.trim(), id: folder.split('/').pop() ?? folder, folder }
}

/** All entries of tracks.md, in both entry formats, in file order. */
export const parseTracks = (md: string): TrackEntry[] => {
  const lines = md.split('\n')
  const tracks: TrackEntry[] = []
  lines.forEach((line, i) => {
    const bold = TRACK_BOLD.exec(line)
    if (bold) {
      for (const next of lines.slice(i + 1, i + 4)) {
        if (ENTRY.test(next)) break
        const link = LINK_LINE.exec(next)
        if (link) {
          tracks.push(entryOf(i, bold[1] ?? ' ', bold[2] ?? '', link[1] ?? ''))
          break
        }
      }
      return
    }
    const linked = TRACK_LINKED.exec(line)
    if (linked) tracks.push(entryOf(i, linked[1] ?? ' ', linked[2] ?? '', linked[3] ?? ''))
  })
  return tracks
}

/** The phases of plan.md with their top-level tasks. */
export const parsePlan = (md: string): Plan => {
  const plan: Plan = { phases: [] }
  let phase: Phase | null = null
  md.split('\n').forEach((line, i) => {
    if (SECTION.test(line)) {
      phase = null
      if (PHASE.test(line)) {
        phase = {
          line: i,
          title: line.slice(3).replace(CHECKPOINT, '').trim(),
          checkpoint: CHECKPOINT.exec(line)?.[1] ?? null,
          tasks: [],
        }
        plan.phases.push(phase)
      }
      return
    }
    const task = phase === null ? null : TASK.exec(line)
    if (phase === null || task === null) return
    const text = (task[2] ?? '').trim()
    phase.tasks.push({
      line: i,
      marker: (task[1] ?? ' ') as Marker,
      text,
      sha: SHA.exec(text)?.[1] ?? null,
      deferredOwner: DEFERRED.exec(text)?.[1] ?? null,
    })
  })
  return plan
}

/** True for `[ ]`, `[~]`, and a `[b]` task with no `deferred:<owner>` field. */
export const isOpen = (task: Task): boolean =>
  task.marker === ' ' || task.marker === '~' || (task.marker === 'b' && task.deferredOwner === null)

/** All top-level tasks of the plan, in order. */
export const tasksOf = (plan: Plan): Task[] => plan.phases.flatMap(phase => phase.tasks)

/** The first `[~]` task of the plan. */
export const currentTask = (plan: Plan): Task | null =>
  tasksOf(plan).find(task => task.marker === '~') ?? null

/** The first open task that is not `[~]`: the next task to start. */
export const nextTask = (plan: Plan): Task | null =>
  tasksOf(plan).find(task => task.marker === ' ') ?? null

/**
 * The active track: the first `[~]` track whose plan has a `[~]` task, else
 * the first `[~]` track. `plans` maps a track id to its parsed plan.
 */
export const selectActive = (
  tracks: readonly TrackEntry[],
  plans: ReadonlyMap<string, Plan>,
): TrackEntry | null => {
  const inProgress = tracks.filter(track => track.marker === '~')
  const working = inProgress.find(track => {
    const plan = plans.get(track.id)
    return plan !== undefined && currentTask(plan) !== null
  })
  return working ?? inProgress[0] ?? null
}

/** The count of `[b]` tasks in the plan, with or without an owner. */
export const blockedCount = (plan: Plan): number =>
  tasksOf(plan).filter(task => task.marker === 'b').length

/** The phase and task numbers of the `[~]` task, else of the first open task. */
export const position = (plan: Plan): Position => {
  const all = plan.phases.flatMap((phase, p) => phase.tasks.map((task, t) => ({ task, p, t })))
  const at = all.find(one => one.task.marker === '~') ?? all.find(one => isOpen(one.task))
  const phases = plan.phases.length
  if (at === undefined) return { phase: phases, phases, task: 0, tasks: 0, current: null }
  return { phase: at.p + 1, phases, task: at.t + 1, tasks: plan.phases[at.p]?.tasks.length ?? 0, current: at.task }
}