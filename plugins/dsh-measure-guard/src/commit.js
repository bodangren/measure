// The strict-mode commit seam (FR-13). The rules and the texts are the shared
// core's (`parseCommitCommand`, `commitDecision`, `commitReminder`); this module
// reads the staged files through the adapter's git seam and shapes the
// decision, the note, and the post-commit reminder flag.
import { commitDecision, commitReminder, parseCommitCommand, pathsOfStatus, taskKey } from './core/guards.ts'
import { gitStatus } from './snapshot.js'

export { commitDecision, commitReminder, parseCommitCommand }

/** The SHA of a finished commit line: `[main abc1234] message`. */
export const commitShaOf = text => /^\[[^\]\n]* ([0-9a-f]{7,40})\]/m.exec(text)?.[1] ?? null

/**
 * The words and separators of one shell command (Decision 9): whitespace
 * separates words; `;`, newline, `&`/`&&`, and `|`/`||` are separators; a
 * single-quoted span is literal; a double-quoted span takes `\"` and `\\`
 * escapes and a backslash-newline continuation; a backslash-newline outside
 * quotes is also a continuation; a backslash escapes the next character; a `#`
 * that starts a word comments to the end of the line. An unterminated quote
 * returns null so the caller can fail closed. `addedPaths` only honors a `git`
 * word at a command start: the first word, directly after a separator, or after
 * a run of command prefixes (an env assignment `NAME=value` or one of `env`,
 * `sudo`, `command`, `exec`, `nice`, `time`).
 */
function shellTokens(command) {
  const tokens = []
  let word = ''
  let inWord = false
  let quote = null
  const flush = () => {
    if (!inWord) return
    tokens.push({ value: word })
    word = ''
    inWord = false
  }
  for (let i = 0; i < command.length; i += 1) {
    const char = command[i]
    if (quote === "'") {
      if (char === "'") {
        quote = null
      } else {
        word += char
        inWord = true
      }
      continue
    }
    if (quote === '"') {
      if (char === '"') {
        quote = null
      } else if (char === '\\' && command[i + 1] === '\n') {
        i += 1
      } else if (char === '\\' && (command[i + 1] === '"' || command[i + 1] === '\\')) {
        word += command[i + 1]
        inWord = true
        i += 1
      } else {
        word += char
        inWord = true
      }
      continue
    }
    if (char === '\\') {
      if (command[i + 1] === '\n') {
        i += 1
      } else if (i + 1 < command.length) {
        word += command[i + 1]
        inWord = true
        i += 1
      }
      continue
    }
    if (char === ' ' || char === '\t') {
      flush()
      continue
    }
    if (char === '\n' || char === ';') {
      flush()
      tokens.push({ separator: char })
      continue
    }
    if (char === '&' || char === '|') {
      flush()
      const next = command[i + 1] === char ? char + char : char
      tokens.push({ separator: next })
      i += next.length - 1
      continue
    }
    if (char === '#' && !inWord) {
      while (i < command.length && command[i] !== '\n') i += 1
      tokens.push({ separator: '\n' })
      continue
    }
    if (char === "'" || char === '"') {
      quote = char
      inWord = true
      continue
    }
    word += char
    inWord = true
  }
  if (quote !== null) return null
  flush()
  return tokens
}

const COMMAND_PREFIXES = new Set(['env', 'sudo', 'command', 'exec', 'nice', 'time'])

/** True for a leading `NAME=value` assignment word. */
const isEnvAssignment = value => /^[A-Za-z_][A-Za-z0-9_]*=/.test(value)

/**
 * True when tokens[index] begins a command: the first word, after a separator,
 * or after a run of command prefixes (env assignments and the wrapper set).
 */
function atCommandStart(tokens, index) {
  let at = index - 1
  while (at >= 0 && !tokens[at].separator) {
    const value = tokens[at].value ?? ''
    if (isEnvAssignment(value) || COMMAND_PREFIXES.has(value)) {
      at -= 1
      continue
    }
    return false
  }
  return true
}

