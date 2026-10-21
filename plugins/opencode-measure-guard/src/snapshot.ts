// Reads the Measure files of a project into a Snapshot (the same shape as the
// mod's $.state snapshot), with Node file APIs and git. Pure parsing is in core/.
import type { Snapshot } from './types'

/** The plan file of a track folder: the index's plan link, else plan.md; null when neither exists. */
export const planPathOf = async (_folder: string): Promise<string | null> => {
  throw new Error('not implemented')
}

/** True when `root` is inside a git work tree. */
export const isGitRepo = async (_root: string): Promise<boolean> => {
  throw new Error('not implemented')
}

/** The `git status --porcelain --untracked-files=all` lines of the project; none when git fails. */
export const gitStatus = async (_root: string): Promise<string[]> => {
  throw new Error('not implemented')
}

/** Reads index.md, tracks.md, and the plans of the `[~]` tracks under `<root>/measure/`. */
export const loadSnapshot = async (_root: string): Promise<Snapshot> => {
  throw new Error('not implemented')
}
