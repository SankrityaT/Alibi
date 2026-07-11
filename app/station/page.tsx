'use client'

import { useCallback, useState } from 'react'
import { PhaserStation } from '../../components/station/PhaserStation.js'

export default function StationPage() {
  const [lastRoom, setLastRoom] = useState<string | null>(null)

  const handleEnterRoom = useCallback((roomId: string) => {
    // Plan 3 replaces this with an actual scene transition to the
    // interrogation/evidence/case-board UI. For now, logging + a small HUD
    // banner is enough to manually verify room-entry detection end-to-end.
    console.log(`Entered room: ${roomId}`)
    setLastRoom(roomId)
  }, [])

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        padding: '2rem',
        background: 'radial-gradient(ellipse at 50% 20%, #1a140c 0%, #0b0a08 65%)'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          alignSelf: 'flex-start',
          maxWidth: 820,
          width: '100%',
          margin: '0 auto'
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: 'var(--accent-bright)',
            boxShadow: '0 0 8px var(--accent-bright)',
            animation: 'flicker 2.2s infinite'
          }}
        />
        <span className="uppercase-label">Precinct &mdash; Live Feed</span>
      </div>

      <div
        style={{
          position: 'relative',
          maxWidth: 820,
          width: '100%',
          border: '10px solid #050403',
          borderRadius: 4,
          boxShadow: '0 0 0 1px rgba(232,223,200,0.08), 0 30px 80px rgba(0,0,0,0.7)',
          overflow: 'hidden'
        }}
      >
        <PhaserStation onEnterRoom={handleEnterRoom} />
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background:
              'repeating-linear-gradient(0deg, rgba(0,0,0,0.18) 0px, rgba(0,0,0,0.18) 1px, transparent 1px, transparent 3px)',
            mixBlendMode: 'multiply'
          }}
        />
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            boxShadow: 'inset 0 0 120px rgba(0,0,0,0.85)'
          }}
        />
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          maxWidth: 820,
          width: '100%',
          margin: '0 auto'
        }}
      >
        <span className="uppercase-label">&uarr; &darr; &larr; &rarr; to move</span>
        <span className="uppercase-label">
          {lastRoom ? `Last room entered: ${lastRoom}` : 'Awaiting movement&hellip;'}
        </span>
      </div>
    </main>
  )
}
