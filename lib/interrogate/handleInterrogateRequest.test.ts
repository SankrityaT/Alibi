import { describe, expect, it } from 'vitest'
import { FakeSupermemoryClient } from '../supermemory/fakeClient.js'
import { FakeAnthropicClient } from '../anthropic/fakeClient.js'
import { seedGroundTruth } from '../suspect/memory.js'
import { handleInterrogateRequest } from './handleInterrogateRequest.js'
import type { CharacterSheet } from '../suspect/respond.js'

const mara: CharacterSheet = {
  suspectId: 'mara',
  containerTag: 'suspect-mara',
  name: 'Mara Okafor',
  voice: 'clipped, professional, deflects with procedure',
  motive: 'covering up the reroute she made at 21:45',
  hiddenFacts: 'She edited the dispatch log to reroute Theo at 21:45.'
}

function echoResponder() {
  return (params: { userMessage: string }) => `RESPONSE_USING: ${params.userMessage}`
}

describe('handleInterrogateRequest', () => {
  it('returns a grounded answer for a known suspect', async () => {
    const supermemory = new FakeSupermemoryClient()
    const anthropic = new FakeAnthropicClient(echoResponder())
    await seedGroundTruth(mara.containerTag, ['Rerouted Theo at 21:45.'], supermemory)

    const result = await handleInterrogateRequest(
      { suspectId: 'mara', question: "Did you change Theo's route?" },
      { supermemory, anthropic, suspects: { mara } }
    )

    expect(result.status).toBe(200)
    expect(result.body.answer).toContain('Rerouted')
    expect(result.body.query).toBe("Did you change Theo's route?")
    expect(Array.isArray(result.body.retrievedMemories)).toBe(true)
  })

  it('returns 404 for an unknown suspect', async () => {
    const supermemory = new FakeSupermemoryClient()
    const anthropic = new FakeAnthropicClient(echoResponder())

    const result = await handleInterrogateRequest(
      { suspectId: 'nobody', question: 'Where were you?' },
      { supermemory, anthropic, suspects: { mara } }
    )

    expect(result.status).toBe(404)
    expect(result.body.error).toBe('Unknown suspect: nobody')
  })

  it('returns 400 when the question is missing', async () => {
    const supermemory = new FakeSupermemoryClient()
    const anthropic = new FakeAnthropicClient(echoResponder())

    const result = await handleInterrogateRequest(
      { suspectId: 'mara' },
      { supermemory, anthropic, suspects: { mara } }
    )

    expect(result.status).toBe(400)
    expect(result.body.error).toBe('Missing or invalid "question"')
  })
})
