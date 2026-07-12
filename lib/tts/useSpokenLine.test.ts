// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useSpokenLine } from './useSpokenLine.js'

interface FakeAudio {
  play: ReturnType<typeof vi.fn>
  src: string
  onended: (() => void) | null
  onerror: (() => void) | null
}

function makeAudio(): FakeAudio {
  return { play: vi.fn().mockResolvedValue(undefined), src: '', onended: null, onerror: null }
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('useSpokenLine', () => {
  it('plays the wav and transitions isSpeaking true -> false on a 200 response', async () => {
    const audio = makeAudio()
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      blob: async () => new Blob(['wav-bytes'], { type: 'audio/wav' })
    })
    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() =>
      useSpokenLine(() => audio as unknown as HTMLAudioElement)
    )

    await act(async () => {
      await result.current.speak('I was at the desk.', { suspectId: 'mara' })
    })

    expect(audio.play).toHaveBeenCalledTimes(1)
    expect(result.current.isSpeaking).toBe(true)
    expect(result.current.ttsAvailable).toBe(true)

    // The clip finishing flips the indicator back off.
    act(() => {
      audio.onended?.()
    })
    await waitFor(() => expect(result.current.isSpeaking).toBe(false))
  })

  it('resolves without playing and flags ttsAvailable=false on a 503', async () => {
    const audio = makeAudio()
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({ error: 'Local TTS unavailable', ttsUnavailable: true })
    })
    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() =>
      useSpokenLine(() => audio as unknown as HTMLAudioElement)
    )

    await act(async () => {
      await expect(result.current.speak('anything', { suspectId: 'mara' })).resolves.toBeUndefined()
    })

    expect(audio.play).not.toHaveBeenCalled()
    expect(result.current.isSpeaking).toBe(false)
    await waitFor(() => expect(result.current.ttsAvailable).toBe(false))
  })

  it('carries text, suspectId and voice in the request body', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      blob: async () => new Blob([], { type: 'audio/wav' })
    })
    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() =>
      useSpokenLine(() => makeAudio() as unknown as HTMLAudioElement)
    )

    await act(async () => {
      await result.current.speak('the line', { suspectId: 'mara', voice: 'af_bella' })
    })

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/tts',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ text: 'the line', suspectId: 'mara', voice: 'af_bella' })
      })
    )
  })

  it('stays silent and marks tts unavailable when the request itself throws', async () => {
    const audio = makeAudio()
    const fetchMock = vi.fn().mockRejectedValue(new Error('network down'))
    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() =>
      useSpokenLine(() => audio as unknown as HTMLAudioElement)
    )

    await act(async () => {
      await expect(result.current.speak('hi', { suspectId: 'mara' })).resolves.toBeUndefined()
    })

    expect(audio.play).not.toHaveBeenCalled()
    await waitFor(() => expect(result.current.ttsAvailable).toBe(false))
  })
})
