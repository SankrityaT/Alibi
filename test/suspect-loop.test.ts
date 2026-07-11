import { describe, expect, it } from 'vitest'
import { FakeSupermemoryClient } from '../lib/supermemory/fakeClient.js'
import { FakeAnthropicClient } from '../lib/anthropic/fakeClient.js'
import { seedGroundTruth, tellSuspect } from '../lib/suspect/memory.js'
import { respondAsSuspect } from '../lib/suspect/respond.js'
import { mara, jonas } from './fixtures/suspects.js'
import { echoResponder } from './fixtures/echoResponder.js'

describe('suspect memory loop (composed)', () => {
  it('answers using seeded ground truth', async () => {
    const supermemory = new FakeSupermemoryClient()
    const anthropic = new FakeAnthropicClient(echoResponder())

    await seedGroundTruth(
      mara.containerTag,
      ['Rerouted Theo\'s delivery path at 21:45, logged internally as "traffic".'],
      supermemory
    )

    const result = await respondAsSuspect(mara, "Did you change Theo's route?", {
      supermemory,
      anthropic
    })

    expect(result.retrievedMemories).toHaveLength(1)
    expect(result.answer).toContain('Rerouted')
  })

  it('remembers a planted lie on the next question', async () => {
    const supermemory = new FakeSupermemoryClient()
    const anthropic = new FakeAnthropicClient(echoResponder())

    await seedGroundTruth(mara.containerTag, ['Was at the dispatch desk all night.'], supermemory)

    await tellSuspect(
      mara.containerTag,
      'The detective told you: "Jonas already confessed he was at the docks."',
      'player-told',
      supermemory
    )

    const result = await respondAsSuspect(mara, 'What do you know about Jonas and the docks?', {
      supermemory,
      anthropic
    })

    const contents = result.retrievedMemories.map((memory) => memory.content)
    expect(contents.some((content) => content.includes('Jonas already confessed'))).toBe(true)
  })

  it("keeps suspects isolated from each other's memories", async () => {
    const supermemory = new FakeSupermemoryClient()
    const anthropic = new FakeAnthropicClient(echoResponder())

    await seedGroundTruth(
      jonas.containerTag,
      ['Was at the docks at 22:00 to meet Theo for money.'],
      supermemory
    )

    const result = await respondAsSuspect(mara, 'Where was Jonas at 22:00?', {
      supermemory,
      anthropic
    })

    expect(result.retrievedMemories).toHaveLength(0)
  })
})
