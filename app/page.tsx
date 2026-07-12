'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

type Difficulty = 'easy' | 'medium' | 'hard'

const DIFFICULTIES: { level: Difficulty; label: string; points: number; blurb: string }[] = [
  { level: 'easy', label: 'Easy', points: 10, blurb: '3 suspects · one planted memory' },
  { level: 'medium', label: 'Medium', points: 20, blurb: '4 suspects · a red herring in play' },
  { level: 'hard', label: 'Hard', points: 30, blurb: 'a decoy guiltier than the culprit' }
]

export default function HomePage() {
  const router = useRouter()
  const [starting, setStarting] = useState<Difficulty | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function startCase(difficulty: Difficulty) {
    setStarting(difficulty)
    setError(null)
    try {
      // Seeds a case into Supermemory server-side (suspect memories + the
      // culprit's planted false memory) and sets it active, then we enter the
      // station. Without this, suspects have nothing to remember.
      const response = await fetch('/api/new-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ difficulty })
      })
      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        setError(typeof body.error === 'string' ? body.error : 'Could not start the case.')
        setStarting(null)
        return
      }
      // Stamp the case start so the accusation can report how long the solve
      // took — the Detective Rating rewards a fast, decisive close.
      try {
        sessionStorage.setItem('alibi:caseStartedAt', String(Date.now()))
      } catch {
        // sessionStorage unavailable (private mode etc.) — time bonus is optional.
      }
      router.push('/station')
    } catch {
      setError('Could not reach the server. Is it running?')
      setStarting(null)
    }
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1.75rem',
        textAlign: 'center',
        padding: '2rem',
        background:
          'repeating-linear-gradient(100deg, rgba(212,149,46,0.05) 0px, rgba(212,149,46,0.05) 2px, transparent 2px, transparent 140px), radial-gradient(ellipse at 50% 30%, #23190f 0%, #0b0a08 70%)'
      }}
    >
      <span className="uppercase-label" style={{ letterSpacing: '0.4em' }}>
        Case File No. 004 &mdash; Missing Courier
      </span>

      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(4.5rem, 16vw, 9rem)',
          letterSpacing: '0.06em',
          margin: 0,
          color: 'var(--paper)',
          textShadow: '0 0 40px rgba(158,27,27,0.55), 0 2px 0 #000',
          animation: 'flicker 7s infinite'
        }}
      >
        Alibi
      </h1>

      <p
        style={{
          fontFamily: 'var(--font-mono)',
          color: 'var(--paper-dim)',
          maxWidth: '34ch',
          lineHeight: 1.6,
          margin: 0
        }}
      >
        Four suspects. One vanished courier. Every word you say to them, they
        remember &mdash; whether it was true or not.
      </p>

      <span className="uppercase-label" style={{ marginTop: '0.5rem' }}>
        Choose a case difficulty
      </span>

      <div
        style={{
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          justifyContent: 'center',
          maxWidth: 720
        }}
      >
        {DIFFICULTIES.map((d) => {
          const isStarting = starting === d.level
          const disabled = starting !== null
          return (
            <button
              key={d.level}
              type="button"
              disabled={disabled}
              onClick={() => startCase(d.level)}
              style={{
                fontFamily: 'var(--font-mono)',
                minWidth: 190,
                textAlign: 'left',
                padding: '1rem 1.2rem',
                cursor: disabled ? 'default' : 'pointer',
                background: 'var(--bg-panel)',
                color: 'var(--paper)',
                border: `1px solid ${isStarting ? 'var(--amber)' : 'var(--accent)'}`,
                opacity: disabled && !isStarting ? 0.5 : 1
              }}
            >
              <span
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline'
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.5rem',
                    letterSpacing: '0.05em'
                  }}
                >
                  {d.label}
                </span>
                <span style={{ color: 'var(--amber)', fontSize: '0.8rem' }}>+{d.points} pts</span>
              </span>
              <span
                style={{
                  display: 'block',
                  marginTop: 6,
                  fontSize: '0.72rem',
                  color: 'var(--paper-faint)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em'
                }}
              >
                {isStarting ? 'Seeding the case…' : d.blurb}
              </span>
            </button>
          )
        })}
      </div>

      {error && (
        <p role="alert" style={{ color: 'var(--accent-bright)', fontFamily: 'var(--font-mono)', margin: 0 }}>
          {error}
        </p>
      )}

      <a
        href="/setup"
        className="uppercase-label"
        style={{ marginTop: '0.5rem', color: 'var(--paper-dim)', textDecoration: 'none' }}
      >
        First run? Check your local setup &rarr;
      </a>
    </main>
  )
}
