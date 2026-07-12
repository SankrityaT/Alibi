import { beforeEach, describe, expect, it } from 'vitest'
import { FakeSupermemoryClient } from '../supermemory/fakeClient.js'
import { fallbackCase } from '../../content/cases/fallbackCase.js'
import { setActiveCase } from './store.js'
import { handleAccuse } from './handleAccuse.js'

function deps() {
  return { supermemory: new FakeSupermemoryClient() }
}

beforeEach(() => {
  setActiveCase(fallbackCase)
})

describe('handleAccuse', () => {
  it('accusing the true culprit with the exact planted claim is correct and reflects the identified planted memory', async () => {
    const result = await handleAccuse(
      {
        accusedCulpritId: fallbackCase.solution.culpritId,
        accusedPlantedClaim: fallbackCase.solution.plantedMemoryClaim,
        movesUsed: 4
      },
      deps()
    )

    expect(result.status).toBe(200)
    const rating = result.body.rating as { correct: boolean; basePoints: number }
    expect(rating.correct).toBe(true)
    expect(result.body.identifiedPlantedMemory).toBe(true)
    expect(result.body.culpritId).toBe(fallbackCase.solution.culpritId)
    expect(result.body.plantedMemoryClaim).toBe(fallbackCase.solution.plantedMemoryClaim)
    expect(result.body.explanation).toBe(fallbackCase.solution.explanation)
  })

  it('naming the true culprit but the wrong planted claim is still correct, without the planted-memory credit', async () => {
    const result = await handleAccuse(
      {
        accusedCulpritId: fallbackCase.solution.culpritId,
        accusedPlantedClaim: 'Something completely unrelated.',
        movesUsed: 4
      },
      deps()
    )

    const rating = result.body.rating as { correct: boolean }
    expect(rating.correct).toBe(true)
    expect(result.body.identifiedPlantedMemory).toBe(false)
  })

  it('accusing an innocent suspect is incorrect', async () => {
    const innocent = fallbackCase.suspects.find((s) => !s.isCulprit)!
    const result = await handleAccuse(
      { accusedCulpritId: innocent.suspectId, movesUsed: 8 },
      deps()
    )

    expect(result.status).toBe(200)
    const rating = result.body.rating as { correct: boolean; basePoints: number }
    expect(rating.correct).toBe(false)
    expect(rating.basePoints).toBe(0)
  })

  it('accusing the red-herring suspect marks the player as fooled by the red herring', async () => {
    const redHerring = fallbackCase.suspects.find((s) => s.isRedHerring)!
    const result = await handleAccuse(
      { accusedCulpritId: redHerring.suspectId, movesUsed: 4 },
      deps()
    )

    expect(result.body.fooledByRedHerring).toBe(true)
  })

  it('returns 400 when accusedCulpritId is missing', async () => {
    const result = await handleAccuse({ movesUsed: 2 }, deps())
    expect(result.status).toBe(400)
    expect(typeof result.body.error).toBe('string')
  })
})
