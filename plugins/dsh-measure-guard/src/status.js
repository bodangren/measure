// The measure_status surface (FR-3): the text of the status lines plus the task
// note, and the hand-built ToolDefinition (design §2 consequence 1: no
// defineTool import, so the definition is a plain object with the same fields).
import { statusLines, taskNote } from './core/parse.ts'
import { goalLine, goalOf } from './goal.js'

/** The tool id. */
export const STATUS_TOOL_NAME = 'measure_status'

/** The tool description for the model. */
export const STATUS_TOOL_DESCRIPTION =
  'Shows the Measure position of this project: the tracks, the active task, the Phase/Task position, the [b] count, the next action, and the Specification path. Call it instead of reading the Measure files (measure/tracks.md and the plan).'

/** The JSON schema of the input: no parameters. */
export const STATUS_TOOL_PARAMETERS = { type: 'object', properties: {}, additionalProperties: false }

/**
 * The status text: the shared core's statusLines() joined, then the task note
 * when there is one (the OpenCode adapter's behaviour).
 */
export function statusText({ snapshot = null, guardsOff = null, mode = 'guard', modeLine = null, goal = null } = {}) {
  const lines = statusLines(snapshot, guardsOff).join('\n')
  const note = snapshot === null ? null : taskNote(snapshot, mode)
  const goalText = goalLine(goal)
  const parts = [lines, modeLine, goalText, note].filter(part => part !== null && part !== '')
  return parts.join('\n\n')
}

/** A live snapshot refresh through the deps: the explicit dep wins, else invalidate + get. */
export async function refreshSnapshotOf(deps, root) {
  if (typeof deps.refreshSnapshot === 'function') return deps.refreshSnapshot(root)
  deps.snapshots.invalidate(root)
  return deps.snapshots.get(root)
}

/** The `measure_status` ToolDefinition for `ctx.tools.register`. */
export function measureStatusTool(deps) {
  return {
    name: STATUS_TOOL_NAME,
    description: STATUS_TOOL_DESCRIPTION,
    parameters: STATUS_TOOL_PARAMETERS,
    output: {
      schema: { type: 'string' },
      render: (_args, value) => [{ type: 'text', text: value }],
    },
    async execute(_args, exec) {
      const root = await deps.rootOf(exec?.agent)
      const snapshot = await refreshSnapshotOf(deps, root)
      const guardsOff = await deps.state.bypass.get(root)
      const mode = typeof deps.modeOf === 'function'
        ? await deps.modeOf(root)
        : { value: deps.configMode ?? deps.mode, source: 'config' }
      return statusText({ snapshot, guardsOff, mode: mode.value, modeLine: `Mode: ${mode.value} (${mode.source})`, goal: goalOf(deps, exec?.agent) })
    },
  }
}
