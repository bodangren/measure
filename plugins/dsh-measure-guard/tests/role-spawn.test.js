// The spawn-route guard maps measure-phase-acceptance to the phase-acceptance
// role of ~/.config/ra-quota/routes.json (PM request, 2026-11-18).
import test from 'node:test'
import assert from 'node:assert/strict'

import { ROLE_OF_AGENT, approvedRoutes, roleSpawnDecision } from '../src/core/guards.ts'

const ROUTES = JSON.stringify({
  roles: {
    acceptance: [{ route: 'opencode-go/deepseek-v4-pro#high' }],
    'phase-acceptance': [{ route: 'opencode-go/glm-5.3#high' }],
  },
})

const context = { snapshot: null, mode: 'guard', setupChoice: null, guardsOff: null }

test('measure-phase-acceptance maps to the phase-acceptance role', () => {
  assert.equal(ROLE_OF_AGENT['measure-phase-acceptance'], 'phase-acceptance')
})

test('the phase-acceptance pick route passes for measure-phase-acceptance', () => {
  const routes = approvedRoutes(ROUTES, ROLE_OF_AGENT['measure-phase-acceptance'])
  assert.deepEqual(routes, ['opencode-go/glm-5.3#high'])
  const { decision } = roleSpawnDecision(context, ROUTES, {
    agent: 'measure-phase-acceptance',
    model: 'opencode-go/glm-5.3#high',
  })
  assert.equal(decision, null)
})

test('a model outside phase-acceptance is denied and names that pick role', () => {
  const { decision } = roleSpawnDecision(context, ROUTES, {
    agent: 'measure-phase-acceptance',
    model: 'claude-code/claude-opus-5-5[1m]#high',
  })
  assert.ok(decision !== null, 'the spawn must be denied')
  assert.match(decision.deny, /not an approved route/)
  assert.match(decision.deny, /opencode-go\/glm-5\.3#high/)
  assert.match(decision.deny, /ra-quota pick phase-acceptance/)
})
