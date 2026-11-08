// Render tests over the shipped client bundle (design §8): a stub module loader
// captures the factory, a miniature React renders the registered components to a
// plain element tree, and stubbed fetch/setInterval feed the band and the panel
// their Host views. No DOM, no jsdom, no build step: the file under test is the
// shipped client.js.
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const CLIENT_PATH = fileURLToPath(new URL('../client.js', import.meta.url))
const source = readFileSync(CLIENT_PATH, 'utf8')

/** The module-loader entry the bundle registers. */
const loadEntry = () => {
  let entry = null
  const window = { __ModuleLoader__: { load: value => { entry = value } } }
  new Function('window', source)(window)
  assert.ok(entry !== null, 'the bundle called window.__ModuleLoader__.load')
  return entry
}

/**
 * A miniature React: createElement, useState, useEffect, and Component, enough
 * for the shipped bundle. Hooks are keyed by component position; `flush` renders,
 * runs effects with dependency comparison, and re-renders while state settles.
 */
const makeReact = () => {
  const instances = new Map()
  let currentKey = null
  let hookIndex = 0
  let dirty = false
  let pendingEffects = []

  const slotOf = key => {
    if (!instances.has(key)) instances.set(key, { state: new Map(), effectDeps: new Map(), cleanups: new Map(), instance: null })
    return instances.get(key)
  }

  const createElement = (type, props, ...children) => {
    const next = { ...(props === null || props === undefined ? {} : props) }
    if (children.length === 1) next.children = children[0]
    else if (children.length > 1) next.children = children
    return { type, props: next }
  }

  const useState = initial => {
    const slot = slotOf(currentKey)
    const index = hookIndex
    hookIndex += 1
    if (!slot.state.has(index)) slot.state.set(index, typeof initial === 'function' ? initial() : initial)
    const set = value => {
      const next = typeof value === 'function' ? value(slot.state.get(index)) : value
      if (!Object.is(next, slot.state.get(index))) {
        slot.state.set(index, next)
        dirty = true
      }
    }
    return [slot.state.get(index), set]
  }

  const depsChanged = (previous, next) => {
    if (!previous || !next) return true
    return previous.length !== next.length || previous.some((value, index) => !Object.is(value, next[index]))
  }

  const useEffect = (fn, deps) => {
    const slot = slotOf(currentKey)
    const index = hookIndex
    hookIndex += 1
    if (depsChanged(slot.effectDeps.get(index), deps)) pendingEffects.push({ slot, index, fn, deps: deps ? [...deps] : null })
  }

  class Component {
    constructor(props) {
      this.props = props
    }
  }

  const renderNode = (node, key) => {
    if (node === null || node === undefined || typeof node === 'boolean') return null
    if (typeof node === 'string' || typeof node === 'number') return { text: String(node) }
    if (Array.isArray(node)) return node.map((child, index) => renderNode(child, `${key}.${index}`)).filter(Boolean)
    const { type, props } = node
    if (typeof type === 'string') {
      const rendered = renderNode(props.children, `${key}>children`)
      return { tag: type, props, children: rendered === null ? [] : Array.isArray(rendered) ? rendered : [rendered] }
    }
    if (typeof type === 'function') {
      const instanceKey = `${key}:${type.name || 'Component'}`
      if (type.prototype instanceof Component) {
        const slot = slotOf(instanceKey)
        if (slot.instance === null) slot.instance = new type(props)
        else slot.instance.props = props
        return renderNode(slot.instance.render(), `${instanceKey}.render`)
      }
      const previousKey = currentKey
      const previousIndex = hookIndex
      currentKey = instanceKey
      hookIndex = 0
      const output = type(props)
      currentKey = previousKey
      hookIndex = previousIndex
      return renderNode(output, `${instanceKey}.out`)
    }
    throw new Error(`unknown element type: ${String(type)}`)
  }

  const flush = async (root, rounds = 12) => {
    let tree = null
    for (let pass = 0; pass < rounds; pass += 1) {
      dirty = false
      pendingEffects = []
      tree = renderNode(root, 'root')
      const effects = pendingEffects
      pendingEffects = []
      for (const effect of effects) {
        const cleanup = effect.slot.cleanups.get(effect.index)
        if (typeof cleanup === 'function') cleanup()
        const result = effect.fn()
        if (typeof result === 'function') effect.slot.cleanups.set(effect.index, result)
        effect.slot.effectDeps.set(effect.index, effect.deps)
      }
      await Promise.resolve()
      await Promise.resolve()
      await Promise.resolve()
      if (!dirty && pendingEffects.length === 0) break
    }
    return tree
  }

  return { createElement, useState, useEffect, Component, flush }
}

