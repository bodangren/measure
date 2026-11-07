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

/** Wrapper options that consume the following word as their argument. */
const PREFIX_OPTION_ARGS = new Set(['-u', '-n', '-C', '--user', '--nice', '--chdir', '--unset'])

/** True for a leading `NAME=value` assignment word. */
const isEnvAssignment = value => /^[A-Za-z_][A-Za-z0-9_]*=/.test(value)

/**
 * True when tokens[index] begins a command: the first word, after a separator,
 * or after a run of command prefixes (env assignments and the wrapper set,
 * including a wrapper's option words and their arguments: `sudo -u root git`).
 */
function atCommandStart(tokens, index) {
  let start = 0
  for (let at = index - 1; at >= 0; at -= 1) {
    if (tokens[at].separator) {
      start = at + 1
      break
    }
  }
  let at = start
  while (at < index) {
    const value = tokens[at].value ?? ''
    if (isEnvAssignment(value)) {
      at += 1
      continue
    }
    if (!COMMAND_PREFIXES.has(value)) return false
    at += 1
    while (at < index) {
      const option = tokens[at].value ?? ''
      if (!option.startsWith('-')) break
      const takesArg = PREFIX_OPTION_ARGS.has(option)
      at += 1
      if (takesArg) at += 1
    }
  }
  return true
}


/**
 * True when a command substitution that runs (not single-quoted or escaped)
 * mentions a `git add`. Balanced `$(...)` and backtick spans are scanned, and
 * `git -C <dir> add` and a quoted `"add"` are recognized; a literal `$(git add)`
 * in a message does not count.
 */
function substitutionAdds(command) {
  let text = ''
  for (let i = 0; i < command.length; i += 1) {
    const ch = command[i]
    if (ch === '\\') {
      i += 1
      text += '  '
      continue
    }
    if (ch === "'") {
      let j = i + 1
      while (j < command.length && command[j] !== "'") j += 1
      text += ' '.repeat(Math.min(j, command.length) - i + 1)
      i = j
      continue
    }
    text += ch
  }
  const spans = []
  for (let i = 0; i < text.length; i += 1) {
    if (text[i] === '$' && text[i + 1] === '(') {
      let depth = 1
      let j = i + 2
      while (j < text.length && depth > 0) {
        if (text[j] === '(') depth += 1
        else if (text[j] === ')') depth -= 1
        j += 1
      }
      spans.push(text.slice(i + 2, depth === 0 ? j - 1 : j))
      i = j - 1
    } else if (text[i] === '`') {
      let j = text.indexOf('`', i + 1)
      if (j < 0) j = text.length
      spans.push(text.slice(i + 1, j))
      i = j
    }
  }
  const add = /\bgit(?:\s+-C\s+\S+)?\s+["']?(?:add|stage)["']?\b/
  return spans.some(span => add.test(span))
}

/**
 * The paths an in-command `git add` contributes (Decision 9): for every `git`
 * [-C <dir>]* `add` token run, the following words until a separator, with the
 * shell quoting and escaping respected. `.`, a pathspec (`:/…`), or a wildcard
 * cannot be resolved without the status, so they set `all`; an unterminated
 * quote is unreadable and also sets `all` (fail closed).
 */
/**
 * The paths an in-command `git add`/`git stage` contributes (Decision 9): for
 * every command-position `git [-C <dir>] add` run, the following words until a
 * separator, with shell quoting respected. `.`, a pathspec (`:/…`), a wildcard,
 * or an executing command substitution that runs a `git add` sets `all`; an
 * unterminated quote is unreadable and also sets `all` (fail closed). A nested
 * `bash -c <string>`, `sh -c <string>`, `zsh -c <string>`, or `eval <string>` is
 * scanned recursively (depth-capped) and merged.
 */
export function addedPaths(command) {
  return scanAddedPaths(command, 0)
}

const NESTED_SHELLS = new Set(['bash', 'sh', 'zsh'])
const MAX_NESTED_DEPTH = 3

function scanAddedPaths(command, depth) {
  const added = { all: false, trackedOnly: false, paths: [] }
  if (typeof command !== 'string' || command === '') return added
  // Four levels: the exported call is depth 0; anything deeper fails closed.
  if (depth > MAX_NESTED_DEPTH) {
    added.all = true
    return added
  }
  const merge = source => {
    added.all = added.all || source.all
    added.trackedOnly = added.trackedOnly || source.trackedOnly
    for (const path of source.paths) if (!added.paths.includes(path)) added.paths.push(path)
  }
  const tokens = shellTokens(command)
  if (tokens === null) {
    added.all = true
    return added
  }
  // A `git add` hidden inside a command substitution cannot be attributed to a
  // path set by the tokenizer; fail closed so the commit check considers every
  // working-tree change instead of only the previously staged set.
  if (substitutionAdds(command)) {
    added.all = true
    return added
  }
  for (let i = 0; i < tokens.length; i += 1) {
    const current = tokens[i].value
    if (tokens[i].separator) continue
    if (!atCommandStart(tokens, i)) continue
    // A nested shell or eval: scan the inner command text and merge its result.
    if (current === 'eval') {
      // eval concatenates all of its words; scan the joined text.
      const parts = []
      for (let j = i + 1; j < tokens.length && !tokens[j].separator; j += 1) parts.push(tokens[j].value)
      if (parts.length > 0) merge(scanAddedPaths(parts.join(' '), depth + 1))
      continue
    }
    const shellName = current.split('/').pop()
    if (NESTED_SHELLS.has(shellName)) {
      let j = i + 1
      let takesCommand = false
      while (j < tokens.length && !tokens[j].separator && tokens[j].value.startsWith('-')) {
        if (tokens[j].value.includes('c')) takesCommand = true
        j += 1
      }
      if (takesCommand && j < tokens.length && !tokens[j].separator) {
        merge(scanAddedPaths(tokens[j].value, depth + 1))
      }
      continue
    }
    if (current !== 'git') continue
    // Only a command-position `git` counts (`echo git add .` is not a git call),
    // and an env/wrapper prefix keeps the command position (`FOO=1 git add x`).
    let at = i + 1
    while (at + 1 < tokens.length && tokens[at].value === '-C' && !tokens[at + 1].separator) at += 2
    if (at >= tokens.length || tokens[at].separator) continue
    if (tokens[at].value !== 'add' && tokens[at].value !== 'stage') continue
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
