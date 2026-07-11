export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export interface Room {
  id: string
  name: string
  doorTrigger: Rect
}

export interface Position {
  x: number
  y: number
}

export type TrackedKey = 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight'
export type PressedKeys = Set<TrackedKey>
