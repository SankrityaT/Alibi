// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { DialogueBox } from './DialogueBox.js'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('DialogueBox', () => {
  it('reveals text progressively over time', () => {
    render(<DialogueBox text="Hi" tickMs={20} charactersPerTick={1} />)

    expect(screen.getByTestId('dialogue-box').textContent).toBe('')

    vi.advanceTimersByTime(20)
    expect(screen.getByTestId('dialogue-box').textContent).toBe('H')

    vi.advanceTimersByTime(20)
    expect(screen.getByTestId('dialogue-box').textContent).toBe('Hi')

    vi.advanceTimersByTime(100)
    expect(screen.getByTestId('dialogue-box').textContent).toBe('Hi')
  })

  it('exposes the full text via data-full-text regardless of reveal progress', () => {
    render(<DialogueBox text="Hi" tickMs={20} charactersPerTick={1} />)

    expect(screen.getByTestId('dialogue-box').getAttribute('data-full-text')).toBe('Hi')
  })
})
