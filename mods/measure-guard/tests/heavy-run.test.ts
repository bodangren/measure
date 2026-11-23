// Red (Task 1.1, v1 scope): the heavy-run pure matcher of FR-1 to FR-7.
// v1 guards direct commands only: wrapper words, shell -c recursion, and
// non-path heavy-run -c recursion are out of scope (spec.md, tech-debt).
// heavyRunDecision(agent, command) does not exist yet, so every deny test
// fails here and passes once Green adds the matcher. This file imports from
// 'bun:test' (not 'claude-code/testing') so `bun test tests/heavy-run.test.ts`
// runs named test failures; the claude-code/testing module does not resolve
// under bun. The matcher itself is engine-free, so no world fixture is needed.
import { describe, expect, test } from 'bun:test'
import * as guards from '../hooks/guards'

/** The missing matcher, called inside each test so the failure is a named test failure. */
const decide = (agent: string | null, command: string): { deny: string } | null => {
  const fn = (guards as unknown as { heavyRunDecision?: unknown }).heavyRunDecision
  if (typeof fn !== 'function') throw new Error('Red: heavyRunDecision is not exported from ../hooks/guards yet')
  return (fn as (agent: string | null, command: string) => { deny: string } | null)(agent, command)
}

/** The exact FR-4 deny text for one class and one offending part. */
const denyFor = (cls: string, part: string): string =>
  `measure-guard: heavy ${cls} runs only through heavy-run: HEAVY_PRIORITY=p1 HEAVY_MIN_AVAIL_MB=1500 /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c '${part}'. If this block is wrong, the user can run /measure-off.`

const ROLE = 'measure-jr-green'

describe('matcher export', () => {
  test('heavyRunDecision is exported from ../hooks/guards', () => {
    expect(typeof (guards as unknown as { heavyRunDecision?: unknown }).heavyRunDecision).toBe('function')
  })
})

describe('dev-server', () => {
  test('vite is refused as dev-server with the exact FR-4 text', () => {
    expect(decide(ROLE, 'vite')).toEqual({ deny: denyFor('dev-server', 'vite') })
  })

  test('http-server and serve are refused as dev-server', () => {
    expect(decide(ROLE, 'http-server')).toEqual({ deny: denyFor('dev-server', 'http-server') })
    expect(decide(ROLE, 'serve -l 3000')).toEqual({ deny: denyFor('dev-server', 'serve -l 3000') })
  })

  test('next dev and next start are refused; next build passes', () => {
    expect(decide(ROLE, 'next dev')).toEqual({ deny: denyFor('dev-server', 'next dev') })
    expect(decide(ROLE, 'next start')).toEqual({ deny: denyFor('dev-server', 'next start') })
    expect(decide(ROLE, 'next build')).toBeNull()
  })

  test('node -e and node --eval with listen( are refused', () => {
    expect(decide(ROLE, `node -e "require('http').createServer().listen(3000)"`)).toEqual({
      deny: denyFor('dev-server', `node -e "require('http').createServer().listen(3000)"`),
    })
    expect(decide(ROLE, 'node --eval "app.listen(3000)"')).toEqual({ deny: denyFor('dev-server', 'node --eval "app.listen(3000)"') })
  })

  test('node -e without listen( passes', () => {
    expect(decide(ROLE, `node -e "console.log(1)"`)).toBeNull()
  })

  test('CI=1 vite is refused as dev-server', () => {
    expect(decide(ROLE, 'CI=1 vite')).toEqual({ deny: denyFor('dev-server', 'CI=1 vite') })
  })

  test('runner prefixes still refuse the dev server', () => {
    expect(decide(ROLE, 'npx vite')).toEqual({ deny: denyFor('dev-server', 'npx vite') })
    expect(decide(ROLE, 'bunx vite')).toEqual({ deny: denyFor('dev-server', 'bunx vite') })
    expect(decide(ROLE, 'bun x vite')).toEqual({ deny: denyFor('dev-server', 'bun x vite') })
  })
})

describe('capture', () => {
  test('playwright with args is refused as capture', () => {
    expect(decide(ROLE, 'playwright test')).toEqual({ deny: denyFor('capture', 'playwright test') })
    expect(decide(ROLE, 'npx playwright test')).toEqual({ deny: denyFor('capture', 'npx playwright test') })
  })

  test('headless chrome with a capture flag is refused', () => {
    expect(decide(ROLE, 'google-chrome --headless --screenshot=x.png https://a')).toEqual({
      deny: denyFor('capture', 'google-chrome --headless --screenshot=x.png https://a'),
    })
    expect(decide(ROLE, 'chrome --headless --print-to-pdf=x.pdf https://a')).toEqual({
      deny: denyFor('capture', 'chrome --headless --print-to-pdf=x.pdf https://a'),
    })
    expect(decide(ROLE, 'chromium --headless --dump-dom https://a')).toEqual({
      deny: denyFor('capture', 'chromium --headless --dump-dom https://a'),
    })
    expect(decide(ROLE, 'chromium-browser --headless --screenshot=x.png https://a')).toEqual({
      deny: denyFor('capture', 'chromium-browser --headless --screenshot=x.png https://a'),
    })
  })

  test('headless chrome without a capture flag passes', () => {
    expect(decide(ROLE, 'google-chrome --headless --version')).toBeNull()
  })

  test('chrome with a capture flag but no --headless passes', () => {
    expect(decide(ROLE, 'chrome --screenshot=x.png')).toBeNull()
  })
})

