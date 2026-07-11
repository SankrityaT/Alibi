import { describe, expect, it } from 'vitest'
import { FakeSupermemoryClient } from '../supermemory/fakeClient.js'
import { FakeAnthropicClient } from '../anthropic/fakeClient.js'
import { seedGroundTruth } from './memory.js'
import { respondAsSuspect, type CharacterSheet } from './respond.js'

const mara: CharacterSheet = {
  suspectId: 'mara',
  containerTag: 'suspect-mara',
  name: 'Mara Okafor',
  voice: 'clipped, professional, deflects with procedure',
  motive: "covering up the reroute she made at 21:45",
  hiddenFacts: "She edited the dispatch log to reroute Theo at 21:45."
}

describe('respondAsSuspect', () => {
  it('grounds the answer in retrieved memories and the character sheet', async () => {
    const supermemory = new FakeSupermemoryClient()
    const anthropic = new FakeAnthropicClient((params) => `RESPONSE_USING: ${params.userMessage}`)

    await seedGroundTruth(
      mara.containerTag,
      ['Rerouted Theo\'s delivery path at 21:45, logged internally as "traffic".'],
      supermemory
    )

    const result = await respondAsSuspect(mara, "Did you change Theo's route?", {
      supermemory,
      anthropic
    })

    expect(result.query).toBe("Did you change Theo's route?")
    expect(result.retrievedMemories).toHaveLength(1)
    expect(result.retrievedMemories[0].content).toContain('Rerouted')
    expect(result.answer).toContain('Rerouted')

    expect(anthropic.calls).toHaveLength(1)
    expect(anthropic.calls[0].system).toContain('Mara Okafor')
    expect(anthropic.calls[0].system).toContain(mara.hiddenFacts)
    expect(anthropic.calls[0].userMessage).toContain('Rerouted')
  })

  it('tells the model when nothing relevant was found, instead of inventing facts', async () => {
    const supermemory = new FakeSupermemoryClient()
    const anthropic = new FakeAnthropicClient((params) => `RESPONSE_USING: ${params.userMessage}`)

    const result = await respondAsSuspect(mara, 'What is the capital of France?', {
      supermemory,
      anthropic
    })

    expect(result.retrievedMemories).toHaveLength(0)
    expect(anthropic.calls[0].userMessage).toContain('no relevant memories found')
  })
})
