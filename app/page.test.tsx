// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'

const pushMock = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock })
}))

import HomePage from './page.js'

afterEach(() => {
  cleanup()
  pushMock.mockReset()
  vi.unstubAllGlobals()
})

describe('HomePage', () => {
  it('renders the title and the three difficulty options', () => {
    render(<HomePage />)

    expect(screen.getByText('Alibi')).toBeTruthy()
    expect(screen.getByRole('button', { name: /Easy/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Medium/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Hard/ })).toBeTruthy()
  })

  it('starts a case at the chosen difficulty then navigates to the station', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({}) })
    vi.stubGlobal('fetch', fetchMock)

    render(<HomePage />)
    fireEvent.click(screen.getByRole('button', { name: /Medium/ }))

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/station')
    })
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/new-game',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ difficulty: 'medium' })
      })
    )
  })

  it('surfaces an error and does not navigate when starting the case fails', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: false, status: 500, json: async () => ({ error: 'boom' }) })
    vi.stubGlobal('fetch', fetchMock)

    render(<HomePage />)
    fireEvent.click(screen.getByRole('button', { name: /Easy/ }))

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toBe('boom')
    })
    expect(pushMock).not.toHaveBeenCalled()
  })
})
