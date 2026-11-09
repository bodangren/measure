// The tool plumbing (FR-5, FR-6): the per-token decision map, the async
// pre-execute listener that prepares a denial, the synchronous tool guard that
// reads it, the post-execute note append, and the mutation normalization the
// guard layer runs. Every function takes its dependencies, so the module runs
// without the DSH runtime.
import { applyEdit } from './core/guards.ts'
import { joinPath } from './core/parse.ts'
import { readOrEmpty } from './snapshot.js'
import { commitReminder, commitShaOf } from './commit.js'

/**
 * The decision map: `exec.token` (opaque) -> deny text or undefined (allow).
 * `get` is synchronous by design: the tool guard runs inside the synchronous
 * pipeline and must never await (design §5).
 */
export function createDecisions() {
  const map = new Map()
  return {
    set(token, denial) {
      return map.set(token, denial)
    },
    get(token) {
      return map.get(token)
    },
    delete(token) {
      return map.delete(token)
    },
    get size() {
      return map.size
    },
  }
}

/** The deny text of a prepared decision: a string, `{ denial }`, or `{ deny }`. */
const denialOf = outcome => {
  if (typeof outcome === 'string') return outcome
  if (outcome === null || outcome === undefined) return undefined
  return outcome.denial ?? outcome.deny ?? undefined
}

/** The optional closeout note of a prepared decision. */
const noteOf = outcome =>
  typeof outcome === 'object' && outcome !== null && typeof outcome.note === 'string' ? outcome.note : null

/**
 * The `tools/pre-execute` waterfall handler: let the other listeners decide
 * first, pass a non-allow gate through untouched, then prepare the guard
 * decision for this exact execution token. `deps.decide(exec)` is the async
 * preparation; a throw stores undefined, which is the fail-open rule of §5.
 * A standalone call (no `exec.agent`) has no project to guard and is allowed.
 */
/** Tools whose result cannot change the repository; any other name invalidates. */
const READ_ONLY_TOOLS = new Set(['read', 'grep', 'glob', 'read_image', 'web_search', 'web_fetch', 'todo_write'])

/**
 * True unless the tool is a known read-only tool. An unknown or empty name stays
 * conservative so a new write tool cannot leave a stale snapshot behind; the
 * per-step invalidation in the pre-step hook still sees external edits.
 */
export const repoMutationLikely = toolName =>
  typeof toolName !== 'string' || toolName === '' || !READ_ONLY_TOOLS.has(toolName)

export function preExecuteListener(deps, decisions, notes = new Map(), commitDue = new Set()) {
  return async (exec, next) => {
    const gate = await next()
    if (gate.kind !== 'allow') return gate
    try {
      if (exec.agent === undefined || exec.agent === null || typeof deps.decide !== 'function') {
        decisions.set(exec.token, undefined)
        return gate
      }
      const outcome = await deps.decide(exec)
      const note = noteOf(outcome)
      if (note !== null) notes.set(exec.token, note)
      const denial = denialOf(outcome)
      if (denial === undefined && outcome !== null && typeof outcome === 'object' && outcome.commitDue === true) {
        commitDue.add(exec.token)
      }
      decisions.set(exec.token, denial)
    } catch {
      decisions.set(exec.token, undefined)
    }
    return gate
  }
}

/** The text of a finished call's model-facing content, one block per line. */
export const resultText = result => {
  const content = result?.content
  if (!Array.isArray(content)) return ''
  return content
    .map(part => (part !== null && typeof part === 'object' && part.type === 'text' && typeof part.text === 'string' ? part.text : ''))
    .join('\n')
}

/**
 * The `tools/post-execute` waterfall handler for an allowed `git commit`: the
 * SHA exists only in the result, so the shared core's reminder is appended
 * here, not through the note map (which is prepared before the call). A failed
 * result is left alone. The token is consumed either way.
 */
export function postCommitListener(commitDue) {
  return async (exec, result, next) => {
    if (!commitDue.has(exec.token)) return next()
    commitDue.delete(exec.token)
    const decision = await next()
    if (decision === null || decision === undefined || decision.kind !== 'accept') return decision
    if (Object.hasOwn(decision, 'value')) return decision
    if (result?.isError === true) return decision
    const sha = commitShaOf(resultText(result))
    const base = Array.isArray(decision.content) ? decision.content : Array.isArray(result?.content) ? result.content : []
    return { ...decision, content: [...base, { type: 'text', text: commitReminder(sha) }] }
  }
}

/**
 * Installs the synchronous tool guard and the result cleanup. The guard reads
 * the prepared decision for the token without any I/O; `tools/result` drops it
 * so a finished invocation cannot leave stale text behind (design §5).
 */
