import { describe, expect, it } from 'vitest'
import { FakeSupermemoryClient } from '../lib/supermemory/fakeClient.js'
import { FakeAnthropicClient } from '../lib/anthropic/fakeClient.js'
import { seedGroundTruth, tellSuspect } from '../lib/suspect/memory.js'
import { respondAsSuspect, type CharacterSheet } from '../lib/suspect/respond.js'

const mara: CharacterSheet = {
  suspectId: 'mara',
  containerTag: 'case1-suspect-mara',
  name: 'Mara Okafor',
  voice: 'clipped, professional, deflects with procedure',
  motive: 'covering up the reroute she made at 21:45',
  hiddenFacts: 'She edited the dispatch log to reroute Theo at 21:45.'
}

const jonas: CharacterSheet = {
  suspectId: 'jonas',
  containerTag: 'case1-suspect-jonas',
  name: 'Jonas Marsh',
  voice: 'nervous, over-explains',
  motive: 'hiding that he was at the docks to meet Theo for money',
  hiddenFacts: 'He was at the docks at 22:00, not home.'
}

function echoResponder() {
  return (params: { userMessage: string }) => `RESPONSE_USING: ${params.userMessage}`
}

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
