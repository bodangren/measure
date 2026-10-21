// The tool hooks: which OpenCode tools write files, what they write, and the
// guard decisions before and after a call. Pure helpers here; the Guard class
// runs them with the snapshot and the session.
import { joinPath } from '../core/parse'
import type { FileEdit } from '../core/guards'

/** The file tools of OpenCode 2 and the fields of their inputs. */
export const EDIT_TOOLS = ['edit', 'write', 'multiedit', 'apply_patch'] as const
export type EditTool = (typeof EDIT_TOOLS)[number]

/** The shell tools: `bash` (the permission name) and `shell` (the documented tool name). */
export const isShellTool = (tool: string): boolean => tool === 'bash' || tool === 'shell'

export const isEditTool = (tool: string): tool is EditTool => (EDIT_TOOLS as readonly string[]).includes(tool)

const record = (input: unknown): Record<string, unknown> | null =>
  typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : null

const text = (value: unknown): string | null => (typeof value === 'string' ? value : null)

const absolute = (path: string, root: string): string => (path.startsWith('/') ? joinPath(path) : joinPath(root, path))

const PATCH_FILE = /^\*\*\* (?:Update|Add|Delete) File: (.+)$/

/**
 * The files a tool call writes, absolute: `filePath` of edit, write, and
 * multiedit (relative paths resolve against `root`); the `*** Update File:`,
 * `*** Add File:`, and `*** Delete File:` paths of an apply_patch `patchText`.
 */
export const writtenPaths = (tool: string, input: unknown, root: string): string[] => {
  const fields = record(input)
  if (fields === null || !isEditTool(tool)) return []
  if (tool === 'apply_patch') {
    const patch = text(fields.patchText) ?? ''
    return patch
      .split('\n')
      .map(line => PATCH_FILE.exec(line)?.[1]?.trim() ?? null)
      .filter((path): path is string => path !== null && path !== '')
      .map(path => absolute(path, root))
  }
  // OpenCode 2.0 names the field `path`; the 1.x docs and some builds name it `filePath`.
  const path = text(fields.path) ?? text(fields.filePath)
  return path === null || path === '' ? [] : [absolute(path, root)]
}

/** The edit as the core's FileEdit (edit → Edit, write → Write); null for multiedit, apply_patch, and other tools. */
export const fileEditOf = (tool: string, input: unknown): FileEdit | null => {
  const fields = record(input)
  if (fields === null) return null
  if (tool === 'edit') {
    const oldString = text(fields.oldString)
    const newString = text(fields.newString)
    if (oldString === null || newString === null) return null
    return fields.replaceAll === true
      ? { tool: 'Edit', old_string: oldString, new_string: newString, replace_all: true }
      : { tool: 'Edit', old_string: oldString, new_string: newString }
  }
  if (tool === 'write') {
    const content = text(fields.content)
    return content === null ? null : { tool: 'Write', content }
  }
  return null
}

/** The text after a multiedit's edits in order; null when one does not apply. */
export const applyMultiEdit = (input: unknown, start: string): string | null => {
  const fields = record(input)
  const edits = fields === null || !Array.isArray(fields.edits) ? [] : fields.edits
  let current = start
  for (const edit of edits) {
    const one = record(edit)
    const oldString = one === null ? null : text(one.oldString)
    const newString = one === null ? null : text(one.newString)
    if (oldString === null || newString === null || !current.includes(oldString)) return null
    current = one?.replaceAll === true ? current.split(oldString).join(newString) : current.replace(oldString, () => newString)
  }
  return current
}

/** The shell command of a bash/shell call; null when absent. */
export const commandOf = (input: unknown): string | null => {
  const fields = record(input)
  return fields === null ? null : text(fields.command)
}

/** The deny text in a git repository without measure/ (the mod's text names buttons; OpenCode has commands). */
export const SETUP_DENY_OPENCODE =
  'measure-guard: this git repository has no measure/ folder. Ask the user: "Do you want to set up Measure (/measure-setup), or turn off measure-guard for this session (/measure-off)?" Do the edit after the user answers. If this block is wrong, the user can run /measure-off.'

/** Appends notes to a tool result's output text. */
export const appendNotes = (output: unknown, notes: readonly string[]): unknown => {
  if (notes.length === 0) return output
  const block = notes.join('\n\n')
  if (typeof output === 'string') return output === '' ? block : `${output}\n\n${block}`
  if (output === undefined || output === null) return block
  return `${JSON.stringify(output)}\n\n${block}`
}
