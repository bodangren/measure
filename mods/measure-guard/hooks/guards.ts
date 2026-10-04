// Pure guard decisions. Each takes a GuardContext and the call, and returns
// null to allow it or { deny } with the text the agent reads.
import type {
  ClosingTrack,
  CommitCheck,
  CommitCommand,
  Decision,
  GuardContext,
  Mode,
  Plan,
  RedState,
  SetupChoice,
  Snapshot,
  StopAction,
  TrackClose,
  TrackEntry,
} from '../types'
import { currentTask, isOpen, joinPath, nextTask, parsePlan, parseTracks, tasksOf } from './parse'

/** The text every deny ends with: the bypass. */
export const BYPASS = 'If this block is wrong, the user can run /measure-off.'

/** True when `path` is `folder` or lies under it. */
export const isInside = (folder: string, path: string): boolean => {
  const f = joinPath(folder)
  const p = joinPath(path)
  return p === f || p.startsWith(`${f}/`)
}

/** A path relative to the project root, for the texts the agent reads. */
export const relative = (snapshot: Snapshot, path: string): string =>
  isInside(snapshot.root, path) ? joinPath(path).slice(joinPath(snapshot.root).length + 1) : path

/**
 * The edit guard (guard and strict modes): denies a write to a file inside
 * the project root and outside measure/ while no task in the active plan has
 * `[~]`. Allows on a parse error, outside the project, and in advise mode.
 */
export const editDecision = (context: GuardContext, path: string): Decision => {
  const { snapshot, mode } = context
  if (mode === 'advise' || snapshot === null || context.guardsOff !== null) return null
  if (needsSetup(snapshot)) {
    const isAsking = context.setupChoice === null || context.setupChoice === 'pending'
    return isAsking && isInside(snapshot.root, path) ? { deny: SETUP_DENY } : null
  }
  if (!snapshot.hasMeasure || snapshot.parseError !== null) return null
  if (!isInside(snapshot.root, path) || isInside(joinPath(snapshot.root, 'measure'), path)) return null

  const { active } = snapshot
  if (active === null) {
    return {
      deny: `measure-guard: no track is in progress, so this edit belongs to no task. Create a track (Measure new-track), or mark a track \`[~]\` in measure/tracks.md. Then do the edit again. ${BYPASS}`,
    }
  }
  if (currentTask(active.plan) !== null) return null
  const next = nextTask(active.plan)
  return {
    deny: `measure-guard: no task in the track "${active.entry.name}" is in progress. Mark the next task \`[~]\` in ${relative(snapshot, active.planPath)}${next === null ? '' : ` (${next.text})`}. Then do the edit again. ${BYPASS}`,
  }
}

/** The prompt the `[ Set up Measure ]` button sends to the agent. */
export const SETUP_PROMPT =
  'Set up Measure in this project: run the Measure setup workflow (the measure skill, "setup").'

/** True for a git repository with no measure/ folder: the mod asks the user. */
export const needsSetup = (snapshot: Snapshot | null): boolean =>
  snapshot !== null && snapshot.isRepo && !snapshot.hasMeasure

/**
 * The band text for a repository with no measure/ folder, by the answer;
 * null when the band shows nothing (no question, or turned off).
 */
export const setupBandText = (choice: SetupChoice | null): string | null => {
  if (choice === null || choice === 'pending') return 'Measure · this repository has no measure/ folder.'
  if (choice === 'setup') return 'Measure · setup requested.'
  return null
}

/** The deny text while the setup question has no answer. */
export const SETUP_DENY = `measure-guard: this git repository has no measure/ folder. Ask the user: "Do you want to set up Measure, or turn off measure-guard for this session?" The user answers with the buttons [ Set up Measure ] or [ Turn off for session ] above the prompt. Do the edit after the user answers. ${BYPASS}`

/** The $.store key that keeps /measure-off repo for a repository root. */
export const offKey = (root: string): string => `off:${root}`

/** The tool inputs that write a whole file or replace a part of one. */
export type FileEdit =
  | { tool: 'Edit'; old_string: string; new_string: string; replace_all?: boolean }
  | { tool: 'Write'; content: string }

/** The file text after the edit; null when the edit does not apply. */
export const applyEdit = (edit: FileEdit, text: string): string | null => {
  if (edit.tool === 'Write') return edit.content
  if (!text.includes(edit.old_string)) return null
  return edit.replace_all === true
    ? text.split(edit.old_string).join(edit.new_string)
    : text.replace(edit.old_string, () => edit.new_string)
}

/** True when the guards of guard and strict mode apply. */
const isGuarding = (context: GuardContext): boolean => context.mode !== 'advise' && context.guardsOff === null

