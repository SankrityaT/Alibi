import { describe, expect, it } from 'vitest'
import { KOKORO_VOICES, voiceForSuspect } from './voices.js'

describe('voiceForSuspect', () => {
  it('is deterministic for the same suspect id', () => {
    expect(voiceForSuspect('mara')).toBe(voiceForSuspect('mara'))
    expect(voiceForSuspect('theo')).toBe(voiceForSuspect('theo'))
  })

  it('yields distinct voices across a set of 5 differing ids', () => {
    const ids = ['mara', 'theo', 'ivo', 'sana', 'lena']
    const voices = new Set(ids.map((id) => voiceForSuspect(id)))
    expect(voices.size).toBe(ids.length)
  })

  it('always returns a member of KOKORO_VOICES', () => {
    for (const id of ['mara', 'theo', 'ivo', 'sana', 'lena', 'anyone', 'x']) {
      expect(KOKORO_VOICES).toContain(voiceForSuspect(id))
    }
  })
})
