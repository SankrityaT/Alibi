// components/station/StationCanvas.test.tsx
// @vitest-environment jsdom
import { act } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { StationCanvas } from './StationCanvas.js'

function stubAnimationFrame() {
  let callback: FrameRequestCallback | null = null
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    callback = cb
    return 1
  })
  vi.stubGlobal('cancelAnimationFrame', () => {})
  return {
    runFrame(time: number) {
      callback?.(time)
    }
  }
}

function stubPerformanceNow(value: number) {
  vi.spyOn(performance, 'now').mockReturnValue(value)
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('StationCanvas', () => {
  it('moves the player right when ArrowRight is held through a frame tick', () => {
    stubPerformanceNow(0)
    const { runFrame } = stubAnimationFrame()
    const onEnterRoom = vi.fn()

    render(<StationCanvas onEnterRoom={onEnterRoom} />)

    const startX = Number(screen.getByTestId('station-canvas').getAttribute('data-player-x'))

    fireEvent.keyDown(window, { key: 'ArrowRight' })
    act(() => {
      runFrame(1000)
    })

    const nextX = Number(screen.getByTestId('station-canvas').getAttribute('data-player-x'))
    expect(nextX).toBeGreaterThan(startX)
    expect(onEnterRoom).not.toHaveBeenCalled()
  })

  it('calls onEnterRoom when the player reaches a door trigger', () => {
    stubPerformanceNow(0)
    const { runFrame } = stubAnimationFrame()
    const onEnterRoom = vi.fn()

    render(<StationCanvas onEnterRoom={onEnterRoom} />)

    fireEvent.keyDown(window, { key: 'ArrowUp' })
    act(() => {
      runFrame(1500)
    })

    expect(onEnterRoom).toHaveBeenCalledWith('interrogation-1')
  })

  it('stops tracking a key on keyup', () => {
    stubPerformanceNow(0)
    const { runFrame } = stubAnimationFrame()
    const onEnterRoom = vi.fn()

    render(<StationCanvas onEnterRoom={onEnterRoom} />)

    fireEvent.keyDown(window, { key: 'ArrowRight' })
    fireEvent.keyUp(window, { key: 'ArrowRight' })
    act(() => {
      runFrame(1000)
    })

    const x = Number(screen.getByTestId('station-canvas').getAttribute('data-player-x'))
    expect(x).toBe(400)
  })
})
