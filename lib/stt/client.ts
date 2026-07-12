import type { TranscribeParams, TranscribeResult, SttClient } from './types.js'
import { SttUnavailableError } from './types.js'

export interface WhisperCppClientConfig {
  baseUrl: string
  fetchImpl?: typeof fetch
}

/**
 * HTTP client for a locally running whisper.cpp server. The whisper.cpp
 * `server` example exposes POST `${baseUrl}/inference` accepting the audio as
 * multipart/form-data under the `file` field and replies with JSON `{ text }`.
 * We forward the recorded audio bytes and read back the transcript.
 *
 * Local run recipe (kept out of tests — mock the server there):
 *   # build whisper.cpp and grab a model, then start its bundled HTTP server:
 *   git clone https://github.com/ggerganov/whisper.cpp && cd whisper.cpp
 *   make -j && ./models/download-ggml-model.sh base.en
 *   ./build/bin/whisper-server -m models/ggml-base.en.bin --port 8081
 * Then set WHISPER_BASE_URL=http://localhost:8081 in .env. If nothing is
 * listening the /api/stt route degrades to a 503 and the player falls back to
 * typing their question.
 */
export class WhisperCppClient implements SttClient {
  private baseUrl: string
  private fetchImpl: typeof fetch

  constructor(config: WhisperCppClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '')
    this.fetchImpl = config.fetchImpl ?? fetch
  }

  async transcribe(params: TranscribeParams): Promise<TranscribeResult> {
    const form = new FormData()
    const blob = new Blob([params.audio], { type: params.contentType })
    form.append('file', blob, 'audio')
    form.append('response_format', 'json')

    let response: Response
    try {
      response = await this.fetchImpl(`${this.baseUrl}/inference`, {
        method: 'POST',
        body: form
      })
    } catch (error) {
      throw new SttUnavailableError(
        `whisper.cpp request failed: ${error instanceof Error ? error.message : String(error)}`
      )
    }

    if (!response.ok) {
      throw new SttUnavailableError(`whisper.cpp returned ${response.status}`)
    }

    let payload: unknown
    try {
      payload = await response.json()
    } catch (error) {
      throw new SttUnavailableError(
        `whisper.cpp returned an unparsable response: ${
          error instanceof Error ? error.message : String(error)
        }`
      )
    }

    const text =
      typeof payload === 'object' && payload !== null && typeof (payload as Record<string, unknown>).text === 'string'
        ? ((payload as Record<string, unknown>).text as string)
        : ''

    return { text: text.trim() }
  }
}
