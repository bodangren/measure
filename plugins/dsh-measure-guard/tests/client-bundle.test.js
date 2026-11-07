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

/** The keys of one embedded dictionary literal. */
const dictionaryKeys = name => {
  const match = new RegExp(`const ${name} = \\{([\\s\\S]*?)\\n    \\}`).exec(source)
  assert.ok(match, `the bundle declares the ${name} dictionary`)
  return [...match[1].matchAll(/^\s{6}([A-Za-z_][A-Za-z0-9_]*):/gm)].map(entry => entry[1])
}

test('the en and zh dictionaries carry the same keys (dictionary parity)', () => {
  const en = dictionaryKeys('en')
  const zh = dictionaryKeys('zh')
  assert.ok(en.length > 0)
  assert.deepEqual(zh, en)
})

test('the band setup actions are localized and post to the setup route', () => {
  for (const key of ['setupSetUp', 'setupOff']) {
    assert.match(source, new RegExp(`^\\s{6}${key}:`, 'm'))
  }
  assert.match(source, /Set up Measure/)
  assert.match(source, /Turn off for session/)
  assert.match(source, /设置 Measure/)
  assert.match(source, /本会话关闭/)
  assert.match(source, /fetch\('\/measure-guard\/setup'/)
  assert.match(source, /JSON\.stringify\(\{ sessionId, choice \}\)/)
})

test('the band shows the setup actions only while the offer has no answer', () => {
  assert.match(source, /props\.setup\.choice !== null/)
  assert.match(source, /h\(SetupActions, \{/)
})

test('the band renders the effective mode with a localized label', () => {
  assert.match(source, /view\.mode === null \|\| view\.mode === undefined/)
  assert.match(source, /t\('mode'\) \+ ': ' \+ view\.mode\.value \+ ' \(' \+ view\.mode\.source \+ '\)'/)
  for (const name of ['en', 'zh']) {
    const match = new RegExp(`const ${name} = \\{([\\s\\S]*?)\\n    \\}`).exec(source)
    assert.ok(match, `${name} dictionary`)
    assert.match(match[1], /^\s{6}mode:/m, `${name} mode label`)
  }
})
