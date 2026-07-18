import { describe, expect, it } from 'vitest'
import { FakeSupermemoryClient } from '../supermemory/fakeClient.js'
import { FakeAnthropicClient } from '../anthropic/fakeClient.js'
import { DETECTIVE_CONTAINER_TAG } from '../case/types.js'
import { handleNotebookRequest } from './handleNotebookRequest.js'

function deps() {
  return {
    supermemory: new FakeSupermemoryClient(),
    anthropic: new FakeAnthropicClient((params) => `Synthesis: ${params.userMessage}`)
  }
}

describe('handleNotebookRequest', () => {
  it('returns 400 for a non-object body', async () => {
    const result = await handleNotebookRequest('nope', deps())
    expect(result.status).toBe(400)
    expect(typeof result.body.error).toBe('string')
  })

  it('returns 400 when the query is empty', async () => {
    const result = await handleNotebookRequest({ query: '   ' }, deps())
    expect(result.status).toBe(400)
    expect(typeof result.body.error).toBe('string')
  })

  it('returns 400 when the query is missing', async () => {
    const result = await handleNotebookRequest({}, deps())
    expect(result.status).toBe(400)
  })

  it('returns 200 with a citations array for a valid query', async () => {
    const d = deps()
    await d.supermemory.writeMemory({
      content: 'Mara was seen near Room 3.',
      containerTag: 'suspect-mara'
    })

    const result = await handleNotebookRequest(
      { query: 'who was near Room 3?', containerTags: [DETECTIVE_CONTAINER_TAG, 'suspect-mara'] },
      d
    )

    expect(result.status).toBe(200)
    expect(result.body.query).toBe('who was near Room 3?')
    expect(typeof result.body.answer).toBe('string')
    expect(Array.isArray(result.body.citations)).toBe(true)
    expect((result.body.citations as unknown[]).length).toBeGreaterThan(0)
  })
})
