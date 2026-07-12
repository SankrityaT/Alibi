'use client'

import { useState } from 'react'

export interface AccusePanelProps {
  suspects: { suspectId: string; name: string }[]
  movesUsed: number
}

interface AccuseRating {
  correct: boolean
  basePoints: number
  rank: string
  summary: string
}

interface AccuseResponse {
  rating?: AccuseRating
  culpritId?: string
  plantedMemoryClaim?: string
  explanation?: string
  error?: string
}

/**
 * The closing move: pick the culprit, optionally state the planted memory you
 * think they fabricated, and accuse. Posts to /api/accuse, which scores the case
 * against the active CaseFile and returns a Detective Rating + the real solution.
 * The result view reveals the rank, the engine's summary, and the full
 * explanation so the player learns how the memory trail resolved.
 */
export function AccusePanel({ suspects, movesUsed }: AccusePanelProps) {
  const [accusedCulpritId, setAccusedCulpritId] = useState(suspects[0]?.suspectId ?? '')
  const [accusedPlantedClaim, setAccusedPlantedClaim] = useState('')
  const [result, setResult] = useState<AccuseResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleAccuse() {
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/accuse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accusedCulpritId, accusedPlantedClaim, movesUsed })
      })
      const body = (await response.json()) as AccuseResponse

      if (!response.ok || !body.rating) {
        setError(typeof body.error === 'string' ? body.error : 'Accusation failed')
        return
      }

      setResult(body)
    } catch {
      setError('Could not reach the courthouse. Is the server running?')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section
      data-testid="accuse-panel"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        background: 'var(--bg-panel)',
        border: '1px solid var(--accent-bright)',
        padding: '1.1rem 1.3rem'
      }}
    >
      <p className="uppercase-label" style={{ margin: 0, color: 'var(--accent-bright)' }}>
        Make an Accusation
      </p>

      <label htmlFor="accuse-suspect" className="uppercase-label" style={{ fontSize: '0.62rem' }}>
        Who took it?
      </label>
      <select
        id="accuse-suspect"
        value={accusedCulpritId}
        onChange={(event) => setAccusedCulpritId(event.target.value)}
        style={{
          background: 'transparent',
          border: '1px solid var(--line-strong)',
          color: 'var(--paper)',
          fontSize: '0.95rem',
          padding: '0.45rem 0.5rem'
        }}
      >
        {suspects.map((suspect) => (
          <option key={suspect.suspectId} value={suspect.suspectId}>
            {suspect.name}
          </option>
        ))}
      </select>

      <label htmlFor="accuse-claim" className="uppercase-label" style={{ fontSize: '0.62rem' }}>
        What was the planted memory? (optional)
      </label>
      <input
        id="accuse-claim"
        value={accusedPlantedClaim}
        onChange={(event) => setAccusedPlantedClaim(event.target.value)}
        placeholder="The lie they seeded into memory"
        style={{
          background: 'transparent',
          border: 'none',
          borderBottom: '1px solid var(--line-strong)',
          color: 'var(--paper)',
          fontSize: '0.95rem',
          padding: '0.4rem 0.1rem',
          outline: 'none'
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button
          type="button"
          disabled={isSubmitting || !accusedCulpritId}
          onClick={() => void handleAccuse()}
          style={{
            fontFamily: 'var(--font-mono)',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            fontSize: '0.78rem',
            color: 'var(--accent-bright)',
            background: 'rgba(158,27,27,0.14)',
            border: '1px solid var(--accent-bright)',
            padding: '0.55rem 1.4rem',
            cursor: isSubmitting ? 'default' : 'pointer'
          }}
        >
          {isSubmitting ? 'Filing…' : 'Accuse'}
        </button>
        <span className="uppercase-label" style={{ fontSize: '0.62rem', color: 'var(--paper-dim)' }}>
          {movesUsed} moves used
        </span>
      </div>

      {error && (
        <p
          role="alert"
          style={{
            fontFamily: 'var(--font-mono)',
            color: 'var(--accent-bright)',
            margin: 0,
            fontSize: '0.82rem'
          }}
        >
          {error}
        </p>
      )}

      {result?.rating && (
        <div
          data-testid="accuse-result"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--line)',
            borderLeft: `3px solid ${result.rating.correct ? 'var(--amber)' : 'var(--accent-bright)'}`,
            padding: '0.9rem 1.1rem'
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.6rem',
              letterSpacing: '0.05em',
              color: 'var(--paper)'
            }}
          >
            {result.rating.correct ? 'Case Closed' : 'Wrong Call'} — {result.rating.rank}
          </span>
          <span className="uppercase-label" style={{ color: 'var(--amber)' }}>
            {result.rating.basePoints} points
          </span>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--paper-dim)' }}>
            {result.rating.summary}
          </p>
          {result.explanation && (
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--paper-dim)' }}>
              {result.explanation}
            </p>
          )}
        </div>
      )}
    </section>
  )
}