/** The tracks that are not `[x]` in `before` and are `[x]` in `after`. */
export const closedTracks = (before: string, after: string): TrackEntry[] => {
  const was = new Map(parseTracks(before).map(track => [track.id, track.marker]))
  return parseTracks(after).filter(track => track.marker === 'x' && was.get(track.id) !== 'x')
}

/**
 * The closeout guard for tracks.md (guard and strict): denies a track change
 * to `[x]` while its plan has an open task (`[ ]`, `[~]`, or `[b]` with no
 * owner). On an allow, the note lists all `[b]` tasks of the closed plans.
 */
export const trackCloseDecision = (context: GuardContext, closing: readonly ClosingTrack[]): TrackClose => {
  if (!isGuarding(context)) return { decision: null, note: null }
  const problems: string[] = []
  const blocked: string[] = []
  for (const { entry, plan } of closing) {
    if (plan === null) continue
    const tasks = tasksOf(plan)
    const open = tasks.filter(isOpen)
    if (open.length > 0) {
      const listed = open.slice(0, 10).map(task => {
        const why = task.marker === 'b' ? ' (needs a deferred:<owner> field)' : ''
        return `  - [${task.marker}] ${task.text}${why}`
      })
      const more = open.length > 10 ? [`  - and ${open.length - 10} more`] : []
      problems.push(`"${entry.name}" has ${open.length} open task(s):`, ...listed, ...more)
    }
    blocked.push(...tasks.filter(task => task.marker === 'b').map(task => `  - [b] ${task.text}`))
  }
  if (problems.length > 0) {
    return {
      decision: {
        deny: [
          'measure-guard: a track can change to [x] only when its plan has no open task.',
          ...problems,
          `Close these tasks first. A human-gated task can stay [b] with a deferred:<owner> field. ${BYPASS}`,
        ].join('\n'),
      },
      note: null,
    }
  }
  const note =
    blocked.length === 0
      ? null
      : ['measure-guard: the closed track has these [b] tasks. List them for the user in your report:', ...blocked].join('\n')
  return { decision: null, note }
}

/**
 * The closeout guard for plan.md (guard and strict): denies a task change to
 * `[~]` in phase N+1 while the heading of phase N has no `[checkpoint: <sha>]`.
 */
export const phaseStartDecision = (context: GuardContext, before: string, after: string): Decision => {
  if (!isGuarding(context)) return null
  const wasActive = new Set(tasksOf(parsePlan(before)).filter(task => task.marker === '~').map(task => task.text))
  const phases = parsePlan(after).phases
  for (const [i, phase] of phases.entries()) {
    const previous = phases[i - 1]
    if (previous === undefined || previous.checkpoint !== null) continue
    if (phase.tasks.some(task => task.marker === '~' && !wasActive.has(task.text))) {
      return {
        deny: `measure-guard: "${phase.title}" cannot start, because the heading of "${previous.title}" has no [checkpoint: <sha>]. Run the Phase Completion Verification and Checkpointing Protocol in measure/workflow.md for "${previous.title}" first. ${BYPASS}`,
      }
    }
  }
  return null
}

/** The most times strict mode keeps one turn open. */
export const MAX_BLOCKS = 2

/** The path of a porcelain line: the new path of a rename, quotes removed. */
const pathOfStatus = (line: string): string => {
  const path = line.slice(3)
  const arrow = path.indexOf(' -> ')
  const target = arrow === -1 ? path : path.slice(arrow + 4)
  return target.startsWith('"') && target.endsWith('"') ? target.slice(1, -1) : target
}

/** The paths of porcelain lines. */
export const pathsOfStatus = (lines: readonly string[]): string[] => lines.map(pathOfStatus)

/** The lines of `git status --porcelain`, without empty lines. */
export const statusLinesOf = (porcelain: string): string[] =>
  porcelain.split('\n').filter(line => line.trim() !== '')


/**
 * The paths (relative to the repository root) of the status lines that are
 * new or changed since the turn start, outside measure/.
 */
export const changedDuringTurn = (start: readonly string[], end: readonly string[]): string[] => {
  const before = new Set(start)
  return end
    .filter(line => !before.has(line))
    .map(pathOfStatus)
    .filter(path => path !== 'measure' && !path.startsWith('measure/'))
}


/** The texts of the `[x]` tasks with no SHA. */
export const unshaTasks = (plan: Plan): string[] =>
  tasksOf(plan)
    .filter(task => task.marker === 'x' && task.sha === null)
    .map(task => task.text)


/**
 * The end-of-turn problems: a `[x]` task with no SHA that was not one at the
 * turn start, and files changed during the turn while no task has `[~]`.
 */
