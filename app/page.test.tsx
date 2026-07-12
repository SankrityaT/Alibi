// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import HomePage from './page.js'

afterEach(() => {
  cleanup()
})

describe('HomePage', () => {
  it('renders the title and a primary CTA into the station', () => {
    render(<HomePage />)

    expect(screen.getByRole('heading', { level: 1, name: 'Alibi' })).toBeTruthy()

    const links = screen.getAllByRole('link', { name: 'Play the case' })
    expect(links.length).toBeGreaterThanOrEqual(1)
    expect(links.every((l) => l.getAttribute('href') === '/station')).toBe(true)
  })
})
