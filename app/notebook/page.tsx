'use client'

import { useState, type FormEvent } from 'react'

interface NotebookCitation {
  id: string
  content: string
  source: string
  containerTag: string
}

interface NotebookResponse {
  query: string
  answer: string
  citations: NotebookCitation[]
}

export default function NotebookPage() {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<NotebookResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [memoryEnabled, setMemoryEnabled] = useState(true)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/notebook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, memoryEnabled })
      })
      const body = await response.json()

      if (!response.ok) {
        setError(typeof body.error === 'string' ? body.error : 'Something went wrong')
        return
      }

      setResult(body as NotebookResponse)
    } catch {
      setError('Could not reach the server. Is it running?')
    } finally {
      setIsLoading(false)
    }
  }

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
      <div style={{ width: '100%', maxWidth: 760, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <header style={{ textAlign: 'center' }}>
          <span className="uppercase-label" style={{ display: 'block' }}>
            Cross-Suspect Synthesis
          </span>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2.5rem, 8vw, 4rem)',
              letterSpacing: '0.05em',
              margin: '0.25rem 0 0',
              color: 'var(--paper)',
              borderBottom: '2px solid var(--accent)',
              paddingBottom: '0.6rem',
              display: 'inline-block'
            }}
          >
            Case Notebook
          </h1>
        </header>

        <p style={{ margin: 0, textAlign: 'center', color: 'var(--paper-dim)', fontSize: '0.95rem' }}>
          Ask one question. The notebook searches your case notes and every suspect&apos;s memory,
          then stitches the facts into a single answer with citations back to each source.
        </p>

        {/* Memory ON/OFF toggle — with memory off the notebook has nothing to
            synthesize, which is exactly the point. */}
        <button
          type="button"
          aria-pressed={memoryEnabled}
          onClick={() => setMemoryEnabled((v) => !v)}
          style={{
            alignSelf: 'center',
            fontFamily: 'var(--font-mono)',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            fontSize: '0.72rem',
            padding: '0.5rem 1.1rem',
            cursor: 'pointer',
            background: memoryEnabled ? 'transparent' : 'rgba(158,27,27,0.18)',
            color: memoryEnabled ? 'var(--amber)' : 'var(--accent-bright)',
            border: `1px solid ${memoryEnabled ? 'var(--amber)' : 'var(--accent-bright)'}`
          }}
        >
          {memoryEnabled ? '● Memory: ON' : '○ Memory: OFF — notebook has nothing to recall'}
        </button>

        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.6rem',
            background: 'var(--bg-panel)',
            border: '1px solid var(--line)',
            padding: '1.25rem 1.4rem'
          }}
        >
          <label htmlFor="notebook-query" className="uppercase-label">
            Ask the case notebook
          </label>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'stretch' }}>
            <input
              id="notebook-query"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Who contradicts each other about the 22:00 window?"
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                borderBottom: '1px solid var(--line-strong)',
                color: 'var(--paper)',
                fontSize: '1rem',
                padding: '0.5rem 0.1rem',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              disabled={isLoading}
              style={{
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                fontSize: '0.8rem',
                color: isLoading ? 'var(--paper-faint)' : 'var(--paper)',
                background: 'transparent',
                border: `1px solid ${isLoading ? 'var(--line-strong)' : 'var(--accent)'}`,
                padding: '0 1.4rem',
                cursor: isLoading ? 'default' : 'pointer'
              }}
            >
              {isLoading ? 'Synthesizing...' : 'Synthesize'}
            </button>
          </div>
        </form>

        {error && (
          <p
            role="alert"
            style={{
              fontFamily: 'var(--font-mono)',
              color: 'var(--accent-bright)',
              border: '1px solid var(--accent)',
              padding: '0.85rem 1.1rem',
              margin: 0,
              fontSize: '0.9rem'
            }}
          >
            {error}
          </p>
        )}

        {result && (
          <div
            style={{
              background:
                'radial-gradient(ellipse at 0% -30%, rgba(212,149,46,0.10), transparent 60%), var(--bg-elevated)',
              border: '1px solid var(--line)',
              borderLeft: '3px solid var(--accent)',
              padding: '1.1rem 1.3rem'
            }}
          >
            <span className="uppercase-label" style={{ display: 'block', marginBottom: 8 }}>
              Synthesis
            </span>
            <p
              data-testid="notebook-answer"
              style={{ margin: 0, color: 'var(--paper)', fontSize: '1rem', lineHeight: 1.6 }}
            >
              {result.answer}
            </p>
          </div>
        )}

        {result && result.citations.length > 0 && (
          <div
            data-testid="notebook-citations"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              background: 'var(--bg-panel)',
              border: '1px solid var(--line)',
              borderLeft: '3px solid var(--amber)',
              padding: '1rem 1.2rem'
            }}
          >
            <span className="uppercase-label" style={{ color: 'var(--amber)' }}>
              Citations
            </span>
            {result.citations.map((citation, index) => (
              <div key={citation.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.72rem',
                    letterSpacing: '0.08em',
                    color: 'var(--amber)'
                  }}
                >
                  [{index + 1}] {citation.source}
                </span>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--paper-dim)' }}>
                  {citation.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