export const turnProblems = (snapshot: Snapshot, changed: readonly string[], knownUnsha: readonly string[]): string[] => {
  if (!snapshot.hasMeasure || snapshot.parseError !== null) return []
  const problems: string[] = []
  const { active } = snapshot
  if (active !== null) {
    const known = new Set(knownUnsha)
    for (const text of unshaTasks(active.plan).filter(one => !known.has(one))) {
      problems.push(`"${text}" is [x] but has no commit SHA. Commit the task, and add the 7-character SHA to its line in plan.md.`)
    }
  }
  if (changed.length > 0 && (active === null || currentTask(active.plan) === null)) {
    const listed = changed.slice(0, 5).join(', ') + (changed.length > 5 ? `, and ${changed.length - 5} more` : '')
    problems.push(`Files changed outside measure/ while no task is in progress: ${listed}. Mark the task [~] in plan.md (or create a track), or revert the changes.`)
  }
  return problems
}


/**
 * What to do at the turn end: strict mode keeps the turn open with the
 * problems as the reason, at most MAX_BLOCKS times; then, and in the other
 * modes, the mod reports the problems.
 */
export const stopAction = (mode: Mode, problems: readonly string[], blocks: number): StopAction => {
  if (problems.length === 0) return { block: null, report: false }
  if (mode === 'strict' && blocks < MAX_BLOCKS) {
    return {
      block: ['measure-guard (strict): do not end the turn yet. Fix these problems first:', ...problems.map(one => `- ${one}`)].join('\n'),
      report: false,
    }
  }
  return { block: null, report: true }
}


const TEST_FILES = [
  /\.(test|spec)\.[cm]?[jt]sx?$/,
  /(^|\/)test_[^/]+\.(py|sh)$/,
  /_test\.(py|go|rs|exs?)$/,
  /_spec\.rb$/,
  /(^|\/)test-[^/]+\.sh$/,
  /(^|\/)(tests?|__tests__|spec)\/[^/]+\.(rs|[cm]?[jt]sx?|py|rb|go)$/,
  /Tests?\.(java|kt|scala|cs|swift)$/,
]

const CODE_FILE =
  /\.(bash|c|cc|cjs|cpp|cs|cts|cxx|dart|ex|exs|go|h|hpp|java|js|jsx|kt|kts|lua|m|mjs|mts|php|py|rb|rs|scala|sh|svelte|swift|ts|tsx|vue|zig|zsh)$/i

const TEST_COMMANDS = [
  /\b(npm|pnpm|yarn|bun)\s+(run\s+)?test\b/,
  /\b(vitest|jest|mocha|ava|pytest|rspec|phpunit|ctest)\b/,
  /\bpython3?\s+-m\s+(pytest|unittest)\b/,
  /\b(go|cargo|deno|mvn|gradle|gradlew|make|mix|dotnet|swift)\s+test\b/,
  /\bclaude\s+plugin\s+test\b/,
  /(^|[\s/])test[-_][\w.-]*\.sh\b/,
]

/** True for a test file by its name: `*.test.ts`, `test_*.py`, `*_test.go`, and similar. */
export const isTestFile = (path: string): boolean => TEST_FILES.some(rule => rule.test(path))


/** True for a code file that is not a test file; Markdown, JSON, and other data pass. */
export const isSourceFile = (path: string): boolean => CODE_FILE.test(path) && !isTestFile(path)


/** True for a command that runs tests: `npm test`, `vitest`, `pytest`, `go test`, and similar. */
export const isTestCommand = (command: string): boolean => TEST_COMMANDS.some(rule => rule.test(command))


/** The key of the `[~]` task of the active track; null when no task has `[~]`. */
export const taskKey = (snapshot: Snapshot | null): string | null => {
  const active = snapshot?.active ?? null
  const task = active === null ? null : currentTask(active.plan)
  return active === null || task === null ? null : `${active.entry.id}|${task.text}`
}


/** The Red state for the task: the kept one when it is the same task, else empty. */
export const redFor = (red: RedState | null, key: string | null): RedState =>
  red !== null && red.taskKey === key ? red : { taskKey: key, testChanged: false, testFailed: false }


/**
 * The TDD guard (strict mode): denies an edit of a source file inside the
 * project and outside measure/ until, for the `[~]` task, a test file
 * changed and a test command failed.
 */
