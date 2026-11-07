// NFR-1: the setup offer for a git repository without measure/. The strings
// are the shared core's, not copies.
import test from 'node:test'
import assert from 'node:assert/strict'

import { SETUP_PROMPT as CORE_PROMPT, needsSetup as coreNeedsSetup, setupBandText as coreBandText } from '../src/core/guards.ts'
import { Agents } from '../src/state.js'
import {
  SETUP_CHOICES,
  SETUP_PROMPT,
  isSetupChoice,
  needsSetup,
  resolveSetupChoice,
  setupBandText,
  setupChoiceOf,
} from '../src/setup.js'

test('a git repository without measure/ asks for setup, a non-repo and a Measure project do not', () => {
  assert.equal(needsSetup({ isRepo: true, hasMeasure: false }), true)
  assert.equal(needsSetup({ isRepo: false, hasMeasure: false }), false)
  assert.equal(needsSetup({ isRepo: true, hasMeasure: true }), false)
  assert.equal(needsSetup({ isRepo: false, hasMeasure: true }), false)
  assert.equal(needsSetup(null), false)
  assert.equal(needsSetup, coreNeedsSetup)
})

test('the setup band text silences itself for off and keeps the prompt text for setup', () => {
  assert.equal(setupBandText('off'), null)
  assert.equal(setupBandText('pending'), 'Measure · this repository has no measure/ folder.')
  assert.equal(setupBandText(null), 'Measure · this repository has no measure/ folder.')
  assert.equal(setupBandText('setup'), 'Measure · setup requested.')
  assert.equal(setupBandText, coreBandText)
})

test('SETUP_PROMPT is the shared core string, not a copy', () => {
  assert.equal(SETUP_PROMPT, CORE_PROMPT)
  assert.match(SETUP_PROMPT, /Measure setup workflow/)
})

test('resolveSetupChoice stores pending, off, and setup, and rejects anything else', () => {
  const state = { agents: new Agents() }
  assert.equal(setupChoiceOf(state, 'agent-1'), null)

  assert.equal(resolveSetupChoice(state, 'agent-1', 'off'), 'off')
  assert.equal(setupChoiceOf(state, 'agent-1'), 'off')
  assert.equal(state.agents.sessionOf('agent-1').setupChoice, 'off')

  assert.equal(resolveSetupChoice(state, 'agent-1', 'setup'), 'setup')
  assert.equal(setupChoiceOf(state, 'agent-1'), 'setup')

  assert.equal(resolveSetupChoice(state, 'agent-1', 'nonsense'), 'pending')
  assert.equal(setupChoiceOf(state, 'agent-1'), 'pending')

  assert.equal(resolveSetupChoice(state, 'agent-1', null), 'pending')
  assert.equal(setupChoiceOf(state, 'agent-1'), 'pending')
})

test('isSetupChoice accepts exactly the three answers', () => {
  assert.deepEqual(SETUP_CHOICES, ['pending', 'off', 'setup'])
  assert.equal(isSetupChoice('pending'), true)
  assert.equal(isSetupChoice('off'), true)
  assert.equal(isSetupChoice('setup'), true)
  assert.equal(isSetupChoice(''), false)
  assert.equal(isSetupChoice(null), false)
  assert.equal(isSetupChoice(undefined), false)
})
