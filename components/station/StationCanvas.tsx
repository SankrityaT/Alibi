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
  const currentRoomRef = useRef<string | null>(null)
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

      setPosition((current) => computeNextPosition(current, keysRef.current, STATION_BOUNDS, deltaMs))

      frameId = requestAnimationFrame(tick)
    }

    frameId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameId)
  }, [])

  // Room-entry detection lives in its own effect, keyed on `position`, rather
  // than inside the setPosition updater above. Effects run after the commit
  // (not during render), so calling onEnterRoom here never risks updating a
  // parent component's state from inside a setState updater function. The
  // ref (not state) tracks the last-known room so onEnterRoom fires exactly
  // once per transition, not once per frame while the player stands still
  // inside a door trigger.
  useEffect(() => {
    const enteredRoomId = detectRoomEntry(position, rooms)
    if (enteredRoomId !== currentRoomRef.current) {
      currentRoomRef.current = enteredRoomId
      if (enteredRoomId) {
        onEnterRoom(enteredRoomId)
      }
    }
  }, [position, onEnterRoom])

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) {
      return
    }
    const { width, height } = canvas

    context.clearRect(0, 0, width, height)

    // Floor: a dim amber-lit wood tone rather than flat black.
    const floor = context.createRadialGradient(
      width / 2,
      height / 2,
      40,
      width / 2,
      height / 2,
      Math.max(width, height) / 1.1
    )
    floor.addColorStop(0, '#241d13')
    floor.addColorStop(1, '#0c0a07')
    context.fillStyle = floor
    context.fillRect(0, 0, width, height)

    // Faint floorboard lines for texture.
    context.strokeStyle = 'rgba(212, 149, 46, 0.05)'
    context.lineWidth = 1
    for (let x = 0; x < width; x += 40) {
      context.beginPath()
      context.moveTo(x, 0)
      context.lineTo(x, height)
      context.stroke()
    }

    // Door triggers glow amber, with a soft falloff instead of a hard edge.
    for (const room of rooms) {
      const { x, y, width: w, height: h } = room.doorTrigger
      const glow = context.createRadialGradient(
        x + w / 2,
        y + h / 2,
        0,
        x + w / 2,
        y + h / 2,
        Math.max(w, h) * 1.8
      )
      glow.addColorStop(0, 'rgba(212, 149, 46, 0.85)')
      glow.addColorStop(1, 'rgba(212, 149, 46, 0)')
      context.fillStyle = glow
      context.fillRect(x - 30, y - 30, w + 60, h + 60)
      context.fillStyle = 'rgba(232, 223, 200, 0.9)'
      context.fillRect(x, y, w, h)
    }

    // Player marker: a red diamond "case pin" with a cream outline and glow.
    const px = position.x
    const py = position.y
    context.save()
    context.shadowColor = 'rgba(158, 27, 27, 0.9)'
    context.shadowBlur = 16
    context.translate(px, py)
    context.rotate(Math.PI / 4)
    context.fillStyle = '#c1272d'
    context.fillRect(-7, -7, 14, 14)
    context.strokeStyle = '#e8dfc8'
    context.lineWidth = 1.5
    context.strokeRect(-7, -7, 14, 14)
    context.restore()
  }, [position])

  return (
    <canvas
      ref={canvasRef}
      width={STATION_BOUNDS.width}
      height={STATION_BOUNDS.height}
      data-testid="station-canvas"
      data-player-x={position.x}
      data-player-y={position.y}
      style={{ display: 'block', width: '100%', height: 'auto' }}
    />
  )
}