/**
 * The paths an in-command `git add` contributes (Decision 9): for every `git`
 * [-C <dir>]* `add` token run, the following words until a separator, with the
 * shell quoting and escaping respected. `.`, a pathspec (`:/…`), or a wildcard
 * cannot be resolved without the status, so they set `all`; an unterminated
 * quote is unreadable and also sets `all` (fail closed).
 */
export function addedPaths(command) {
  const added = { all: false, trackedOnly: false, paths: [] }
  if (typeof command !== 'string' || command === '') return added
  const tokens = shellTokens(command)
  if (tokens === null) {
    added.all = true
    return added
  }
  for (let i = 0; i < tokens.length; i += 1) {
    if (tokens[i].separator || tokens[i].value !== 'git') continue
    // Only a command-position `git` counts (`echo git add .` is not a git call),
    // and an env/wrapper prefix keeps the command position (`FOO=1 git add x`).
    if (!atCommandStart(tokens, i)) continue
    let at = i + 1
    while (at + 1 < tokens.length && tokens[at].value === '-C' && !tokens[at + 1].separator) at += 2
    if (at >= tokens.length || tokens[at].separator || tokens[at].value !== 'add') continue
    at += 1
    let afterDashDash = false
    for (; at < tokens.length && !tokens[at].separator; at += 1) {
      const value = tokens[at].value
      if (value === '') continue
      if (!afterDashDash && value === '--') {
        afterDashDash = true
        continue
      }
      if (!afterDashDash && (value === '-A' || value === '--all')) {
        added.all = true
        continue
      }
      if (!afterDashDash && (value === '-u' || value === '--update')) {
        added.trackedOnly = true
        continue
      }
      if (!afterDashDash && value.startsWith('-')) continue
      if (value === '.' || value.startsWith(':/') || value.includes('*')) {
        added.all = true
        continue
      }
      if (!added.paths.includes(value)) added.paths.push(value)
    }
    i = at
  }
  return added
}

export async function stagedFiles(deps, root, takesChanges, added = { all: false, trackedOnly: false, paths: [] }) {
  const staged = await deps.io.gitLines(['diff', '--cached', '--name-only'], root)
  const status = await gitStatus(deps.io, root)
  const tracked = () => pathsOfStatus(status.filter(line => !line.startsWith('??')))
  const extras = []
  if (added.all) extras.push(...pathsOfStatus(status))
  else extras.push(...added.paths.map(path => path.replace(/^\.\//, '')))
  if (added.trackedOnly || takesChanges) extras.push(...tracked())
  return [...new Set([...staged, ...extras])]
}

/** True when the commit command itself carries `-a`/`--all` (not an earlier `git add`). */
const commitTakesAll = command => {
  const match = /\bgit\s+(?:-[Cc]\s+\S+\s+)*commit\b([\s\S]*)/.exec(command)
  return match !== null && /(?:^|\s)(?:-[a-zA-Z]*a[a-zA-Z]*|--all)(?=\s|$)/.test(match[1] ?? '')
}

/**
 * The strict commit check of one shell command (FR-13): `parseCommitCommand`
 * first, then the shared `commitDecision` on the files the commit takes. The
 * returned `commitDue` is true only for an allowed commit of a `[~]` task with
 * the guards on: that call gets the post-commit reminder, and the SHA is read
 * from its result.
 */
export async function commitCheck(deps, context, command) {
  const none = { decision: null, note: null, commitDue: false }
  const commit = parseCommitCommand(typeof command === 'string' ? command : '')
  if (commit === null) return none
  const check = commitDecision(context, commit, await stagedFiles(deps, context.snapshot.root, commitTakesAll(command), addedPaths(command)))
  if (check.decision !== null) return { decision: check.decision, note: check.note, commitDue: false }
  return { decision: null, note: check.note, commitDue: context.guardsOff === null && taskKey(context.snapshot) !== null }
}
