import { describe, expect, it } from 'vitest'
import { fallbackCase } from '../../content/cases/fallbackCase.js'
import { caseToRegistry } from './toRegistry.js'
import {
  getActiveCase,
  getActivePublicCase,
  getActiveRegistry,
  setActiveCase
} from './store.js'

// The store is a module-level singleton, so these tests run in order: the
// "before any setActiveCase" assertion must come first, while the module state
// is still pristine.
describe('active-case store', () => {
  it('getActiveRegistry() returns the fallback-derived registry before any setActiveCase', () => {
    expect(getActiveCase()).toBeNull()

    const registry = getActiveRegistry()
    const expected = caseToRegistry(fallbackCase)
    expect(Object.keys(registry).sort()).toEqual(Object.keys(expected).sort())
    for (const suspect of fallbackCase.suspects) {
      expect(registry[suspect.suspectId]).toBeDefined()
      expect(registry[suspect.suspectId].name).toBe(suspect.name)
    }
  })

  it('after setActiveCase(fallbackCase), getActiveCase() is identity-equal', () => {
    setActiveCase(fallbackCase)
    expect(getActiveCase()).toBe(fallbackCase)
  })

  it('getActiveRegistry() reflects the active case once set', () => {
    setActiveCase(fallbackCase)
    const registry = getActiveRegistry()
    for (const suspect of fallbackCase.suspects) {
      expect(registry[suspect.suspectId]).toBeDefined()
      expect(registry[suspect.suspectId].ttsVoice).toBe(suspect.ttsVoice)
    }
  })

  it('getActivePublicCase() exposes the roster but never the solution', () => {
    setActiveCase(fallbackCase)
    const view = getActivePublicCase()

    expect(view.started).toBe(true)
    expect(view.suspects.length).toBe(fallbackCase.suspects.length)
    expect(view.suspects[0]).toEqual({
      suspectId: fallbackCase.suspects[0].suspectId,
      name: fallbackCase.suspects[0].name,
      ttsVoice: fallbackCase.suspects[0].ttsVoice
    })
    // The culprit / planted-memory answer must never reach the client bundle.
    expect(view).not.toHaveProperty('solution')
    expect(JSON.stringify(view)).not.toContain('culpritId')
  })
})
