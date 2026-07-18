// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { EvidenceActions } from './EvidenceActions.js'

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

describe('EvidenceActions', () => {
  it('renders CCTV, phone, forensics and present buttons', () => {
    render(<EvidenceActions suspectId="mara" onFact={() => {}} />)

    expect(screen.getByRole('button', { name: /CCTV/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Phone/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Forensics/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Present/i })).toBeTruthy()
  })

  it('calls onFact with the returned fact after clicking a pull verb', async () => {
    const fetchMock = stubFetchOnce({
      kind: 'cctv',
      fact: 'Atrium footage never shows Mara during the theft window.',
      retrieved: []
    })
    vi.stubGlobal('fetch', fetchMock)
    const onFact = vi.fn()

    render(<EvidenceActions suspectId="mara" onFact={onFact} />)

    fireEvent.change(screen.getByLabelText(/Detail/i), {
      target: { value: 'Where was Mara?' }
    })
    fireEvent.click(screen.getByRole('button', { name: /CCTV/i }))

    await waitFor(() => {
      expect(onFact).toHaveBeenCalledWith('Atrium footage never shows Mara during the theft window.')
    })

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/investigate',
      expect.objectContaining({ method: 'POST' })
    )
    const sentBody = JSON.parse((fetchMock.mock.calls[0][1] as { body: string }).body)
    expect(sentBody.kind).toBe('cctv')
    expect(sentBody.query).toBe('Where was Mara?')
  })

  it('sends the detail as the fact for present-evidence and passes the suspectId', async () => {
    const fetchMock = stubFetchOnce({
      kind: 'present-evidence',
      fact: 'You badged into the vault corridor at 21:52.',
      retrieved: []
    })
    vi.stubGlobal('fetch', fetchMock)
    const onFact = vi.fn()

    render(<EvidenceActions suspectId="mara" onFact={onFact} />)

    fireEvent.change(screen.getByLabelText(/Detail/i), {
      target: { value: 'You badged into the vault corridor at 21:52.' }
    })
    fireEvent.click(screen.getByRole('button', { name: /Present/i }))

    await waitFor(() => {
      expect(onFact).toHaveBeenCalledWith('You badged into the vault corridor at 21:52.')
    })

    const sentBody = JSON.parse((fetchMock.mock.calls[0][1] as { body: string }).body)
    expect(sentBody.kind).toBe('present-evidence')
    expect(sentBody.suspectId).toBe('mara')
    expect(sentBody.fact).toBe('You badged into the vault corridor at 21:52.')
  })

  it('does not call onFact when the request fails', async () => {
    const fetchMock = stubFetchOnce({ error: 'boom' }, false, 400)
    vi.stubGlobal('fetch', fetchMock)
    const onFact = vi.fn()

    render(<EvidenceActions suspectId="mara" onFact={onFact} />)

    fireEvent.click(screen.getByRole('button', { name: /Forensics/i }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })
    expect(onFact).not.toHaveBeenCalled()
  })
})
