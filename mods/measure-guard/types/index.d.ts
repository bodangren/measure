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
  /** Absolute path of the Tracks Registry (tracks.md); null when not found. */
  tracksPath: string | null
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

/** The bypass: null (guards on), `session` (/measure-off), or `repo` (/measure-off repo). */
export type GuardsOff = 'session' | 'repo' | null

/** What a guard reads: the snapshot, the mode, the setup answer, and the bypass. */
export type GuardContext = {
  snapshot: Snapshot | null
  mode: Mode
  setupChoice: SetupChoice | null
  guardsOff: GuardsOff
}

/** A guard's answer: null allows the call; `deny` refuses it with that text. */
export type Decision = { deny: string } | null

/** A track that an edit of tracks.md changes to `[x]`, with its plan (null: not found). */
export type ClosingTrack = { entry: TrackEntry; plan: Plan | null }

/** The closeout guard's answer for tracks.md: the decision, and the `[b]` list on an allow. */
export type TrackClose = { decision: Decision; note: string | null }

/** What the end-of-turn check keeps from the start of a user turn. */
export type TurnState = {
  /** `git status --porcelain` lines at the turn start. */
  status: string[]
  /** The texts of the `[x]` tasks with no SHA at the turn start (old ones are not reported). */
  unsha: string[]
  /** How many times strict mode kept this turn open. */
  blocks: number
}

/** What the end-of-turn check does: keep the turn open (strict), or report. */
export type StopAction = { block: string | null; report: boolean }

declare module 'claude-code' {
  interface PluginState {
    'measure-guard': {
      snapshot: Snapshot | null
      /** The noteKey of the last task note the agent got; null sends the next one. */
      notedKey: string | null
      /** The answer to the setup question; null where no question is asked. */
      setupChoice: SetupChoice | null
      /** The bypass for this session; `repo` also stands in $.store. */
      guardsOff: GuardsOff
      /** The end-of-turn state of the running user turn. */
      turn: TurnState | null
      /** The problems the last end-of-turn check found; the band shows them. */
      problems: string[]
      /** The reminder for the next prompt (guard and strict modes). */
      reminder: string | null
    }
  }
}
