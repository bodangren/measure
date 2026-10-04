// Reads the Measure files of the project through `$` and builds a Snapshot.
import type { EngineInterface } from 'claude-code'
import type { Snapshot } from '../types'

/** Reads index.md, tracks.md, and the plans of the `[~]` tracks. */
export const loadSnapshot = async ($: EngineInterface): Promise<Snapshot> => {
  throw new Error('loadSnapshot: not implemented')
}
