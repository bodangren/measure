// The plugin options: the guard mode from `plugins: [{ package, options: { mode } }]`
// in opencode.json, else from the MEASURE_GUARD_MODE environment variable.
import { parseMode } from './core/parse'
import type { Mode } from './types'

const known = (value: unknown): value is Mode => value === 'advise' || value === 'guard' || value === 'strict'

/** The guard mode: the `mode` option, else the environment variable, else `guard`. */
export const modeFrom = (options: Readonly<Record<string, unknown>>, env: Readonly<Record<string, string | undefined>>): Mode => {
  if (known(options.mode)) return options.mode
  return parseMode(env.MEASURE_GUARD_MODE)
}
