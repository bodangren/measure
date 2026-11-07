// Story S1: the live-instance digest. The digest covers the fixed code file
// list, is order independent, changes when any covered byte changes, and never
// covers tests, scripts, docs, or the install stamp.
import test from 'node:test'
import assert from 'node:assert/strict'
import { cp, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { fileURLToPath } from 'node:url'

import { computeDigest, digestFiles, loadedDigest } from '../src/digest.js'

const PACKAGE = fileURLToPath(new URL('..', import.meta.url))

/** A temporary package folder with the given relative files. */
const makePackage = async (files = {}) => {
  const root = await mkdtemp(join(tmpdir(), 'dsh-digest-'))
  for (const [relative, text] of Object.entries(files)) {
    const path = join(root, relative)
    await mkdir(dirname(path), { recursive: true })
    await writeFile(path, text, 'utf8')
  }
  return root
}

const FILES = {
  'index.js': 'export const x = 1\n',
  'client.js': 'module.exports = {}\n',
  'package.json': '{ "name": "x" }\n',
  'cordis.patch.yml': '[]\n',
  'locale/en.json': '{ "a": "b" }\n',
  'src/a.js': 'export const a = 2\n',
  'src/core/b.ts': 'export const b = 3\n',
}

test('the real package digest is stable and covers the code files', () => {
  const first = computeDigest(PACKAGE)
  const second = computeDigest(PACKAGE)
  assert.match(first, /^sha256:[0-9a-f]{64}$/)
  assert.equal(first, second)

  const files = digestFiles(PACKAGE)
  for (const expected of ['index.js', 'client.js', 'package.json', 'cordis.patch.yml', 'src/strict.js', 'src/core/parse.ts', 'src/core/guards.ts', 'locale/en.json']) {
    assert.ok(files.includes(expected), `missing ${expected}`)
  }
  for (const excluded of ['README.md', '.measure-dsh-install', 'test.js']) {
    assert.ok(!files.includes(excluded), `unexpected ${excluded}`)
  }
  assert.equal(files.some(file => file.startsWith('tests/')), false)
  assert.equal(files.some(file => file.startsWith('scripts/')), false)
  assert.deepEqual(files, [...files].sort())
})

test('the digest is independent of file creation order', async () => {
  const entries = Object.entries(FILES)
  const forward = await makePackage(Object.fromEntries(entries))
  const reverse = await makePackage(Object.fromEntries([...entries].reverse()))
  try {
    assert.equal(computeDigest(forward), computeDigest(reverse))
  } finally {
    await rm(forward, { recursive: true, force: true })
    await rm(reverse, { recursive: true, force: true })
  }
})

test('a changed covered byte changes the digest', async () => {
  const root = await makePackage(FILES)
  try {
    const before = computeDigest(root)
    await writeFile(join(root, 'src/a.js'), 'export const a = 99\n', 'utf8')
    assert.notEqual(computeDigest(root), before)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('tests and docs are outside the digest', async () => {
  const root = await makePackage({ ...FILES, 'tests/x.test.js': 'x\n', 'README.md': 'x\n' })
  try {
    const before = computeDigest(root)
    await writeFile(join(root, 'tests/x.test.js'), 'changed\n', 'utf8')
    await writeFile(join(root, 'README.md'), 'changed\n', 'utf8')
    assert.equal(computeDigest(root), before)
    assert.equal(digestFiles(root).some(file => file.startsWith('tests/')), false)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('loadedDigest returns null when the folder cannot be read', async () => {
  assert.equal(loadedDigest('/definitely/not/a/package'), null)
})

test('the digest is captured once, at module evaluation', async () => {
  const root = await mkdtemp(join(tmpdir(), 'dsh-digest-load-'))
  try {
    await cp(PACKAGE, root, { recursive: true })
    const url = pathToFileURL(join(root, 'index.js')).href

    const firstModule = await import(url)
    const first = firstModule.digest
    assert.match(first, /^sha256:[0-9a-f]{64}$/)
    assert.equal(first, computeDigest(root))

    // A file changed after the import does not change this instance's answer:
    // the digest was captured when the module was evaluated, not per request.
    await writeFile(join(root, 'src/status.js'), '// changed after load\n', 'utf8')
    assert.equal((await import(url)).digest, first)

    // A fresh evaluation sees the new bytes, which proves the value is a
    // load-time capture rather than a constant or a per-request read.
    const second = (await import(`${url}?v=2`)).digest
    assert.notEqual(second, first)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
