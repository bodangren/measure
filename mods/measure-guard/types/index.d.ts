// The measure-guard contract: the parse model of the Measure files and the
// values the mod keeps in $.state.

/** A status marker: `[ ]` pending, `[~]` in progress, `[x]` done, `[b]` blocked. */
export type Marker = ' ' | '~' | 'x' | 'b'

/** The guard level from the `mode` userConfig field. */
export type Mode = 'advise' | 'guard' | 'strict'

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
  /** Absolute path of the plan file. */
  planPath: string
  plan: Plan
}

/** What the mod read from the project, kept in $.state. */
export type Snapshot = {
  /** Absolute project root (the session root). */
  root: string
  /** True when `<root>/measure/` exists. */
  hasMeasure: boolean
  /** True when the root is inside a git repository. */
  isRepo: boolean
  tracks: TrackEntry[]
  active: ActiveTrack | null
  /** The count of tracks with `[~]`. */
  inProgressCount: number
  /** The reason the mod could not read the Measure files; the guards fail open. */
  parseError: string | null
}

/**
 * The user's answer in a git repository with no measure/ folder: `pending`
 * until a band button is pressed, `off` for the session, or `setup` asked.
 */
export type SetupChoice = 'pending' | 'off' | 'setup'

/** What a guard reads: the snapshot, the mode, and the setup answer. */
export type GuardContext = {
  snapshot: Snapshot | null
  mode: Mode
  setupChoice: SetupChoice | null
}

/** A guard's answer: null allows the call; `deny` refuses it with that text. */
export type Decision = { deny: string } | null

declare module 'claude-code' {
  interface PluginState {
    'measure-guard': {
      snapshot: Snapshot | null
      /** The noteKey of the last task note the agent got; null sends the next one. */
      notedKey: string | null
      /** The answer to the setup question; null where no question is asked. */
      setupChoice: SetupChoice | null
    }
  }
}
