/**
 * Kokoro's built-in English voice ids. Each suspect is assigned one
 * deterministically so a given character always speaks in the same voice
 * across turns, without any per-suspect configuration.
 */
export const KOKORO_VOICES: readonly string[] = [
  'af_bella',
  'af_sarah',
  'af_nicole',
  'af_sky',
  'am_adam',
  'am_michael',
  'am_fenrir',
  'am_liam',
  'bf_emma',
  'bf_isabella',
  'bm_george',
  'bm_lewis'
]

/**
 * Stable FNV-1a hash of the suspect id, mapped into KOKORO_VOICES. Deterministic
 * for a given id (same voice every turn) and spreads distinct ids across the
 * voice pool so different suspects tend to get different voices.
 */
export function voiceForSuspect(suspectId: string): string {
  let hash = 0x811c9dc5
  for (let i = 0; i < suspectId.length; i++) {
    hash ^= suspectId.charCodeAt(i)
    // FNV prime multiply, kept in 32-bit unsigned range.
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  const index = hash % KOKORO_VOICES.length
  return KOKORO_VOICES[index]
}
