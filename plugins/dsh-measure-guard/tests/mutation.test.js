// Mutation normalization (FR-6): every file tool becomes one absolute-path
// mutation with the core's FileEdit and its after-text where the shared
// `applyEdit` can reconstruct it; shell calls are classified, not path-derived;
// an unknown tool is not a mutation. A path that cannot resolve keeps its
// joined absolute form and never throws.
import test from 'node:test'
import assert from 'node:assert/strict'

import { normalizeMutation } from '../src/hooks.js'

/** A filesystem-backed-looking io: resolve against cwd, read from `files`. */
const ioOf = (files = {}, fail = []) => {
  const resolved = []
  return {
    resolved,
    async resolve(path, options = {}) {
      const cwd = options.cwd ?? '/repo'
      resolved.push({ path, cwd, options })
      const joined = path.startsWith('/') ? path : `${cwd}/${path}`
      if (fail.includes(path) || fail.includes(joined)) throw new Error(`cannot resolve ${path}`)
      return joined
    },
    async exists(path) {
      return Object.hasOwn(files, path)
    },
    async readText(path) {
      return files[path] ?? ''
    },
  }
}

const APP = '/repo/src/app.js'
const files = { [APP]: 'export const a = 1\n' }

test('edit becomes a file mutation with a core FileEdit and the after-text', async () => {
  const io = ioOf(files)
  const mutation = await normalizeMutation(
    'edit',
    { file_path: 'src/app.js', old_string: 'a = 1', new_string: 'a = 2' },
    '/repo',
    io,
  )
  assert.equal(mutation.kind, 'file')
  assert.deepEqual(mutation.paths, [APP])
  assert.deepEqual(mutation.edit, { tool: 'Edit', old_string: 'a = 1', new_string: 'a = 2' })
  assert.equal(mutation.afterTexts.get(APP), 'export const a = 2\n')
  assert.equal(io.resolved[0].cwd, '/repo')
})

test('edit accepts path and filePath and replace_all', async () => {
  const all = { '/repo/x.txt': 'x x\n' }
  for (const field of ['path', 'filePath']) {
    const mutation = await normalizeMutation('edit', { [field]: 'x.txt', old_string: 'x', new_string: 'y', replace_all: true }, '/repo', ioOf(all))
    assert.equal(mutation.kind, 'file')
    assert.deepEqual(mutation.paths, ['/repo/x.txt'])
    assert.equal(mutation.edit.replace_all, true)
    assert.equal(mutation.afterTexts.get('/repo/x.txt'), 'y y\n')
  }
})

test('write becomes a Write FileEdit and its after-text is the content', async () => {
  const io = ioOf(files)
  const mutation = await normalizeMutation('write', { file_path: 'src/new.js', content: 'export {}\n' }, '/repo', io)
  assert.equal(mutation.kind, 'file')
  assert.deepEqual(mutation.paths, ['/repo/src/new.js'])
  assert.deepEqual(mutation.edit, { tool: 'Write', content: 'export {}\n' })
  assert.equal(mutation.afterTexts.get('/repo/src/new.js'), 'export {}\n')
})

test('apply_patch lists every patch path and reconstructs the after-texts', async () => {
  const patch = [
    '*** Begin Patch',
    '*** Update File: src/a.js',
    '@@',
    '-a',
    '+b',
    '*** Add File: src/b.js',
    '+new',
    '*** Delete File: src/c.js',
    '*** End Patch',
  ].join('\n')
  const files = { '/repo/src/a.js': 'a\n' }
  const mutation = await normalizeMutation('apply_patch', { input: patch }, '/repo', ioOf(files))
  assert.equal(mutation.kind, 'file')
  assert.deepEqual(mutation.paths, ['/repo/src/a.js', '/repo/src/b.js', '/repo/src/c.js'])
  assert.equal(mutation.afterTexts.get('/repo/src/a.js'), 'b\n')
  assert.equal(mutation.afterTexts.get('/repo/src/b.js'), 'new\n')
  assert.equal(mutation.afterTexts.get('/repo/src/c.js'), '')
  assert.equal(mutation.edit, null)

  const alternate = await normalizeMutation('apply_patch', { patchText: '*** Update File: docs/x.md\n' }, '/repo', ioOf())
  assert.deepEqual(alternate.paths, ['/repo/docs/x.md'])
  assert.equal(alternate.afterTexts.size, 0)
})

