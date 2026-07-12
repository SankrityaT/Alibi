// app/notebook/page.test.tsx
// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import NotebookPage from './page.js'

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

describe('NotebookPage', () => {
  it('submits a question and renders the synthesized answer with each citation source', async () => {
    const fetchMock = stubFetchOnce({
      query: 'Who was near Room 3?',
      answer: 'Both Mara and the CCTV pull place activity near Room 3 [1][2].',
      citations: [
        {
          id: 'mem_1',
          content: 'CCTV shows no one entered Room 3 after 22:00.',
          source: 'Detective notebook (cctv)',
          containerTag: 'detective-case'
        },
        {
          id: 'mem_2',
          content: 'I rerouted Theo at 21:45.',
          source: 'Suspect: Mara',
          containerTag: 'suspect-mara'
        }
      ]
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<NotebookPage />)

    fireEvent.change(screen.getByLabelText(/Ask the case notebook/i), {
      target: { value: 'Who was near Room 3?' }
    })
    fireEvent.submit(screen.getByLabelText(/Ask the case notebook/i).closest('form') as HTMLFormElement)

    await waitFor(() => {
      expect(screen.getByTestId('notebook-answer').textContent).toContain(
        'Both Mara and the CCTV pull place activity near Room 3'
      )
    })

    const citations = screen.getByTestId('notebook-citations')
    expect(citations.textContent).toContain('Detective notebook (cctv)')
    expect(citations.textContent).toContain('Suspect: Mara')
    expect(citations.textContent).toContain('CCTV shows no one entered Room 3 after 22:00.')

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/notebook',
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('shows an error message when the request fails', async () => {
    const fetchMock = stubFetchOnce({ error: 'Missing or invalid "query"' }, false, 400)
    vi.stubGlobal('fetch', fetchMock)

    render(<NotebookPage />)

    fireEvent.change(screen.getByLabelText(/Ask the case notebook/i), {
      target: { value: 'x' }
    })
    fireEvent.submit(screen.getByLabelText(/Ask the case notebook/i).closest('form') as HTMLFormElement)

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toBe('Missing or invalid "query"')
    })
  })

  it('reports a network failure gracefully', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('network error'))
    vi.stubGlobal('fetch', fetchMock)

    render(<NotebookPage />)

    fireEvent.change(screen.getByLabelText(/Ask the case notebook/i), {
      target: { value: 'anything?' }
    })
    fireEvent.submit(screen.getByLabelText(/Ask the case notebook/i).closest('form') as HTMLFormElement)

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toBe('Could not reach the server. Is it running?')
    })
  })
})
