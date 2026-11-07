// The strict-mode commit seam (FR-13). The rules and the texts are the shared
// core's (`parseCommitCommand`, `commitDecision`, `commitReminder`); this module
// reads the staged files through the adapter's git seam and shapes the
// decision, the note, and the post-commit reminder flag.
import { commitDecision, commitReminder, parseCommitCommand, pathsOfStatus, taskKey } from './core/guards.ts'
import { gitStatus } from './snapshot.js'

export { commitDecision, commitReminder, parseCommitCommand }

/** The SHA of a finished commit line: `[main abc1234] message`. */
export const commitShaOf = text => /^\[[^\]\n]* ([0-9a-f]{7,40})\]/m.exec(text)?.[1] ?? null

/**
 * The files a commit takes, relative to the root: the staged paths
 * (`git diff --cached --name-only`) and, when the command takes changes (`-a`
 * or a `git add` before it), the changed and untracked paths too.
 */
export async function stagedFiles(deps, root, takesChanges) {
  const staged = await deps.io.gitLines(['diff', '--cached', '--name-only'], root)
  if (!takesChanges) return staged
  const status = await gitStatus(deps.io, root)
  return [...new Set([...staged, ...pathsOfStatus(status)])]
}

/**
 * The strict commit check of one shell command (FR-13): `parseCommitCommand`
 * first, then the shared `commitDecision` on the files the commit takes. The
 * returned `commitDue` is true only for an allowed commit of a `[~]` task with
 * the guards on: that call gets the post-commit reminder, and the SHA is read
 * from its result.
 */
export async function commitCheck(deps, context, command) {
  const none = { decision: null, note: null, commitDue: false }
  const commit = parseCommitCommand(typeof command === 'string' ? command : '')
  if (commit === null) return none
  const check = commitDecision(context, commit, await stagedFiles(deps, context.snapshot.root, commit.takesChanges))
  if (check.decision !== null) return { decision: check.decision, note: check.note, commitDue: false }
  return { decision: null, note: check.note, commitDue: context.guardsOff === null && taskKey(context.snapshot) !== null }
}
