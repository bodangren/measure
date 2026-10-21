// The end-of-turn check: what a user turn keeps from its start, what the idle
// event computes, and what the plugin then does. Pure helpers here; the Guard
// class runs them with the snapshot and the session, and index.ts does the I/O
// (the synthetic message or the follow-up prompt) through ctx.session.
import type { Mode, Snapshot, TurnState } from '../types'

/** What the plugin does after an idle check. */
export type IdleAction =
  /** Nothing to do: no problems, advise mode, the bypass, or no turn. */
  | { kind: 'none'; problems: string[] }
  /** Guard mode, or strict mode after MAX_BLOCKS follow-ups: a synthetic reminder in the session and a reminder on the next prompt. */
  | { kind: 'remind'; problems: string[]; text: string }
  /** Strict mode: a follow-up prompt that keeps the agent working on the problems. */
  | { kind: 'follow-up'; problems: string[]; text: string }

/** The turn state at a user prompt: the status lines and the `[x]` tasks without SHA at the start. */
export const startTurn = (snapshot: Snapshot, status: readonly string[]): TurnState => {
  throw new Error(`not implemented: startTurn(${snapshot.root}, ${status.length})`)
}

/**
 * The idle check: the problems from the status lines at idle and the
 * snapshot, and the action for the mode. `turn` is null when no prompt
 * started a turn in this session (nothing happens).
 */
export const endTurn = (mode: Mode, turn: TurnState | null, snapshot: Snapshot, status: readonly string[], guardsOff: boolean): IdleAction => {
  throw new Error(`not implemented: endTurn(${mode}, ${turn === null}, ${snapshot.root}, ${status.length}, ${guardsOff})`)
}

/** The follow-up prompt text (strict mode): the problems and the instruction to fix them now. */
export const followUpText = (problems: readonly string[]): string => {
  throw new Error(`not implemented: followUpText(${problems.length})`)
}

/** The reminder text for the synthetic message and the next prompt (guard mode, or strict after the follow-ups). */
export const reminderText = (problems: readonly string[]): string => {
  throw new Error(`not implemented: reminderText(${problems.length})`)
}
