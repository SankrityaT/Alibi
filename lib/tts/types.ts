export interface SynthesizeParams {
  text: string
  voice: string
}

export interface SynthesizeResult {
  audio: ArrayBuffer
  contentType: string
}

export interface TtsClient {
  synthesize(params: SynthesizeParams): Promise<SynthesizeResult>
}

/**
 * Thrown whenever local speech synthesis cannot be produced — the Kokoro
 * server is down, unreachable, or returned a non-2xx response. Callers catch
 * this and degrade gracefully (503 JSON, no audio) so the text transcript
 * keeps working with no voice output. See app/api/tts/route.ts.
 */
export class TtsUnavailableError extends Error {
  constructor(message = 'Local TTS (Kokoro) is unavailable') {
    super(message)
    this.name = 'TtsUnavailableError'
  }
}