describe('tsc-full', () => {
  test('tsc --noEmit with no file operand is refused', () => {
    expect(decide(ROLE, 'tsc --noEmit')).toEqual({ deny: denyFor('tsc-full', 'tsc --noEmit') })
  })

  test('tsc -b and tsc --build are full regardless of operands', () => {
    expect(decide(ROLE, 'tsc -b')).toEqual({ deny: denyFor('tsc-full', 'tsc -b') })
    expect(decide(ROLE, 'tsc --build')).toEqual({ deny: denyFor('tsc-full', 'tsc --build') })
    expect(decide(ROLE, 'tsc -b tsconfig.json')).toEqual({ deny: denyFor('tsc-full', 'tsc -b tsconfig.json') })
    expect(decide(ROLE, 'tsc -b src/a.ts')).toEqual({ deny: denyFor('tsc-full', 'tsc -b src/a.ts') })
  })

  test('tsc --noEmit -p tsconfig.json has no operand and is refused', () => {
    expect(decide(ROLE, 'tsc --noEmit -p tsconfig.json')).toEqual({ deny: denyFor('tsc-full', 'tsc --noEmit -p tsconfig.json') })
  })

  test('tsc --noEmit with a file operand passes', () => {
    expect(decide(ROLE, 'tsc --noEmit src/a.ts')).toBeNull()
  })

  test('a bare word is no file operand: tsc --noEmit expression is refused', () => {
    expect(decide(ROLE, 'tsc --noEmit expression')).toEqual({ deny: denyFor('tsc-full', 'tsc --noEmit expression') })
  })
})

describe('test-suite', () => {
  const full = [
    'bun test',
    'bun run test',
    'npm test',
    'npm run test',
    'yarn test',
    'yarn run test',
    'pnpm test',
    'pnpm run test',
    'vitest',
    'vitest run',
    'jest',
    'pytest',
    'node --test',
  ]
  for (const command of full) {
    test(`${command} with no file operand is refused as test-suite`, () => {
      expect(decide(ROLE, command)).toEqual({ deny: denyFor('test-suite', command) })
    })
  }

  test('a named file passes for bun test and node --test', () => {
    expect(decide(ROLE, 'node --test one-file.test.js')).toBeNull()
    expect(decide(ROLE, 'bun test tests/a.test.ts')).toBeNull()
  })

  test('vitest run --reporter verbose has no operand and is refused', () => {
    expect(decide(ROLE, 'vitest run --reporter verbose')).toEqual({ deny: denyFor('test-suite', 'vitest run --reporter verbose') })
  })

  test('vitest run --reporter=verbose is one token and is refused', () => {
    expect(decide(ROLE, 'vitest run --reporter=verbose')).toEqual({ deny: denyFor('test-suite', 'vitest run --reporter=verbose') })
  })

  test('pytest -k expression has no file operand and is refused', () => {
    expect(decide(ROLE, 'pytest -k expression')).toEqual({ deny: denyFor('test-suite', 'pytest -k expression') })
  })

  test('pytest -x is a flag, so bare pytest -x is refused', () => {
    expect(decide(ROLE, 'pytest -x')).toEqual({ deny: denyFor('test-suite', 'pytest -x') })
  })

  test('pytest with a file operand passes, with or without ::test', () => {
    expect(decide(ROLE, 'pytest tests/test_a.py')).toBeNull()
    expect(decide(ROLE, 'pytest tests/test_a.py::test_one')).toBeNull()
  })
})

describe('render', () => {
  test('ffmpeg is refused as render', () => {
    expect(decide(ROLE, 'ffmpeg -i in.mp4 out.mp4')).toEqual({ deny: denyFor('render', 'ffmpeg -i in.mp4 out.mp4') })
  })

  test('remotion render and remotion still are refused', () => {
    expect(decide(ROLE, 'remotion render')).toEqual({ deny: denyFor('render', 'remotion render') })
    expect(decide(ROLE, 'remotion still out.png')).toEqual({ deny: denyFor('render', 'remotion still out.png') })
  })

  test('another remotion subcommand passes', () => {
    expect(decide(ROLE, 'remotion --help')).toBeNull()
  })
})

describe('build-graph', () => {
  test('build-graph with any args is refused', () => {
    expect(decide(ROLE, 'build-graph')).toEqual({ deny: denyFor('build-graph', 'build-graph') })
    expect(decide(ROLE, 'build-graph --help')).toEqual({ deny: denyFor('build-graph', 'build-graph --help') })
  })
})

