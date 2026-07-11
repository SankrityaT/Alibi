import { describe, expect, it } from 'vitest'
import { NullSupermemoryClient } from './nullClient.js'

describe('NullSupermemoryClient', () => {
  it('returns no memories from search even after a write', async () => {
    const client = new NullSupermemoryClient()

    await client.writeMemory({ content: 'Rerouted Theo at 21:45.', containerTag: 'suspect-mara' })
    const result = await client.search({ q: 'anything', containerTag: 'suspect-mara' })

    expect(result.results).toEqual([])
  })

  it('reports memory disabled in the profile', async () => {
    const client = new NullSupermemoryClient()

    const result = await client.getProfile({ containerTag: 'suspect-mara' })

    expect(result.profile.memoryDisabled).toBe(true)
  })
})
