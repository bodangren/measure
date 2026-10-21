// The guard runtime: one per plugin instance (one project root). It owns the
// snapshot cache, the sessions, the bypass, and the hook handlers. index.ts
// wires the handlers to the OpenCode hooks; the tests call them directly.
import type { Bypass, Sessions } from './state'
import type { Mode, Snapshot } from './types'
import type { CompactionEvent, ContextEvent, PromptEvent } from './hooks/types'

/** The marker that starts every note the plugin appends to a prompt or a tool output. */
export const NOTE_MARK = 'measure-guard'

/** The agent whose prompt holds the rule itself (spec decision 1). */
export const RULE_AGENT = 'measure-orchestrator'

export class Guard {
  constructor(
    readonly root: string,
    readonly mode: Mode,
    readonly sessions: Sessions,
    readonly bypass: Bypass,
    /** The state file base folder; the default is under ~/.local/state. */
    readonly stateBase?: string,
  ) {}

  /** Reads the Measure files again and keeps the result. */
  async refresh(): Promise<Snapshot> {
    throw new Error('not implemented')
  }

  /** The kept snapshot, read on first use. */
  async current(): Promise<Snapshot> {
    throw new Error('not implemented')
  }

  /** Appends the fixed rule section to the system prompt of every agent but RULE_AGENT. */
  async onContext(_event: ContextEvent): Promise<void> {
    throw new Error('not implemented')
  }

  /** Appends the task note to the prompt text when the track or the task changed. */
  async onPrompt(_event: PromptEvent): Promise<void> {
    throw new Error('not implemented')
  }

  /** Adds the task note to the compaction request, and sends it again after the compaction. */
  async onCompaction(_event: CompactionEvent): Promise<void> {
    throw new Error('not implemented')
  }

  /** The task note when the track or the task changed since the last note of the session; null otherwise. */
  async pendingNote(_sessionID: string, _snapshot: Snapshot): Promise<string | null> {
    throw new Error('not implemented')
  }
}
