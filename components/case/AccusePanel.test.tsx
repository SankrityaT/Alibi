// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { AccusePanel } from './AccusePanel.js'

const SUSPECTS = [
  { suspectId: 'mara', name: 'Mara Okafor' },
  { suspectId: 'jonas', name: 'Jonas Marsh' },
  { suspectId: 'priya', name: 'Priya Nandakumar' }
]

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

describe('AccusePanel', () => {
  it('renders one selectable option per suspect', () => {
    render(<AccusePanel suspects={SUSPECTS} movesUsed={5} />)
    expect(screen.getAllByRole('option')).toHaveLength(SUSPECTS.length)
  })

  it('submits the accusation and shows the returned rank and explanation', async () => {
    const fetchMock = stubFetchOnce({
      rating: { correct: true, basePoints: 30, rank: 'Chief', summary: 'Case closed.' },
      culpritId: 'mara',
      plantedMemoryClaim: 'Mara was in the atrium.',
      explanation: 'The badge log places Mara in the vault corridor at 21:52.'
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<AccusePanel suspects={SUSPECTS} movesUsed={7} />)

    fireEvent.click(screen.getByRole('button', { name: /Accuse/i }))

    await waitFor(() => {
      expect(screen.getByTestId('accuse-result').textContent).toContain('Chief')
    })
    expect(screen.getByTestId('accuse-result').textContent).toContain(
      'The badge log places Mara in the vault corridor at 21:52.'
    )

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/accuse',
      expect.objectContaining({ method: 'POST' })
    )
    const sentBody = JSON.parse((fetchMock.mock.calls[0][1] as { body: string }).body)
    expect(sentBody.accusedCulpritId).toBe('mara')
    expect(sentBody.movesUsed).toBe(7)
  })

  it('surfaces an error when the accusation request fails', async () => {
    const fetchMock = stubFetchOnce({ error: 'No active case' }, false, 400)
    vi.stubGlobal('fetch', fetchMock)

    render(<AccusePanel suspects={SUSPECTS} movesUsed={1} />)

    fireEvent.click(screen.getByRole('button', { name: /Accuse/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toContain('No active case')
    })
  })
})
