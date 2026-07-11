'use client'

import { useState, type FormEvent } from 'react'
import { DialogueBox } from '../../../components/interrogation/DialogueBox.js'
import { MemoryTracePanel } from '../../../components/interrogation/MemoryTracePanel.js'

interface RetrievedMemory {
  id: string
  content: string
}

interface InterrogateResponse {
  answer: string
  query: string
  retrievedMemories: RetrievedMemory[]
}

export interface InterrogationPageProps {
  params: { suspectId: string }
}

function displayName(suspectId: string): string {
  return suspectId.charAt(0).toUpperCase() + suspectId.slice(1)
}

export default function InterrogationPage({ params }: InterrogationPageProps) {
  const [question, setQuestion] = useState('')
  const [result, setResult] = useState<InterrogateResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/interrogate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suspectId: params.suspectId, question })
      })
      const body = await response.json()

      if (!response.ok) {
        setError(typeof body.error === 'string' ? body.error : 'Something went wrong')
        return
      }

      setResult(body as InterrogateResponse)
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
      <div style={{ width: '100%', maxWidth: 760, display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        <header style={{ textAlign: 'center' }}>
          <span className="uppercase-label" style={{ display: 'block' }}>
            Interrogation Room 1
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
            Suspect: {displayName(params.suspectId)}
          </h1>
        </header>

        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.6rem',
            background: 'var(--bg-panel)',
            border: '1px solid var(--line)',
            padding: '1.5rem 1.6rem'
          }}
        >
          <label htmlFor="question" className="uppercase-label">
            Ask a question
          </label>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'stretch' }}>
            <input
              id="question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Where were you at 22:10?"
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
              {isLoading ? 'Asking...' : 'Ask'}
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div
              style={{
                background:
                  'radial-gradient(ellipse at 50% -20%, rgba(212,149,46,0.12), transparent 60%), var(--bg-elevated)',
                border: '1px solid var(--line)',
                padding: '1.75rem 1.6rem'
              }}
            >
              <DialogueBox text={result.answer} />
            </div>
            <MemoryTracePanel query={result.query} retrievedMemories={result.retrievedMemories} />
          </div>
        )}
      </div>
    </main>
  )
}
