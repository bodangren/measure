// The `measure_status` tool: the status lines and the task note as text, so an
// agent can ask for the plan position instead of reading the Measure files.
import type { Guard } from './guard'

/** The tool's id as OpenCode lists it. */
export const STATUS_TOOL_ID = 'measure_status'

/** The tool's description for the model. */
export const STATUS_TOOL_DESCRIPTION =
  'Shows the Measure position of this project: the tracks, the active track and its [~] task or the next action, the [b] count, and whether the guards are off. Call it instead of reading measure/tracks.md and plan.md.'

/** The JSON schema of the input: no parameters. */
export const STATUS_TOOL_INPUT = { type: 'object', properties: {}, additionalProperties: false } as const

/** The text the tool returns: the status lines, then the task note when there is one. */
export const statusText = async (guard: Guard): Promise<string> => {
  throw new Error(`not implemented: statusText(${guard.root})`)
}
