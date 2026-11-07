// The live-instance digest (Story S1): the SHA-256 over this package's own code
// bytes, captured synchronously when the module set is evaluated. A Host that
// still runs an older instance answers with the digest of the bytes it loaded
// before an install replaced the files, so `bin/measure-dsh --check --live` can
// tell a stale instance from a fresh one. The manifest format is
// `<relative>\n<file sha256>\n` per file in sorted order, which the CLI
// reproduces with sha256sum.
import { createHash } from 'node:crypto'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

/** The package-relative code files, sorted: the bytes that make the live module. */
export function digestFiles(packageDir) {
  const files = ['index.js', 'client.js', 'package.json', 'cordis.patch.yml']
  try {
    for (const entry of readdirSync(join(packageDir, 'locale'), { withFileTypes: true })) {
      if (entry.isFile() && entry.name.endsWith('.json')) files.push(`locale/${entry.name}`)
    }
  } catch {
    // A package without a locale folder still has a digest.
  }
  const walk = relative => {
    for (const entry of readdirSync(join(packageDir, relative), { withFileTypes: true })) {
      const child = `${relative}/${entry.name}`
      if (entry.isDirectory()) walk(child)
      else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.ts'))) files.push(child)
    }
  }
  try {
    walk('src')
  } catch {
    // Keep the top-level files when the source tree is unreadable.
  }
  return [...new Set(files)].sort()
}

/** The sha256 of one file, as hex. */
const fileHash = path => createHash('sha256').update(readFileSync(path)).digest('hex')

/** The manifest digest of a package folder, as `sha256:<hex>`. */
export function computeDigest(packageDir) {
  const hash = createHash('sha256')
  for (const relative of digestFiles(packageDir)) {
    hash.update(`${relative}\n${fileHash(join(packageDir, relative))}\n`)
  }
  return `sha256:${hash.digest('hex')}`
}

/** The digest of this instance's package; null when the files cannot be read. */
export function loadedDigest(packageDir) {
  try {
    return computeDigest(packageDir)
  } catch {
    return null
  }
}
