'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

type Difficulty = 'easy' | 'medium' | 'hard'

const DIFFICULTIES: { level: Difficulty; label: string; points: number; blurb: string }[] = [
  { level: 'easy', label: 'Easy', points: 10, blurb: '3 suspects · one planted memory' },
  { level: 'medium', label: 'Medium', points: 20, blurb: '4 suspects · a red herring in play' },
  { level: 'hard', label: 'Hard', points: 30, blurb: 'a decoy guiltier than the culprit' }
]

// Story-mode beats shown while the engine generates the case and Supermemory
// finishes indexing the seeded memories. They read like a case being assembled;
// the later beats explicitly cover the memory-indexing wait so the pause feels
// intentional rather than broken.
const LOADING_BEATS: string[] = [
  'Opening a fresh case file…',
  'Rounding up the suspects…',
  'Establishing the timeline…',
  "Planting the culprit's false alibi…",
  'Wiring the precinct cameras…',
  'Filing phone records and forensics…',
  'Letting the memories set in…',
  'Pouring the coffee. This one’s ugly.'
]

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export default function HomePage() {
  const router = useRouter()
  const [phase, setPhase] = useState<'idle' | 'loading'>('idle')
  const [chosen, setChosen] = useState<Difficulty | null>(null)
  const [beat, setBeat] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const cancelledRef = useRef(false)

  useEffect(() => () => { cancelledRef.current = true }, [])

  // Advance the story beats while loading.
  useEffect(() => {
    if (phase !== 'loading') return
    const id = setInterval(() => setBeat((b) => b + 1), 2200)
    return () => clearInterval(id)
  }, [phase])

  async function waitForMemoriesReady(maxMs = 45000) {
    const deadline = Date.now() + maxMs
    // Poll the readiness probe; fail-open so we never hang past the deadline.
    while (Date.now() < deadline && !cancelledRef.current) {
      try {
        const r = await fetch(`/api/case-ready?t=${Date.now()}`, { cache: 'no-store' })
        const body = await r.json()
        if (body?.ready) return
      } catch {
        return
      }
      await sleep(1800)
    }
  }

  async function startCase(difficulty: Difficulty) {
    setChosen(difficulty)
    setPhase('loading')
    setBeat(0)
    setError(null)
    // Hard ceiling so a wedged generation can never leave the loading screen
    // spinning forever — the server bounds generation to 60s + falls back, so
    // 120s here is pure backstop before we bail to a retry.
    const controller = new AbortController()
    const bailTimer = setTimeout(() => controller.abort(), 120_000)
    try {
      const response = await fetch('/api/new-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ difficulty }),
        signal: controller.signal
      })
      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        setError(typeof body.error === 'string' ? body.error : 'Could not start the case.')
        setPhase('idle')
        return
      }
      try {
        sessionStorage.setItem('alibi:caseStartedAt', String(Date.now()))
      } catch {
        // sessionStorage unavailable — the solve-time bonus is optional.
      }
      // Hold on the loading screen until the suspects' memories are actually
      // searchable, so the first interrogation is never empty.
      await waitForMemoriesReady()
      if (!cancelledRef.current) router.push('/brief')
    } catch (err) {
      const timedOut = err instanceof DOMException && err.name === 'AbortError'
      setError(
        timedOut
          ? 'The case took too long to assemble. Please try again.'
          : 'Could not reach the server. Is it running?'
      )
      setPhase('idle')
    } finally {
      clearTimeout(bailTimer)
    }
  }

  if (phase === 'loading') {
    return <LoadingScreen beat={beat} difficulty={chosen} />
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
        Four suspects, each with a real memory of that night. One of them buried
        a lie in theirs. Find it &mdash; before their story becomes the truth.
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
        {DIFFICULTIES.map((d) => (
          <button
            key={d.level}
            type="button"
            onClick={() => startCase(d.level)}
            style={{
              fontFamily: 'var(--font-mono)',
              minWidth: 190,
              textAlign: 'left',
              padding: '1rem 1.2rem',
              cursor: 'pointer',
              background: 'var(--bg-panel)',
              color: 'var(--paper)',
              border: '1px solid var(--accent)'
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
              {d.blurb}
            </span>
          </button>
        ))}
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

function LoadingScreen({ beat, difficulty }: { beat: number; difficulty: Difficulty | null }) {
  const line = LOADING_BEATS[Math.min(beat, LOADING_BEATS.length - 1)]
  return (
    <main
      role="status"
      aria-live="polite"
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '2rem',
        padding: '2rem',
        overflow: 'hidden',
        position: 'relative',
        background: 'radial-gradient(ellipse at 50% 35%, #1a130b 0%, #080705 72%)'
      }}
    >
      {/* slow searchlight sweep */}
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
      <div className="scene__grain-scan" aria-hidden="true" />

      <span className="uppercase-label" style={{ letterSpacing: '0.4em', color: 'var(--accent-bright)' }}>
        {difficulty ? `${difficulty} case` : 'New case'} &mdash; assembling
      </span>

      {/* case-file stamp */}
      <div
        style={{
          position: 'relative',
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(3rem, 11vw, 6rem)',
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
            fontSize: '0.9rem',
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

      {/* evidence-tape progress bar */}
      <div
        aria-hidden="true"
        style={{
          width: 'min(420px, 80vw)',
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
          fontSize: '1rem',
          minHeight: '1.4em',
          margin: 0,
          zIndex: 1
        }}
      >
        {line}
        <span className="blink-cursor">▋</span>
      </p>

      <p
        style={{
          fontFamily: 'var(--font-mono)',
          color: 'var(--paper-faint)',
          fontSize: '0.75rem',
          maxWidth: '40ch',
          textAlign: 'center',
          margin: 0,
          zIndex: 1
        }}
      >
        The suspects are learning what they remember. This takes a moment &mdash;
        it&rsquo;s what makes them lie convincingly.
      </p>
    </main>
  )
}
