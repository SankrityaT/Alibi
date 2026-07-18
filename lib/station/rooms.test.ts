import { describe, expect, it } from 'vitest'
import { rooms, STATION_BOUNDS } from './rooms.js'

function within(inner: { x: number; y: number; width: number; height: number }): boolean {
  return (
    inner.x >= STATION_BOUNDS.x &&
    inner.y >= STATION_BOUNDS.y &&
    inner.x + inner.width <= STATION_BOUNDS.x + STATION_BOUNDS.width &&
    inner.y + inner.height <= STATION_BOUNDS.y + STATION_BOUNDS.height
  )
}

describe('rooms', () => {
  it('every room exposes id, name and a doorTrigger', () => {
    for (const room of rooms) {
      expect(typeof room.id).toBe('string')
      expect(room.id.length).toBeGreaterThan(0)
      expect(typeof room.name).toBe('string')
      expect(room.name.length).toBeGreaterThan(0)
      expect(room.doorTrigger).toBeDefined()
    }
  })

  it('keeps every doorTrigger within the station bounds', () => {
    for (const room of rooms) {
      expect(within(room.doorTrigger)).toBe(true)
    }
  })

  it('keeps every interior.rect within the station bounds and lists tiles', () => {
    for (const room of rooms) {
      if (!room.interior) continue
      expect(within(room.interior.rect)).toBe(true)
      expect(room.interior.tiles.length).toBeGreaterThan(0)
      for (const tile of room.interior.tiles) {
        expect(typeof tile).toBe('string')
        expect(tile.length).toBeGreaterThan(0)
      }
    }
  })

  it('furnishes the interrogation / evidence-locker / case-board rooms', () => {
    const furnished = rooms.filter((room) => room.interior)
    expect(furnished.length).toBeGreaterThanOrEqual(3)
  })
})
