export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export interface RoomInterior {
  // Sprite keys (loaded in the Phaser scene) that furnish this room.
  tiles: string[]
  // Region of the station canvas the furniture occupies. Stays within
  // STATION_BOUNDS; purely decorative, independent of the doorTrigger band.
  rect: Rect
}

export interface Room {
  id: string
  name: string
  doorTrigger: Rect
  interior?: RoomInterior
}

export interface Position {
  x: number
  y: number
}

export type TrackedKey = 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight'
export type PressedKeys = Set<TrackedKey>
