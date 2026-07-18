import type { SynthesizeParams, SynthesizeResult, TtsClient } from './types.js'
import { TtsUnavailableError } from './types.js'

/**
 * A TtsClient that never produces audio: synthesize always throws
 * TtsUnavailableError. Use it when no Kokoro server is configured so the
 * request handler degrades to its 503/no-audio path and the text transcript
 * keeps working without any voice output.
 */
export class NullTtsClient implements TtsClient {
  async synthesize(_params: SynthesizeParams): Promise<SynthesizeResult> {
    throw new TtsUnavailableError('Local TTS is disabled (NullTtsClient)')
  }
}
