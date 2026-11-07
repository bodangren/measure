// Static checks over the hand-written client bundle (design §8, plan 4.2/4.3):
// it parses, its factory id is the package name, it requires only `react`,
// it registers the band, the panel pair, and the command decoration, and it
// carries both locale dictionaries. No browser and no DOM: the file is read as
// text and `node --check` proves the syntax.
import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const CLIENT_PATH = fileURLToPath(new URL('../client.js', import.meta.url))
const PACKAGE_PATH = fileURLToPath(new URL('../package.json', import.meta.url))

const source = readFileSync(CLIENT_PATH, 'utf8')
const pkg = JSON.parse(readFileSync(PACKAGE_PATH, 'utf8'))

/** Every `require('...')` specifier in the bundle, in file order. */
const requireSpecs = () => [...source.matchAll(/require\s*\(\s*(['"])([^'"]+)\1\s*\)/g)].map(match => match[2])

/** The tokens of the first array literal after `inject:`. */
const injectServices = () => {
  const match = /inject:\s*\[([^\]]*)\]/.exec(source)
  assert.ok(match, 'the bundle declares an inject array')
  return [...match[1].matchAll(/['"]([^'"]+)['"]/g)].map(entry => entry[1])
}

test('the client bundle is valid JavaScript (node --check)', () => {
  assert.doesNotThrow(() => execFileSync(process.execPath, ['--check', CLIENT_PATH], { stdio: 'pipe' }))
})

test('the factory id equals the package name', () => {
  const match = /id:\s*(['"])([^'"]+)\1/.exec(source)
  assert.ok(match, 'the bundle names a factory id')
  assert.equal(match[2], pkg.name)
  assert.equal(pkg.name, 'dsh-measure-guard')
})

test('the bundle requires only react from the page module table', () => {
  assert.deepEqual(requireSpecs(), ['react'])
  assert.equal(/require\.async\s*\(/.test(source), false)
  assert.equal(source.includes('@deepseek-ai/'), false)
})

test('the bundle injects the five client services', () => {
  assert.deepEqual(injectServices(), ['slots', 'sessions', 'locale', 'layout', 'commandUi'])
})

test('the bundle registers the band in the conversation input dock', () => {
  assert.match(source, /ctx\.slots\.inject\(\s*['"]conversation\.input\.dock['"]/)
  assert.match(source, /name:\s*['"]conversation\.input\.dock['"]\s*,\s*id:\s*['"]measure-guard['"]/)
  assert.match(source, /order:\s*20/)
  assert.match(source, /locale:\s*NS/)
})

test('the bundle registers the keyed main panel and its sidebar entry', () => {
  assert.match(source, /ctx\.slots\.inject\(\s*['"]main['"]/)
  assert.match(source, /name:\s*['"]main['"]\s*,\s*key:\s*['"]measure['"]/)
  assert.match(source, /ctx\.slots\.inject\(\s*['"]sidebar\.panellist['"]/)
  assert.match(source, /name:\s*['"]sidebar\.panellist['"]\s*,\s*id:\s*['"]measure['"]/)
  assert.match(source, /label:\s*\(\)\s*=>\s*t\(\s*['"]panel['"]\s*\)/)
})

test('the bundle decorates measure-status with a panel action, never registers it', () => {
  assert.match(source, /ctx\.commandUi\.decorate\(\s*\{/)
  assert.match(source, /name:\s*['"]measure-status['"]/)
  assert.match(source, /available:\s*\(\)\s*=>\s*true/)
  assert.match(source, /kind:\s*['"]action['"]/)
  assert.match(source, /selectPanel\(\s*['"]measure['"]\s*\)/)
  assert.equal(/ctx\.commandUi\.register\s*\(/.test(source), false)
})

test('the bundle carries the en and zh dictionaries under one namespace', () => {
  assert.match(source, /const en = \{/)
  assert.match(source, /const zh = \{/)
  assert.match(source, /locale\.register\(\s*NS\s*,\s*\{\s*en\s*,\s*zh\s*\}\s*\)/)
  assert.match(source, /const NS = ['"]measure-guard['"]/)
  assert.match(source, /const t = ctx\.locale\.bind\(NS\)/)
})

test('the bundle uses theme tokens for every style', () => {
  assert.match(source, /--dsw-alias-label-primary/)
  assert.match(source, /--dsw-alias-label-secondary/)
  assert.match(source, /--dsw-alias-border-l1/)
  assert.match(source, /--dsw-alias-bg-layer-2/)
  assert.match(source, /--dsw-radius-sm/)
  assert.match(source, /--dsw-font-family\)/)
  assert.match(source, /--ds-font-family-code/)
  assert.equal(/['"]#[0-9a-fA-F]{3,8}['"]/.test(source), false, 'no literal color values')
})
