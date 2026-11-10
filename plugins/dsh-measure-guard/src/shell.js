// The bounded shell-write grammar lives in the shared core (src/core/guards.ts) so the
// mod, the OpenCode adapter, and this adapter share one implementation; this module keeps
// the adapter's import path stable.
export { shellWritePaths } from './core/guards.ts'
