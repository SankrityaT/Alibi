//created by kinjal
'use client'

import { DIFFICULTIES, LOADING_BEATS, type Difficulty } from '../../lib/case/useStartCase.js'

export interface StartCaseOverlayProps {
  open: boolean
  onClose: () => void
  phase: 'idle' | 'loading'
  chosen: Difficulty | null
  status: 'assembling' | 'indexing'
  elapsed: number
  error: string | null
  aiGenerate: boolean
  setAiGenerate: (updater: (v: boolean) => boolean) => void
  startCase: (difficulty: Difficulty) => void
}

export function StartCaseOverlay({
  open,
  onClose,
  phase,
  chosen,
  status,
  elapsed,
  error,
  aiGenerate,
  setAiGenerate,
  startCase
}: StartCaseOverlayProps) {
  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Start a case"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        background: 'rgba(8,7,5,0.86)',
        backdropFilter: 'blur(3px)'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && phase === 'idle') onClose()
      }}
    >
      {phase === 'loading' ? (
        <LoadingCard elapsed={elapsed} status={status} difficulty={chosen} />
      ) : (
        <div
          style={{
            width: 'min(560px, 100%)',
            background: 'var(--bg-panel)',
            border: '1px solid var(--line-strong)',
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            position: 'relative'
          }}
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              position: 'absolute',
              top: '0.9rem',
              right: '0.9rem',
              background: 'transparent',
              border: 'none',
              color: 'var(--paper-dim)',
              fontFamily: 'var(--font-mono)',
              fontSize: '1.1rem',
              cursor: 'pointer',
              lineHeight: 1
            }}
          >
            ×
          </button>

          <div>
            <span className="uppercase-label" style={{ letterSpacing: '0.3em' }}>
              Case File No. 004 &mdash; Missing Courier
            </span>
            <p
              style={{
                fontFamily: 'var(--font-mono)',
                color: 'var(--paper-dim)',
                marginTop: '0.75rem',
                lineHeight: 1.6
              }}
            >
              Four suspects, each with a real memory of that night. One of them
              buried a lie in theirs. Find it &mdash; before their story becomes
              the truth.
            </p>
          </div>

          <span className="uppercase-label">Choose a case difficulty</span>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {DIFFICULTIES.map((d) => (
              <button
                key={d.level}
                type="button"
                onClick={() => startCase(d.level)}
                style={{
                  fontFamily: 'var(--font-mono)',
                  minWidth: 170,
                  flex: '1 1 170px',
                  textAlign: 'left',
                  padding: '1rem 1.2rem',
                  cursor: 'pointer',
                  background: 'var(--bg-panel)',
                  color: 'var(--paper)',
                  border: '1px solid var(--accent)'
                }}
              >
                <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '1.4rem',
                      letterSpacing: '0.05em'
                    }}
                  >
                    {d.label}
                  </span>
                  <span style={{ color: 'var(--amber)', fontSize: '0.78rem' }}>+{d.points} pts</span>
                </span>
                <span
                  style={{
                    display: 'block',
                    marginTop: 6,
                    fontSize: '0.7rem',
                    color: 'var(--paper-faint)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em'
                  }}
                >
                  {d.blurb}
                </span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setAiGenerate((v) => !v)}
            aria-pressed={aiGenerate}
            style={{
              alignSelf: 'flex-start',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
              letterSpacing: '0.06em',
              color: aiGenerate ? 'var(--amber)' : 'var(--paper-faint)',
              background: 'transparent',
              border: `1px solid ${aiGenerate ? 'var(--amber)' : 'var(--line-strong)'}`,
              borderRadius: 999,
              padding: '0.4rem 0.9rem',
              cursor: 'pointer'
            }}
          >
            <span aria-hidden="true">{aiGenerate ? '☑' : '☐'}</span>
            🎲 Generate a brand-new case with AI (slower)
          </button>

          {error && (
            <p role="alert" style={{ color: 'var(--accent-bright)', fontFamily: 'var(--font-mono)', margin: 0 }}>
              {error}
            </p>
          )}

          <a
            href="/setup"
            className="uppercase-label"
            style={{ color: 'var(--paper-dim)', textDecoration: 'none' }}
          >
            First run? Check your local setup &rarr;
          </a>
        </div>
      )}
    </div>
  )
}

function LoadingCard({
  elapsed,
  status,
  difficulty
}: {
  elapsed: number
  status: 'assembling' | 'indexing'
  difficulty: Difficulty | null
}) {
  const beat = Math.floor(elapsed / 2.5)
  const line = LOADING_BEATS[Math.min(beat, LOADING_BEATS.length - 1)]
  const phaseLabel = status === 'assembling' ? 'Assembling the case file' : 'Waking the suspects’ memories'
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        width: 'min(560px, 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1.5rem',
        padding: '3rem 2rem',
        background: 'var(--bg-panel)',
        border: '1px solid var(--line-strong)',
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: '-30%',
          background:
            'conic-gradient(from 0deg at 50% 40%, transparent 0deg, rgba(212,149,46,0.10) 24deg, transparent 60deg)',
          animation: 'sweep 6s linear infinite',
          pointerEvents: 'none'
        }}
      />

      <span className="uppercase-label" style={{ letterSpacing: '0.4em', color: 'var(--accent-bright)' }}>
        {difficulty ? `${difficulty} case` : 'New case'} &mdash; {status}
      </span>

      <div
        style={{
          position: 'relative',
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(2.4rem, 8vw, 3.6rem)',
          letterSpacing: '0.05em',
          color: 'var(--paper)',
          textShadow: '0 0 34px rgba(158,27,27,0.5)',
          zIndex: 1
        }}
      >
        CASE FILE
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '-0.6rem',
            right: '-1.4rem',
            transform: 'rotate(-14deg)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.7rem',
            letterSpacing: '0.25em',
            color: 'var(--accent-bright)',
            border: '2px solid var(--accent-bright)',
            padding: '0.2rem 0.5rem',
            opacity: 0.9,
            animation: 'flicker 3s infinite'
          }}
        >
          ACTIVE
        </span>
      </div>

      <div
        aria-hidden="true"
        style={{
          width: 'min(360px, 80vw)',
          height: 6,
          background: 'rgba(232,223,200,0.08)',
          borderRadius: 3,
          overflow: 'hidden',
          zIndex: 1
        }}
      >
        <div
          style={{
            height: '100%',
            width: '38%',
            background: 'linear-gradient(90deg, transparent, var(--amber), transparent)',
            animation: 'slide 1.4s ease-in-out infinite'
          }}
        />
      </div>

      <p
        style={{
          fontFamily: 'var(--font-mono)',
          color: 'var(--paper)',
          fontSize: '0.95rem',
          minHeight: '1.4em',
          margin: 0,
          zIndex: 1,
          textAlign: 'center'
        }}
      >
        {line}
        <span className="blink-cursor">▋</span>
      </p>

      <p
        aria-live="polite"
        style={{
          fontFamily: 'var(--font-mono)',
          color: 'var(--amber)',
          fontSize: '0.78rem',
          letterSpacing: '0.08em',
          margin: 0,
          zIndex: 1
        }}
      >
        ● {phaseLabel} &middot; {elapsed}s
        {elapsed >= 30 ? ' — hang tight, first case seeds the memories' : ''}
      </p>
    </div>
  )
}
