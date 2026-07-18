import { describe, expect, it } from 'vitest'
import { handleSttRequest } from './handleSttRequest.js'
import type { TranscribeParams, TranscribeResult, SttClient } from './types.js'
import { SttUnavailableError } from './types.js'

class FakeSttClient implements SttClient {
  public lastParams?: TranscribeParams
  constructor(private readonly text: string) {}
  async transcribe(params: TranscribeParams): Promise<TranscribeResult> {
    this.lastParams = params
    return { text: this.text }
  }
}

class ThrowingSttClient implements SttClient {
  async transcribe(): Promise<TranscribeResult> {
    throw new SttUnavailableError('server down')
  }
}

describe('handleSttRequest', () => {
  it('returns 200 with the transcript for valid audio', async () => {
    const stt = new FakeSttClient('where were you at nine')
    const audio = new Uint8Array([1, 2, 3, 4]).buffer

    const result = await handleSttRequest(audio, 'audio/wav', { stt })

    expect(result.status).toBe(200)
    expect(result.body.text).toBe('where were you at nine')
    expect(stt.lastParams?.contentType).toBe('audio/wav')
  })

  it('returns 400 for an empty audio buffer', async () => {
    const stt = new FakeSttClient('unused')

    const result = await handleSttRequest(new ArrayBuffer(0), 'audio/wav', { stt })

    expect(result.status).toBe(400)
  })

  it('returns 503 with sttUnavailable when the client throws SttUnavailableError', async () => {
    const audio = new Uint8Array([1, 2, 3]).buffer

    const result = await handleSttRequest(audio, 'audio/wav', { stt: new ThrowingSttClient() })

    expect(result.status).toBe(503)
    expect(result.body.sttUnavailable).toBe(true)
  })
})
