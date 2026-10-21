// The plugin options: the guard mode from `plugins: [{ package, options: { mode } }]`
// in opencode.json, else from the MEASURE_GUARD_MODE environment variable.
import type { Mode } from './types'

/** The guard mode: the `mode` option, else the environment variable, else `guard`. */
export const modeFrom = (_options: Readonly<Record<string, unknown>>, _env: Readonly<Record<string, string | undefined>>): Mode => {
  throw new Error('not implemented')
}
