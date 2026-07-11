# Alibi — Station Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a walkable police station with real, controllable movement and room-entry detection — no interrogation/evidence logic yet, no visual polish beyond a functional canvas. This is Plan 2 of 6; it introduces Next.js/React into the project for the first time, on top of the backend from Plan 1 (core memory loop).

**Architecture:** Movement and collision are pure, fully unit-tested functions (`lib/station/movement.ts`) operating on plain data (`Position`, `Rect`, `Room`). A thin React component (`StationCanvas`) wires keyboard input and a `requestAnimationFrame` loop to those pure functions and draws the result to a `<canvas>`; the canvas exposes player position via `data-*` attributes so tests can assert on movement without inspecting pixels. A Next.js App Router page mounts the canvas. Room interiors (what happens inside a room) are out of scope — entering a room only fires a callback for now.

**Tech Stack:** Next.js (App Router), React 18, TypeScript, Vitest with `@vitest-environment jsdom` per-file overrides for component tests, `@testing-library/react`. Builds on the Node/Vitest toolchain from Plan 1 — no changes to `lib/supermemory`, `lib/anthropic`, or `lib/suspect`.

## Global Constraints

- Station canvas is 800x600 (`STATION_BOUNDS`).
- Player movement speed is 0.2 pixels/ms (`SPEED_PER_MS`), applied per axis independently (diagonal movement is not speed-normalized — acceptable simplification for this stage).
- Tracked keys are exactly `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`.
- Room entry is detected by the player's position falling inside a room's `doorTrigger` rectangle; entry fires `onEnterRoom(roomId)` — what happens after that (Plan 3's interrogation UI) is out of scope here.
- No global vitest environment change: the project default stays `node` (Plan 1's tests must keep running exactly as before); component tests opt into `jsdom` per-file via `// @vitest-environment jsdom`.
- All new relative imports use explicit `.js` extensions, matching the convention established in Plan 1 (Vite/Next resolve `.js` specifiers to their `.ts`/`.tsx` source).

---

### Task 1: Next.js + React toolchain

**Files:**
- Modify: `package.json`
- Modify: `tsconfig.json`
- Create: `next.config.mjs`
- Create: `next-env.d.ts`
- Create: `app/layout.tsx`
- Create: `app/page.tsx`
- Test: `app/page.test.tsx`

**Interfaces:**
- Consumes: nothing from Plan 1 (this task only adds the React/Next toolchain and a placeholder home page).
- Produces: a working Next.js App Router project (`npm run dev`/`build`) and a proven pattern for testing a React component with `@testing-library/react` under a per-file jsdom environment — later tasks in this plan follow the same pattern.

- [ ] **Step 1: Modify `package.json`**

Replace the file's full contents with:

```json
{
  "name": "alibi",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit",
    "dev-interrogate": "tsx scripts/dev-interrogate.ts"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.32.0",
    "dotenv": "^16.4.5",
    "next": "^14.2.5",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@testing-library/react": "^16.0.0",
    "@types/node": "^20.14.0",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "jsdom": "^24.1.1",
    "tsx": "^4.16.2",
    "typescript": "^5.5.4",
    "vitest": "^2.0.5"
  }
}
```

- [ ] **Step 2: Modify `tsconfig.json`**

Replace the file's full contents with:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "jsx": "preserve",
    "lib": ["dom", "dom.iterable", "ES2022"],
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "types": ["node"]
  },
  "include": ["lib", "scripts", "test", "app", "components", "next-env.d.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Write `next.config.mjs`**

```js
/** @type {import('next').NextConfig} */
const nextConfig = {}

export default nextConfig
```

- [ ] **Step 4: Write `next-env.d.ts`**

```ts
/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be edited
// see https://nextjs.org/docs/app/api-reference/config/typescript for more information.
```

- [ ] **Step 5: Install dependencies**

Run: `npm install`
Expected: installs successfully, `next`/`react`/`react-dom` and the new devDependencies appear in `node_modules`.

- [ ] **Step 6: Write the failing test**

```tsx
// app/page.test.tsx
// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import HomePage from './page.js'

afterEach(() => {
  cleanup()
})

describe('HomePage', () => {
  it('renders the title and a link into the station', () => {
    render(<HomePage />)

    expect(screen.getByText('Alibi')).toBeTruthy()

    const link = screen.getByText('Enter the station') as HTMLAnchorElement
    expect(link.getAttribute('href')).toBe('/station')
  })
})
```

- [ ] **Step 7: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — `app/page.js` (i.e. `app/page.tsx`) does not exist.

- [ ] **Step 8: Write `app/layout.tsx`**

```tsx
import type { ReactNode } from 'react'

export const metadata = {
  title: 'Alibi',
  description: 'A memory-driven detective game'
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

- [ ] **Step 9: Write `app/page.tsx`**

```tsx
export default function HomePage() {
  return (
    <main>
      <h1>Alibi</h1>
      <a href="/station">Enter the station</a>
    </main>
  )
}
```

- [ ] **Step 10: Run the test to verify it passes**

Run: `npm test`
Expected: PASS — the new test passes, and all 13 tests from Plan 1 still pass (14 total).

- [ ] **Step 11: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 12: Commit**

```bash
git add package.json tsconfig.json next.config.mjs next-env.d.ts app/layout.tsx app/page.tsx app/page.test.tsx package-lock.json
git commit -m "chore: add Next.js/React toolchain and placeholder home page"
```

---

### Task 2: Room definitions and movement/collision logic

**Files:**
- Create: `lib/station/types.ts`
- Create: `lib/station/rooms.ts`
- Create: `lib/station/movement.ts`
- Test: `lib/station/movement.test.ts`

**Interfaces:**
- Consumes: nothing beyond the Node/Vitest toolchain from Plan 1 (these are plain TS modules, no React).
- Produces:
  - `Rect = { x: number; y: number; width: number; height: number }`
  - `Room = { id: string; name: string; doorTrigger: Rect }`
  - `Position = { x: number; y: number }`
  - `PressedKeys = Set<'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight'>`
  - `STATION_BOUNDS: Rect`, `rooms: Room[]` (exported from `lib/station/rooms.ts`)
  - `computeNextPosition(position: Position, keys: PressedKeys, bounds?: Rect, deltaMs?: number): Position`
  - `detectRoomEntry(position: Position, rooms: Room[]): string | null`
  Task 3 depends on all of the above, imported exactly as named here.

- [ ] **Step 1: Write the failing test**

```ts
// lib/station/movement.test.ts
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — `lib/station/movement.ts`, `lib/station/rooms.ts`, and `lib/station/types.ts` do not exist.

- [ ] **Step 3: Write `lib/station/types.ts`**

```ts
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
```

- [ ] **Step 4: Write `lib/station/rooms.ts`**

```ts
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
```

- [ ] **Step 5: Write `lib/station/movement.ts`**

```ts
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
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npm test`
Expected: PASS — all 19 tests pass (14 from Task 1 + 5 new).

- [ ] **Step 7: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add lib/station/types.ts lib/station/rooms.ts lib/station/movement.ts lib/station/movement.test.ts
git commit -m "feat: add station room definitions and movement/collision logic"
```

---

### Task 3: StationCanvas component and station page

**Files:**
- Create: `components/station/StationCanvas.tsx`
- Create: `app/station/page.tsx`
- Test: `components/station/StationCanvas.test.tsx`

**Interfaces:**
- Consumes: `computeNextPosition`, `detectRoomEntry` (Task 2, `lib/station/movement.ts`), `rooms`, `STATION_BOUNDS` (Task 2, `lib/station/rooms.ts`), `Position` (Task 2, `lib/station/types.ts`).
- Produces: `StationCanvas` React component with props `{ onEnterRoom: (roomId: string) => void }`, rendering a `<canvas data-testid="station-canvas" data-player-x data-player-y>`. `app/station/page.tsx` mounts it. Plan 3 will replace the `onEnterRoom` callback's console.log with an actual scene transition.

- [ ] **Step 1: Write the failing test**

```tsx
// components/station/StationCanvas.test.tsx
// @vitest-environment jsdom
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
    runFrame(1000)

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
    runFrame(1500)

    expect(onEnterRoom).toHaveBeenCalledWith('interrogation-1')
  })

  it('stops tracking a key on keyup', () => {
    stubPerformanceNow(0)
    const { runFrame } = stubAnimationFrame()
    const onEnterRoom = vi.fn()

    render(<StationCanvas onEnterRoom={onEnterRoom} />)

    fireEvent.keyDown(window, { key: 'ArrowRight' })
    fireEvent.keyUp(window, { key: 'ArrowRight' })
    runFrame(1000)

    const x = Number(screen.getByTestId('station-canvas').getAttribute('data-player-x'))
    expect(x).toBe(400)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — `components/station/StationCanvas.ts(x)` does not exist.

- [ ] **Step 3: Write `components/station/StationCanvas.tsx`**

```tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { computeNextPosition, detectRoomEntry } from '../../lib/station/movement.js'
import { rooms, STATION_BOUNDS } from '../../lib/station/rooms.js'
import type { Position, TrackedKey } from '../../lib/station/types.js'

export interface StationCanvasProps {
  onEnterRoom: (roomId: string) => void
}

const START_POSITION: Position = { x: 400, y: 300 }
const TRACKED_KEYS = new Set<TrackedKey>(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'])

function isTrackedKey(key: string): key is TrackedKey {
  return (TRACKED_KEYS as Set<string>).has(key)
}

export function StationCanvas({ onEnterRoom }: StationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const keysRef = useRef<Set<TrackedKey>>(new Set())
  const [position, setPosition] = useState<Position>(START_POSITION)

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (isTrackedKey(event.key)) {
        keysRef.current.add(event.key)
      }
    }
    function handleKeyUp(event: KeyboardEvent) {
      if (isTrackedKey(event.key)) {
        keysRef.current.delete(event.key)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  useEffect(() => {
    let frameId: number
    let lastTime = performance.now()

    function tick(now: number) {
      const deltaMs = now - lastTime
      lastTime = now

      setPosition((current) => {
        const next = computeNextPosition(current, keysRef.current, STATION_BOUNDS, deltaMs)
        const enteredRoomId = detectRoomEntry(next, rooms)
        if (enteredRoomId) {
          onEnterRoom(enteredRoomId)
        }
        return next
      })

      frameId = requestAnimationFrame(tick)
    }

    frameId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameId)
  }, [onEnterRoom])

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) {
      return
    }
    context.clearRect(0, 0, canvas.width, canvas.height)
    context.fillStyle = '#111'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.fillStyle = '#eee'
    for (const room of rooms) {
      context.fillRect(
        room.doorTrigger.x,
        room.doorTrigger.y,
        room.doorTrigger.width,
        room.doorTrigger.height
      )
    }
    context.fillStyle = '#f33'
    context.fillRect(position.x - 5, position.y - 5, 10, 10)
  }, [position])

  return (
    <canvas
      ref={canvasRef}
      width={STATION_BOUNDS.width}
      height={STATION_BOUNDS.height}
      data-testid="station-canvas"
      data-player-x={position.x}
      data-player-y={position.y}
    />
  )
}
```

- [ ] **Step 4: Write `app/station/page.tsx`**

```tsx
'use client'

import { useCallback } from 'react'
import { StationCanvas } from '../../components/station/StationCanvas.js'

export default function StationPage() {
  const handleEnterRoom = useCallback((roomId: string) => {
    // Plan 3 replaces this with an actual scene transition to the
    // interrogation/evidence/case-board UI. For now, logging is enough to
    // manually verify room-entry detection end-to-end in a real browser.
    console.log(`Entered room: ${roomId}`)
  }, [])

  return <StationCanvas onEnterRoom={handleEnterRoom} />
}
```

No automated test is added for `app/station/page.tsx` — it has no logic of its own beyond wiring `StationCanvas`, whose behavior is already fully covered by `StationCanvas.test.tsx` and `movement.test.ts`. A vacuous "renders without crashing" test would not verify anything real.

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test`
Expected: PASS — all 22 tests pass (19 from Tasks 1-2 + 3 new).

- [ ] **Step 6: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 7: Manually verify in a real browser**

Run: `npm run dev`, open `http://localhost:3000/station`.
Expected: a dark 800x600 canvas renders with light bands along its edges (the door triggers) and a small red square (the player) starting at the center. Arrow keys move the square; walking it into an edge band logs `Entered room: <id>` to the browser console.

- [ ] **Step 8: Commit**

```bash
git add components/station/StationCanvas.tsx components/station/StationCanvas.test.tsx app/station/page.tsx
git commit -m "feat: add StationCanvas movement component and station page"
```

---

## Plan self-review notes

- **Spec coverage:** real controllable movement (arrow keys, Task 3) — covered. Room-entry triggers (Task 2 + 3) — covered. Station shell with no game logic yet (explicitly, `onEnterRoom` just logs) — covered, matches Plan 2's scoped goal from the 6-plan breakdown. Visual polish (noir palette, animations) is explicitly deferred to later plans per the 6-plan breakdown and is not claimed here.
- **Placeholder scan:** no TBD/TODO; every step has complete code. The one thing deliberately left as a comment (`console.log` in the room-entry handler) is explicitly explained as intentional scope, not a placeholder standing in for missing work.
- **Type consistency:** `Position`, `Rect`, `Room`, `PressedKeys`/`TrackedKey` defined once in Task 2's `types.ts` and reused verbatim in Task 3's component and its test. `computeNextPosition`/`detectRoomEntry` signatures match between Task 2's definition and Task 3's usage.
- **Scope:** this plan only covers station movement + room-entry detection, matching Plan 2 from the 6-plan breakdown; interrogation UI, evidence, case board, and case content remain separate plans (3-6).
