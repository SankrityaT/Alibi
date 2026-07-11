import type { PressedKeys, Position, Rect, Room } from './types.js'
import { STATION_BOUNDS } from './rooms.js'

const SPEED_PER_MS = 0.2

export function computeNextPosition(
  position: Position,
  keys: PressedKeys,
  bounds: Rect = STATION_BOUNDS,
  deltaMs = 16
): Position {
  let dx = 0
  let dy = 0
  if (keys.has('ArrowUp')) dy -= 1
  if (keys.has('ArrowDown')) dy += 1
  if (keys.has('ArrowLeft')) dx -= 1
  if (keys.has('ArrowRight')) dx += 1

  const distance = SPEED_PER_MS * deltaMs
  const nextX = position.x + dx * distance
  const nextY = position.y + dy * distance

  return {
    x: Math.min(Math.max(nextX, bounds.x), bounds.x + bounds.width),
    y: Math.min(Math.max(nextY, bounds.y), bounds.y + bounds.height)
  }
}

function isInsideRect(position: Position, rect: Rect): boolean {
  return (
    position.x >= rect.x &&
    position.x <= rect.x + rect.width &&
    position.y >= rect.y &&
    position.y <= rect.y + rect.height
  )
}

export function detectRoomEntry(position: Position, rooms: Room[]): string | null {
  const match = rooms.find((room) => isInsideRect(position, room.doorTrigger))
  return match ? match.id : null
}
