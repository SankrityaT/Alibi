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
