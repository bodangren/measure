// The tool hooks: which OpenCode tools write files, what they write, and the
// guard decisions before and after a call. Pure helpers here; the Guard class
// runs them with the snapshot and the session.
import type { FileEdit } from '../core/guards'

/** The file tools of OpenCode 2 and the fields of their inputs. */
export const EDIT_TOOLS = ['edit', 'write', 'multiedit', 'apply_patch'] as const
export type EditTool = (typeof EDIT_TOOLS)[number]

/** The shell tools: `bash` (the permission name) and `shell` (the documented tool name). */
export const isShellTool = (tool: string): boolean => tool === 'bash' || tool === 'shell'

export const isEditTool = (tool: string): tool is EditTool => (EDIT_TOOLS as readonly string[]).includes(tool)

/**
 * The files a tool call writes, absolute: `filePath` of edit, write, and
 * multiedit (relative paths resolve against `root`); the `*** Update File:`,
 * `*** Add File:`, and `*** Delete File:` paths of an apply_patch `patchText`.
 */
export const writtenPaths = (_tool: string, _input: unknown, _root: string): string[] => {
  throw new Error('not implemented')
}

/** The edit as the core's FileEdit (edit → Edit, write → Write); null for multiedit, apply_patch, and other tools. */
export const fileEditOf = (_tool: string, _input: unknown): FileEdit | null => {
  throw new Error('not implemented')
}

/** The text after a multiedit's edits in order; null when one does not apply. */
export const applyMultiEdit = (_input: unknown, _text: string): string | null => {
  throw new Error('not implemented')
}

/** The shell command of a bash/shell call; null when absent. */
export const commandOf = (_input: unknown): string | null => {
  throw new Error('not implemented')
}

/** The deny text in a git repository without measure/ (the mod's text names buttons; OpenCode has commands). */
export const SETUP_DENY_OPENCODE =
  'measure-guard: this git repository has no measure/ folder. Ask the user: "Do you want to set up Measure (/measure-setup), or turn off measure-guard for this session (/measure-off)?" Do the edit after the user answers. If this block is wrong, the user can run /measure-off.'

/** Appends notes to a tool result's output text. */
export const appendNotes = (_output: unknown, _notes: readonly string[]): unknown => {
  throw new Error('not implemented')
}
