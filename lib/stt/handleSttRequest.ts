import type { SttClient } from './types.js'
import { SttUnavailableError } from './types.js'

export interface SttRequestDeps {
  stt: SttClient
}

export interface SttRequestResult {
  status: number
  body: Record<string, unknown>
}

/**
 * Thin, testable core of the /api/stt route. Validates that the request
 * carries some recorded audio, then asks the injected SttClient to transcribe
 * it. When STT is unavailable it returns a 503 (never throws) so the caller can
 * fall back to typing the question with no voice input.
 */
export async function handleSttRequest(
  audio: ArrayBuffer,
  contentType: string,
  deps: SttRequestDeps
): Promise<SttRequestResult> {
  if (!audio || audio.byteLength === 0) {
    return { status: 400, body: { error: 'Missing or empty audio body' } }
  }

  try {
    const { text } = await deps.stt.transcribe({ audio, contentType })
    return { status: 200, body: { text } }
  } catch (error) {
    if (error instanceof SttUnavailableError) {
      return { status: 503, body: { error: error.message, sttUnavailable: true } }
    }
    throw error
  }
}
