// The Measure status panel, page, and Work Status section. Reads the Measure
// files through the host file API and renders them with the UI kit.
import { connectHost, HostRequestError, type HostReadyContext } from '@openchamber/sdk'
import {
  applyHostReady,
  mountBanner,
  mountButton,
  mountEmpty,
  mountList,
  mountSeparator,
  mountSpinner,
} from '@openchamber/sdk/ui'
import {
  bandLine,
  blockedCountOfActivePlan,
  copyText,
  markerClassName,
  markerText,
  markerTone,
  needsCurrentTaskBanner,
  nextPendingText,
  statusView,
  type PhaseRow,
  type TrackRow,
} from '../src/band'
import { loadSnapshot, type MeasureHost } from '../src/measure'
import { currentTask } from '../src/parse'
import type { Snapshot } from '../src/types'

type Disposable = { dispose: () => void }

const host = connectHost() as MeasureHost & {
  onReady: (listener: (ctx: HostReadyContext) => void) => () => void
  onDirectory: (listener: (directory: string | null) => void) => () => void
  setBadge: (count: number | null) => Promise<void>
  setHeight: (px: number) => Promise<void>
  compose: (request: { text: string }) => Promise<void>
  writeClipboard: (text: string) => Promise<void>
  openCommit: (sha: string) => Promise<void>
  toast: (request: { kind: 'info' | 'success' | 'error'; message: string }) => Promise<void>
}

const root = document.querySelector('#root') as HTMLElement

/** A spinner mount returned by `mountSpinner` so we can remove it on first paint. */
let loadingSpinner: Disposable | null = null

/** All UI handles the panel mounted. Disposed before each repaint. */
let mounted: Disposable[] = []
const dispose = (): void => {
  if (loadingSpinner !== null) {
    loadingSpinner.dispose()
    loadingSpinner = null
  }
  for (const one of mounted) one.dispose()
  mounted = []
  refreshButton = null
}

/** The current snapshot. Updated by load(). */
let current: Snapshot | null = null
let currentDirectory: string | null = null

/** A generation counter to drop superseded loads. */
let generation = 0

/** True before the first snapshot lands; used by the first paint. */
let firstLoadDone = false

/** A polling timer id, cleared when the directory changes or we unmount. */
let pollTimer: number | null = null

/** A map of last-seen mtimes per path; used to decide when a full reload is needed. */
const seen: Map<string, number> = new Map()
let seenInProgress: Set<string> = new Set()
let seenActivePlan: string | null = null

/** A handle to the refresh button, so we can flip its loading state. */
let refreshButton: { update: (next: { loading?: boolean; label?: string }) => void } | null = null
let loadInFlight = 0

/** Reads the Measure files and updates the panel. */
const load = async (directory: string | null): Promise<void> => {
  if (directory !== currentDirectory) {
    seen.clear()
    seenInProgress = new Set()
    seenActivePlan = null
    currentDirectory = directory
  }
  loadInFlight++
  refreshButton?.update({ loading: true })
  const id = ++generation
  try {
    const snapshot = await loadSnapshot(host, directory)
    if (id !== generation) return
    current = snapshot
    firstLoadDone = true
    await refreshBadge()
    paint()
  } finally {
    loadInFlight--
    if (loadInFlight === 0) refreshButton?.update({ loading: false })
  }
}

/** Sets the rail badge to the blocked count of the active plan, or null. */
const refreshBadge = async (): Promise<void> => {
  const count = current === null ? 0 : blockedCountOfActivePlan(current)
  await host.setBadge(count > 0 ? count : null)
}

/** Updates the Work Status section height to match the band line. */
const adjustHeight = async (): Promise<void> => {
  if (current === null) {
    await host.setHeight(48)
    return
  }
  const line = bandLine(current)
  if (line === null) {
    await host.setHeight(48)
    return
  }
  const lines = line.split(' · ').length
  const height = current.parseError !== null ? 24 * (lines + 2) : 24 * lines + 16
  const clamped = Math.max(24, Math.min(320, height))
  await host.setHeight(clamped)
}

/** The active track id for the panel title band. */
const activeTrackId = (): string | null => current?.active?.entry.id ?? null

