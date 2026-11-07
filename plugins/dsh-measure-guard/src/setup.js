// The setup offer of NFR-1 for a git repository without a measure/ folder. The
// strings and the two decisions are the shared core's (src/core/guards.ts),
// re-exported rather than copied; this module only adds the agent-state helpers.
export { SETUP_DENY, SETUP_PROMPT, needsSetup, setupBandText } from './core/guards.ts'

/** The three answers to the setup question. */
export const SETUP_CHOICES = ['pending', 'off', 'setup']

/** True for one of the three setup answers. */
export function isSetupChoice(value) {
  return SETUP_CHOICES.includes(value)
}

/** The stored answer of an agent; null before it answered. */
export function setupChoiceOf(state, agentId) {
  return state.agents.sessionOf(agentId).setupChoice
}

/**
 * Stores the setup answer in agent state: `off`, `setup`, or `pending`; an
 * unknown answer reads as `pending` (the question is asked again).
 */
export function resolveSetupChoice(state, agentId, choice) {
  const next = isSetupChoice(choice) ? choice : 'pending'
  state.agents.sessionOf(agentId).setupChoice = next
  return next
}
