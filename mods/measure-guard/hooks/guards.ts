// Pure guard decisions. Each takes a GuardContext and the call, and returns
// null to allow it or { deny } with the text the agent reads.
import type { Decision, GuardContext } from '../types'

/** The text every deny ends with: the bypass. */
export const BYPASS = 'If this block is wrong, the user can run /measure-off.'

/**
 * The edit guard (guard and strict modes): denies a write to a file inside
 * the project root and outside measure/ while no task in the active plan has
 * `[~]`. Allows on a parse error, outside the project, and in advise mode.
 */
export const editDecision = (context: GuardContext, path: string): Decision => {
  throw new Error('editDecision: not implemented')
}