/** Every text fragment of a rendered tree, joined with single spaces. */
const textOf = node => {
  if (node === null || node === undefined) return ''
  if (Array.isArray(node)) return node.map(textOf).filter(Boolean).join(' ')
  if (typeof node.text === 'string') return node.text
  return (node.children ?? []).map(textOf).filter(Boolean).join(' ')
}

/** Every rendered node in document order. */
const walk = (node, visit) => {
  if (node === null || node === undefined) return
  if (Array.isArray(node)) {
    node.forEach(child => walk(child, visit))
    return
  }
  visit(node)
  ;(node.children ?? []).forEach(child => walk(child, visit))
}

const find = (tree, predicate) => {
  let found = null
  walk(tree, node => {
    if (found === null && predicate(node)) found = node
  })
  return found
}

const byGuardTag = (tree, tag) => find(tree, node => node.props !== undefined && node.props['data-measure-guard'] === tag)
const buttonsOf = tree => {
  const buttons = []
  walk(tree, node => {
    if (node.tag === 'button') buttons.push(node)
  })
  return buttons
}

/** The test-local fetch and timer stubs, reset per rendering. */
const stubs = {
  queue: [],
  calls: [],
  intervals: [],
}

globalThis.fetch = async (url, options = {}) => {
  stubs.calls.push({ url: String(url), options })
  if (stubs.queue.length > 0) return stubs.queue.shift()
  return { ok: true, json: async () => ({}) }
}
globalThis.setInterval = (fn, ms) => {
  stubs.intervals.push({ fn, ms })
  return stubs.intervals.length
}
globalThis.clearInterval = () => {}

const resetStubs = () => {
  stubs.queue = []
  stubs.calls = []
  stubs.intervals = []
}

/** The bundle, its applied context, and the captured registrations. */
const makeBundle = () => {
  const react = makeReact()
  const captured = { injected: [], registrations: [], decorations: [], effects: [] }
  const locale = {
    namespace: null,
    dictionaries: null,
    register(namespace, dictionaries) {
      this.namespace = namespace
      this.dictionaries = dictionaries
    },
    bind(namespace) {
      const dictionaries = this.dictionaries ?? {}
      return key => (dictionaries.en && dictionaries.en[key] !== undefined ? dictionaries.en[key] : key)
    },
  }
  const layout = { selected: null, selectPanel(id) { this.selected = id } }
  const slots = {
    inject(name, producer) {
      captured.injected.push(name)
      let value = producer()
      // The panel registration is a generator: run it once.
      if (value !== null && value !== undefined && typeof value.next === 'function') value = value.next().value
      captured.registrations.push({ name, value })
    },
    register(meta, component) {
      return { meta, component }
    },
  }
  const ctx = {
    effect(fn) {
      const value = fn()
      captured.effects.push(value)
      return value
    },
    slots,
    locale,
    layout,
    sessions: { list: null },
    commandUi: {
      decorate(definition) {
        captured.decorations.push(definition)
      },
    },
  }
  const entry = loadEntry()
  const bundle = entry.factory(specifier => {
    if (specifier === 'react') return react
    throw new Error(`the bundle required an unexpected module: ${specifier}`)
  })
  bundle.apply(ctx)
  const componentOf = name => {
    const registration = captured.registrations.find(item => item.name === name && item.value !== undefined && item.value !== null)
    return registration === undefined ? null : registration.value.component
  }
  return {
    entry,
    bundle,
    react,
    captured,
    ctx,
    locale,
    componentOf,
    band: () => componentOf('conversation.input.dock'),
    panel: () => componentOf('main'),
    sidebar: () => componentOf('sidebar.panellist'),
  }
}

const HOST_VIEW = {
  band: 'Measure · Demo · Phase 1/2 · Task 1/3 [~] Task: Build the band',
  bandFull: 'Measure · Demo · Phase 1/2 · Task 1/3 [~] Task: Build the band · full text',
  guardsOff: 'config',
  mode: { value: 'guard', source: 'config' },
  goal: { phase: 'active', round: 3, maxRounds: 256, objective: 'Evolve the harness' },
  setup: { choice: null, text: null },
  problems: ['src/x.js changed outside measure/ while no task is [~]'],
}

