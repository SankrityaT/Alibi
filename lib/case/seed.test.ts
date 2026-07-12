import { describe, expect, it } from 'vitest'
import { fallbackCase } from '../../content/cases/fallbackCase.js'
import { FakeSupermemoryClient } from '../supermemory/fakeClient.js'
import {
  DETECTIVE_CONTAINER_TAG,
  PLANTED_BY_CULPRIT_TAG,
  WORLD_CONTAINER_TAG,
  suspectContainerTag
} from './types.js'
import { seedCase } from './seed.js'

describe('seedCase', () => {
  it('writes each suspect ground truth into their isolated container with source metadata', async () => {
    const supermemory = new FakeSupermemoryClient()
    await seedCase(fallbackCase, { supermemory })

    for (const suspect of fallbackCase.suspects) {
      const { results } = await supermemory.search({
        q: '',
        containerTag: suspectContainerTag(suspect.suspectId)
      })
      const groundTruth = results.filter((r) => r.metadata?.source === 'ground-truth')
      expect(groundTruth).toHaveLength(suspect.groundTruth.length)
      for (const g of groundTruth) {
        expect(g.metadata?.suspectId).toBe(suspect.suspectId)
      }
      const contents = groundTruth.map((r) => r.content)
      for (const line of suspect.groundTruth) {
        expect(contents).toContain(line)
      }
    }
  })

  it('plants the false memory in the culprit container tagged planted-by-culprit', async () => {
    const supermemory = new FakeSupermemoryClient()
    const result = await seedCase(fallbackCase, { supermemory })

    const culpritId = fallbackCase.culpritId
    const { results } = await supermemory.search({
      q: '',
      containerTag: suspectContainerTag(culpritId)
    })
    const planted = results.filter((r) => r.metadata?.tag === PLANTED_BY_CULPRIT_TAG)
    expect(planted).toHaveLength(1)
    expect(planted[0].metadata?.source).toBe('planted')
    expect(planted[0].content).toBe(fallbackCase.plantedMemory.content)
    expect(result.plantedMemoryId).toBe(planted[0].id)
    expect(result.plantedMemoryId).not.toBe('')
  })

  it('plants the false memory in the container named by plantedMemory.suspectId', async () => {
    const supermemory = new FakeSupermemoryClient()
    await seedCase(fallbackCase, { supermemory })

    const { results } = await supermemory.search({
      q: '',
      containerTag: suspectContainerTag(fallbackCase.plantedMemory.suspectId)
    })
    expect(results.some((r) => r.metadata?.tag === PLANTED_BY_CULPRIT_TAG)).toBe(true)
  })

  it('writes one world-evidence memory per evidence item with its kind', async () => {
    const supermemory = new FakeSupermemoryClient()
    await seedCase(fallbackCase, { supermemory })

    const { results } = await supermemory.search({
      q: '',
      containerTag: WORLD_CONTAINER_TAG
    })
    const evidence = results.filter((r) => r.metadata?.source === 'evidence')
    expect(evidence).toHaveLength(fallbackCase.evidence.length)
    for (const ev of fallbackCase.evidence) {
      const match = evidence.find((r) => r.metadata?.evidenceId === ev.id)
      expect(match).toBeDefined()
      expect(match?.metadata?.kind).toBe(ev.kind)
      expect(match?.content).toBe(ev.summary)
    }
  })

  it('writes world facts into the detective container tagged world', async () => {
    const supermemory = new FakeSupermemoryClient()
    await seedCase(fallbackCase, { supermemory })

    const { results } = await supermemory.search({
      q: '',
      containerTag: DETECTIVE_CONTAINER_TAG
    })
    const world = results.filter((r) => r.metadata?.source === 'world')
    expect(world).toHaveLength(fallbackCase.worldFacts.length)
    const contents = world.map((r) => r.content)
    for (const fact of fallbackCase.worldFacts) {
      expect(contents).toContain(fact)
    }
  })

  it('returns a SeedResult whose counts match the CaseFile totals', async () => {
    const supermemory = new FakeSupermemoryClient()
    const result = await seedCase(fallbackCase, { supermemory })

    const groundTruthCount = fallbackCase.suspects.reduce(
      (sum, s) => sum + s.groundTruth.length,
      0
    )
    expect(result.suspectsSeeded).toBe(fallbackCase.suspects.length)
    expect(result.evidenceSeeded).toBe(fallbackCase.evidence.length)
    expect(result.memoriesWritten).toBe(
      groundTruthCount + 1 + fallbackCase.evidence.length + fallbackCase.worldFacts.length
    )
    expect(result.plantedMemoryId).not.toBe('')
  })
})
