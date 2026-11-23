// Red (Task 1.1): the heavy-run pure matcher of FR-1 to FR-7.
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
    expect(decide(ROLE, 'npm exec -- vite')).toEqual({ deny: denyFor('dev-server', 'npm exec -- vite') })
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

  test('tsc -b and tsc --build are refused', () => {
    expect(decide(ROLE, 'tsc -b')).toEqual({ deny: denyFor('tsc-full', 'tsc -b') })
    expect(decide(ROLE, 'tsc --build')).toEqual({ deny: denyFor('tsc-full', 'tsc --build') })
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

describe('wrappers', () => {
  test('env, nohup, and timeout wrappers still refuse the dev server', () => {
    expect(decide(ROLE, 'env CI=1 vite')).toEqual({ deny: denyFor('dev-server', 'env CI=1 vite') })
    expect(decide(ROLE, 'nohup vite')).toEqual({ deny: denyFor('dev-server', 'nohup vite') })
    expect(decide(ROLE, 'timeout 60 vite')).toEqual({ deny: denyFor('dev-server', 'timeout 60 vite') })
  })

  test('env -u and timeout -k option values are skipped', () => {
    expect(decide(ROLE, 'env -u CI vite')).toEqual({ deny: denyFor('dev-server', 'env -u CI vite') })
    expect(decide(ROLE, 'timeout -k 5s 60s vite')).toEqual({ deny: denyFor('dev-server', 'timeout -k 5s 60s vite') })
  })

  test('time -p and exec -a option forms still refuse', () => {
    expect(decide(ROLE, 'time -p vite')).toEqual({ deny: denyFor('dev-server', 'time -p vite') })
    expect(decide(ROLE, 'exec -a x vite')).toEqual({ deny: denyFor('dev-server', 'exec -a x vite') })
  })

  test('command -v is a lookup and passes', () => {
    expect(decide(ROLE, 'command -v vite')).toBeNull()
  })

  test("env -S checks its command string: vite refused, ls passes", () => {
    expect(decide(ROLE, `env -S 'vite --port 3000'`)).toEqual({ deny: denyFor('dev-server', `env -S 'vite --port 3000'`) })
    expect(decide(ROLE, `env -S 'ls -l'`)).toBeNull()
  })

  test('words after the env -S string are its arguments and are ignored', () => {
    expect(decide(ROLE, `env -S 'vite' foo`)).toEqual({ deny: denyFor('dev-server', `env -S 'vite' foo`) })
  })
})

describe('shell -c recursion', () => {
  test("bash -c 'vite' is refused and names the inner code", () => {
    expect(decide(ROLE, `bash -c 'vite'`)).toEqual({ deny: denyFor('dev-server', 'vite') })
  })

  test("sh -c 'cd x && vite' is refused and names the inner offending part", () => {
    expect(decide(ROLE, `sh -c 'cd x && vite'`)).toEqual({ deny: denyFor('dev-server', 'vite') })
  })

  test("bash -c 'ls' passes", () => {
    expect(decide(ROLE, `bash -c 'ls'`)).toBeNull()
  })

  test('two levels of shell -c are still refused (depth limit 2)', () => {
    expect(decide(ROLE, `bash -c 'bash -c "vite"'`)).toEqual({ deny: denyFor('dev-server', 'vite') })
  })

  test('three levels of shell -c pass (past the depth limit)', () => {
    expect(decide(ROLE, `bash -c 'bash -c "bash -c \\"vite\\""'`)).toBeNull()
  })
})

describe('non-path heavy-run.sh -c', () => {
  test('./heavy-run.sh -c vite is refused as dev-server', () => {
    expect(decide(ROLE, './heavy-run.sh -c vite')).toEqual({ deny: denyFor('dev-server', 'vite') })
  })

  test('./heavy-run.sh -c ls passes', () => {
    expect(decide(ROLE, `./heavy-run.sh -c 'ls'`)).toBeNull()
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

  test('a bare heavy-run.sh is not the form', () => {
    expect(decide(ROLE, './heavy-run.sh -c vite')).toEqual({ deny: denyFor('dev-server', 'vite') })
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
