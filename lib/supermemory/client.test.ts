import { describe, expect, it, vi } from 'vitest'
import { HttpSupermemoryClient } from './client.js'

function fakeFetch(responseBody: unknown, ok = true, status = 200) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    json: async () => responseBody,
    text: async () => JSON.stringify(responseBody)
  }) as unknown as typeof fetch
}

describe('HttpSupermemoryClient', () => {
  it('writes a memory via POST /v3/documents', async () => {
    const fetchImpl = fakeFetch({ id: 'mem_1', status: 'queued' })
    const client = new HttpSupermemoryClient({
      baseUrl: 'http://localhost:6767',
      apiKey: 'test-key',
      fetchImpl
    })

    const result = await client.writeMemory({
      content: 'Saw Ivo near the docks at 22:00',
      containerTag: 'suspect-mara',
      metadata: { source: 'ground-truth' }
    })

    expect(result).toEqual({ id: 'mem_1', status: 'queued' })
    expect(fetchImpl).toHaveBeenCalledWith(
      'http://localhost:6767/v3/documents',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-key',
          'Content-Type': 'application/json'
        })
      })
    )

    const call = (fetchImpl as ReturnType<typeof vi.fn>).mock.calls[0]
    const init = call[1] as { body: string }
    expect(JSON.parse(init.body)).toEqual({
      content: 'Saw Ivo near the docks at 22:00',
      containerTag: 'suspect-mara',
      metadata: { source: 'ground-truth' }
    })
  })

  it('searches via POST /v4/search', async () => {
    const fetchImpl = fakeFetch({
      results: [{ id: 'mem_1', content: 'Saw Ivo near the docks at 22:00' }]
    })
    const client = new HttpSupermemoryClient({
      baseUrl: 'http://localhost:6767',
      apiKey: 'test-key',
      fetchImpl
    })

    const result = await client.search({
      q: 'Where was Ivo at 22:00?',
      containerTag: 'suspect-mara',
      searchMode: 'hybrid'
    })

    expect(result.results).toHaveLength(1)
    expect(result.results[0].content).toBe('Saw Ivo near the docks at 22:00')
    expect(fetchImpl).toHaveBeenCalledWith(
      'http://localhost:6767/v4/search',
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('fetches a profile via POST /v4/profile', async () => {
    const fetchImpl = fakeFetch({ profile: { trust: 'low' } })
    const client = new HttpSupermemoryClient({
      baseUrl: 'http://localhost:6767',
      apiKey: 'test-key',
      fetchImpl
    })

    const result = await client.getProfile({ containerTag: 'suspect-mara' })

    expect(result.profile).toEqual({ trust: 'low' })
  })

  it('throws when the response is not ok', async () => {
    const fetchImpl = fakeFetch({ error: 'bad request' }, false, 400)
    const client = new HttpSupermemoryClient({
      baseUrl: 'http://localhost:6767',
      apiKey: 'test-key',
      fetchImpl
    })

    await expect(
      client.search({ q: 'x', containerTag: 'suspect-mara' })
    ).rejects.toThrow('Supermemory request to /v4/search failed: 400')
  })
})
