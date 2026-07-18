import { describe, expect, it, vi } from 'vitest'
import { WhisperCppClient } from './client.js'
import { SttUnavailableError } from './types.js'

function fakeFetch(json: unknown, ok = true, status = 200) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    json: async () => json,
    text: async () => ''
  }) as unknown as typeof fetch
}

describe('WhisperCppClient', () => {
  it('resolves the transcript text from a 200 {text} response', async () => {
    const fetchImpl = fakeFetch({ text: 'hello' })
    const client = new WhisperCppClient({ baseUrl: 'http://localhost:8081', fetchImpl })

    const result = await client.transcribe({
      audio: new Uint8Array([1, 2, 3]).buffer,
      contentType: 'audio/wav'
    })

    expect(result.text).toBe('hello')
    expect(fetchImpl).toHaveBeenCalledWith(
      'http://localhost:8081/inference',
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('trims surrounding whitespace whisper.cpp often emits', async () => {
    const fetchImpl = fakeFetch({ text: '  where were you  ' })
    const client = new WhisperCppClient({ baseUrl: 'http://localhost:8081', fetchImpl })

    const result = await client.transcribe({
      audio: new Uint8Array([1]).buffer,
      contentType: 'audio/wav'
    })

    expect(result.text).toBe('where were you')
  })

  it('throws SttUnavailableError on a non-2xx response', async () => {
    const fetchImpl = fakeFetch({}, false, 500)
    const client = new WhisperCppClient({ baseUrl: 'http://localhost:8081', fetchImpl })

    await expect(
      client.transcribe({ audio: new Uint8Array([1]).buffer, contentType: 'audio/wav' })
    ).rejects.toBeInstanceOf(SttUnavailableError)
  })

  it('throws SttUnavailableError when fetch itself rejects (server down)', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error('ECONNREFUSED')) as unknown as typeof fetch
    const client = new WhisperCppClient({ baseUrl: 'http://localhost:8081', fetchImpl })

    await expect(
      client.transcribe({ audio: new Uint8Array([1]).buffer, contentType: 'audio/wav' })
    ).rejects.toBeInstanceOf(SttUnavailableError)
  })
})
