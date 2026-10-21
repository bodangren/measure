// The server entry. The OpenCode plugin host resolves `<folder>/server` or
// `<folder>/index` for the server plugin and `<folder>/tui` for the terminal
// plugin of a folder under ~/.config/opencode/plugins/ (package.json exports
// are not read for local folders).
export { default } from './src/index.ts'
