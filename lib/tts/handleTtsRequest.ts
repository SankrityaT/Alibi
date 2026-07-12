import type { TtsClient } from './types.js'
import { TtsUnavailableError } from './types.js'
import { voiceForSuspect } from './voices.js'
import { getActiveCase } from '../case/store.js'

// Prefer the voice deliberately cast for this suspect in the active case
// (suspect.ttsVoice), so each character keeps a consistent, authored voice.
// Falls back to the deterministic hash when there's no active case or the
// suspect carries no authored voice — matching the pre-case behaviour.
function voiceForActiveSuspect(suspectId: string): string {
  const suspect = getActiveCase()?.suspects.find((s) => s.suspectId === suspectId)
  if (suspect?.ttsVoice && suspect.ttsVoice.length > 0) {
    return suspect.ttsVoice
  }
  return voiceForSuspect(suspectId)
}

export interface TtsRequestDeps {
  tts: TtsClient
}

export interface TtsRequestResult {
  status: number
  contentType?: string
  audio?: ArrayBuffer
  body?: Record<string, unknown>
}

/**
 * Thin, testable core of the /api/tts route. Validates that the body carries
 * non-empty text, resolves the voice (explicit `voice`, else a deterministic
 * voice for `suspectId`), and asks the injected TtsClient to synthesize. When
 * TTS is unavailable it returns a 503 (never throws) so the caller can keep the
 * transcript working with no audio.
 */
export async function handleTtsRequest(
  body: unknown,
  deps: TtsRequestDeps
): Promise<TtsRequestResult> {
  if (typeof body !== 'object' || body === null) {
    return { status: 400, body: { error: 'Missing or invalid request body' } }
  }

  const candidate = body as Record<string, unknown>
  const text = candidate.text

  if (typeof text !== 'string' || text.trim().length === 0) {
    return { status: 400, body: { error: 'Missing or invalid "text"' } }
  }

  const explicitVoice =
    typeof candidate.voice === 'string' && candidate.voice.length > 0
      ? candidate.voice
      : undefined

  let voice: string
  if (explicitVoice) {
    voice = explicitVoice
  } else if (typeof candidate.suspectId === 'string' && candidate.suspectId.length > 0) {
    voice = voiceForActiveSuspect(candidate.suspectId)
  } else {
    return { status: 400, body: { error: 'Missing "voice" or "suspectId"' } }
  }

  try {
    const result = await deps.tts.synthesize({ text, voice })
    return {
      status: 200,
      contentType: result.contentType,
      audio: result.audio
    }
  } catch (error) {
    if (error instanceof TtsUnavailableError) {
      return {
        status: 503,
        body: { error: error.message, ttsUnavailable: true }
      }
    }
    throw error
  }
}
