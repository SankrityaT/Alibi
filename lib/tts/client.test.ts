import { describe, expect, it, vi } from 'vitest'
import { KokoroTtsClient } from './client.js'
import { TtsUnavailableError } from './types.js'

function fakeFetch(arrayBuffer: ArrayBuffer, ok = true, status = 200) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    headers: { get: () => 'audio/wav' },
    arrayBuffer: async () => arrayBuffer,
    text: async () => ''
  }) as unknown as typeof fetch
}

describe('KokoroTtsClient', () => {
  it('resolves audio + contentType from a 200 arraybuffer response', async () => {
    const bytes = new Uint8Array([1, 2, 3, 4]).buffer
    const fetchImpl = fakeFetch(bytes)
    const client = new KokoroTtsClient({ baseUrl: 'http://localhost:8880', fetchImpl })

    const result = await client.synthesize({ text: 'Where were you?', voice: 'af_bella' })

    expect(result.audio).toBe(bytes)
    expect(result.contentType).toBe('audio/wav')
    expect(fetchImpl).toHaveBeenCalledWith(
      'http://localhost:8880/v1/audio/speech',
      expect.objectContaining({ method: 'POST' })
    )
    const init = (fetchImpl as ReturnType<typeof vi.fn>).mock.calls[0][1] as { body: string }
    expect(JSON.parse(init.body)).toMatchObject({ input: 'Where were you?', voice: 'af_bella' })
  })

  it('throws TtsUnavailableError on a non-2xx response', async () => {
    const fetchImpl = fakeFetch(new ArrayBuffer(0), false, 500)
    const client = new KokoroTtsClient({ baseUrl: 'http://localhost:8880', fetchImpl })

    await expect(client.synthesize({ text: 'hi', voice: 'af_bella' })).rejects.toBeInstanceOf(
      TtsUnavailableError
    )
  })

  it('throws TtsUnavailableError when fetch itself rejects (server down)', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error('ECONNREFUSED')) as unknown as typeof fetch
    const client = new KokoroTtsClient({ baseUrl: 'http://localhost:8880', fetchImpl })

    await expect(client.synthesize({ text: 'hi', voice: 'af_bella' })).rejects.toBeInstanceOf(
      TtsUnavailableError
    )
  })
})
