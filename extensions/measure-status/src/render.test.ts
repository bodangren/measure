// FR-5, FR-7, FR-8, FR-12, FR-16 D2: the board renderer. Every fixture
// text is invented; no real repo data appears here.
import { describe, expect, test } from 'vitest'
import {
  buildBoard,
  type Card,
  type TrackInput,
} from './board'
import { parsePlan } from './parse'
import {
  GRANT_BANNER,
  escapeHtml,
  renderCard,
  renderPage,
  renderSection,
  sectionOpen,
  type PageView,
  type UiState,
} from './render'
import { BOARD_CSS } from './styles'

const NOW = 1_800_000_000_000
const DAY = 86_400_000

const ui = (over: Partial<UiState> = {}): UiState => ({
  open: {},
  doneOpen: {},
  expanded: {},
  ...over,
})

const input = (over: Partial<TrackInput> = {}): TrackInput => ({
  repo: 'invented-repo',
  title: 'Invented track',
  registryMarker: ' ',
  folder: 'tracks/invented_1',
  plan: { kind: 'plan', plan: parsePlan('## Phase 1: Work\n\n- [~] Task: Work\n') },
  lastChange: NOW - DAY,
  doneDate: null,
  doneSource: null,
  now: NOW,
  ...over,
})

const cardOf = (over: Partial<TrackInput> = {}): Card =>
  buildBoard('invented-repo', [input(over)]).cards[0] as Card

