// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useMicTranscription } from './useMicTranscription.js'

/**
 * Minimal stand-in for the browser MediaRecorder. Injected via the hook's
 * recorderFactory so these tests never touch real microphone hardware. Calling
 * stop() synchronously emits one data chunk then fires onstop, mirroring the
 * real event order the hook relies on.
 */
class FakeMediaRecorder {
  ondataavailable: ((event: { data: Blob }) => void) | null = null
  onstop: (() => void) | null = null
  state: 'inactive' | 'recording' = 'inactive'
  start(): void {
    this.state = 'recording'
  }
  stop(): void {
    this.state = 'inactive'
    this.ondataavailable?.({ data: new Blob(['audio-bytes'], { type: 'audio/webm' }) })
    this.onstop?.()
  }
}

function stubGetUserMedia(impl?: () => Promise<MediaStream>): void {
  const getUserMedia =
    impl ?? vi.fn().mockResolvedValue({ getTracks: () => [{ stop: vi.fn() }] } as unknown as MediaStream)
  vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } })
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('useMicTranscription', () => {
  it('start() opens the mic and sets isRecording true', async () => {
    stubGetUserMedia()
    const recorder = new FakeMediaRecorder()
    const { result } = renderHook(() =>
      useMicTranscription(() => recorder as unknown as MediaRecorder)
    )

    await act(async () => {
      await result.current.start()
    })

    expect(result.current.isRecording).toBe(true)
    expect(recorder.state).toBe('recording')
  })

  it('stop() posts the recorded audio and returns the transcript on a 200', async () => {
    stubGetUserMedia()
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ text: 'transcribed text' })
    })
    vi.stubGlobal('fetch', fetchMock)

    const recorder = new FakeMediaRecorder()
    const { result } = renderHook(() =>
      useMicTranscription(() => recorder as unknown as MediaRecorder)
    )

    await act(async () => {
      await result.current.start()
    })

    let transcript: string | null = null
    await act(async () => {
      transcript = await result.current.stop()
    })

    expect(transcript).toBe('transcribed text')
    expect(result.current.isRecording).toBe(false)
    expect(result.current.sttAvailable).toBe(true)

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/stt')
    expect(init.method).toBe('POST')
    expect(init.body).toBeInstanceOf(Blob)
  })

  it('stop() returns null and flags sttAvailable=false on a 503', async () => {
    stubGetUserMedia()
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({ error: 'Local STT unavailable', sttUnavailable: true })
    })
    vi.stubGlobal('fetch', fetchMock)

    const recorder = new FakeMediaRecorder()
    const { result } = renderHook(() =>
      useMicTranscription(() => recorder as unknown as MediaRecorder)
    )

    await act(async () => {
      await result.current.start()
    })

    let transcript: string | null = 'unset'
    await act(async () => {
      transcript = await result.current.stop()
    })

    expect(transcript).toBeNull()
    expect(result.current.isRecording).toBe(false)
    await waitFor(() => expect(result.current.sttAvailable).toBe(false))
  })

  it('resolves gracefully (null, no throw) when getUserMedia is rejected', async () => {
    stubGetUserMedia(() => Promise.reject(new Error('permission denied')))
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const recorder = new FakeMediaRecorder()
    const { result } = renderHook(() =>
      useMicTranscription(() => recorder as unknown as MediaRecorder)
    )

    await act(async () => {
      await expect(result.current.start()).resolves.toBeUndefined()
    })
    expect(result.current.isRecording).toBe(false)

    let transcript: string | null = 'unset'
    await act(async () => {
      transcript = await result.current.stop()
    })

    expect(transcript).toBeNull()
    // Never recorded, so we never post audio to the STT route.
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
