// Story S3: the bounded shell-write grammar. The recognized forms are `>` and
// `>>` redirection, `tee` arguments, and `sed -i` file arguments; stream
// devices, fd duplications, options, and sed scripts are not targets.
import test from 'node:test'
import assert from 'node:assert/strict'

import { shellWritePaths } from '../src/shell.js'

test('redirection targets are extracted', () => {
  assert.deepEqual(shellWritePaths('echo hi > out.txt'), ['out.txt'])
  assert.deepEqual(shellWritePaths('echo hi >> logs/out.txt'), ['logs/out.txt'])
  assert.deepEqual(shellWritePaths('make 1>build.log 2>errors.log'), ['build.log', 'errors.log'])
  assert.deepEqual(shellWritePaths('cat x > /tmp/a > /tmp/b'), ['/tmp/a', '/tmp/b'])
})

test('stream devices, fd duplications, and labels are not targets', () => {
  assert.deepEqual(shellWritePaths('echo hi 2>/dev/null'), [])
  assert.deepEqual(shellWritePaths('echo hi >&1'), [])
  assert.deepEqual(shellWritePaths('echo hi 1>&2'), [])
  assert.deepEqual(shellWritePaths('echo hi > /dev/stdout'), [])
})

test('tee arguments are extracted, options and `-` are not', () => {
  assert.deepEqual(shellWritePaths('cat x | tee out.txt'), ['out.txt'])
  assert.deepEqual(shellWritePaths('cat x | tee -a out.txt other.txt'), ['out.txt', 'other.txt'])
  assert.deepEqual(shellWritePaths('cat x | tee -'), [])
})

test('sed -i file arguments are extracted, the script is not', () => {
  assert.deepEqual(shellWritePaths('sed -i "s/a/b/" src/app.js'), ['src/app.js'])
  assert.deepEqual(shellWritePaths("sed -i 's/a/b/g' src/app.js src/b.js"), ['src/app.js', 'src/b.js'])
  assert.deepEqual(shellWritePaths('sed -i s/a/b/ src/app.js'), ['src/app.js'])
  assert.deepEqual(shellWritePaths('sed -n "s/a/b/p" file.txt'), [])
})

test('a command without a write form has no targets', () => {
  assert.deepEqual(shellWritePaths('npm test'), [])
  assert.deepEqual(shellWritePaths('git status --porcelain'), [])
  assert.deepEqual(shellWritePaths(''), [])
  assert.deepEqual(shellWritePaths(null), [])
})

test('duplicate targets appear once, in command order', () => {
  assert.deepEqual(shellWritePaths('echo a > out.txt; echo b >> out.txt'), ['out.txt'])
})
