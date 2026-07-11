import type { Rect, Room } from './types.js'

export const STATION_BOUNDS: Rect = { x: 0, y: 0, width: 800, height: 600 }

// Door triggers are edge-hugging bands rather than small corner rectangles:
// this keeps room entry reachable by single-direction movement (useful for
// both playability and deterministic testing) until Plan 3 adds real room
// interiors and this can be revisited with actual station art.
export const rooms: Room[] = [
  {
    id: 'interrogation-1',
    name: 'Interrogation Room 1',
    doorTrigger: { x: 0, y: 0, width: 800, height: 10 }
  },
  {
    id: 'interrogation-2',
    name: 'Interrogation Room 2',
    doorTrigger: { x: 0, y: 590, width: 800, height: 10 }
  },
  {
    id: 'evidence-locker',
    name: 'Evidence Locker',
    doorTrigger: { x: 0, y: 0, width: 10, height: 600 }
  },
  {
    id: 'case-board',
    name: 'Case Board Room',
    doorTrigger: { x: 790, y: 0, width: 10, height: 600 }
  }
]