export function installToolGuard(ctx, decisions) {
  if (ctx.tools === undefined || typeof ctx.tools.guard !== 'function') return () => {}
  ctx.effect(() => ctx.tools.guard(exec => decisions.get(exec.token)))
  ctx.on('tools/result', exec => {
    decisions.delete(exec.token)
  })
  return () => {}
}

// ---- Task 3.2: mutation normalization (FR-6) --------------------------------

const recordOf = value => (typeof value === 'object' && value !== null && !Array.isArray(value) ? value : null)

/** The first string value of the named fields; null when none is a string. */
const textField = (fields, ...names) => {
  for (const name of names) {
    const value = fields[name]
    if (typeof value === 'string') return value
  }
  return null
}

/** The first non-empty string value of the named fields. */
const pathField = (fields, ...names) => {
  const value = textField(fields, ...names)
  return value === null || value === '' ? null : value
}

/** The absolute form of a path argument against the effective directory. */
const joinedAgainst = (dir, path) => (path.startsWith('/') ? joinPath(path) : joinPath(dir, path))

/**
 * The realpathed path of a file argument (design §4), resolved through the io
 * seam: `io.resolve(path, { cwd: dir })`. A failure keeps the joined absolute
 * form so normalization never throws; the guard layer fails open for it.
 */
export async function resolveMutationPath(io, path, dir) {
  const joined = joinedAgainst(dir, path)
  try {
    if (io === undefined || io === null || typeof io.resolve !== 'function') return joined
    const target = await io.resolve(path, { cwd: dir })
    const value = typeof target === 'string' ? target : target?.displayPath
    return typeof value === 'string' && value !== '' ? value : joined
  } catch {
    return joined
  }
}

/** The file mutation shape of design §5. */
const fileMutation = (paths, afterTexts = new Map(), edit = null) => ({ kind: 'file', paths, afterTexts, edit })

const PATCH_OP = /^\*\*\* (Add|Update|Delete) File: (.+)$/

/** The operations of one `apply_patch` input, in patch order; other `***` lines end one. */
const patchOps = patch => {
  const ops = []
  let current = null
  for (const line of patch.split('\n')) {
    const match = PATCH_OP.exec(line)
    if (match !== null) {
      current = { kind: match[1].toLowerCase(), path: match[2].trim(), lines: [] }
      ops.push(current)
      continue
    }
    if (line.startsWith('***')) {
      current = null
      continue
    }
    if (current !== null) current.lines.push(line)
  }
  return ops
}

/** The operation lines without the trailing blank the final newline leaves behind. */
const bodyLines = lines => {
  const out = [...lines]
  while (out.length > 0 && out[out.length - 1] === '') out.pop()
  return out
}

/**
 * The after-text of one `apply_patch` operation against `before`, or null when
 * the patch cannot be applied exactly (fail closed): an add expects only `+`
 * lines, a delete leaves the empty text, and an update applies its hunks with
 * exact context matching. No fuzz factor and no diff engine: one bounded
 * format, and anything unrecognized yields no after-text.
 */
const patchAfterText = (op, before) => {
  if (op.kind === 'add') {
    if (op.lines.some(line => line !== '' && !line.startsWith('+'))) return null
    const added = op.lines.filter(line => line.startsWith('+')).map(line => line.slice(1))
    return added.length === 0 ? '' : `${added.join('\n')}\n`
  }
  if (op.kind === 'delete') return ''
  const lines = bodyLines(op.lines)
  // A header without a hunk carries no change: nothing can be read from it.
  if (lines.length === 0) return null
  const source = before.split('\n')
  const out = []
  let cursor = 0
  for (const line of lines) {
    if (line === '') {
      if (source[cursor] !== '') return null
      out.push('')
      cursor += 1
      continue
    }
    if (line.startsWith('@@')) continue
    const marker = line[0]
    const text = line.slice(1)
    if (marker === ' ') {
      if (source[cursor] !== text) return null
      out.push(text)
      cursor += 1
      continue
    }
    if (marker === '-') {
      if (source[cursor] !== text) return null
      cursor += 1
      continue
    }
    if (marker === '+') {
      out.push(text)
      continue
    }
    return null
  }
  out.push(...source.slice(cursor))
  return out.join('\n')
}

