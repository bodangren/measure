// The terminal plugin: the band above the prompt (prompt.footer.status), the
// Measure block of the sidebar (sidebar.content), and the /measure-guard
// dialog. It reads the Measure files and the state file itself; the server
// plugin never talks to it.
import { Plugin } from '@opencode/plugin/tui'
import { TextAttributes } from '@opentui/core'
import { For, Show, createSignal, onCleanup, onMount } from 'solid-js'
import { statSync } from 'node:fs'
import { loadSnapshot } from './snapshot'
import { readStateFile, stateFilePath } from './state'
import type { StateFile } from './state'
import type { Snapshot } from './types'
import { REFRESH_EVENTS, REFRESH_PERIOD_MS, bandModel, needsRefresh, sidebarLines, watchedPaths } from './tui/model'
import type { BandModel, Mtimes, Tone } from './tui/model'

/** The plugin id of the terminal part. */
export const TUI_PLUGIN_ID = 'measure.guard.tui'

/** What the components render from. */
type View = { snapshot: Snapshot | null; state: StateFile | null }

const mtimesOf = (paths: readonly string[]): Mtimes =>
  Object.fromEntries(
    paths.map(path => {
      try {
        return [path, statSync(path).mtimeMs]
      } catch {
        return [path, 0]
      }
    }),
  )

/** Reads the snapshot and the state file of a root. */
const readView = async (root: string): Promise<View> => {
  const snapshot = await loadSnapshot(root)
  const state = await readStateFile(root)
  return { snapshot, state }
}

const attributesOf = (tone: Tone): number => (tone === 'dim' ? TextAttributes.DIM : TextAttributes.NONE)

export default Plugin.define({
  id: TUI_PLUGIN_ID,
  async setup(context) {
    const root = context.location?.directory ?? process.cwd()
    const [view, setView] = createSignal<View>({ snapshot: null, state: null })
    let seen: Mtimes = {}
    let reading: Promise<void> | null = null

    /** Reads the files again when one changed, or always when `force` is set. */
    const refresh = async (force = false): Promise<void> => {
      if (reading !== null) return reading
      reading = (async () => {
        const current = view()
        const paths = watchedPaths(root, current.snapshot, stateFilePath(root))
        const now = mtimesOf(paths)
        if (force || Object.keys(seen).length === 0 || needsRefresh(seen, now)) {
          const next = await readView(root)
          seen = mtimesOf(watchedPaths(root, next.snapshot, stateFilePath(root)))
          setView(next)
        }
      })().finally(() => {
        reading = null
      })
      return reading
    }

    void refresh(true)
    const timer = setInterval(() => void refresh(), REFRESH_PERIOD_MS)
    const stopListening = context.data.listen(({ details }) => {
      if (REFRESH_EVENTS.has(details.type)) void refresh()
    })

    const showStatus = async (): Promise<void> => {
      await refresh(true)
      const current = view()
      const lines = sidebarLines(current.snapshot, current.state)
      await context.ui.dialog.select({
        title: 'Measure',
        options: lines.map((line, index) => ({ title: line, value: index })),
      })
    }

    const Band = () => {
      // The keymap layer lives in a mounted component, as the host requires.
      context.keymap.layer(() => ({
        commands: [
          {
            id: 'measure.guard.status',
            title: 'Measure: show the status',
            description: 'The tracks, the active task, the [b] count, and the guard state',
            group: 'Measure',
            palette: true,
            slash: { name: 'measure-guard' },
            run: () => void showStatus(),
          },
        ],
      }))
      onMount(() => void refresh())
      const model = (): BandModel => bandModel(view().snapshot, view().state)
      const lines = () => model()?.lines ?? []
      return (
        <Show when={model() !== null}>
          <box flexDirection="column">
            <For each={lines()}>
              {line => (
                <text wrapMode="none" truncate attributes={attributesOf(line.tone)} fg={line.tone === 'warn' ? context.theme.warning : undefined}>
                  {line.text}
                </text>
              )}
            </For>
          </box>
        </Show>
      )
    }

    const Sidebar = () => {
      onMount(() => void refresh())
      return (
        <box flexDirection="column">
          <For each={sidebarLines(view().snapshot, view().state)}>{line => <text wrapMode="none" truncate>{line}</text>}</For>
        </box>
      )
    }

    const unslotBand = context.ui.slot({ append: 'prompt.footer.status', render: () => <Band /> })
    const unslotSidebar = context.ui.slot({ append: 'sidebar.content', render: () => <Sidebar /> })

    return () => {
      clearInterval(timer)
      stopListening()
      unslotBand()
      unslotSidebar()
    }
  },
})