/** Renders the Work Status section. Plain text, one or two lines. */
const renderStatus = (): void => {
  dispose()
  if (current === null) {
    root.appendChild(plainLine('Measure: no project open'))
    void adjustHeight()
    return
  }
  const line = bandLine(current)
  if (line === null) {
    root.appendChild(plainLine('Measure: project has no measure/ folder'))
    void adjustHeight()
    return
  }
  root.appendChild(bandElement(line, current.parseError !== null))
  if (current.parseError !== null) {
    const detail = document.createElement('div')
    detail.className = 'band band-error'
    detail.textContent = current.parseError
    root.appendChild(detail)
  }
  void adjustHeight()
}

/** The band element: plain styled text with the first `[X]` marker colored. */
const bandElement = (line: string, error: boolean): HTMLElement => {
  const el = document.createElement('div')
  el.className = error ? 'band band-error' : 'band'
  const marker = /\[([ ~xb])\]/.exec(line)
  if (marker === null) {
    el.textContent = line
    return el
  }
  const m = marker[1] ?? ' '
  const idx = marker.index
  const before = line.slice(0, idx)
  const after = line.slice(idx + 3)
  const span = document.createElement('span')
  span.className = `marker ${markerClassName((m as ' ' | '~' | 'x' | 'b'))}`
  span.textContent = `[${m}]`
  el.append(before, span, after)
  return el
}

const plainLine = (text: string): HTMLElement => {
  const el = document.createElement('div')
  el.className = 'band'
  el.textContent = text
  return el
}

/** Renders the rail panel and full page. Header, then a body. */
const renderPanel = (): void => {
  dispose()
  if (current === null || current.directory === null) {
    paintOpenProject()
    return
  }
  if (!current.hasMeasure) {
    paintNoMeasure()
    return
  }
  if (current.parseError !== null) {
    paintParseError()
    return
  }
  paintBody()
}

/** Mounts the header (title, refresh, copy) and returns the body container. */
const paintHeader = (parent: HTMLElement, bodyClass?: string): HTMLElement => {
  const header = document.createElement('div')
  header.className = 'header'
  parent.appendChild(header)
  const title = document.createElement('div')
  title.className = 'title'
  title.textContent = 'Measure'
  header.appendChild(title)
  refreshButton = mountButton(header, {
    label: 'Refresh',
    variant: 'ghost',
    size: 'xs',
    loading: loadInFlight > 0,
    onClick: () => { void load(currentDirectory) },
  })
  mounted.push(refreshButton as unknown as Disposable)
  const copy = mountButton(header, {
    label: 'Copy status',
    variant: 'outline',
    size: 'xs',
    onClick: () => { void onCopy() },
  })
  mounted.push(copy)
  const body = document.createElement('div')
  if (bodyClass !== undefined) body.className = bodyClass
  parent.appendChild(body)
  return body
}

const paintOpenProject = (): void => {
  const body = paintHeader(root)
  mounted.push(mountEmpty(body, {
    title: 'Open a project',
    body: 'The Measure status appears when a project is open.',
  }))
}

const paintNoMeasure = (): void => {
  const body = paintHeader(root)
  mounted.push(mountEmpty(body, {
    title: 'No Measure in this project',
    body: 'This project has no measure/ folder.',
    action: {
      label: 'Set up Measure',
      onClick: () => { void onSetUp() },
    },
  }))
}

const paintParseError = (): void => {
  const body = paintHeader(root)
  const parseError = current?.parseError
  if (parseError !== null && parseError !== undefined) {
    mounted.push(mountBanner(body, {
      tone: 'error',
      title: 'Cannot read the Measure files',
      body: parseError,
    }))
  }
}

