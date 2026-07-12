import type { SynthesizeParams, SynthesizeResult, TtsClient } from './types.js'
import { TtsUnavailableError } from './types.js'

// OpenAI's speech endpoint is the same shape Kokoro emulates. Using it gives the
// suspects genuinely good voices with no local model to run — reusing the key
// already configured for memory extraction.
const OPENAI_VOICES = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'] as const

// Map the authored Kokoro-style voice ids (af_*/am_*) onto OpenAI voices so each
// suspect keeps a distinct, gender-appropriate voice; unknown ids hash to one.
const VOICE_MAP: Record<string, string> = {
  af_bella: 'nova',
  af_sarah: 'shimmer',
  af_nicole: 'alloy',
  am_michael: 'onyx',
  am_adam: 'echo',
  am_eric: 'fable'
}

function hash(value: string): number {
  let h = 5381
  for (let i = 0; i < value.length; i += 1) h = ((h << 5) + h + value.charCodeAt(i)) | 0
  return Math.abs(h)
}

export function toOpenAiVoice(voice: string): string {
  if (VOICE_MAP[voice]) return VOICE_MAP[voice]
  if ((OPENAI_VOICES as readonly string[]).includes(voice)) return voice
  return OPENAI_VOICES[hash(voice) % OPENAI_VOICES.length]
}

export interface OpenAiTtsClientConfig {
  apiKey: string
  model?: string
  fetchImpl?: typeof fetch
}

export class OpenAiTtsClient implements TtsClient {
  private apiKey: string
  private model: string
  private fetchImpl: typeof fetch

  constructor(config: OpenAiTtsClientConfig) {
    this.apiKey = config.apiKey
    this.model = config.model ?? 'gpt-4o-mini-tts'
    this.fetchImpl = config.fetchImpl ?? fetch
  }

  async synthesize(params: SynthesizeParams): Promise<SynthesizeResult> {
    let response: Response
    try {
      response = await this.fetchImpl('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          input: params.text,
          voice: toOpenAiVoice(params.voice),
          response_format: 'mp3'
        })
      })
    } catch (error) {
      throw new TtsUnavailableError(
        `OpenAI TTS request failed: ${error instanceof Error ? error.message : String(error)}`
      )
    }

    if (!response.ok) {
      throw new TtsUnavailableError(`OpenAI TTS returned ${response.status}`)
    }

    const audio = await response.arrayBuffer()
    return { audio, contentType: 'audio/mpeg' }
  }
}
