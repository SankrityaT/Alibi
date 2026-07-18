import type { TranscribeParams, TranscribeResult, SttClient } from './types.js'
import { SttUnavailableError } from './types.js'

/**
 * An SttClient that never transcribes: transcribe always throws
 * SttUnavailableError. Use it when no whisper.cpp server is configured so the
 * request handler degrades to its 503 path and the player simply falls back to
 * typing their question with no voice input.
 */
export class NullSttClient implements SttClient {
  async transcribe(_params: TranscribeParams): Promise<TranscribeResult> {
    throw new SttUnavailableError('Local STT is disabled (NullSttClient)')
  }
}
