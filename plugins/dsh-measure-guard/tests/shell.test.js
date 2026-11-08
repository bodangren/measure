// Story S3: the bounded shell-write grammar. The recognized forms are `>` and
// `>>` redirection, `tee` arguments, `sed -i` file arguments, and the
// destination of `cp`/`mv`/`install`; stream devices, fd duplications, options,
// sed scripts, and `-t` destinations are not targets.
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

// ---- cp, mv, and install destinations (dsh_measure_apply_patch_visibility_20261110)

test('cp, mv, and install destinations are extracted', () => {
  assert.deepEqual(shellWritePaths('cp /tmp/p measure/tracks/a/plan.md'), ['measure/tracks/a/plan.md'])
  assert.deepEqual(shellWritePaths('cp -R src/ dst/'), ['dst/'])
  assert.deepEqual(shellWritePaths('mv old.md new.md'), ['new.md'])
  assert.deepEqual(shellWritePaths('install -m 644 /tmp/x measure/tracks.md'), ['measure/tracks.md'])
  assert.deepEqual(shellWritePaths('cp a.txt b.txt c.txt'), ['c.txt'])
})

test('cp and mv option arguments and -t destinations are not targets', () => {
  assert.deepEqual(shellWritePaths('cp -t /tmp a.txt b.txt'), [])
  assert.deepEqual(shellWritePaths('ls -la'), [])
  assert.deepEqual(shellWritePaths('git commit -m "cp x"'), [])
})

// ---- heredoc, quote, and comment masking (dsh_measure_shell_grammar_20261107)

test('a heredoc body quoting a redirect is not a write', () => {
  const command = "cat > measure/tracks.md <<'EOF'\nThe guard denies > measure/plan.md writes.\nEOF\n"
  assert.deepEqual(shellWritePaths(command), ['measure/tracks.md'])
})

test('a quoted redirect and a comment redirect are not writes', () => {
  assert.deepEqual(shellWritePaths('echo "a > measure/b.md"'), [])
  assert.deepEqual(shellWritePaths('# > measure/c.md'), [])
  assert.deepEqual(shellWritePaths("cat > a.md <<'EOF'\nbody\nEOF\necho x > b.md"), ['a.md', 'b.md'])
})

test('a quoted heredoc marker is not a heredoc', () => {
  assert.deepEqual(shellWritePaths('printf "x << y"\necho data > out.md'), ['out.md'])
})

test('quoted delimiters, tab-stripped delimiters, and quoted targets', () => {
  assert.deepEqual(shellWritePaths("cat > a.md <<-'EOF'\n\tbody\n\tEOF\n"), ['a.md'])
  assert.deepEqual(shellWritePaths('cat > b.md <<"WORD"\nbody\nWORD\n'), ['b.md'])
  assert.deepEqual(shellWritePaths('echo x > "measure/tracks.md"'), ['measure/tracks.md'])
  assert.deepEqual(shellWritePaths('echo "a # b" > out.md'), ['out.md'])
})
