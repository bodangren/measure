// The spawn-route guard maps measure-phase-acceptance to the phase-acceptance
// role and measure-closeout to the record role of ~/.config/ra-quota/routes.json;
// vision-review is a known role with no agent yet (PM request, 2026-11-18).
// measure-ux-browser-review maps to review-c, and a picture brief also accepts
// vision-review (PM add-on, 2026-11-18).
import { describe, expect, test } from 'claude-code/testing'
import { KNOWN_ROLES, ROLE_OF_AGENT, approvedRoutes, roleSpawnDecision, roleSpawnOf } from '../hooks/guards'

const ROUTES = JSON.stringify({
  roles: {
    acceptance: [{ route: 'opencode-go/deepseek-v4-pro#high' }],
    'phase-acceptance': [{ route: 'opencode-go/glm-5.3#high' }],
    record: [{ route: 'opencode-go/deepseek-v4.1-flash' }],
    'review-c': [{ route: 'opencode-go/glm-4.5#high' }],
    'vision-review': [{ route: 'claude-code/claude-opus-5-5[1m]#high' }],
  },
})

const REVIEW_C = 'opencode-go/glm-4.5#high'
const VISION = 'claude-code/claude-opus-5-5[1m]#high'

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

  test('measure-closeout maps to the record role', () => {
    expect(ROLE_OF_AGENT['measure-closeout']).toBe('record')
  })

  test('the record pick route passes for measure-closeout', () => {
    expect(approvedRoutes(ROUTES, ROLE_OF_AGENT['measure-closeout'])).toEqual(['opencode-go/deepseek-v4.1-flash'])
    const { decision } = roleSpawnDecision({ ...context, mode: 'guard' }, ROUTES, {
      agent: 'measure-closeout',
      model: 'opencode-go/deepseek-v4.1-flash',
    })
    expect(decision).toBeNull()
  })

  test('a model outside record is denied and names that pick role', () => {
    const { decision } = roleSpawnDecision({ ...context, mode: 'guard' }, ROUTES, {
      agent: 'measure-closeout',
      model: 'claude-code/claude-opus-5-5[1m]#high',
    })
    expect(decision).not.toBeNull()
    expect(decision?.deny).toContain('not an approved route')
    expect(decision?.deny).toContain('opencode-go/deepseek-v4.1-flash')
    expect(decision?.deny).toContain('ra-quota pick record')
  })

  test('vision-review is a known role with no agent mapped to it', () => {
    expect(KNOWN_ROLES).toContain('vision-review')
    expect(Object.values(ROLE_OF_AGENT)).not.toContain('vision-review')
  })
})

describe('spec review role', () => {
  test('measure-spec-review maps to the spec-review role and measure-strategy stays on strategy', () => {
    expect(ROLE_OF_AGENT['measure-spec-review']).toBe('spec-review')
    expect(ROLE_OF_AGENT['measure-strategy']).toBe('strategy')
  })

  test('the spec-review pick route passes for measure-spec-review', () => {
    const SPEC_ROUTES = JSON.stringify({
      roles: {
        strategy: [{ route: 'opencode-go/strategy-route#high' }],
        'spec-review': [{ route: 'opencode-go/spec-review-route#high' }],
      },
    })
    expect(approvedRoutes(SPEC_ROUTES, ROLE_OF_AGENT['measure-spec-review'])).toEqual(['opencode-go/spec-review-route#high'])
    const { decision } = roleSpawnDecision({ ...context, mode: 'guard' }, SPEC_ROUTES, {
      agent: 'measure-spec-review',
      model: 'opencode-go/spec-review-route#high',
    })
    expect(decision).toBeNull()
  })
})

describe('ux browser review role', () => {
  test('measure-ux-browser-review maps to the review-c role', () => {
    expect(ROLE_OF_AGENT['measure-ux-browser-review']).toBe('review-c')
  })

  test('the spawn prompt is read from the subagent input', () => {
    expect(roleSpawnOf('subagent', { agent: 'measure-ux-browser-review', model: REVIEW_C, prompt: 'Review the screenshot' })).toEqual({
      agent: 'measure-ux-browser-review',
      model: REVIEW_C,
      prompt: 'Review the screenshot',
    })
  })

  test('a text brief accepts a review-c route with no warning', () => {
    const spawn = { agent: 'measure-ux-browser-review', model: REVIEW_C, prompt: 'Check the API response shape' } as any
    const { decision, note } = roleSpawnDecision({ ...context, mode: 'guard' }, ROUTES, spawn)
    expect(decision).toBeNull()
    expect(note).toBeNull()
  })

  test('a text brief refuses a vision-review-only route', () => {
    const spawn = { agent: 'measure-ux-browser-review', model: VISION, prompt: 'Check the API response shape' } as any
    const { decision } = roleSpawnDecision({ ...context, mode: 'guard' }, ROUTES, spawn)
    expect(decision).not.toBeNull()
    expect(decision?.deny).toContain('not an approved route')
    expect(decision?.deny).toContain(REVIEW_C)
  })

  test('a picture brief accepts a vision-review route', () => {
    const spawn = { agent: 'measure-ux-browser-review', model: VISION, prompt: 'Review the screenshot for layout bugs' } as any
    const { decision, note } = roleSpawnDecision({ ...context, mode: 'guard' }, ROUTES, spawn)
    expect(decision).toBeNull()
    expect(note).toBeNull()
  })
})
