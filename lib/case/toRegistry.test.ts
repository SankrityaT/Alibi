import { describe, expect, it } from 'vitest'
import { fallbackCase } from '../../content/cases/fallbackCase.js'
import { suspectContainerTag } from './types.js'
import { caseToRegistry } from './toRegistry.js'

describe('caseToRegistry', () => {
  it('returns one CharacterSheet per suspect keyed by suspectId', () => {
    const registry = caseToRegistry(fallbackCase)
    const keys = Object.keys(registry)
    expect(keys).toHaveLength(fallbackCase.suspects.length)
    for (const suspect of fallbackCase.suspects) {
      expect(keys).toContain(suspect.suspectId)
    }
  })

  it('maps each suspect with a container tag equal to suspectContainerTag(id)', () => {
    const registry = caseToRegistry(fallbackCase)
    for (const suspect of fallbackCase.suspects) {
      const sheet = registry[suspect.suspectId]
      expect(sheet.containerTag).toBe(suspectContainerTag(suspect.suspectId))
      expect(sheet.containerTag.length).toBeGreaterThan(0)
    }
  })

  it('passes through name and ttsVoice, and folds the incriminating fact into hiddenFacts', () => {
    const registry = caseToRegistry(fallbackCase)
    for (const suspect of fallbackCase.suspects) {
      const sheet = registry[suspect.suspectId]
      expect(sheet.name).toBe(suspect.name)
      expect(sheet.ttsVoice).toBe(suspect.ttsVoice)
      expect(sheet.hiddenFacts).toContain(suspect.incriminatingFact)
    }
  })
})