export const tddDecision = (context: GuardContext, red: RedState | null, path: string): Decision => {
  const { snapshot } = context
  if (context.mode !== 'strict' || context.guardsOff !== null) return null
  if (snapshot === null || !snapshot.hasMeasure || snapshot.parseError !== null || snapshot.active === null) return null
  if (!isInside(snapshot.root, path) || isInside(joinPath(snapshot.root, 'measure'), path) || !isSourceFile(path)) return null
  const task = currentTask(snapshot.active.plan)
  if (task === null) return null
  const state = redFor(red, taskKey(snapshot))
  if (state.testChanged && state.testFailed) return null
  const missing = [
    state.testChanged ? null : 'change a test file (for example *.test.ts, test_*.py, *_test.go)',
    state.testFailed ? null : 'run the tests and see them fail',
  ].filter(step => step !== null)
  return {
    deny: `measure-guard (strict): write a failing test first. The task "${task.text}" has no Red phase yet. Still to do: ${missing.join('; ')}. Then edit ${relative(snapshot, path)}. ${BYPASS}`,
  }
}


/** The commit message format: `<type>(<scope>): <description>`. */
export const COMMIT_FORMAT = /^[a-z]+\([^)]+\)!?: \S/

const GIT_COMMIT = /\bgit\s+(?:-[Cc]\s+\S+\s+)*commit\b/
const GIT_ADD = /\bgit\s+(?:-[Cc]\s+\S+\s+)*add\b/
const HEREDOC = /<<-?\s*['"]?(\w+)['"]?\n([\s\S]*?)\n\s*\1\b/
const MESSAGE = /(?:^|\s)(?:-[a-zA-Z]*m|--message)(?:=|\s+)(?:"((?:[^"\\]|\\.)*)"|'([^']*)'|(\S+))/

/** The `git commit` in a Bash command; null when the command makes no commit. */
export const parseCommitCommand = (command: string): CommitCommand | null => {
  const match = GIT_COMMIT.exec(command)
  if (match === null) return null
  const rest = command.slice(match.index + match[0].length)
  const heredoc = HEREDOC.exec(rest)
  const quoted = MESSAGE.exec(rest)
  const raw = heredoc?.[2] ?? quoted?.[1]?.replace(/\\(.)/g, '$1') ?? quoted?.[2] ?? quoted?.[3] ?? null
  const message = raw === null ? null : (raw.split('\n').find(line => line.trim() !== '')?.trim() ?? null)
  const flags = rest.replace(HEREDOC, '').replace(/"(?:[^"\\]|\\.)*"/g, '""').replace(/'[^']*'/g, "''")
  const takesChanges = GIT_ADD.test(command.slice(0, match.index)) || /(^|\s)(-[a-zA-Z]*a[a-zA-Z]*|--all)(?=\s|$)/.test(flags)
  return { message: message !== null && message.startsWith('$(') ? null : message, takesChanges }
}


/**
 * The commit guard (strict mode): denies a message not in the format, and a
 * commit of files outside measure/ while no task has `[~]`. `staged` holds the
 * paths (relative to the repository root) the commit takes.
 */
export const commitDecision = (context: GuardContext, commit: CommitCommand, staged: readonly string[]): CommitCheck => {
  const none = { decision: null, note: null }
  const { snapshot } = context
  if (context.mode !== 'strict' || context.guardsOff !== null) return none
  if (snapshot === null || !snapshot.hasMeasure || snapshot.parseError !== null) return none
  if (commit.message !== null && !COMMIT_FORMAT.test(commit.message)) {
    return {
      decision: {
        deny: `measure-guard (strict): the commit message "${commit.message}" is not in the format <type>(<scope>): <description>, for example "feat(parser): Read both entry formats". Use the Commit Guidelines in measure/workflow.md. ${BYPASS}`,
      },
      note: null,
    }
  }
  const outside = staged.filter(path => path !== 'measure' && !path.startsWith('measure/'))
  const task = snapshot.active === null ? null : currentTask(snapshot.active.plan)
  if (outside.length > 0 && task === null) {
    const listed = outside.slice(0, 5).join(', ') + (outside.length > 5 ? `, and ${outside.length - 5} more` : '')
    return {
      decision: {
        deny: `measure-guard (strict): no task is in progress, so this commit belongs to no task. It has files outside measure/: ${listed}. Mark the task [~] in plan.md first. ${BYPASS}`,
      },
      note: null,
    }
  }
  const note =
    commit.message === null
      ? 'measure-guard: could not read the commit message (-F, a variable, or the editor). Make sure that it has the format <type>(<scope>): <description>.'
      : null
  return { decision: null, note }
}


/** The reminder after a commit for a `[~]` task: the git note and the SHA in plan.md. */
export const commitReminder = (sha: string | null): string => {
  const short = sha === null ? null : sha.slice(0, 7)
  return `measure-guard: the commit ${short ?? '(see git log -1)'} is done. Next steps of the Task Workflow: add the git note (git notes add -m "<task summary>" ${short ?? 'HEAD'}), and record ${short ?? 'the 7-character SHA'} on the task line in plan.md.`
}

