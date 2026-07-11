// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import HomePage from './page.js'

afterEach(() => {
  cleanup()
})

describe('HomePage', () => {
  it('renders the title and a link into the station', () => {
    render(<HomePage />)

    expect(screen.getByText('Alibi')).toBeTruthy()

    const link = screen.getByText('Enter the station') as HTMLAnchorElement
    expect(link.getAttribute('href')).toBe('/station')
  })
})
