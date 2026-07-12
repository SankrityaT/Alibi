'use client'

import { useCallback, useRef, useState } from 'react'

export interface UseMicResult {
  /** True while the microphone is recording (drives the push-to-talk button). */
  isRecording: boolean
  /**
   * False once the /api/stt route returned 503 / was unreachable, or the mic
   * could not be opened. The UI hides/disables the mic button so the player
   * simply falls back to typing their question.
   */
  sttAvailable: boolean
  /** Open the mic and begin recording. Never throws: a denied/absent mic just
   *  leaves isRecording false. */
  start: () => Promise<void>
  /**
   * Stop recording, POST the captured audio Blob to /api/stt and resolve the
   * transcript. Resolves null (never throws) on a 503, any error, or when no
   * audio was recorded, flipping sttAvailable=false for the unavailable cases.
   */
  stop: () => Promise<string | null>
}

/** Default factory used in the real app; tests inject a fake recorder instead. */
const defaultRecorderFactory = (stream: MediaStream): MediaRecorder => new MediaRecorder(stream)

/**
 * Client hook giving the interrogation input a push-to-talk mic. `start()`
 * opens the microphone via getUserMedia and records with a MediaRecorder;
 * `stop()` assembles the recorded chunks into a Blob, POSTs it to /api/stt and
 * returns the transcript string.
 *
 * The whole feature degrades gracefully so typing is always the fallback:
 * a denied mic, an unreachable route, a 503 (whisper.cpp not running) or a
 * malformed response all resolve to null rather than throwing, and the
 * service-unavailable cases set `sttAvailable` to false so the button hides.
 *
 * `recorderFactory` is injectable so unit tests can supply a fake MediaRecorder
 * without touching real audio hardware.
 */
export function useMicTranscription(
  recorderFactory: (stream: MediaStream) => MediaRecorder = defaultRecorderFactory
): UseMicResult {
  const [isRecording, setIsRecording] = useState(false)
  const [sttAvailable, setSttAvailable] = useState(true)

  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const start = useCallback(async (): Promise<void> => {
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      // Mic denied / unavailable — stay silent; the player keeps typing.
      setSttAvailable(false)
      return
    }

    streamRef.current = stream
    chunksRef.current = []

    let recorder: MediaRecorder
    try {
      recorder = recorderFactory(stream)
    } catch {
      stopStream(stream)
      setSttAvailable(false)
      return
    }

    recorder.ondataavailable = (event: BlobEvent) => {
      if (event.data && event.data.size > 0) {
        chunksRef.current.push(event.data)
      }
    }
    recorderRef.current = recorder
    recorder.start()
    setIsRecording(true)
  }, [recorderFactory])

  const stop = useCallback(async (): Promise<string | null> => {
    const recorder = recorderRef.current
    recorderRef.current = null
    setIsRecording(false)

    if (!recorder) {
      // Never started recording (e.g. mic was denied) — nothing to transcribe.
      stopStream(streamRef.current)
      streamRef.current = null
      return null
    }

    // Wait for the recorder to flush its final chunk and fire onstop, then
    // assemble the captured bytes into one Blob.
    const blob = await new Promise<Blob>((resolve) => {
      recorder.onstop = () => {
        const type = chunksRef.current[0]?.type || 'audio/webm'
        resolve(new Blob(chunksRef.current, { type }))
      }
      recorder.stop()
    })

    stopStream(streamRef.current)
    streamRef.current = null

    if (blob.size === 0) {
      return null
    }

    let response: Response
    try {
      response = await fetch('/api/stt', {
        method: 'POST',
        headers: { 'Content-Type': blob.type },
        body: blob
      })
    } catch {
      // Route unreachable — treat STT as unavailable, fall back to typing.
      setSttAvailable(false)
      return null
    }

    // 503 is the route's graceful "whisper.cpp not running" signal.
    if (response.status === 503) {
      setSttAvailable(false)
      return null
    }

    if (!response.ok) {
      // Some other error (e.g. empty body) — no transcript, but keep STT
      // available so the player can retry.
      return null
    }

    setSttAvailable(true)

    let body: unknown
    try {
      body = await response.json()
    } catch {
      return null
    }

    const text =
      typeof body === 'object' && body !== null && typeof (body as Record<string, unknown>).text === 'string'
        ? ((body as Record<string, unknown>).text as string)
        : null

    return text
  }, [])

  return { isRecording, sttAvailable, start, stop }
}

/** Best-effort stop of every track so the mic indicator turns off. */
function stopStream(stream: MediaStream | null): void {
  if (!stream || typeof stream.getTracks !== 'function') {
    return
  }
  for (const track of stream.getTracks()) {
    try {
      track.stop()
    } catch {
      // ignore — best-effort cleanup
    }
  }
}
