import { describe, expect, it } from 'vitest'
import { curatedCases } from './curatedCases.js'
import { validateCase } from '../../lib/case/validate.js'

describe('curatedCases', () => {
  it('has one case per difficulty with matching difficulty field', () => {
    expect(curatedCases.easy.difficulty).toBe('easy')
    expect(curatedCases.medium.difficulty).toBe('medium')
    expect(curatedCases.hard.difficulty).toBe('hard')
  })

  for (const difficulty of ['easy', 'medium', 'hard'] as const) {
    it(`${difficulty} case passes validateCase`, () => {
      const result = validateCase(curatedCases[difficulty])
      // Surface any issues in the failure message for quick fixing.
      expect(result.issues, JSON.stringify(result.issues, null, 2)).toEqual([])
      expect(result.ok).toBe(true)
    })

    it(`${difficulty} case has a red herring and a planted memory on the culprit`, () => {
      const c = curatedCases[difficulty]
      expect(c.suspects.some((s) => s.isRedHerring)).toBe(true)
      expect(c.plantedMemory.suspectId).toBe(c.culpritId)
    })
  }
})
