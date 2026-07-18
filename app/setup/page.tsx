'use client'

import { useCallback, useEffect, useState } from 'react'

interface ServiceStatus {
  id: string
  label: string
  required: boolean
  configured: boolean
  reachable: boolean | null
  detail: string
  fixCommand?: string
}

interface HealthResponse {
  services: ServiceStatus[]
  playable: boolean
}

type Dot = { color: string; text: string }

function statusDot(s: ServiceStatus): Dot {
  if (s.reachable === true) return { color: 'var(--amber)', text: 'Connected' }
  if (s.reachable === false) return { color: 'var(--accent-bright)', text: 'Not reachable' }
  // reachable === null
  if (!s.configured) return { color: 'var(--paper-faint)', text: 'Not configured' }
  return { color: 'var(--paper-dim)', text: 'Ready (login-based)' }
}

export default function SetupPage() {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/health', { cache: 'no-store' })
      setHealth(res.ok ? ((await res.json()) as HealthResponse) : null)
    } catch {
      setHealth(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const services = health?.services ?? []

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
        <header style={{ textAlign: 'center' }}>
          <span className="uppercase-label" style={{ display: 'block' }}>
            Everything runs on your machine
          </span>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2.2rem, 7vw, 3.5rem)',
              letterSpacing: '0.05em',
              margin: '0.25rem 0 0',
              color: 'var(--paper)',
              borderBottom: '2px solid var(--accent)',
              paddingBottom: '0.6rem',
              display: 'inline-block'
            }}
          >
            System Check
          </h1>
        </header>

        {loading && !health ? (
          <p style={{ textAlign: 'center', color: 'var(--paper-dim)', fontFamily: 'var(--font-mono)' }}>
            Probing local services…
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            {services.map((s) => {
              const dot = statusDot(s)
              return (
                <div
                  key={s.id}
                  style={{
                    background: 'var(--bg-panel)',
                    border: '1px solid var(--line)',
                    borderLeft: `3px solid ${dot.color}`,
                    padding: '1rem 1.2rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.4rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                      <span style={{ width: 9, height: 9, borderRadius: '50%', background: dot.color, boxShadow: `0 0 8px ${dot.color}` }} />
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', letterSpacing: '0.03em', color: 'var(--paper)' }}>
                        {s.label}
                      </span>
                    </span>
                    <span className="uppercase-label" style={{ color: dot.color }}>
                      {s.required ? dot.text : `${dot.text} · optional`}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--paper-dim)' }}>{s.detail}</p>
                  {s.reachable !== true && s.fixCommand && (
                    <code
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.78rem',
                        color: 'var(--amber)',
                        background: 'rgba(0,0,0,0.35)',
                        border: '1px solid var(--line)',
                        padding: '0.4rem 0.6rem',
                        overflowX: 'auto'
                      }}
                    >
                      $ {s.fixCommand}
                    </code>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => void refresh()}
            style={{
              fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              fontSize: '0.78rem',
              color: 'var(--paper)',
              background: 'transparent',
              border: '1px solid var(--amber)',
              padding: '0.6rem 1.3rem',
              cursor: 'pointer'
            }}
          >
            {loading ? 'Re-checking…' : 'Re-check'}
          </button>
          <a
            href="/"
            aria-disabled={!health?.playable}
            style={{
              fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              fontSize: '0.78rem',
              textDecoration: 'none',
              color: health?.playable ? 'var(--paper)' : 'var(--paper-faint)',
              background: health?.playable ? 'rgba(158,27,27,0.14)' : 'transparent',
              border: `1px solid ${health?.playable ? 'var(--accent)' : 'var(--line-strong)'}`,
              padding: '0.6rem 1.3rem',
              pointerEvents: health?.playable ? 'auto' : 'none'
            }}
          >
            {health?.playable ? 'Ready — to the case' : 'Start the required services first'}
          </a>
        </div>
      </div>
    </main>
  )
}
