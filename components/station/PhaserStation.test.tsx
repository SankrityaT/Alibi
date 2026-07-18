// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, waitFor } from '@testing-library/react'
import { INTERIOR_TILE_KEYS, PhaserStation, portraitKey } from './PhaserStation.js'
import { PORTRAIT_SPRITES } from '../../lib/station/portraits.js'
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
    const { getByTestId } = render(<PhaserStation onEnterRoom={onEnterRoom} suspects={[{ suspectId: 'mara', name: 'Mara' }]} />)

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
    const { unmount } = render(<PhaserStation onEnterRoom={onEnterRoom} suspects={[{ suspectId: 'mara', name: 'Mara' }]} />)

    await waitFor(() => {
      expect(instances()).toHaveLength(1)
    })

    const [game] = instances()
    unmount()

    expect(game.destroy).toHaveBeenCalledWith(true)
  })

  it('registers the interior tile and portrait textures in the scene preload', async () => {
    const onEnterRoom = vi.fn()
    render(<PhaserStation onEnterRoom={onEnterRoom} suspects={[{ suspectId: 'mara', name: 'Mara' }]} />)

    await waitFor(() => {
      expect(instances()).toHaveLength(1)
    })

    // The scene class is handed to Phaser via config.scene; instantiate it and
    // run preload against a fake loader to capture the registered keys.
    const [game] = instances()
    const SceneClass = game.config.scene as new () => { preload: () => void; load: unknown }
    const scene = new SceneClass()
    const loaded: Array<{ key: string; path: string }> = []
    ;(scene as unknown as { load: { image: (key: string, path: string) => void } }).load = {
      image: (key: string, path: string) => {
        loaded.push({ key, path })
      }
    }

    scene.preload()

    const keys = loaded.map((entry) => entry.key)
    // Existing base textures still load.
    expect(keys).toContain('floor')
    expect(keys).toContain('detective')
    // Every interior furniture tile is loaded from /sprites/<key>.png.
    for (const key of INTERIOR_TILE_KEYS) {
      expect(loaded).toContainEqual({ key, path: `/sprites/${key}.png` })
    }
    expect(INTERIOR_TILE_KEYS.length).toBeGreaterThan(0)
    // Every suspect portrait is registered under its portrait key.
    for (const path of PORTRAIT_SPRITES) {
      expect(loaded).toContainEqual({ key: portraitKey(path), path })
    }
  })
})