const en = key =>
  ({
    panel: 'Measure',
    panelTitle: 'Measure status',
    setup: 'No measure/ folder in this project. Create one to start a track.',
    problems: 'Problems',
    guards: 'Guards',
    goal: 'Goal',
    mode: 'Mode',
    setupSetUp: 'Set up Measure',
    setupOff: 'Turn off for session',
    guardsOn: 'on',
    guardsSession: 'off for this session',
    guardsRepo: 'off for this repository',
    session: 'Session',
    empty: 'No session is open. Open or create a conversation to see its Measure status.',
    loading: 'Loading…',
    refresh: 'Refresh',
  })[key] ?? key

const bandProps = (t = en) => ({ t, session: { sessionId: 'session-1' } })

const renderBand = async (harness, props, views) => {
  resetStubs()
  stubs.queue = views.map(view => ({ ok: true, json: async () => view }))
  return harness.react.flush(harness.react.createElement(harness.band(), props))
}

test('the bundle loads through the module loader and registers its slots, locale, and command', () => {
  const harness = makeBundle()
  assert.equal(harness.entry.id, 'dsh-measure-guard')
  assert.deepEqual(harness.bundle.inject, ['slots', 'sessions', 'locale', 'layout', 'commandUi'])
  assert.deepEqual(harness.captured.injected, ['conversation.input.dock', 'main', 'sidebar.panellist'])
  const band = harness.captured.registrations[0].value.meta
  assert.equal(band.name, 'conversation.input.dock')
  assert.equal(band.id, 'measure-guard')
  assert.equal(band.order, 20)
  assert.equal(harness.captured.registrations[1].value.meta.key, 'measure')
  const sidebar = harness.captured.registrations[2].value.meta
  assert.equal(sidebar.name, 'sidebar.panellist')
  assert.equal(sidebar.id, 'measure')
  assert.equal(harness.locale.namespace, 'measure-guard')
  assert.ok(harness.locale.dictionaries.en && harness.locale.dictionaries.zh)
  assert.equal(harness.captured.decorations.length, 1)
  const decoration = harness.captured.decorations[0]
  assert.equal(decoration.name, 'measure-status')
  assert.equal(decoration.available(), true)
  decoration.ui.run()
  assert.equal(harness.ctx.layout.selected, 'measure')
})