describe('heavy-run form', () => {
  test('the path form passes with or without HEAVY_ assignments', () => {
    expect(decide(ROLE, `scripts/jobs/heavy-run.sh -c 'vite'`)).toBeNull()
    expect(decide(ROLE, `./scripts/jobs/heavy-run.sh -c 'vite'`)).toBeNull()
    expect(decide(ROLE, `/home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'vite'`)).toBeNull()
    expect(decide(ROLE, `/x/scripts/jobs/heavy-run.sh -c 'vite'`)).toBeNull()
    expect(decide(ROLE, `HEAVY_PRIORITY=p1 scripts/jobs/heavy-run.sh -c 'vite'`)).toBeNull()
    expect(decide(ROLE, `HEAVY_PRIORITY=p1 HEAVY_MIN_AVAIL_MB=1500 /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'vite'`)).toBeNull()
  })

  test('a bare heavy-run.sh is an ordinary unknown command and passes', () => {
    expect(decide(ROLE, 'heavy-run.sh')).toBeNull()
    expect(decide(ROLE, './heavy-run.sh -c vite')).toBeNull()
  })

  test('a segment that only mentions the path is not the form', () => {
    expect(decide(ROLE, 'echo scripts/jobs/heavy-run.sh')).toBeNull()
  })
})

describe('compounds', () => {
  test('a heavy part outside the heavy-run form refuses the command and is named', () => {
    expect(decide(ROLE, 'git status && vite')).toEqual({ deny: denyFor('dev-server', 'vite') })
    expect(decide(ROLE, 'vite || git status')).toEqual({ deny: denyFor('dev-server', 'vite') })
    expect(decide(ROLE, 'vite | cat')).toEqual({ deny: denyFor('dev-server', 'vite') })
    expect(decide(ROLE, 'ls\nvite')).toEqual({ deny: denyFor('dev-server', 'vite') })
  })

  test('echo of the heavy-run path then vite is refused and names vite', () => {
    expect(decide(ROLE, 'echo scripts/jobs/heavy-run.sh; vite')).toEqual({ deny: denyFor('dev-server', 'vite') })
  })

  test('a quoted separator does not split the command', () => {
    expect(decide(ROLE, 'echo "a && b"')).toBeNull()
  })

  test('two heavy parts name the first offending part (fixed class order)', () => {
    expect(decide(ROLE, 'tsc --noEmit && vite')).toEqual({ deny: denyFor('tsc-full', 'tsc --noEmit') })
  })
})

describe('allowed commands (FR-6)', () => {
  test('git, grep, ls, and cat pass', () => {
    expect(decide(ROLE, 'git status --short')).toBeNull()
    expect(decide(ROLE, 'grep -rn foo src')).toBeNull()
    expect(decide(ROLE, 'ls')).toBeNull()
    expect(decide(ROLE, 'cat file.txt')).toBeNull()
  })

  test('accepted v1 gaps pass: env CI=1 vite, bash -c vite, timeout 60 vite', () => {
    expect(decide(ROLE, 'env CI=1 vite')).toBeNull()
    expect(decide(ROLE, `bash -c 'vite'`)).toBeNull()
    expect(decide(ROLE, 'timeout 60 vite')).toBeNull()
  })
})

describe('false positives (FR-7)', () => {
  test('substring matches of tool names pass', () => {
    expect(decide(ROLE, 'grep vite')).toBeNull()
    expect(decide(ROLE, 'echo vite')).toBeNull()
    expect(decide(ROLE, 'git commit -m "vite"')).toBeNull()
    expect(decide(ROLE, 'echo "npx playwright test"')).toBeNull()
    expect(decide(ROLE, 'cat vite.config.ts')).toBeNull()
  })
})

describe('orchestrator exemption (FR-2)', () => {
  test('an agent with orchestrator in the name passes', () => {
    expect(decide('measure-orchestrator', 'vite')).toBeNull()
    expect(decide('measure-orchestrator-audit', 'bun test')).toBeNull()
  })

  test('the exemption is case-insensitive', () => {
    expect(decide('MEASURE-ORCHESTRATOR', 'vite')).toBeNull()
  })

  test('a null, empty, or unknown agent is guarded', () => {
    expect(decide(null, 'vite')).toEqual({ deny: denyFor('dev-server', 'vite') })
    expect(decide('', 'vite')).toEqual({ deny: denyFor('dev-server', 'vite') })
    expect(decide('build', 'vite')).toEqual({ deny: denyFor('dev-server', 'vite') })
    expect(decide('measure-jr-green', 'bun test')).toEqual({ deny: denyFor('test-suite', 'bun test') })
  })

  test('an allowed command with no agent still passes', () => {
    expect(decide(null, 'git status')).toBeNull()
  })
})
