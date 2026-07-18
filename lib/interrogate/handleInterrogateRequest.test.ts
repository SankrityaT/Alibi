import { describe, expect, it } from 'vitest'
import { FakeSupermemoryClient } from '../supermemory/fakeClient.js'
import { FakeAnthropicClient } from '../anthropic/fakeClient.js'
import { seedGroundTruth } from '../suspect/memory.js'
import { handleInterrogateRequest } from './handleInterrogateRequest.js'
import type { CharacterSheet } from '../suspect/respond.js'
import { getActiveRegistry } from '../case/store.js'
import { fallbackCase } from '../../content/cases/fallbackCase.js'

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

// The interrogate route sources its suspect registry from getActiveRegistry()
// (the active-case store). Before any game is started that derives from the
// fallback case, so a fallback suspect id resolves and an unknown id 404s.
describe('handleInterrogateRequest with getActiveRegistry() (live registry)', () => {
  it('resolves 200 for a suspect present in the active registry', async () => {
    const supermemory = new FakeSupermemoryClient()
    const anthropic = new FakeAnthropicClient(echoResponder())
    const suspects = getActiveRegistry()
    const seededId = fallbackCase.suspects[0].suspectId

    const result = await handleInterrogateRequest(
      { suspectId: seededId, question: 'Where were you that night?' },
      { supermemory, anthropic, suspects }
    )

    expect(result.status).toBe(200)
  })

  it('returns 404 for a suspect id not in the active registry', async () => {
    const supermemory = new FakeSupermemoryClient()
    const anthropic = new FakeAnthropicClient(echoResponder())
    const suspects = getActiveRegistry()

    const result = await handleInterrogateRequest(
      { suspectId: 'does-not-exist', question: 'Where were you?' },
      { supermemory, anthropic, suspects }
    )

    expect(result.status).toBe(404)
  })
})
