import { describe, expect, it } from 'vitest'
import { FakeSupermemoryClient } from '../supermemory/fakeClient.js'
import { FakeAnthropicClient } from '../anthropic/fakeClient.js'
import type { SearchParams, SearchResult } from '../supermemory/types.js'
import { DETECTIVE_CONTAINER_TAG } from '../case/types.js'
import { askNotebook } from './notebook.js'

// A FakeSupermemoryClient that records every containerTag it was asked to
// search, so we can prove askNotebook fans out across every provided container.
class SpySupermemoryClient extends FakeSupermemoryClient {
  public searchedTags: string[] = []

  async search(params: SearchParams): Promise<SearchResult> {
    this.searchedTags.push(params.containerTag)
    return super.search(params)
  }
}

async function seededSpy(): Promise<SpySupermemoryClient> {
  const spy = new SpySupermemoryClient()
  // Detective's own accumulated case notes (produced by a pull verb).
  await spy.writeMemory({
    content: 'CCTV shows no one entered Room 3 after 22:00.',
    containerTag: DETECTIVE_CONTAINER_TAG,
    metadata: { source: 'verb', kind: 'cctv' }
  })
  // Two different suspects' private memories.
  await spy.writeMemory({
    content: 'I rerouted Theo at 21:45; it was procedure.',
    containerTag: 'suspect-mara',
    metadata: { source: 'evidence-shown' }
  })
  await spy.writeMemory({
    content: 'I left the platform before the theft.',
    containerTag: 'suspect-theo'
  })
  return spy
}

describe('askNotebook', () => {
  const containerTags = [DETECTIVE_CONTAINER_TAG, 'suspect-mara', 'suspect-theo']

  it('searches every provided containerTag', async () => {
    const spy = await seededSpy()
    const anthropic = new FakeAnthropicClient((params) => params.userMessage)

    await askNotebook('who was near Room 3?', { supermemory: spy, anthropic }, { containerTags })

    for (const tag of containerTags) {
      expect(spy.searchedTags).toContain(tag)
    }
  })

  it('returns citations drawn from more than one container with correct source and containerTag', async () => {
    const spy = await seededSpy()
    const anthropic = new FakeAnthropicClient((params) => params.userMessage)

    const result = await askNotebook(
      'who was near Room 3?',
      { supermemory: spy, anthropic },
      { containerTags }
    )

    const containers = new Set(result.citations.map((c) => c.containerTag))
    expect(containers.size).toBeGreaterThan(1)

    const detective = result.citations.find((c) => c.containerTag === DETECTIVE_CONTAINER_TAG)
    expect(detective).toBeDefined()
    expect(detective?.source).toContain('Detective')
    expect(detective?.content).toContain('Room 3')

    const mara = result.citations.find((c) => c.containerTag === 'suspect-mara')
    expect(mara).toBeDefined()
    expect(mara?.source).toContain('Mara')

    const theo = result.citations.find((c) => c.containerTag === 'suspect-theo')
    expect(theo).toBeDefined()
    expect(theo?.source).toContain('Theo')
  })

  it('synthesizes a non-empty answer that reflects the retrieved memories', async () => {
    const spy = await seededSpy()
    const anthropic = new FakeAnthropicClient((params) => params.userMessage)

    const result = await askNotebook(
      'who was near Room 3?',
      { supermemory: spy, anthropic },
      { containerTags }
    )

    expect(result.query).toBe('who was near Room 3?')
    expect(result.answer.trim().length).toBeGreaterThan(0)
    // The echoed prompt carries the retrieved evidence, proving the memories are
    // handed to Claude for synthesis with citation markers.
    expect(result.answer).toContain('Room 3')
    expect(result.answer).toContain('[1]')
  })

  it('still produces an answer when no memories are found', async () => {
    const spy = new SpySupermemoryClient()
    const anthropic = new FakeAnthropicClient((params) => params.userMessage)

    const result = await askNotebook('anything?', { supermemory: spy, anthropic }, { containerTags })

    expect(result.citations).toEqual([])
    expect(result.answer.trim().length).toBeGreaterThan(0)
  })
})
