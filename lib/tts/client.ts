import type { SynthesizeParams, SynthesizeResult, TtsClient } from './types.js'
import { TtsUnavailableError } from './types.js'

export interface KokoroTtsClientConfig {
  baseUrl: string
  fetchImpl?: typeof fetch
}

/**
 * HTTP client for a locally running Kokoro TTS server. Kokoro exposes an
 * OpenAI-compatible speech endpoint, so we POST { model, input, voice,
 * response_format } to `${baseUrl}/v1/audio/speech` and read back wav bytes.
 *
 * Local run recipe (kept out of tests — mock the server there):
 *   pip install kokoro-fastapi   # or use the ghcr Kokoro-FastAPI image
 *   docker run -p 8880:8880 ghcr.io/remsky/kokoro-fastapi-cpu:latest
 * Then set KOKORO_BASE_URL=http://localhost:8880 in .env. If nothing is
 * listening the route degrades to a 503 and the transcript still works.
 */
export class KokoroTtsClient implements TtsClient {
  private baseUrl: string
  private fetchImpl: typeof fetch

  constructor(config: KokoroTtsClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '')
    this.fetchImpl = config.fetchImpl ?? fetch
  }

  async synthesize(params: SynthesizeParams): Promise<SynthesizeResult> {
    let response: Response
    try {
      response = await this.fetchImpl(`${this.baseUrl}/v1/audio/speech`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'kokoro',
          input: params.text,
          voice: params.voice,
          response_format: 'wav'
        })
      })
    } catch (error) {
      throw new TtsUnavailableError(
        `Kokoro request failed: ${error instanceof Error ? error.message : String(error)}`
      )
    }

    if (!response.ok) {
      throw new TtsUnavailableError(`Kokoro returned ${response.status}`)
    }

    const audio = await response.arrayBuffer()
    const contentType = response.headers?.get('content-type') ?? 'audio/wav'

    return { audio, contentType }
  }
}