test('an apply_patch whose hunk does not apply has no after-text', async () => {
  const patch = '*** Begin Patch\n*** Update File: src/a.js\n@@\n-missing\n+x\n*** End Patch'
  const mutation = await normalizeMutation('apply_patch', { input: patch }, '/repo', ioOf({ '/repo/src/a.js': 'a\n' }))
  assert.deepEqual(mutation.paths, ['/repo/src/a.js'])
  assert.equal(mutation.afterTexts.size, 0)
})

test('str_replace_editor reconstructs create, str_replace, and insert; view is not a mutation', async () => {
  const before = { [APP]: 'one\ntwo\n' }
  const created = await normalizeMutation('str_replace_editor', { path: 'src/new.js', command: 'create', file_text: 'x\n' }, '/repo', ioOf({}))
  assert.equal(created.afterTexts.get('/repo/src/new.js'), 'x\n')
  const replaced = await normalizeMutation('str_replace_editor', { path: 'src/app.js', command: 'str_replace', old_str: 'two', new_str: 'three' }, '/repo', ioOf(before))
  assert.deepEqual(replaced.paths, [APP])
  assert.equal(replaced.afterTexts.get(APP), 'one\nthree\n')
  const inserted = await normalizeMutation('str_replace_editor', { path: 'src/app.js', command: 'insert', insert_line: 1, new_str: 'mid' }, '/repo', ioOf(before))
  assert.equal(inserted.afterTexts.get(APP), 'one\nmid\ntwo\n')
  assert.deepEqual(await normalizeMutation('str_replace_editor', { path: 'src/app.js', command: 'view' }, '/repo', ioOf(before)), {
    kind: 'other',
  })
})

test('a str_replace_editor call that cannot be reconstructed has no after-text', async () => {
  const mutation = await normalizeMutation(
    'str_replace_editor',
    { path: 'src/app.js', command: 'str_replace', old_str: 'missing', new_str: 'x' },
    '/repo',
    ioOf({ [APP]: 'one\n' }),
  )
  assert.deepEqual(mutation.paths, [APP])
  assert.equal(mutation.afterTexts.size, 0)
})

test('bash and pwsh are shell calls with their command', async () => {
  assert.deepEqual(await normalizeMutation('bash', { command: 'ls -la' }, '/repo', ioOf()), { kind: 'shell', command: 'ls -la' })
  assert.deepEqual(await normalizeMutation('pwsh', { command: 'Get-ChildItem' }, '/repo', ioOf()), {
    kind: 'shell',
    command: 'Get-ChildItem',
  })
})

test('an unknown tool is not a mutation', async () => {
  assert.deepEqual(await normalizeMutation('read', { file_path: 'src/app.js' }, '/repo', ioOf(files)), { kind: 'other' })
  assert.deepEqual(await normalizeMutation('todowrite', {}, '/repo', ioOf()), { kind: 'other' })
})

test('an edit whose old_string does not match yields a null after-text', async () => {
  const mutation = await normalizeMutation('edit', { file_path: 'src/app.js', old_string: 'missing', new_string: 'x' }, '/repo', ioOf(files))
  assert.equal(mutation.kind, 'file')
  assert.equal(mutation.afterTexts.get(APP), null)
})

test('a path that cannot resolve keeps the joined absolute form and does not throw', async () => {
  const io = ioOf({}, ['ghost.js'])
  const mutation = await normalizeMutation('write', { file_path: 'ghost.js', content: 'x' }, '/repo', io)
  assert.equal(mutation.kind, 'file')
  assert.deepEqual(mutation.paths, ['/repo/ghost.js'])
})
