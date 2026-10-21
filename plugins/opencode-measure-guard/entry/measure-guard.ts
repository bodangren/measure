// The plugin entry file. OpenCode 2.0.32 loads the direct `.ts` files of
// `~/.config/opencode/plugins/`; it does not load a package folder with a
// package.json there. The installer copies this file to
// `~/.config/opencode/plugins/measure-guard.ts`, next to the package folder
// `opencode-measure-guard/`, and this file re-exports the server plugin.
export { default } from './opencode-measure-guard/src/index.ts'
