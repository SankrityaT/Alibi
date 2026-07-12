import { describe, expect, it } from 'vitest'
import { handleTtsRequest } from './handleTtsRequest.js'
import type { SynthesizeParams, SynthesizeResult, TtsClient } from './types.js'
import { TtsUnavailableError } from './types.js'
import { voiceForSuspect } from './voices.js'

class FakeTtsClient implements TtsClient {
  public lastParams?: SynthesizeParams
  constructor(private readonly audio: ArrayBuffer) {}
  async synthesize(params: SynthesizeParams): Promise<SynthesizeResult> {
    this.lastParams = params
    return { audio: this.audio, contentType: 'audio/wav' }
  }
}

class ThrowingTtsClient implements TtsClient {
  async synthesize(): Promise<SynthesizeResult> {
    throw new TtsUnavailableError('server down')
  }
}

describe('handleTtsRequest', () => {
  it('returns 400 for missing text', async () => {
    const result = await handleTtsRequest({ voice: 'af_bella' }, { tts: new FakeTtsClient(new ArrayBuffer(0)) })
    expect(result.status).toBe(400)
  })

  it('returns 400 for empty/whitespace text', async () => {
    const result = await handleTtsRequest({ text: '   ', voice: 'af_bella' }, { tts: new FakeTtsClient(new ArrayBuffer(0)) })
    expect(result.status).toBe(400)
  })

  it('returns 200 with audio + contentType for valid text', async () => {
    const bytes = new Uint8Array([9, 8, 7]).buffer
    const tts = new FakeTtsClient(bytes)
    const result = await handleTtsRequest({ text: 'I was home.', voice: 'af_bella' }, { tts })
    expect(result.status).toBe(200)
    expect(result.audio).toBe(bytes)
    expect(result.contentType).toBe('audio/wav')
  })

  it('resolves voice via voiceForSuspect for a suspectId-only body', async () => {
    const tts = new FakeTtsClient(new ArrayBuffer(0))
    const result = await handleTtsRequest({ text: 'Yes.', suspectId: 'mara' }, { tts })
    expect(result.status).toBe(200)
    expect(tts.lastParams?.voice).toBe(voiceForSuspect('mara'))
  })

  it('returns 503 with ttsUnavailable when the client throws TtsUnavailableError', async () => {
    const result = await handleTtsRequest({ text: 'hello', voice: 'af_bella' }, { tts: new ThrowingTtsClient() })
    expect(result.status).toBe(503)
    expect(result.body?.ttsUnavailable).toBe(true)
  })
})
