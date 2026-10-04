// Pure parse functions over the text of the Measure files. No `$` here, so
// the tests call them directly.
import type { Marker, Mode, Plan, Snapshot, Task, TrackEntry } from '../types'

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

/** The `mode` option as a Mode; `guard` when unset or unknown. */
export const parseMode = (value: unknown): Mode =>
  value === 'advise' || value === 'guard' || value === 'strict' ? value : 'guard'

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
  let phase: Plan['phases'][number] | null = null
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

const tasksOf = (plan: Plan): Task[] => plan.phases.flatMap(phase => phase.tasks)

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

/**
 * The fixed system prompt section. Its text never changes in a session, so it
 * keeps the prompt cache; the changing state goes into notes (taskNote).
 */
export const ruleSection = (): string =>
  [
    '# Measure workflow (measure-guard)',
    '',
    'This project uses Measure for spec-driven development. The plan files in `measure/` are the source of truth.',
    'Before you change files outside `measure/`, mark the task in `plan.md` as `[~]`, and follow the Task Workflow in `measure/workflow.md`.',
    'measure-guard sends the active track and task to you as a note when they change.',
  ].join('\n')

/**
 * What the task note is about: the active track and its `[~]` task. A new key
 * means a new note. Null when the project has no measure/ folder.
 */
export const noteKey = (snapshot: Snapshot): string | null => {
  if (!snapshot.hasMeasure) return null
  if (snapshot.parseError !== null) return `error|${snapshot.parseError}`
  if (snapshot.active === null) return 'none'
  return `${snapshot.active.entry.id}|${currentTask(snapshot.active.plan)?.text ?? '-'}`
}

/** The note with the active track and task; null when there is no note. */
export const taskNote = (snapshot: Snapshot, mode: Mode): string | null => {
  if (!snapshot.hasMeasure) return null
  const head = `measure-guard (Mode: ${mode})`
  if (snapshot.parseError !== null) {
    return `${head}: the Measure files could not be read (${snapshot.parseError}). The guards allow all calls until the files are correct.`
  }
  const { active } = snapshot
  if (active === null) {
    return `${head}: no track is in progress in measure/tracks.md. Create a track, or mark a track \`[~]\`, before you change files outside measure/.`
  }
  const track = `Active track: ${active.entry.name} (measure/${active.entry.folder}/).`
  const task = currentTask(active.plan)
  if (task !== null) return `${head}\n${track}\nCurrent task: [~] ${task.text}`
  const next = nextTask(active.plan)
  return [
    head,
    track,
    'No task is in progress.',
    next === null
      ? 'The plan has no pending task. Close the track, or add a task to plan.md.'
      : `Next task: ${next.text}. Mark it \`[~]\` in plan.md before you change files outside measure/.`,
  ].join('\n')
}
