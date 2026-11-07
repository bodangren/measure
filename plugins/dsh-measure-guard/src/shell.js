// The bounded shell-write grammar (Story S3): the write targets a bash call can
// name without a full parser. Recognised forms:
//   - `> target` and `>> target` (fd labels and `>&` duplications excluded,
//     and the stream devices /dev/null, /dev/stdout, /dev/stderr, /dev/fd/*);
//   - `tee target...` (non-option arguments, `-` excluded);
//   - `sed -i 'script' target...` (non-option arguments after the script; the
//     script is recognised by a leading s/y/ or a delimiter, and `-e` scripts
//     are skipped).
// Everything outside those forms is allowed: the end-of-turn check remains the
// backstop, and no shell content is reconstructed.
const STREAM_DEVICES = new Set(['/dev/null', '/dev/stdout', '/dev/stderr'])
const REDIRECT = /(?:^|[\s;|&()])(?:\d?>>?)\s*([^\s;|&<>()]+)/g
const TEE = /(?:^|[\s;|&()])tee\b([^;|&\n]*)/g
const SED = /(?:^|[\s;|&()])sed\b([^;|&\n]*)/g

const clean = token => token.replace(/^['"]|['"]$/g, '')

const isStreamDevice = path => STREAM_DEVICES.has(path) || path.startsWith('/dev/fd/')

/** A heredoc marker: `<<`, `<<-`, with an optional quoted delimiter. */
const HEREDOC_MARKER = /<<(-?)(?!<)\s*(['"]?)([A-Za-z0-9_]+)\2/

/**
 * The command as the shell sees its structure: heredoc bodies, comments, and
 * `>` characters inside quoted spans are blanked, so prose that quotes a
 * redirect is not mistaken for a write. Quoted text that is not a `>` is kept,
 * so a quoted redirection target still parses. Bounded: one heredoc marker per
 * line is recognized, and the scan is line/quote based, not a shell parser.
 */
const redirectView = command => {
  const lines = command.split('\n')
  for (let i = 0; i < lines.length; i += 1) {
    const marker = HEREDOC_MARKER.exec(lines[i])
    if (marker === null) continue
    const stripTabs = marker[1] === '-'
    const delimiter = marker[3]
    for (let j = i + 1; j < lines.length; j += 1) {
      const candidate = stripTabs ? lines[j].replace(/^\t+/, '') : lines[j]
      if (candidate === delimiter) {
        i = j
        break
      }
      lines[j] = ''
    }
  }
  const text = lines.join('\n')
  let view = ''
  let quote = null
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]
    if (quote !== null) {
      if (char === quote && !(quote === '"' && text[i - 1] === '\\')) {
        quote = null
        view += char
      } else {
        view += char === '>' ? ' ' : char
      }
      continue
    }
    if (char === '#' && (i === 0 || /[\s;|&(]/.test(text[i - 1]))) {
      while (i < text.length && text[i] !== '\n') i += 1
      view += '\n'
      continue
    }
    if (char === "'" || char === '"') {
      quote = char
      view += char
      continue
    }
    view += char
  }
  return view
}

/** A quoted-string placeholder used while the sed arguments are tokenized. */
const QUOTED = '\u0000'

/** The redirection targets of a command. */
const redirectTargets = command => {
  const out = []
  for (const match of redirectView(command).matchAll(REDIRECT)) {
    const target = clean(match[1] ?? '')
    if (target === '' || target === '-' || target.startsWith('&') || isStreamDevice(target)) continue
    out.push(target)
  }
  return out
}

/** The file arguments of every `tee` in the command. */
const teeTargets = command => {
  const out = []
  for (const match of command.matchAll(TEE)) {
    for (const raw of (match[1] ?? '').trim().split(/\s+/)) {
      const token = clean(raw)
      if (token === '' || token === '-' || token.startsWith('-')) continue
      out.push(token)
    }
  }
  return out
}

/**
 * The file arguments of every in-place `sed`. The arguments are tokenized with
 * quoted strings mapped to a placeholder: `-e`/`--expression` consumes its
 * script, the first remaining non-placeholder argument is the sed script, and
 * every later non-option argument is a file. This positional rule keeps an
 * absolute path from being mistaken for a `/pattern/` script.
 */
const sedTargets = command => {
  const out = []
  for (const match of command.matchAll(SED)) {
    const segment = match[1] ?? ''
    if (!/(?:^|\s)(?:-i|--in-place)(?:\s|$|[.-])/.test(` ${segment}`) && !/\s-i\S/.test(segment)) continue
    const tokens = segment.replace(/'[^']*'|"[^"]*"/g, ` ${QUOTED} `).trim().split(/\s+/).filter(Boolean)
    let scriptSeen = false
    for (let i = 0; i < tokens.length; i += 1) {
      const token = tokens[i]
      if (token === QUOTED) {
        scriptSeen = true
        continue
      }
      if (token.startsWith('-')) {
        if (token === '-e' || token === '--expression') {
          i += 1
          scriptSeen = true
        }
        continue
      }
      if (!scriptSeen) {
        scriptSeen = true
        continue
      }
      out.push(clean(token))
    }
  }
  return out
}

/** The write targets of a bash command, in command order, without duplicates. */
export function shellWritePaths(command) {
  if (typeof command !== 'string' || command === '') return []
  const paths = [...redirectTargets(command), ...teeTargets(command), ...sedTargets(command)]
  const seen = []
  for (const path of paths) {
    if (!seen.includes(path)) seen.push(path)
  }
  return seen
}