const paintBody = (): void => {
  if (current === null) return
  const view = statusView(current)
  const body = paintHeader(root)

  // Tracks list.
  if (view.tracks.length > 0) {
    const tracksRoot = document.createElement('div')
    body.appendChild(tracksRoot)
    const tracksList = mountList(tracksRoot, {
      items: trackItems(view.tracks),
      onSelect: id => { void onTrackSelect(id) },
    })
    mounted.push(tracksList as unknown as Disposable)
  }

  // Active plan path as a separator.
  if (view.activePlanPath !== null) {
    const sepRoot = document.createElement('div')
    body.appendChild(sepRoot)
    const sep = mountSeparator(sepRoot, { label: view.activePlanPath })
    mounted.push(sep)
  }

  // Current task highlight.
  if (current.active !== null) {
    const task = currentTask(current.active.plan)
    if (task !== null) {
      const taskRoot = document.createElement('div')
      body.appendChild(taskRoot)
      const wrap = document.createElement('div')
      wrap.className = 'current-task'
      const label = document.createElement('div')
      label.className = 'label'
      label.textContent = 'Current task'
      const text = document.createElement('div')
      text.className = 'text'
      text.textContent = `[${task.marker === ' ' ? ' ' : task.marker}] ${task.text}`
      wrap.append(label, text)
      wrap.addEventListener('click', () => { void onTaskContinue() })
      taskRoot.appendChild(wrap)
      mounted.push({ dispose: () => { wrap.remove() } })
    }
  }

  // Banner when the plan has no [~] task.
  if (needsCurrentTaskBanner(current)) {
    const bannerRoot = document.createElement('div')
    body.appendChild(bannerRoot)
    const next = nextPendingText(current)
    const body1 = next === null
      ? 'The plan has no pending task.'
      : `Next task: ${next}. Mark it [~] in plan.md before you change files outside measure/.`
    const banner = mountBanner(bannerRoot, { tone: 'info', title: 'No task is in progress', body: body1 })
    mounted.push(banner)
  }

  // Phases list.
  if (view.phases.length > 0) {
    const phasesRoot = document.createElement('div')
    body.appendChild(phasesRoot)
    const phasesList = mountList(phasesRoot, {
      items: phaseItems(view.phases),
      onSelect: id => { void onPhaseSelect(view, id) },
    })
    mounted.push(phasesList as unknown as Disposable)
  }

  // Blocked tasks.
  if (view.blockedTasks.length > 0) {
    const blockedRoot = document.createElement('div')
    body.appendChild(blockedRoot)
    const blockedSep = mountSeparator(blockedRoot, { label: `Blocked tasks ([b])` })
    mounted.push(blockedSep)
    const blockedList = mountList(blockedRoot, {
      items: view.blockedTasks.map((task, index) => ({
        id: `blocked-${index}`,
        title: task.text,
        badge: task.deferredOwner === null
          ? { label: 'no owner', tone: 'warning' as const }
          : { label: `deferred:${task.deferredOwner}`, tone: 'info' as const },
      })),
      onSelect: () => {},
    })
    mounted.push(blockedList as unknown as Disposable)
  }
}

const trackItems = (tracks: TrackRow[]): Array<{
  id: string
  title: string
  subtitle: string
  meta?: string
  badge?: { label: string; tone: 'primary' | 'success' | 'warning' | 'neutral' | 'error' }
}> =>
  tracks.map(track => ({
    id: track.id,
    title: track.name,
    subtitle: track.folder,
    meta: track.active ? 'active' : '',
    badge: { label: markerText(track.marker), tone: markerTone(track.marker) },
  }))

const phaseItems = (phases: PhaseRow[]): Array<{
  id: string
  leading: string
  title: string
  meta?: string
}> =>
  phases.map((phase, index) => ({
    id: `phase-${index}`,
    leading: `${phase.closed}/${phase.total}`,
    title: phase.title,
    meta: phase.checkpoint === null ? '' : `checkpoint ${phase.checkpoint}`,
  }))

// ----- Event handlers.

const onCopy = async (): Promise<void> => {
  if (current === null) return
  const text = copyText(current)
  try {
    await host.writeClipboard(text)
    await host.toast({ kind: 'success', message: 'Measure status copied' })
  } catch (error) {
    await host.toast({ kind: 'error', message: `Copy failed: ${errorMessage(error)}` })
  }
}

const onSetUp = async (): Promise<void> => {
  const text = 'This project has no measure/ folder. Please run the Measure `setup` workflow for this project (see the `measure` skill, `setup` command). The setup writes measure/index.md, measure/tracks.md, and the starter product/tech-stack/workflow files.'
  await host.compose({ text })
}

const onTrackSelect = async (id: string): Promise<void> => {
  if (current === null) return
  const track = current.tracks.find(t => t.id === id)
  if (track === undefined) return
  if (track.id !== activeTrackId()) {
    await host.toast({ kind: 'info', message: `Track "${track.name}" is not active. Mark it [~] in tracks.md to make it active.` })
    return
  }
  // Active track: send the continue-task prompt.
  await onTaskContinue()
}