test('the band renders the host line, full text, guards, mode, goal, setup buttons, and problems', async () => {
  const harness = makeBundle()
  const tree = await renderBand(harness, bandProps(), [HOST_VIEW])
  const band = byGuardTag(tree, 'band')
  assert.ok(band !== null, 'the band element is missing')
  const text = textOf(band)
  assert.match(text, /Measure · Demo · Phase 1\/2/)
  assert.match(text, /Guards: on/)
  assert.match(text, /Mode: guard \(config\)/)
  assert.match(text, /Goal: active · round 3\/256 · Evolve the harness/)
  assert.match(text, /Problems: src\/x\.js changed outside measure\//)
  const labels = buttonsOf(tree).map(button => textOf(button))
  assert.deepEqual(labels, ['Set up Measure', 'Turn off for session'])
  const title = find(tree, node => node.props !== undefined && node.props.title !== undefined)
  assert.equal(title.props.title, HOST_VIEW.bandFull)
})

test('the band requests the state route for its session and polls every 2 s', async () => {
  const harness = makeBundle()
  await renderBand(harness, bandProps(), [HOST_VIEW])
  assert.equal(stubs.calls.length, 1)
  assert.equal(stubs.calls[0].url, '/measure-guard/state?sessionId=session-1')
  assert.equal(stubs.calls[0].options.method, undefined)
  assert.deepEqual(
    stubs.intervals.map(item => item.ms),
    [2000],
  )
})

test('a setup button POSTs the answer and refetches the view', async () => {
  const harness = makeBundle()
  const tree = await renderBand(harness, bandProps(), [HOST_VIEW])
  const buttons = buttonsOf(tree)
  buttons[0].props.onClick()
  await Promise.resolve()
  await Promise.resolve()
  const post = stubs.calls.find(call => call.url === '/measure-guard/setup')
  assert.ok(post !== undefined, 'the setup POST is missing')
  assert.equal(post.options.method, 'POST')
  assert.deepEqual(JSON.parse(post.options.body), { sessionId: 'session-1', choice: 'setup' })
  assert.equal(stubs.calls.filter(call => call.url.startsWith('/measure-guard/state')).length, 1)
})

test('a null host view renders nothing, and the band falls back to the setup sentence', async () => {
  const failed = makeBundle()
  resetStubs()
  stubs.queue = [{ ok: false, json: async () => ({}) }]
  const empty = await failed.react.flush(failed.react.createElement(failed.band(), bandProps()))
  assert.equal(empty, null)
  const harness = makeBundle()
  const withNullBand = { ...HOST_VIEW, band: null, bandFull: null, problems: [], setup: { choice: null, text: null } }
  const tree = await renderBand(harness, bandProps(), [withNullBand])
  assert.match(textOf(byGuardTag(tree, 'band')), /No measure\/ folder in this project/)
})

test('the zh dictionary renders its own labels while the host line stays as sent', async () => {
  const harness = makeBundle()
  const zh = key => harness.locale.dictionaries.zh[key] ?? key
  const tree = await renderBand(harness, bandProps(zh), [HOST_VIEW])
  const text = textOf(byGuardTag(tree, 'band'))
  assert.match(text, /Measure · Demo · Phase 1\/2/)
  assert.match(text, /守卫: 已开启/)
  assert.match(text, /问题:/)
  assert.deepEqual(
    buttonsOf(tree).map(button => textOf(button)),
    ['设置 Measure', '本会话关闭'],
  )
})

test('the panel renders the empty state without a session list', async () => {
  const harness = makeBundle()
  resetStubs()
  const tree = await harness.react.flush(harness.react.createElement(harness.panel(), { t: en }))
  const panel = byGuardTag(tree, 'panel')
  assert.ok(panel !== null, 'the panel element is missing')
  assert.match(textOf(panel), /No session is open\./)
  const refresh = buttonsOf(tree)[0]
  assert.equal(refresh.props.disabled, true)
})

test('the panel renders a session select, the guards row, and the status block', async () => {
  const react = makeReact()
  const captured = { injected: [], registrations: [], decorations: [] }
  const snapshot = {
    ids: ['session-1'],
    byId: { 'session-1': { displayTitle: 'Session One' } },
    current: 'session-1',
  }
  const list = { getSnapshot: () => snapshot, subscribe: () => () => {} }
  const locale = { register() {}, bind: () => key => en(key) }
  const slots = {
    inject(name, producer) {
      captured.injected.push(name)
      let value = producer()
      if (value !== null && value !== undefined && typeof value.next === 'function') value = value.next().value
      captured.registrations.push({ name, value })
    },
    register(meta, component) {
      return { meta, component }
    },
  }
  const entry = loadEntry()
  const bundle = entry.factory(specifier => {
    if (specifier === 'react') return react
    throw new Error(`unexpected module: ${specifier}`)
  })
  bundle.apply({
    effect: fn => fn(),
    slots,
    locale,
    layout: { selectPanel() {} },
    sessions: { list },
    commandUi: { decorate() {} },
  })
  resetStubs()
  stubs.queue = [
    {
      ok: true,
      json: async () => ({ band: null, bandFull: null, guardsOff: null, mode: null, goal: null, setup: null, problems: [], status: 'Tracks: 1 in progress' }),
    },
  ]
  const panel = captured.registrations.find(item => item.name === 'main').value.component
  const tree = await react.flush(react.createElement(panel, { t: en }))
  const text = textOf(byGuardTag(tree, 'panel'))
  assert.match(text, /Session One/)
  assert.match(text, /Guards: on/)
  assert.match(text, /Tracks: 1 in progress/)
  const refresh = buttonsOf(tree)[0]
  assert.equal(refresh.props.disabled, false)
})

test('the sidebar entry renders the icon artwork with the size prop', async () => {
  const harness = makeBundle()
  const icon = harness.sidebar()
  const tree = await harness.react.flush(harness.react.createElement(icon, { size: 20 }))
  assert.equal(tree.tag, 'svg')
  assert.equal(tree.props.width, 20)
  assert.equal(tree.props['aria-hidden'], true)
  const shapes = []
  walk(tree, node => {
    if (node.tag === 'rect' || node.tag === 'path') shapes.push(node.tag)
  })
  assert.deepEqual(shapes, ['rect', 'path'])
})
