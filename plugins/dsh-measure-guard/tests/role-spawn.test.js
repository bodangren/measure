// The spawn-route guard maps measure-phase-acceptance to the phase-acceptance
// role and measure-closeout to the record role of ~/.config/ra-quota/routes.json;
// vision-review is a known role with no agent yet (PM request, 2026-11-18).
import test from 'node:test'
import assert from 'node:assert/strict'

import { KNOWN_ROLES, ROLE_OF_AGENT, approvedRoutes, roleSpawnDecision } from '../src/core/guards.ts'

const ROUTES = JSON.stringify({
  roles: {
    acceptance: [{ route: 'opencode-go/deepseek-v4-pro#high' }],
    'phase-acceptance': [{ route: 'opencode-go/glm-5.3#high' }],
    record: [{ route: 'opencode-go/deepseek-v4.1-flash' }],
    'vision-review': [{ route: 'claude-code/claude-opus-5-5[1m]#high' }],
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

test('measure-closeout maps to the record role', () => {
  assert.equal(ROLE_OF_AGENT['measure-closeout'], 'record')
})

test('the record pick route passes for measure-closeout', () => {
  const routes = approvedRoutes(ROUTES, ROLE_OF_AGENT['measure-closeout'])
  assert.deepEqual(routes, ['opencode-go/deepseek-v4.1-flash'])
  const { decision } = roleSpawnDecision(context, ROUTES, {
    agent: 'measure-closeout',
    model: 'opencode-go/deepseek-v4.1-flash',
  })
  assert.equal(decision, null)
})

test('a model outside record is denied and names that pick role', () => {
  const { decision } = roleSpawnDecision(context, ROUTES, {
    agent: 'measure-closeout',
    model: 'claude-code/claude-opus-5-5[1m]#high',
  })
  assert.ok(decision !== null, 'the spawn must be denied')
  assert.match(decision.deny, /not an approved route/)
  assert.match(decision.deny, /opencode-go\/deepseek-v4\.1-flash/)
  assert.match(decision.deny, /ra-quota pick record/)
})

test('vision-review is a known role with no agent mapped to it', () => {
  assert.ok(KNOWN_ROLES.includes('vision-review'))
  assert.ok(!Object.values(ROLE_OF_AGENT).includes('vision-review'))
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
