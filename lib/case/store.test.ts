import { describe, expect, it } from 'vitest'
import { fallbackCase } from '../../content/cases/fallbackCase.js'
import { caseToRegistry } from './toRegistry.js'
import { getActiveCase, getActiveRegistry, setActiveCase } from './store.js'

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
})
