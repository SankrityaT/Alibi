import { describe, expect, it } from 'vitest'
import { FakeSupermemoryClient } from '../supermemory/fakeClient.js'
import { FakeAnthropicClient } from '../anthropic/fakeClient.js'
import type { AnthropicMessageParams } from '../anthropic/types.js'
import { fallbackCase } from '../../content/cases/fallbackCase.js'
import { PLANTED_BY_CULPRIT_TAG, suspectContainerTag } from './types.js'
import { getActiveCase } from './store.js'
import { handleNewGame } from './handleNewGame.js'

function noopResponder() {
  return (_params: AnthropicMessageParams) => '{}'
}

describe('handleNewGame', () => {
  it('useFallback:true seeds the fallback case, returns its roster with ttsVoice, and sets active case', async () => {
    const supermemory = new FakeSupermemoryClient()
    const anthropic = new FakeAnthropicClient(noopResponder())

    const result = await handleNewGame(
      { difficulty: 'medium', useFallback: true },
      { supermemory, anthropic }
    )

    expect(result.status).toBe(200)
    expect(result.body.caseId).toBe(fallbackCase.id)
    expect(result.body.difficulty).toBe(fallbackCase.difficulty)
    expect(result.body.title).toBe(fallbackCase.title)
    expect(result.body.synopsis).toBe(fallbackCase.synopsis)

    const suspects = result.body.suspects as Array<{
      suspectId: string
      name: string
      ttsVoice: string
    }>
    expect(suspects).toHaveLength(fallbackCase.suspects.length)
    for (const expected of fallbackCase.suspects) {
      const got = suspects.find((s) => s.suspectId === expected.suspectId)
      expect(got).toBeDefined()
      expect(got?.name).toBe(expected.name)
      expect(got?.ttsVoice).toBe(expected.ttsVoice)
    }

    // No model call needed when the fallback is requested.
    expect(anthropic.calls).toHaveLength(0)
    expect(getActiveCase()).toBe(fallbackCase)
  })

  it('never returns 500: a generate stub that throws still yields 200 via fallback', async () => {
    const supermemory = new FakeSupermemoryClient()
    const anthropic = new FakeAnthropicClient(noopResponder())
    const throwingGenerate = async () => {
      throw new Error('model exploded')
    }

    const result = await handleNewGame(
      { difficulty: 'hard' },
      { supermemory, anthropic, generate: throwingGenerate as never }
    )

    expect(result.status).toBe(200)
    expect(result.body.caseId).toBe(fallbackCase.id)
    expect(getActiveCase()).toBe(fallbackCase)
  })

  it('seeds a successfully generated case (not the fallback) and sets it active', async () => {
    const supermemory = new FakeSupermemoryClient()
    const anthropic = new FakeAnthropicClient(noopResponder())
    const generated = { ...fallbackCase, id: 'gen-xyz', title: 'Generated Case' }
    const okGenerate = async () => generated

    const result = await handleNewGame(
      { difficulty: 'medium' },
      { supermemory, anthropic, generate: okGenerate as never }
    )

    expect(result.status).toBe(200)
    expect(result.body.caseId).toBe('gen-xyz')
    expect(result.body.title).toBe('Generated Case')
    expect(getActiveCase()).toBe(generated)
  })

  it('returns 400 for an invalid difficulty', async () => {
    const supermemory = new FakeSupermemoryClient()
    const anthropic = new FakeAnthropicClient(noopResponder())

    const result = await handleNewGame(
      { difficulty: 'impossible' },
      { supermemory, anthropic }
    )

    expect(result.status).toBe(400)
    expect(typeof result.body.error).toBe('string')
  })

  it('returns 400 when difficulty is missing', async () => {
    const supermemory = new FakeSupermemoryClient()
    const anthropic = new FakeAnthropicClient(noopResponder())

    const result = await handleNewGame({}, { supermemory, anthropic })
    expect(result.status).toBe(400)
  })

  it('plants the culprit false memory in the culprit container after a successful call', async () => {
    const supermemory = new FakeSupermemoryClient()
    const anthropic = new FakeAnthropicClient(noopResponder())

    await handleNewGame(
      { difficulty: 'medium', useFallback: true },
      { supermemory, anthropic }
    )

    const culpritTag = suspectContainerTag(fallbackCase.culpritId)
    const results = await supermemory.search({ q: 'alibi', containerTag: culpritTag })
    const planted = results.results.find(
      (m) => m.metadata?.tag === PLANTED_BY_CULPRIT_TAG
    )
    expect(planted).toBeDefined()
    expect(planted?.content).toBe(fallbackCase.plantedMemory.content)
  })
})
