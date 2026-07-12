import { describe, expect, it } from 'vitest'
import { fallbackCase } from './fallbackCase.js'

describe('fallbackCase', () => {
  it('has exactly one culprit and it matches culpritId', () => {
    const culprits = fallbackCase.suspects.filter((s) => s.isCulprit)
    expect(culprits).toHaveLength(1)
    expect(culprits[0].suspectId).toBe(fallbackCase.culpritId)
  })

  it('has four suspects at medium difficulty', () => {
    expect(fallbackCase.difficulty).toBe('medium')
    expect(fallbackCase.suspects).toHaveLength(4)
  })

  it('has exactly one red herring who is not the culprit', () => {
    const redHerrings = fallbackCase.suspects.filter((s) => s.isRedHerring)
    expect(redHerrings).toHaveLength(1)
    expect(redHerrings[0].isCulprit).toBe(false)
  })

  it('points its planted memory at an existing suspect', () => {
    const ids = fallbackCase.suspects.map((s) => s.suspectId)
    expect(ids).toContain(fallbackCase.plantedMemory.suspectId)
  })

  it('has a solution whose culpritId matches the case culpritId', () => {
    expect(fallbackCase.solution.culpritId).toBe(fallbackCase.culpritId)
  })

  it('has at least one evidence item that contradicts a claim', () => {
    const contradicting = fallbackCase.evidence.filter((e) => e.contradictsClaim)
    expect(contradicting.length).toBeGreaterThanOrEqual(1)
  })
})
