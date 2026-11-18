// The spawn-route guard maps measure-phase-acceptance to the phase-acceptance
// role of ~/.config/ra-quota/routes.json (PM request, 2026-11-18).
import { describe, expect, test } from 'claude-code/testing'
import { ROLE_OF_AGENT, approvedRoutes, roleSpawnDecision } from '../hooks/guards'

const ROUTES = JSON.stringify({
  roles: {
    acceptance: [{ route: 'opencode-go/deepseek-v4-pro#high' }],
    'phase-acceptance': [{ route: 'opencode-go/glm-5.3#high' }],
  },
})

const context = { snapshot: null, mode: 'guard', setupChoice: null, guardsOff: null } as const

describe('phase acceptance role', () => {
  test('measure-phase-acceptance maps to the phase-acceptance role', () => {
    expect(ROLE_OF_AGENT['measure-phase-acceptance']).toBe('phase-acceptance')
  })

  test('the phase-acceptance pick route passes for measure-phase-acceptance', () => {
    expect(approvedRoutes(ROUTES, ROLE_OF_AGENT['measure-phase-acceptance'])).toEqual(['opencode-go/glm-5.3#high'])
    const { decision } = roleSpawnDecision({ ...context, mode: 'guard' }, ROUTES, {
      agent: 'measure-phase-acceptance',
      model: 'opencode-go/glm-5.3#high',
    })
    expect(decision).toBeNull()
  })

  test('a model outside phase-acceptance is denied and names that pick role', () => {
    const { decision } = roleSpawnDecision({ ...context, mode: 'guard' }, ROUTES, {
      agent: 'measure-phase-acceptance',
      model: 'claude-code/claude-opus-5-5[1m]#high',
    })
    expect(decision).not.toBeNull()
    expect(decision?.deny).toContain('not an approved route')
    expect(decision?.deny).toContain('opencode-go/glm-5.3#high')
    expect(decision?.deny).toContain('ra-quota pick phase-acceptance')
  })
})
