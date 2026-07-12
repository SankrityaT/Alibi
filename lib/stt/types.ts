export interface TranscribeParams {
  audio: ArrayBuffer
  contentType: string
}

export interface TranscribeResult {
  text: string
}

export interface SttClient {
  transcribe(params: TranscribeParams): Promise<TranscribeResult>
}

/**
 * Thrown whenever local speech-to-text cannot be produced — the whisper.cpp
 * server is down, unreachable, or returned a non-2xx response. Callers catch
 * this and degrade gracefully (503 JSON, no transcript) so the player simply
 * falls back to typing their question. See app/api/stt/route.ts.
 */
export class SttUnavailableError extends Error {
  constructor(message = 'Local STT (whisper.cpp) is unavailable') {
    super(message)
    this.name = 'SttUnavailableError'
  }
}