/** The after-text of one `str_replace_editor` call, or null when it cannot be read (fail closed). */
const editorAfterText = (command, fields, before) => {
  if (command === 'create') return textField(fields, 'file_text')
  if (command === 'str_replace') {
    const oldString = textField(fields, 'old_str', 'oldString')
    const newString = textField(fields, 'new_str', 'newString')
    if (oldString === null || newString === null) return null
    return applyEdit({ tool: 'Edit', old_string: oldString, new_string: newString }, before)
  }
  if (command === 'insert') {
    const raw = fields.insert_line
    const text = textField(fields, 'new_str', 'insert_text')
    if (typeof raw !== 'number' || !Number.isInteger(raw) || text === null) return null
    const lines = before.split('\n')
    const at = Math.min(Math.max(raw, 0), lines.length)
    return [...lines.slice(0, at), ...text.split('\n'), ...lines.slice(at)].join('\n')
  }
  return null
}

/**
 * Normalizes one tool call into the `ToolMutation` contract (FR-6):
 * `{kind:'file', paths, afterTexts, edit}`, `{kind:'shell', command}`, or
 * `{kind:'other'}`. Paths are absolute and resolved against `dir`; `afterTexts`
 * is filled for `edit`, `write`, `apply_patch`, and `str_replace_editor`, whose
 * text the bounded applier reconstructs (an unreadable patch leaves its path
 * without an after-text, so the closeout guard fails closed for it). The shell
 * calls keep only their command: their writes are path-scanned, not reconstructed.
 */
export async function normalizeMutation(name, args, dir, io) {
  const fields = recordOf(args)
  if (fields === null) return { kind: 'other' }

  if (name === 'edit') {
    const raw = pathField(fields, 'file_path', 'path', 'filePath')
    if (raw === null) return { kind: 'other' }
    const path = await resolveMutationPath(io, raw, dir)
    const oldString = textField(fields, 'old_string', 'oldString')
    const newString = textField(fields, 'new_string', 'newString')
    const afterTexts = new Map()
    let edit = null
    if (oldString !== null && newString !== null) {
      edit =
        fields.replace_all === true || fields.replaceAll === true
          ? { tool: 'Edit', old_string: oldString, new_string: newString, replace_all: true }
          : { tool: 'Edit', old_string: oldString, new_string: newString }
      afterTexts.set(path, applyEdit(edit, await readOrEmpty(io, path)))
    }
    return fileMutation([path], afterTexts, edit)
  }

  if (name === 'write') {
    const raw = pathField(fields, 'file_path', 'path', 'filePath')
    if (raw === null) return { kind: 'other' }
    const path = await resolveMutationPath(io, raw, dir)
    const edit = { tool: 'Write', content: textField(fields, 'content') ?? '' }
    return fileMutation([path], new Map([[path, applyEdit(edit, '')]]), edit)
  }

  if (name === 'apply_patch') {
    const patch = textField(fields, 'input') ?? textField(fields, 'patchText') ?? ''
    const paths = []
    const afterTexts = new Map()
    for (const op of patchOps(patch)) {
      const path = await resolveMutationPath(io, op.path, dir)
      if (!paths.includes(path)) paths.push(path)
      const before = afterTexts.has(path) ? afterTexts.get(path) : await readOrEmpty(io, path)
      const after = patchAfterText(op, before)
      if (after !== null) afterTexts.set(path, after)
    }
    return fileMutation(paths, afterTexts)
  }

  if (name === 'str_replace_editor') {
    const command = textField(fields, 'command')
    if (command === 'view') return { kind: 'other' }
    const raw = pathField(fields, 'path', 'file_path', 'filePath')
    if (raw === null) return { kind: 'other' }
    const path = await resolveMutationPath(io, raw, dir)
    const before = await readOrEmpty(io, path)
    const after = command === null ? null : editorAfterText(command, fields, before)
    const afterTexts = new Map()
    if (after !== null) afterTexts.set(path, after)
    return fileMutation([path], afterTexts)
  }

  if (name === 'bash' || name === 'pwsh') {
    return { kind: 'shell', command: textField(fields, 'command') ?? '' }
  }

  return { kind: 'other' }
}

/**
 * The `tools/post-execute` waterfall handler: a note that the preparation set
 * for this token (an allowed closeout's `[b]` list or phase-start note) is appended to the tool
 * result content the model reads. The note never changes the decision and is
 * dropped for a failed result; `tools/result` clears the map entry.
 */
export function postExecuteListener(notes) {
  return async (exec, result, next) => {
    const note = notes.get(exec.token)
    if (note === undefined || note === null || note === '') return next()
    const decision = await next()
    if (decision === null || decision === undefined || decision.kind !== 'accept') return decision
    if (Object.hasOwn(decision, 'value')) return decision
    if (result?.isError === true) return decision
    const base = Array.isArray(decision.content) ? decision.content : Array.isArray(result?.content) ? result.content : []
    return { ...decision, content: [...base, { type: 'text', text: note }] }
  }
}
