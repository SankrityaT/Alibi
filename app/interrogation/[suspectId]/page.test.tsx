// app/interrogation/[suspectId]/page.test.tsx
// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import InterrogationPage from './page.js'

function stubFetchOnce(responseBody: unknown, ok = true, status = 200) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    json: async () => responseBody
  })
}

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
        body: JSON.stringify({ suspectId: 'mara', question: "Did you change Theo's route?" })
      })
    )
    expect(screen.getByTestId('memory-trace-panel').textContent).toContain(
      'Rerouted Theo at 21:45.'
    )
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
})
