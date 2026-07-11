import { describe, expect, it } from 'vitest'
import { computeNextPosition, detectRoomEntry } from './movement.js'
import { STATION_BOUNDS } from './rooms.js'
import type { PressedKeys, Room } from './types.js'

function keysOf(...keys: Array<'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight'>): PressedKeys {
  return new Set(keys)
}

describe('computeNextPosition', () => {
  it('moves right when ArrowRight is pressed', () => {
    const next = computeNextPosition({ x: 400, y: 300 }, keysOf('ArrowRight'), STATION_BOUNDS, 1000)
    expect(next).toEqual({ x: 600, y: 300 })
  })

  it('does not move when no tracked keys are pressed', () => {
    const next = computeNextPosition({ x: 400, y: 300 }, keysOf(), STATION_BOUNDS, 1000)
    expect(next).toEqual({ x: 400, y: 300 })
  })

  it('clamps movement at the station bounds', () => {
    const next = computeNextPosition({ x: 5, y: 300 }, keysOf('ArrowLeft'), STATION_BOUNDS, 1000)
    expect(next.x).toBe(STATION_BOUNDS.x)
  })

  it('clamps movement at the right/bottom station bounds', () => {
    const next = computeNextPosition(
      { x: STATION_BOUNDS.x + STATION_BOUNDS.width - 5, y: 300 },
      keysOf('ArrowRight'),
      STATION_BOUNDS,
      1000
    )
    expect(next.x).toBe(STATION_BOUNDS.x + STATION_BOUNDS.width)
  })

  it('moves both axes by the full computed distance when moving diagonally (not normalized)', () => {
    const next = computeNextPosition(
      { x: 400, y: 300 },
      keysOf('ArrowRight', 'ArrowUp'),
      STATION_BOUNDS,
      1000
    )
    // SPEED_PER_MS (0.2) * deltaMs (1000) = 200 full distance on each axis,
    // not scaled down to preserve constant diagonal speed.
    expect(next).toEqual({ x: 600, y: 100 })
  })
})

describe('detectRoomEntry', () => {
  const testRooms: Room[] = [
    { id: 'test-room', name: 'Test Room', doorTrigger: { x: 0, y: 0, width: 50, height: 50 } }
  ]

  it('returns null when the position is outside every door trigger', () => {
    expect(detectRoomEntry({ x: 400, y: 300 }, testRooms)).toBeNull()
  })

  it('returns the room id when the position is inside a door trigger', () => {
    expect(detectRoomEntry({ x: 10, y: 10 }, testRooms)).toBe('test-room')
  })
})
