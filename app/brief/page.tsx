'use client'

import { useEffect, useState } from 'react'
import { portraitForSuspect } from '../../lib/station/portraits.js'

interface PublicSuspect {
  suspectId: string
  name: string
}

interface PublicCase {
  started: boolean
  title: string
  synopsis: string
  crime: string
  difficulty: 'easy' | 'medium' | 'hard'
  suspects: PublicSuspect[]
}

const POINTS: Record<string, number> = { easy: 10, medium: 20, hard: 30 }

export default function BriefPage() {
  const [caseInfo, setCaseInfo] = useState<PublicCase | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/case?t=${Date.now()}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled) setCaseInfo(data)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        padding: '3rem 1.5rem',
        background:
          'radial-gradient(circle at 50% 0%, rgba(212,149,46,0.10) 0%, transparent 45%), radial-gradient(ellipse at 50% 15%, #1a140c 0%, #0b0a08 70%)'
      }}
    >
      <div style={{ width: '100%', maxWidth: 720, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {loading && !caseInfo ? (
          <p style={{ textAlign: 'center', color: 'var(--paper-dim)', fontFamily: 'var(--font-mono)' }}>
            Opening the case file…
          </p>
        ) : !caseInfo ? (
          <p style={{ textAlign: 'center', color: 'var(--accent-bright)', fontFamily: 'var(--font-mono)' }}>
            No case loaded. <a href="/" style={{ color: 'var(--paper)' }}>Start one from the title screen.</a>
          </p>
        ) : (
          <>
            <header style={{ textAlign: 'center' }}>
              <span className="uppercase-label" style={{ display: 'block', letterSpacing: '0.35em' }}>
                Case File &mdash; {caseInfo.difficulty} &middot; {POINTS[caseInfo.difficulty] ?? 0} pts
              </span>
              <h1
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(2.4rem, 8vw, 4rem)',
                  letterSpacing: '0.04em',
                  margin: '0.35rem 0 0',
                  color: 'var(--paper)',
                  textShadow: '0 0 34px rgba(158,27,27,0.5)',
                  borderBottom: '2px solid var(--accent)',
                  paddingBottom: '0.5rem',
                  display: 'inline-block'
                }}
              >
                {caseInfo.title}
              </h1>
            </header>

            {/* The crime */}
            <section
              style={{
                background: 'var(--bg-panel)',
                border: '1px solid var(--line)',
                borderLeft: '3px solid var(--accent)',
                padding: '1.1rem 1.3rem'
              }}
            >
              <p className="uppercase-label" style={{ margin: '0 0 0.5rem', color: 'var(--accent-bright)' }}>
                The Crime
              </p>
              <p style={{ margin: '0 0 0.75rem', color: 'var(--paper)', fontSize: '1rem', lineHeight: 1.6 }}>
                {caseInfo.crime}
              </p>
              <p style={{ margin: 0, color: 'var(--paper-dim)', fontSize: '0.92rem', lineHeight: 1.6 }}>
                {caseInfo.synopsis}
              </p>
            </section>

            {/* Persons of interest */}
            <section>
              <p className="uppercase-label" style={{ margin: '0 0 0.75rem', color: 'var(--amber)' }}>
                Persons of Interest &mdash; {caseInfo.suspects.length}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.9rem' }}>
                {caseInfo.suspects.map((s) => (
                  <div
                    key={s.suspectId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.7rem',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--line)',
                      padding: '0.6rem 0.9rem',
                      minWidth: 180
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={portraitForSuspect(s.suspectId)}
                      alt={`Portrait of ${s.name}`}
                      width={40}
                      height={40}
                      style={{ imageRendering: 'pixelated', border: '1px solid var(--accent)', background: '#0b0a08' }}
                    />
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--paper)', fontSize: '0.95rem' }}>
                      {s.name}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Objective */}
            <section
              style={{
                background: 'var(--bg-panel)',
                border: '1px solid var(--line)',
                borderLeft: '3px solid var(--amber)',
                padding: '1.1rem 1.3rem'
              }}
            >
              <p className="uppercase-label" style={{ margin: '0 0 0.5rem', color: 'var(--amber)' }}>
                Your Objective
              </p>
              <p style={{ margin: 0, color: 'var(--paper-dim)', fontSize: '0.92rem', lineHeight: 1.65 }}>
                Interrogate each suspect, pull evidence from the world (CCTV, phone records, forensics),
                and use your Notebook to connect it. Every suspect remembers their real night &mdash; but{' '}
                <strong style={{ color: 'var(--paper)' }}>the culprit&rsquo;s memory hides one planted lie</strong>, an
                alibi that never happened. Name the culprit and expose the false memory they&rsquo;re hiding behind.
              </p>
            </section>

            <a
              href="/station"
              style={{
                alignSelf: 'center',
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
                letterSpacing: '0.2em',
                fontSize: '0.85rem',
                color: 'var(--paper)',
                textDecoration: 'none',
                background: 'rgba(158,27,27,0.14)',
                border: '1px solid var(--accent)',
                padding: '0.85rem 2.2rem',
                marginTop: '0.5rem'
              }}
            >
              Enter the Precinct &rarr;
            </a>
          </>
        )}
      </div>
    </main>
  )
}
