import { describe, expect, it } from 'vitest'
import type { CaseMoveTrail } from './rating.js'
import { DETECTIVE_RANKS, computeRating } from './rating.js'

function rankIndex(rank: string): number {
  return DETECTIVE_RANKS.indexOf(rank as (typeof DETECTIVE_RANKS)[number])
}

function cleanHardSolve(overrides: Partial<CaseMoveTrail> = {}): CaseMoveTrail {
  return {
    difficulty: 'hard',
    movesUsed: 3,
    accusedCulpritId: 'mara',
    correctCulpritId: 'mara',
    identifiedPlantedMemory: true,
    fooledByRedHerring: false,
    ...overrides
  }
}

describe('computeRating', () => {
  it('awards 30 base points, correct, and the highest rank for a clean, efficient hard solve that identified the planted memory', () => {
    const rating = computeRating(cleanHardSolve())

    expect(rating.correct).toBe(true)
    expect(rating.basePoints).toBe(30)
    expect(rating.rank).toBe('Chief')
    expect(rankIndex(rating.rank)).toBe(DETECTIVE_RANKS.length - 1)
  })

  it('accusing the wrong culprit scores 0 base points, correct false, and the lowest rank', () => {
    const rating = computeRating(
      cleanHardSolve({ accusedCulpritId: 'jonas' })
    )

    expect(rating.correct).toBe(false)
    expect(rating.basePoints).toBe(0)
    expect(rating.rank).toBe('Rookie')
    expect(rankIndex(rating.rank)).toBe(0)
  })

  it('being fooled by a red herring lowers the rank versus an otherwise-identical clean solve', () => {
    const clean = computeRating(cleanHardSolve({ fooledByRedHerring: false }))
    const fooled = computeRating(cleanHardSolve({ fooledByRedHerring: true }))

    expect(rankIndex(fooled.rank)).toBeLessThan(rankIndex(clean.rank))
  })

  it('maps easy/medium/hard difficulty to 10/20/30 base points on a correct solve', () => {
    expect(computeRating(cleanHardSolve({ difficulty: 'easy' })).basePoints).toBe(10)
    expect(computeRating(cleanHardSolve({ difficulty: 'medium' })).basePoints).toBe(20)
    expect(computeRating(cleanHardSolve({ difficulty: 'hard' })).basePoints).toBe(30)
  })

  it('a correct solve produces a non-empty human summary', () => {
    const rating = computeRating(cleanHardSolve())
    expect(typeof rating.summary).toBe('string')
    expect(rating.summary.length).toBeGreaterThan(0)
  })
})
