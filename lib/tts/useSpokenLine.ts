'use client'

import { useCallback, useState } from 'react'

export interface UseSpokenLineResult {
  /**
   * Fetch and play the spoken form of `text` in the suspect's voice. Never
   * throws: on a 503 (no Kokoro server) it silently no-ops and flips
   * `ttsAvailable` to false so the transcript keeps reading with no audio.
   */
  speak: (text: string, opts: { suspectId?: string; voice?: string }) => Promise<void>
  /** True while an audio clip is playing (drives the speaking indicator). */
  isSpeaking: boolean
  /** False once a request came back 503 / unreachable — the voice is muted. */
  ttsAvailable: boolean
}

/** Default factory used in the real app; tests inject a stub instead. */
const defaultAudioFactory = (): HTMLAudioElement => new Audio()

/**
 * Client hook that speaks a suspect's line via the local Kokoro TTS server.
 *
 * It POSTs { text, suspectId, voice } to /api/tts. On a 200 wav response it
 * plays the bytes through an <audio> element (toggling `isSpeaking`); on a 503
 * (Kokoro not running) it resolves without throwing and sets `ttsAvailable`
 * to false so the UI can show a muted indicator while the text transcript
 * still works. `audioFactory` is injectable so unit tests can supply a stub
 * without touching real browser audio.
 */
export function useSpokenLine(
  audioFactory: () => HTMLAudioElement = defaultAudioFactory
): UseSpokenLineResult {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [ttsAvailable, setTtsAvailable] = useState(true)

  const speak = useCallback(
    async (text: string, opts: { suspectId?: string; voice?: string }): Promise<void> => {
      if (typeof text !== 'string' || text.trim().length === 0) {
        return
      }

      let response: Response
      try {
        response = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, suspectId: opts.suspectId, voice: opts.voice })
        })
      } catch {
        // Network / route unreachable — treat as unavailable, stay silent.
        setTtsAvailable(false)
        return
      }

      // 503 is the graceful "no Kokoro" signal from the route.
      if (response.status === 503) {
        setTtsAvailable(false)
        return
      }

      if (!response.ok) {
        // Some other error (e.g. a bad request) — no audio, but don't
        // permanently mark TTS unavailable; the transcript still reads.
        return
      }

      setTtsAvailable(true)

      let blob: Blob | null = null
      try {
        blob = await response.blob()
      } catch {
        blob = null
      }

      const audio = audioFactory()
      let objectUrl: string | undefined
      if (blob) {
        try {
          objectUrl = URL.createObjectURL(blob)
        } catch {
          objectUrl = undefined
        }
        if (objectUrl) {
          audio.src = objectUrl
        }
      }

      const stop = (): void => {
        setIsSpeaking(false)
        if (objectUrl) {
          try {
            URL.revokeObjectURL(objectUrl)
          } catch {
            // ignore — best-effort cleanup
          }
        }
      }
      audio.onended = stop
      audio.onerror = stop

      setIsSpeaking(true)
      try {
        await audio.play()
      } catch {
        // Autoplay blocked or playback failed — reset the indicator; the
        // transcript is unaffected.
        stop()
      }
    },
    [audioFactory]
  )

  return { speak, isSpeaking, ttsAvailable }
}
