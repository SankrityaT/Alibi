// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, waitFor } from '@testing-library/react'
import { PhaserStation } from './PhaserStation.js'
import * as PhaserMockModule from 'phaser'

vi.mock('phaser', () => {
  class FakeScene {}

  const instances: Array<{ config: Record<string, unknown>; destroy: ReturnType<typeof vi.fn> }> = []

  class FakeGame {
    config: Record<string, unknown>
    destroy = vi.fn()

    constructor(config: Record<string, unknown>) {
      this.config = config
      instances.push(this)
    }
  }

  return {
    __instances: instances,
    default: {
      AUTO: 'AUTO',
      Game: FakeGame,
      Scene: FakeScene
    }
  }
})

function instances() {
  return (PhaserMockModule as unknown as { __instances: Array<{ config: Record<string, unknown>; destroy: ReturnType<typeof vi.fn> }> })
    .__instances
}

afterEach(() => {
  cleanup()
  instances().length = 0
})

describe('PhaserStation', () => {
  it('boots a Phaser game sized to the station bounds, mounted into its container', async () => {
    const onEnterRoom = vi.fn()
    const { getByTestId } = render(<PhaserStation onEnterRoom={onEnterRoom} />)

    await waitFor(() => {
      expect(instances()).toHaveLength(1)
    })

    const [game] = instances()
    expect(game.config.width).toBe(800)
    expect(game.config.height).toBe(600)
    expect(game.config.parent).toBe(getByTestId('phaser-station'))
  })

  it('destroys the Phaser game on unmount', async () => {
    const onEnterRoom = vi.fn()
    const { unmount } = render(<PhaserStation onEnterRoom={onEnterRoom} />)

    await waitFor(() => {
      expect(instances()).toHaveLength(1)
    })

    const [game] = instances()
    unmount()

    expect(game.destroy).toHaveBeenCalledWith(true)
  })
})
