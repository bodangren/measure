export const name = 'measure-guard'

export const inject = [
  'tools',
  'agents',
  'commands',
  'systemPrompt',
  'workingDirectory',
  'fs',
  'subprocess',
  'sessions',
  'webServer',
]

export function apply(ctx, config) {
  // Phase 2 registers the context layer; config.mode is validated there.
}
