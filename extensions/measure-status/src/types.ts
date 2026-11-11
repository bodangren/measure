// The measure-status contract: the parse model of the Measure files and the
// snapshot the panel reads from the host file API.

/** A status marker: `[ ]` pending, `[~]` in progress, `[x]` done, `[b]` blocked. */
export type Marker = ' ' | '~' | 'x' | 'b'

/** One entry of `measure/tracks.md`, in either of the two entry formats. */
export type TrackEntry = {
  /** 0-based line of the entry in tracks.md. */
  line: number
  marker: Marker
  name: string
  /** The track id: the last segment of the track folder. */
  id: string
  /** The track folder, relative to the folder of tracks.md (`tracks/<id>`). */
  folder: string
}

/** One top-level checkbox line under a `## Phase ...` heading. */
export type Task = {
  /** 0-based line of the task in plan.md. */
  line: number
  marker: Marker
  text: string
  /** The 7-character commit SHA at the end of the line, with or without backticks. */
  sha: string | null
  /** The owner in a `deferred:<owner>` field, which closes a `[b]` task. */
  deferredOwner: string | null
}

/** One `## Phase ...` section of plan.md. */
export type Phase = {
  line: number
  title: string
  /** The SHA in `[checkpoint: <sha>]` on the heading. */
  checkpoint: string | null
  tasks: Task[]
}

export type Plan = { phases: Phase[] }

/**
 * Where the plan stands: the 1-based phase and task numbers of the `[~]` task
 * (else the next open task), and the counts they are out of.
 */
export type Position = {
  phase: number
  phases: number
  task: number
  tasks: number
  /** The `[~]` task, else the first open task; null when all tasks are closed. */
  current: Task | null
}

/** The active track and its parsed plan. */
export type ActiveTrack = {
  entry: TrackEntry
  /** Project-relative path of the plan file. */
  planPath: string
  plan: Plan
}

/**
 * What the panel read from the project. All paths are project-relative, so the
 * UI can show them without knowing the project root.
 */
export type Snapshot = {
  /** Project root the panel reads against (null when no project is open). */
  directory: string | null
  /** True when `measure/` exists in the project. */
  hasMeasure: boolean
  /** Project-relative path of the Tracks Registry (tracks.md); null when not found. */
  tracksPath: string | null
  tracks: TrackEntry[]
  active: ActiveTrack | null
  /** The count of tracks with `[~]`. */
  inProgressCount: number
  /** The reason the panel could not read the Measure files. */
  parseError: string | null
}