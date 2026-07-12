'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PhaserStation } from '../../components/station/PhaserStation.js'
import { assignSuspectsToRooms } from '../../lib/station/rooms.js'

interface PublicSuspect {
  suspectId: string
  name: string
}

interface PublicCase {
  started: boolean
  title: string
  suspects: PublicSuspect[]
}

export default function StationPage() {
  const router = useRouter()
  const [caseInfo, setCaseInfo] = useState<PublicCase | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/case?t=${Date.now()}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data && Array.isArray(data.suspects)) {
          setCaseInfo({
            started: Boolean(data.started),
            title: typeof data.title === 'string' ? data.title : 'Active Case',
            suspects: data.suspects.map((s: PublicSuspect) => ({ suspectId: s.suspectId, name: s.name }))
          })
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const suspects = caseInfo?.suspects ?? []

  // Walking into a room navigates too, so the station feels like a place — but
  // the clickable roster below is the reliable path for the demo.
  const handleEnterRoom = useCallback(
    (roomId: string) => {
      // A room seated with a suspect goes to that interrogation; an unseated
      // case-board room still opens the notebook.
      const seating = assignSuspectsToRooms(suspects)
      const target = seating[roomId]
      if (target) {
        router.push(`/interrogation/${target.suspectId}`)
        return
      }
      if (roomId === 'case-board') {
        router.push('/notebook')
      }
    },
    [router, suspects]
  )

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
        {suspects.length > 0 ? (
          <PhaserStation onEnterRoom={handleEnterRoom} suspects={suspects} />
        ) : (
          <div
            data-testid="phaser-station"
            style={{
              width: '100%',
              aspectRatio: '800 / 600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--paper-faint)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.85rem'
            }}
          >
            Bringing the precinct online…
          </div>
        )}
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

      <span className="uppercase-label" style={{ maxWidth: 820, width: '100%', margin: '0 auto' }}>
        &uarr; &darr; &larr; &rarr; to walk &mdash; or pick a destination below
      </span>

      {/* Reliable clickable navigation — the whole game is reachable from here. */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.75rem',
          maxWidth: 820,
          width: '100%',
          margin: '0 auto'
        }}
      >
        {suspects.map((s) => (
          <button
            key={s.suspectId}
            type="button"
            onClick={() => router.push(`/interrogation/${s.suspectId}`)}
            style={{
              fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              fontSize: '0.75rem',
              padding: '0.7rem 1.1rem',
              cursor: 'pointer',
              background: 'var(--bg-panel)',
              color: 'var(--paper)',
              border: '1px solid var(--accent)'
            }}
          >
            Interrogate {s.name}
          </button>
        ))}
        <button
          type="button"
          onClick={() => router.push('/notebook')}
          style={{
            fontFamily: 'var(--font-mono)',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            fontSize: '0.75rem',
            padding: '0.7rem 1.1rem',
            cursor: 'pointer',
            background: 'var(--bg-panel)',
            color: 'var(--amber)',
            border: '1px solid var(--amber)'
          }}
        >
          Case Board / Notebook
        </button>
        <button
          type="button"
          onClick={() => router.push('/brief')}
          style={{
            fontFamily: 'var(--font-mono)',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            fontSize: '0.75rem',
            padding: '0.7rem 1.1rem',
            cursor: 'pointer',
            background: 'var(--bg-panel)',
            color: 'var(--paper-dim)',
            border: '1px solid var(--line-strong)'
          }}
        >
          Re-read Case File
        </button>
      </div>

      {caseInfo && !caseInfo.started && (
        <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--paper-faint)', fontSize: '0.8rem' }}>
          No case started &mdash;{' '}
          <a href="/" style={{ color: 'var(--accent-bright)' }}>
            begin one from the title screen
          </a>{' '}
          to seed the suspects&rsquo; memories.
        </p>
      )}
    </main>
  )
}
