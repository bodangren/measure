// One writer agent per canonical root. The plugin only detects a second
// session in the same worktree and warns it once; it does not arbitrate.
export class RootWriters {
  #byRoot = new Map()
  #rootByAgent = new Map()
  #warned = new Set()

  /**
   * Registers an agent as a writer of a root. Returns true only for the first
   * claim of an additional agent (the second, third, ... distinct writer), so
   * each agent gets at most one warning for a root.
   */
  claim(agentId, root) {
    if (this.#rootByAgent.get(agentId) === root) return false
    if (this.#rootByAgent.has(agentId)) this.release(agentId)

    let writers = this.#byRoot.get(root)
    if (writers === undefined) {
      writers = new Set()
      this.#byRoot.set(root, writers)
    }
    writers.add(agentId)
    this.#rootByAgent.set(agentId, root)

    const warningKey = `${root}\u0000${agentId}`
    if (writers.size < 2 || this.#warned.has(warningKey)) return false
    this.#warned.add(warningKey)
    return true
  }

  /** Alias of claim(), for callers that speak of registering a writer. */
  register(agentId, root) {
    return this.claim(agentId, root)
  }

  /** How many agents write a root. */
  countOf(root) {
    return this.#byRoot.get(root)?.size ?? 0
  }

  /** The root an agent writes; null when it is not registered. */
  rootOf(agentId) {
    return this.#rootByAgent.get(agentId) ?? null
  }

  /** Removes an agent (agent/disposed); a later writer can then claim the root. */
  release(agentId) {
    const root = this.#rootByAgent.get(agentId)
    if (root === undefined) return
    this.#rootByAgent.delete(agentId)
    const writers = this.#byRoot.get(root)
    if (writers !== undefined) {
      writers.delete(agentId)
      if (writers.size === 0) this.#byRoot.delete(root)
    }
    this.#warned.delete(`${root}\u0000${agentId}`)
  }
}

/** The one-shot warning a second writer receives (design §4). */
export const secondWriterText = count =>
  `measure-guard: ${count} sessions are working in this git worktree. measure-guard only warns; it does not arbitrate between them.`
