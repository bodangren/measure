// The tool plumbing (FR-5, FR-6): the per-token decision map, the async
// pre-execute listener that prepares a denial, the synchronous tool guard that
// reads it, the post-execute note append, and the mutation normalization the
// guard layer runs. Every function takes its dependencies, so the module runs
// without the DSH runtime.
import { applyEdit } from './core/guards.ts'
import { joinPath } from './core/parse.ts'
import { readOrEmpty } from './snapshot.js'

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
export function preExecuteListener(deps, decisions, notes = new Map()) {
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
      decisions.set(exec.token, denialOf(outcome))
    } catch {
      decisions.set(exec.token, undefined)
    }
    return gate
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

const PATCH_FILE = /^\*\*\* (?:Update|Add|Delete) File: (.+)$/

/**
 * Normalizes one tool call into the `ToolMutation` contract (FR-6):
 * `{kind:'file', paths, afterTexts, edit}`, `{kind:'shell', command}`, or
 * `{kind:'other'}`. Paths are absolute and resolved against `dir`; `afterTexts`
 * is filled only for `edit` and `write`, whose text the shared `applyEdit`
 * reconstructs. `apply_patch`, `str_replace_editor`, and the shell calls fail
 * open in the closeout guard and are covered by the end-of-turn check.
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
    for (const line of patch.split('\n')) {
      const match = PATCH_FILE.exec(line)
      const raw = match?.[1]?.trim()
      if (raw === undefined || raw === '') continue
      const path = await resolveMutationPath(io, raw, dir)
      if (!paths.includes(path)) paths.push(path)
    }
    return fileMutation(paths)
  }

  if (name === 'str_replace_editor') {
    if (textField(fields, 'command') === 'view') return { kind: 'other' }
    const raw = pathField(fields, 'path', 'file_path', 'filePath')
    if (raw === null) return { kind: 'other' }
    return fileMutation([await resolveMutationPath(io, raw, dir)])
  }

  if (name === 'bash' || name === 'pwsh') {
    return { kind: 'shell', command: textField(fields, 'command') ?? '' }
  }

  return { kind: 'other' }
}

/**
 * The `tools/post-execute` waterfall handler: a note that the preparation set
 * for this token (an allowed closeout's `[b]` list) is appended to the tool
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
