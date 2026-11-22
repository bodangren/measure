// Browser evidence helper. This file changes no implementation file.
import { writeFile } from 'node:fs/promises'
const endpoint = 'http://127.0.0.1:38899'
const tabs = await (await fetch(`${endpoint}/json/list`)).json()
const mode = process.argv[2] ?? 'state'
const target = tabs.find(t => mode === 'host' ? t.type === 'page' && t.url.startsWith('http://127.0.0.1:38307/') : t.type === 'iframe' && t.url.includes('guest-files') && !t.url.includes('LVMAir'))
if (!target) throw new Error('The audit target is absent.')
const ws = new WebSocket(target.webSocketDebuggerUrl)
await new Promise(resolve => { ws.onopen = resolve })
let id = 0
const waiting = new Map()
ws.onmessage = e => {
  const result = JSON.parse(e.data)
  if (result.id) {
    const pair = waiting.get(result.id)
    waiting.delete(result.id)
    result.error ? pair.reject(result.error) : pair.resolve(result.result)
  }
}
const call = (method, params = {}) => new Promise((resolve, reject) => {
  waiting.set(++id, { resolve, reject })
  ws.send(JSON.stringify({ id, method, params }))
})
const evaluate = async expression => {
  const result = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails))
  return result.result.value
}
const read = `(() => {
  const a = document.querySelector('textarea.comment-input');
  return { at: new Date().toISOString(), url: location.href, visible: document.visibilityState,
    active: document.activeElement?.tagName, focus: !!a && document.activeElement === a,
    documentFocus: document.hasFocus(), value: a?.value, start: a?.selectionStart, end: a?.selectionEnd,
    sameNode: !!a && a === window.__uxAudit?.area,
    refresh: document.querySelector('[data-action="refresh"]')?.textContent.trim(),
    events: window.__uxAudit?.events, rootChanges: window.__uxAudit?.rootChanges,
    width: innerWidth, scrollWidth: document.documentElement.scrollWidth };
})()`
let result
if (mode === 'setup') {
  result = await evaluate(`(() => {
    const area = document.querySelector('textarea.comment-input');
    if (!area) throw new Error('The comment box is absent.');
    const audit = window.__uxAudit = { area, events: [], rootChanges: 0 };
    const add = (kind, details = {}) => audit.events.push({ at: new Date().toISOString(), kind, ...details });
    new MutationObserver(records => { audit.rootChanges += records.length; add('root-mutation', { count: records.length }); })
      .observe(document.querySelector('#root'), { subtree: true, childList: true, attributes: true, characterData: true });
    for (const type of ['focusin', 'focusout', 'input', 'keydown']) document.addEventListener(type, e => {
      add(type, { tag: e.target.tagName, key: e.key, value: area.value, start: area.selectionStart, end: area.selectionEnd });
    }, true);
    window.addEventListener('message', e => {
      const d = e.data;
      add('host-message', { type: d?.type, method: d?.method, id: d?.id,
        keys: d && typeof d === 'object' ? Object.keys(d) : [],
        contextSurface: d?.context?.surface, hasError: !!d?.error });
    });
    area.setSelectionRange(6, 6);
    return true;
  })()`)
  result = await evaluate(read)
} else if (mode === 'host') {
  result = await evaluate(`({ at: new Date().toISOString(), active: document.activeElement?.outerHTML.slice(0,600), focus: document.hasFocus() })`)
} else if (mode === 'selection') {
  await evaluate(`document.querySelector('textarea.comment-input').setSelectionRange(6,6)`)
  result = await evaluate(read)
} else if (mode === 'a11y') {
  result = await call('Accessibility.getFullAXTree')
} else if (mode === 'monitor') {
  const samples = []
  const start = Date.now()
  while (Date.now() - start < 72000) {
    samples.push({ stage: 'before-key', ...(await evaluate(read)) })
    await call('Input.dispatchKeyEvent', { type: 'keyDown', key: 'x', code: 'KeyX', text: 'x', unmodifiedText: 'x', windowsVirtualKeyCode: 88 })
    await call('Input.dispatchKeyEvent', { type: 'keyUp', key: 'x', code: 'KeyX', windowsVirtualKeyCode: 88 })
    samples.push({ stage: 'after-key', ...(await evaluate(read)) })
    await call('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Backspace', code: 'Backspace', windowsVirtualKeyCode: 8 })
    await call('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Backspace', code: 'Backspace', windowsVirtualKeyCode: 8 })
    await new Promise(resolve => setTimeout(resolve, 2000))
  }
  result = { start: new Date(start).toISOString(), end: new Date().toISOString(), samples, final: await evaluate(read) }
} else {
  result = await evaluate(read)
}
if (process.argv[3]) await writeFile(process.argv[3], JSON.stringify(result, null, 2) + '\n')
console.log(JSON.stringify(mode === 'a11y' ? { saved: process.argv[3], nodes: result.nodes.length } : mode === 'monitor' ? {
  saved: process.argv[3], start: result.start, end: result.end, samples: result.samples.length,
  allFocused: result.samples.every(s => s.focus && s.documentFocus && s.sameNode),
  allBeforeValid: result.samples.filter(s => s.stage === 'before-key').every(s => s.value === 'Alpha audit draft omega' && s.start === 6 && s.end === 6),
  allAfterValid: result.samples.filter(s => s.stage === 'after-key').every(s => s.value === 'Alpha xaudit draft omega' && s.start === 7 && s.end === 7),
  final: { ...result.final, events: result.final.events?.slice(-5) }, eventCount: result.final.events?.length
} : { ...result, events: result.events?.slice(-5), eventCount: result.events?.length }, null, 2))
ws.close()
