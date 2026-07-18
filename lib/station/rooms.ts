import type { Rect, Room } from './types.js'

export const STATION_BOUNDS: Rect = { x: 0, y: 0, width: 800, height: 600 }

// The order suspects are seated into rooms: top, bottom, left, right. Cases
// carry 3–4 suspects, so any trailing room without a suspect keeps its original
// role (e.g. the case-board room falls back to the notebook).
export const SUSPECT_ROOM_ORDER: readonly string[] = [
  'interrogation-1',
  'interrogation-2',
  'evidence-locker',
  'case-board'
]

// Seat each suspect into a room by index. Shared by the canvas (to draw the
// suspect + nameplate) and the page (to route a room entry to that suspect),
// so both always agree on who is where.
export function assignSuspectsToRooms<T>(suspects: readonly T[]): Record<string, T> {
  const map: Record<string, T> = {}
  SUSPECT_ROOM_ORDER.forEach((roomId, index) => {
    if (suspects[index]) map[roomId] = suspects[index]
  })
  return map
}

// Door triggers are edge-hugging bands rather than small corner rectangles:
// this keeps room entry reachable by single-direction movement (useful for
// both playability and deterministic testing).
//
// Each room also carries an optional `interior`: a furnished region drawn on
// the station canvas so the space reads as an interrogation room / evidence
// locker / case-board room rather than a bare floor. Interiors are decorative
// only — movement and room entry still key off doorTrigger — and every
// interior.rect is kept comfortably inside STATION_BOUNDS.
export const rooms: Room[] = [
  {
    id: 'interrogation-1',
    name: 'Interrogation Room 1',
    doorTrigger: { x: 0, y: 0, width: 800, height: 10 },
    // A table under the top wall — the interrogation set-piece.
    interior: { tiles: ['wall', 'desk'], rect: { x: 280, y: 20, width: 240, height: 90 } }
  },
  {
    id: 'interrogation-2',
    name: 'Interrogation Room 2',
    doorTrigger: { x: 0, y: 590, width: 800, height: 10 },
    interior: { tiles: ['wall', 'desk'], rect: { x: 280, y: 490, width: 240, height: 90 } }
  },
  {
    id: 'evidence-locker',
    name: 'Evidence Locker',
    doorTrigger: { x: 0, y: 0, width: 10, height: 600 },
    // Shelving stacked against the left wall.
    interior: { tiles: ['wall', 'shelf'], rect: { x: 20, y: 210, width: 90, height: 180 } }
  },
  {
    id: 'case-board',
    name: 'Case Board Room',
    doorTrigger: { x: 790, y: 0, width: 10, height: 600 },
    // A corkboard of leads against the right wall.
    interior: { tiles: ['wall', 'corkboard'], rect: { x: 690, y: 210, width: 90, height: 180 } }
  }
]
