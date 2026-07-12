// app/interrogation/[suspectId]/page.test.tsx
// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'

// Mock the TTS hook so the page's speak() call does not fire real /api/tts
// fetches during these interrogate-focused tests. Individual tests drive the
// spy's behaviour to simulate a working voice or a TTS failure.
const { speakMock } = vi.hoisted(() => ({ speakMock: vi.fn() }))
vi.mock('../../../lib/tts/useSpokenLine.js', () => ({
  useSpokenLine: () => ({ speak: speakMock, isSpeaking: false, ttsAvailable: true })
}))

// Mock the mic hook so the push-to-talk button drives a deterministic
// transcript without touching real MediaRecorder / getUserMedia. Tests set the
// spies' behaviour and the sttAvailable flag before rendering.
const { micState } = vi.hoisted(() => ({
  micState: {
    isRecording: false,
    sttAvailable: true,
    start: vi.fn(),
    stop: vi.fn()
  }
}))
vi.mock('../../../lib/stt/useMicTranscription.js', () => ({
  useMicTranscription: () => micState
}))

import InterrogationPage from './page.js'

function stubFetchOnce(responseBody: unknown, ok = true, status = 200) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    json: async () => responseBody
  })
}

beforeEach(() => {
  speakMock.mockReset()
  speakMock.mockResolvedValue(undefined)
  micState.isRecording = false
  micState.sttAvailable = true
  micState.start.mockReset()
  micState.stop.mockReset()
  micState.start.mockResolvedValue(undefined)
  micState.stop.mockResolvedValue(null)
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('InterrogationPage', () => {
  it('submits a question and renders the grounded answer with its memory trace', async () => {
    const fetchMock = stubFetchOnce({
      answer: 'I rerouted him. It was procedure.',
      query: "Did you change Theo's route?",
      retrievedMemories: [{ id: 'mem_1', content: 'Rerouted Theo at 21:45.' }]
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<InterrogationPage params={{ suspectId: 'mara' }} />)

    fireEvent.change(screen.getByLabelText('Ask a question'), {
      target: { value: "Did you change Theo's route?" }
    })
    fireEvent.submit(screen.getByLabelText('Ask a question').closest('form') as HTMLFormElement)

    await waitFor(() => {
      expect(screen.getByTestId('dialogue-box').getAttribute('data-full-text')).toBe(
        'I rerouted him. It was procedure.'
      )
    })

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/interrogate',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          suspectId: 'mara',
          question: "Did you change Theo's route?",
          memoryEnabled: true
        })
      })
    )
    expect(screen.getByTestId('memory-trace-panel').textContent).toContain(
      'Rerouted Theo at 21:45.'
    )
  })

  it('accumulates a persistent transcript across multiple questions', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ answer: 'I was at the desk.', query: 'q1', retrievedMemories: [] })
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ answer: 'I already told you.', query: 'q2', retrievedMemories: [] })
      })
    vi.stubGlobal('fetch', fetchMock)

    render(<InterrogationPage params={{ suspectId: 'mara' }} />)

    const input = screen.getByLabelText('Ask a question')
    fireEvent.change(input, { target: { value: 'Where were you?' } })
    fireEvent.submit(input.closest('form') as HTMLFormElement)

    await waitFor(() => {
      expect(screen.getAllByTestId('dialogue-box')).toHaveLength(1)
    })

    fireEvent.change(input, { target: { value: 'Are you sure?' } })
    fireEvent.submit(input.closest('form') as HTMLFormElement)

    await waitFor(() => {
      expect(screen.getAllByTestId('dialogue-box')).toHaveLength(2)
    })

    const transcript = screen.getByTestId('transcript')
    // Questions render as plain text; answers reveal via the typewriter
    // DialogueBox, so assert them via the reliable data-full-text attribute.
    expect(transcript.textContent).toContain('Where were you?')
    expect(transcript.textContent).toContain('Are you sure?')
    const answers = screen.getAllByTestId('dialogue-box').map((el) => el.getAttribute('data-full-text'))
    expect(answers).toEqual(['I was at the desk.', 'I already told you.'])
  })

  it('sends memoryEnabled: false after toggling memory off', async () => {
    const fetchMock = stubFetchOnce({ answer: '...', query: 'q', retrievedMemories: [] })
    vi.stubGlobal('fetch', fetchMock)

    render(<InterrogationPage params={{ suspectId: 'mara' }} />)

    fireEvent.click(screen.getByRole('button', { name: /Memory: ON/ }))

    fireEvent.change(screen.getByLabelText('Ask a question'), { target: { value: 'Hello?' } })
    fireEvent.submit(screen.getByLabelText('Ask a question').closest('form') as HTMLFormElement)

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/interrogate',
        expect.objectContaining({
          body: JSON.stringify({ suspectId: 'mara', question: 'Hello?', memoryEnabled: false })
        })
      )
    })
  })

  it('shows an error message when the request fails', async () => {
    const fetchMock = stubFetchOnce({ error: 'Unknown suspect: mara' }, false, 404)
    vi.stubGlobal('fetch', fetchMock)

    render(<InterrogationPage params={{ suspectId: 'mara' }} />)

    fireEvent.change(screen.getByLabelText('Ask a question'), {
      target: { value: 'Anything?' }
    })
    fireEvent.submit(screen.getByLabelText('Ask a question').closest('form') as HTMLFormElement)

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toBe('Unknown suspect: mara')
    })
  })

  it('shows an error message when the network request itself fails', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('network error'))
    vi.stubGlobal('fetch', fetchMock)

    render(<InterrogationPage params={{ suspectId: 'mara' }} />)

    fireEvent.change(screen.getByLabelText('Ask a question'), {
      target: { value: 'Anything?' }
    })
    fireEvent.submit(screen.getByLabelText('Ask a question').closest('form') as HTMLFormElement)

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toBe('Could not reach the server. Is it running?')
    })
  })

  it('speaks the returned answer text in the suspect voice after a turn', async () => {
    const fetchMock = stubFetchOnce({
      answer: 'I never left the platform.',
      query: 'Where were you?',
      retrievedMemories: []
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<InterrogationPage params={{ suspectId: 'mara' }} />)

    fireEvent.change(screen.getByLabelText('Ask a question'), {
      target: { value: 'Where were you?' }
    })
    fireEvent.submit(screen.getByLabelText('Ask a question').closest('form') as HTMLFormElement)

    await waitFor(() => {
      expect(speakMock).toHaveBeenCalledWith('I never left the platform.', { suspectId: 'mara' })
    })
  })

  it('populates the question input from the mic transcript when recording stops', async () => {
    // Simulate a live recording: clicking the button calls stop(), which
    // resolves the spoken transcript and fills the question field.
    micState.isRecording = true
    micState.stop.mockResolvedValue('Where were you at ten?')

    render(<InterrogationPage params={{ suspectId: 'mara' }} />)

    fireEvent.click(screen.getByTestId('mic-button'))

    await waitFor(() => {
      expect((screen.getByLabelText('Ask a question') as HTMLInputElement).value).toBe(
        'Where were you at ten?'
      )
    })
    expect(micState.stop).toHaveBeenCalledTimes(1)
  })

  it('starts recording when the mic button is clicked while idle', async () => {
    render(<InterrogationPage params={{ suspectId: 'mara' }} />)

    fireEvent.click(screen.getByTestId('mic-button'))

    await waitFor(() => {
      expect(micState.start).toHaveBeenCalledTimes(1)
    })
  })

  it('hides the mic button when STT is unavailable', () => {
    micState.sttAvailable = false

    render(<InterrogationPage params={{ suspectId: 'mara' }} />)

    expect(screen.queryByTestId('mic-button')).toBeNull()
  })

  it('surfaces a fact in the evidence log after running an investigation verb', async () => {
    const fetchMock = stubFetchOnce({
      kind: 'cctv',
      fact: 'Atrium footage never shows Mara during the theft window.',
      retrieved: []
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<InterrogationPage params={{ suspectId: 'mara' }} />)

    fireEvent.click(screen.getByRole('button', { name: /^CCTV$/i }))

    await waitFor(() => {
      expect(screen.getByTestId('evidence-log').textContent).toContain(
        'Atrium footage never shows Mara during the theft window.'
      )
    })

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/investigate',
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('still renders the transcript when TTS fails', async () => {
    // speak() rejecting must not break rendering the spoken line as text.
    speakMock.mockRejectedValue(new Error('TTS unavailable'))
    const fetchMock = stubFetchOnce({
      answer: 'The lights were off in Room 3.',
      query: 'q',
      retrievedMemories: []
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<InterrogationPage params={{ suspectId: 'mara' }} />)

    fireEvent.change(screen.getByLabelText('Ask a question'), {
      target: { value: 'Anything else?' }
    })
    fireEvent.submit(screen.getByLabelText('Ask a question').closest('form') as HTMLFormElement)

    await waitFor(() => {
      expect(screen.getByTestId('dialogue-box').getAttribute('data-full-text')).toBe(
        'The lights were off in Room 3.'
      )
    })
    expect(speakMock).toHaveBeenCalledTimes(1)
  })
})
