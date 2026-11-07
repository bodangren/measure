// The strict-mode commit seam (FR-13). The rules and the texts are the shared
// core's (`parseCommitCommand`, `commitDecision`, `commitReminder`); this module
// reads the staged files through the adapter's git seam and shapes the
// decision, the note, and the post-commit reminder flag.
import { commitDecision, commitReminder, parseCommitCommand, pathsOfStatus, taskKey } from './core/guards.ts'
import { gitStatus } from './snapshot.js'

export { commitDecision, commitReminder, parseCommitCommand }

/** The SHA of a finished commit line: `[main abc1234] message`. */
export const commitShaOf = text => /^\[[^\]\n]* ([0-9a-f]{7,40})\]/m.exec(text)?.[1] ?? null

/** One `git add` segment before the commit, its arguments as a string. */
const GIT_ADD_SEGMENT = /(?:^|[;&|\n])\s*git\s+(?:-[Cc]\s+\S+\s+)*add\b([^;&|\n]*)/g

/**
 * The words of one `git add` segment (Decision 9): whitespace separates; a
 * single-quoted span is literal; a double-quoted span takes `\"` and `\\`
 * escapes; a backslash outside quotes escapes the next character; a `#` that
 * starts a word begins a comment. An unterminated quote returns null so the
 * caller can fail closed.
 */
function shellWords(text) {
  const words = []
  let word = ''
  let inWord = false
  let quote = null
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]
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
      } else if (char === '\\' && (text[i + 1] === '"' || text[i + 1] === '\\')) {
        word += text[i + 1]
        inWord = true
        i += 1
      } else {
        word += char
        inWord = true
      }
      continue
    }
    if (char === ' ' || char === '\t') {
      if (inWord) {
        words.push(word)
        word = ''
        inWord = false
      }
      continue
    }
    if (char === '#' && !inWord) break
    if (char === "'" || char === '"') {
      quote = char
      inWord = true
      continue
    }
    if (char === '\\') {
      if (i + 1 < text.length) {
        word += text[i + 1]
        inWord = true
        i += 1
      }
      continue
    }
    word += char
    inWord = true
  }
  if (quote !== null) return null
  if (inWord) words.push(word)
  return words
}

/**
 * The paths an in-command `git add` contributes (Decision 9): the non-option
 * words of every `git add` segment, with shell quoting and escaping respected.
 * `.`, a pathspec (`:/…`), or a wildcard cannot be resolved without the status,
 * so they set `all`; an unterminated quote is unreadable and also sets `all`
 * (fail closed).
 */
export function addedPaths(command) {
  const added = { all: false, trackedOnly: false, paths: [] }
  if (typeof command !== 'string' || command === '') return added
  for (const match of command.matchAll(GIT_ADD_SEGMENT)) {
    const words = shellWords(match[1] ?? '')
    if (words === null) {
      added.all = true
      continue
    }
    let afterDashDash = false
    for (const token of words) {
      if (token === '') continue
      if (!afterDashDash && token === '--') {
        afterDashDash = true
        continue
      }
      if (!afterDashDash && (token === '-A' || token === '--all')) {
        added.all = true
        continue
      }
      if (!afterDashDash && (token === '-u' || token === '--update')) {
        added.trackedOnly = true
        continue
      }
      if (!afterDashDash && token.startsWith('-')) continue
      if (token === '.' || token.startsWith(':/') || token.includes('*')) {
        added.all = true
        continue
      }
      if (!added.paths.includes(token)) added.paths.push(token)
    }
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