const onPhaseSelect = async (view: ReturnType<typeof statusView>, id: string): Promise<void> => {
  const match = /^phase-(\d+)$/.exec(id)
  if (match === null) return
  const index = Number(match[1])
  const phase = view.phases[index]
  if (phase === undefined) return
  if (phase.checkpoint !== null) {
    try {
      await host.openCommit(phase.checkpoint)
    } catch (error) {
      await host.toast({ kind: 'error', message: `Open commit failed: ${errorMessage(error)}` })
    }
  }
}

const onTaskContinue = async (): Promise<void> => {
  if (current?.active === null || current?.active === undefined) return
  const { entry, planPath, plan } = current.active
  const task = currentTask(plan)
  if (task === null) return
  const text = `Continue the task on the active track.\n\nTrack: ${entry.name} (measure/${entry.folder}/).\nPlan: measure/${planPath}.\nCurrent task: [~] ${task.text}\n\nFollow the Task Workflow in measure/workflow.md. Mark the task [x] with the commit SHA when you finish it.`
  await host.compose({ text })
}

const errorMessage = (error: unknown): string => {
  if (error instanceof HostRequestError) return `${error.code}: ${error.message}`
  return error instanceof Error ? error.message : String(error)
}

// ----- Polling and refresh.

const pathsToStat = (): string[] => {
  const paths = ['measure/index.md']
  if (current !== null) {
    if (current.tracksPath !== null) paths.push(current.tracksPath)
    if (current.active !== null) paths.push(current.active.planPath)
  }
  return paths
}

const inProgressFolders = (): Set<string> => {
  if (current === null) return new Set()
  return new Set(current.tracks.filter(t => t.marker === '~').map(t => t.folder))
}

const activePlanPathNow = (): string | null => current?.active?.planPath ?? null

/** Stats the known files; reloads when any mtime changed or tracks moved. */
const poll = async (): Promise<void> => {
  if (currentDirectory === null) return
  let changed = false
  const stats = await Promise.all(pathsToStat().map(async path => [path, await host.stat(path)] as const))
  for (const [path, stat] of stats) {
    if (stat.kind !== 'file') {
      if (seen.has(path)) {
        seen.delete(path)
        changed = true
      }
      continue
    }
    const prev = seen.get(path)
    if (prev !== stat.mtime) {
      if (prev !== undefined) changed = true
      seen.set(path, stat.mtime)
    }
  }
  const nowInProgress = inProgressFolders()
  if (!sameSet(nowInProgress, seenInProgress)) {
    seenInProgress = nowInProgress
    changed = true
  }
  const nowActivePlan = activePlanPathNow()
  if (nowActivePlan !== seenActivePlan) {
    seenActivePlan = nowActivePlan
    changed = true
  }
  if (changed) await load(currentDirectory)
}

const sameSet = (a: Set<string>, b: Set<string>): boolean => {
  if (a.size !== b.size) return false
  for (const v of a) if (!b.has(v)) return false
  return true
}

const startPolling = (): void => {
  if (pollTimer !== null) return
  pollTimer = window.setInterval(() => { void poll() }, 5000)
}

const stopPolling = (): void => {
  if (pollTimer !== null) window.clearInterval(pollTimer)
  pollTimer = null
}

// ----- The mount hook. Renders the right surface for the first onReady, and
// keeps repainting as directory and session change.

let mountedOnce = false
const paint = (): void => {
  const surface = lastSurface ?? 'panel'
  dispose()
  if (!firstLoadDone) {
    paintLoading()
    return
  }
  if (surface === 'status') renderStatus()
  else renderPanel()
}

let lastSurface: 'panel' | 'page' | 'status' | 'dialog' | 'background' | 'file' | 'popover' = 'panel'

host.onReady((ctx) => {
  applyHostReady(ctx, document.documentElement)
  lastSurface = ctx.surface
  if (!mountedOnce) {
    mountedOnce = true
    host.onDirectory((directory) => {
      void load(directory)
    })
    startPolling()
    void load(ctx.directory)
  }
  paint()
})

/** Mount a spinner that the next paint removes. */
const paintLoading = (): void => {
  if (loadingSpinner !== null) return
  loadingSpinner = mountSpinner(root, { label: 'Loading Measure status' })
}