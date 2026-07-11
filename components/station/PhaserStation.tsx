'use client'

import { useEffect, useRef } from 'react'
import type Phaser from 'phaser'
import { computeNextPosition, detectRoomEntry } from '../../lib/station/movement.js'
import { rooms, STATION_BOUNDS } from '../../lib/station/rooms.js'
import type { Position, TrackedKey } from '../../lib/station/types.js'

export interface PhaserStationProps {
  onEnterRoom: (roomId: string) => void
}

const START_POSITION: Position = { x: 400, y: 300 }

export function PhaserStation({ onEnterRoom }: PhaserStationProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const onEnterRoomRef = useRef(onEnterRoom)
  onEnterRoomRef.current = onEnterRoom

  useEffect(() => {
    let game: Phaser.Game | undefined
    let cancelled = false

    async function boot() {
      const { default: Phaser } = await import('phaser')
      if (cancelled || !containerRef.current) {
        return
      }

      const position: Position = { ...START_POSITION }
      let currentRoomId: string | null = null

      class StationScene extends Phaser.Scene {
        private player!: Phaser.GameObjects.Sprite
        private cursors!: Phaser.Types.Input.Keyboard.CursorKeys

        preload() {
          this.load.image('floor', '/sprites/floor.png')
          this.load.image('detective', '/sprites/detective.png')
        }

        create() {
          this.add
            .tileSprite(
              STATION_BOUNDS.width / 2,
              STATION_BOUNDS.height / 2,
              STATION_BOUNDS.width,
              STATION_BOUNDS.height,
              'floor'
            )
            .setAlpha(0.9)

          const doorGraphics = this.add.graphics()
          for (const room of rooms) {
            const { x, y, width: w, height: h } = room.doorTrigger
            doorGraphics.fillStyle(0xd4952e, 0.55)
            doorGraphics.fillRect(x, y, w, h)
          }

          this.player = this.add.sprite(position.x, position.y, 'detective')
          this.player.setScale(4)
          this.player.setDepth(10)

          this.cursors = this.input.keyboard!.createCursorKeys()
        }

        update(_time: number, delta: number) {
          const pressed = new Set<TrackedKey>()
          if (this.cursors.up.isDown) pressed.add('ArrowUp')
          if (this.cursors.down.isDown) pressed.add('ArrowDown')
          if (this.cursors.left.isDown) pressed.add('ArrowLeft')
          if (this.cursors.right.isDown) pressed.add('ArrowRight')

          const next = computeNextPosition(position, pressed, STATION_BOUNDS, delta)
          position.x = next.x
          position.y = next.y
          this.player.setPosition(position.x, position.y)

          if (pressed.has('ArrowLeft')) {
            this.player.setFlipX(true)
          } else if (pressed.has('ArrowRight')) {
            this.player.setFlipX(false)
          }

          const enteredRoomId = detectRoomEntry(position, rooms)
          if (enteredRoomId !== currentRoomId) {
            currentRoomId = enteredRoomId
            if (enteredRoomId) {
              onEnterRoomRef.current(enteredRoomId)
            }
          }
        }
      }

      game = new Phaser.Game({
        type: Phaser.AUTO,
        width: STATION_BOUNDS.width,
        height: STATION_BOUNDS.height,
        parent: containerRef.current,
        backgroundColor: '#0c0a07',
        pixelArt: true,
        scene: StationScene
      })
    }

    boot()

    return () => {
      cancelled = true
      game?.destroy(true)
    }
  }, [])

  return <div ref={containerRef} data-testid="phaser-station" />
}