const renderSources = import.meta.glob(['./render.ts', './styles.ts'], {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

describe('escapeHtml', () => {
  test('escapes a hostile title', () => {
    expect(escapeHtml('<img src=x onerror=alert(1)>')).not.toContain('<img')
    expect(escapeHtml('<img src=x onerror=alert(1)>')).toContain('&lt;img')
  })

  test('escapes a script close and a folder name', () => {
    const folder = '"><script>alert(1)</script>'
    expect(escapeHtml(folder)).not.toContain('<script>')
    expect(escapeHtml('Fish & Chips "quoted"')).toContain('&amp;')
  })
})

describe('renderCard', () => {
  test('shows the position line of a current task', () => {
    const html = renderCard(cardOf(), NOW)
    expect(html).toContain('Phase 1/1')
    expect(html).toContain('[~]')
  })

  test('escapes a hostile title and a hostile line', () => {
    const hostile = cardOf({
      title: '<img src=x onerror=alert(1)>',
      plan: {
        kind: 'plan',
        plan: parsePlan('## Phase 1: Work\n\n- [x] Task: One\n- [b] Task: "><script>\n- [~] Task: Three\n'),
      },
    })
    const html = renderCard(hostile, NOW)
    expect(html).not.toContain('<img src=x')
    expect(html).not.toContain('"><script>')
    expect(html).toContain('&lt;img')
  })

  test('shows the note when no current task exists', () => {
    const html = renderCard(
      cardOf({ plan: { kind: 'plan', plan: parsePlan('## Phase 1: Work\n\n- [x] Task: One\n') } }),
      NOW,
    )
    expect(html).toContain('All tasks closed.')
  })

  test('shows the line Not in the registry for a folder with no entry', () => {
    const html = renderCard(cardOf({ registryMarker: null }), NOW)
    expect(html).toContain('Not in the registry')
  })
})

describe('renderSection', () => {
  test('shows the header counts and the Blocked badge', () => {
    const board = buildBoard('invented-repo', [
      input({ title: 'Blocked one', registryMarker: 'b', plan: { kind: 'missing' } }),
      input({ title: 'Planned one', plan: { kind: 'plan', plan: parsePlan('## Phase 1: W\n\n- [ ] Task: One\n') } }),
    ])
    const html = renderSection({ status: 'ready', repo: { id: 'invented-repo', path: '~/Desktop/invented-repo' }, board }, ui(), NOW)
    expect(html).toContain('invented-repo')
    expect(html).toContain('Blocked')
    expect(html).toContain('aria-expanded')
  })

  test('caps a column at 8 cards with a Show N more button', () => {
    const board = buildBoard(
      'invented-repo',
      Array.from({ length: 10 }, (_value, index) => input({ title: `Card ${index}` })),
    )
    const html = renderSection({ status: 'ready', repo: { id: 'invented-repo', path: '~/Desktop/invented-repo' }, board }, ui(), NOW)
    expect(html).toContain('Show 2 more')
    expect(html).toContain('data-action="show-more"')
  })

  test('keeps the Done column closed at first paint', () => {
    const board = buildBoard('invented-repo', [input({ registryMarker: 'x', folder: 'archive/done_1' })])
    const html = renderSection({ status: 'ready', repo: { id: 'invented-repo', path: '~/Desktop/invented-repo' }, board }, ui(), NOW)
    expect(html).toContain('data-action="toggle-done"')
    expect(html).toContain('aria-expanded="false"')
  })

  test('shows the D2 count line and the not archived badge', () => {
    const board = buildBoard('invented-repo', [
      input({ title: 'Kept', registryMarker: 'x', folder: 'tracks/kept_1', lastChange: NOW - DAY }),
      input({ title: 'Moved', registryMarker: 'x', folder: 'archive/moved_2', lastChange: NOW - 2 * DAY }),
    ])
    const html = renderSection({ status: 'ready', repo: { id: 'invented-repo', path: '~/Desktop/invented-repo' }, board }, ui({ doneOpen: { 'invented-repo': true } }), NOW)
    expect(html).toContain('more done')
    expect(html).toContain('archived')
    expect(html).toContain('Not archived')
  })
})

describe('renderPage', () => {
  test('shows the grant banner for a NOT_GRANTED section', () => {
    const view: PageView = {
      states: [{ status: 'error', repo: { id: 'invented-repo', path: '~/Desktop/invented-repo' }, code: 'NOT_GRANTED', line: 'Cannot read invented-repo: NOT_GRANTED.' }],
      ui: ui(),
      now: NOW,
      busy: false,
    }
    expect(renderPage(view)).toContain(GRANT_BANNER)
  })

  test('keeps the repo order of the roster', () => {
    const boardA = buildBoard('invented-a', [input({ title: 'A' })])
    const boardB = buildBoard('invented-b', [input({ title: 'B' })])
    const view: PageView = {
      states: [
        { status: 'ready', repo: { id: 'invented-a', path: '~/Desktop/invented-a' }, board: boardA },
        { status: 'ready', repo: { id: 'invented-b', path: '~/Desktop/invented-b' }, board: boardB },
      ],
      ui: ui(),
      now: NOW,
      busy: false,
    }
    const html = renderPage(view)
    expect(html.indexOf('invented-a')).toBeLessThan(html.indexOf('invented-b'))
  })
})

describe('sectionOpen', () => {
  test('opens a section with a Blocked card and closes a quiet section', () => {
    const blocked = { status: 'ready', repo: { id: 'r', path: '~/Desktop/r' }, board: buildBoard('r', [input({ registryMarker: 'b', plan: { kind: 'missing' } })]) } as const
    const quiet = { status: 'ready', repo: { id: 'q', path: '~/Desktop/q' }, board: buildBoard('q', [input({ plan: { kind: 'plan', plan: parsePlan('## Phase 1: W\n\n- [ ] Task: One\n') } })]) } as const
    expect(sectionOpen(blocked, ui())).toBe(true)
    expect(sectionOpen(quiet, ui())).toBe(false)
  })
})

describe('the style and render sources', () => {
  test('hold the board CSS as one string', () => {
    expect(typeof BOARD_CSS).toBe('string')
    expect(BOARD_CSS).toContain('var(--oc-')
  })

  test('hold no colour literal', () => {
    for (const [path, text] of Object.entries(renderSources)) {
      expect(text, `colour literal in ${path}`).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
      expect(text, `colour function in ${path}`).not.toMatch(/(?:\brgb\s*\(|\bhsl\s*\()/)
    }
  })

  test('hold no remote URL', () => {
    for (const [path, text] of Object.entries(renderSources)) {
      expect(text, `remote URL in ${path}`).not.toContain('https://')
      expect(text, `remote URL in ${path}`).not.toContain('http://')
      expect(text, `fetch call in ${path}`).not.toContain('fetch(')
    }
  })
})
