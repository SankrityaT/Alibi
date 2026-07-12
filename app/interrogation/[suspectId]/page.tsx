'use client'

import { useState, type FormEvent } from 'react'
import { DialogueBox } from '../../../components/interrogation/DialogueBox.js'
import { MemoryTracePanel } from '../../../components/interrogation/MemoryTracePanel.js'
import { EvidenceActions } from '../../../components/investigation/EvidenceActions.js'
import { AccusePanel } from '../../../components/case/AccusePanel.js'
import { useSpokenLine } from '../../../lib/tts/useSpokenLine.js'
import { useMicTranscription } from '../../../lib/stt/useMicTranscription.js'
import { fallbackCase } from '../../../content/cases/fallbackCase.js'

interface RetrievedMemory {
  id: string
  content: string
}

interface InterrogateResponse {
  answer: string
  query: string
  retrievedMemories: RetrievedMemory[]
}

interface Turn {
  id: number
  question: string
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
  const [turns, setTurns] = useState<Turn[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [memoryEnabled, setMemoryEnabled] = useState(true)
  // Facts surfaced by the non-dialogue investigation verbs (CCTV/phone/forensics
  // pulls and evidence presented to the suspect). Pull-verb facts are also
  // written into the detective's memory server-side for the notebook and rating;
  // this local log just gives the player immediate feedback.
  const [evidenceFacts, setEvidenceFacts] = useState<string[]>([])
  // Speaks each new suspect answer aloud in that suspect's voice. Degrades to
  // silence (ttsAvailable=false) when no local Kokoro server is running.
  const { speak, isSpeaking, ttsAvailable } = useSpokenLine()
  // Push-to-talk mic: the player may optionally speak their question. A resolved
  // transcript is dropped into the question field; on any failure the hook
  // flips sttAvailable=false and the button hides, so typing stays the fallback.
  const { isRecording, sttAvailable, start: startMic, stop: stopMic } = useMicTranscription()

  async function handleMicToggle() {
    if (isRecording) {
      const transcript = await stopMic()
      if (transcript && transcript.trim().length > 0) {
        setQuestion(transcript)
      }
    } else {
      await startMic()
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/interrogate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suspectId: params.suspectId, question, memoryEnabled })
      })
      const body = await response.json()

      if (!response.ok) {
        setError(typeof body.error === 'string' ? body.error : 'Something went wrong')
        return
      }

      const result = body as InterrogateResponse
      setTurns((prev) => [
        ...prev,
        {
          id: prev.length,
          question,
          answer: result.answer,
          query: result.query,
          retrievedMemories: result.retrievedMemories
        }
      ])
      setQuestion('')
      // Speak the suspect's line. The transcript shows the exact same text, so
      // a TTS failure never blocks reading — speak() resolves on its own and we
      // still guard against any rejection.
      void speak(result.answer, { suspectId: params.suspectId }).catch(() => {})
    } catch {
      setError('Could not reach the server. Is it running?')
    } finally {
      setIsLoading(false)
    }
  }

  const latestTurn = turns.length > 0 ? turns[turns.length - 1] : null
  // Every question and every investigation verb counts as a move; the rating
  // rewards closing the case efficiently. The suspect roster for the accusation
  // comes from the active demo case (the fallback) so the panel always lists a
  // full line-up even though this page is scoped to one suspect.
  const movesUsed = turns.length + evidenceFacts.length
  const roster = fallbackCase.suspects.map((s) => ({ suspectId: s.suspectId, name: s.name }))

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

        {/* Memory ON/OFF toggle — the demo's proof that the game needs Supermemory. */}
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
          {memoryEnabled ? '● Memory: ON' : '○ Memory: OFF — suspect forgets everything'}
        </button>

        {/* Voice indicator — suspects speak their lines via local TTS. When no
            Kokoro server is running the request 503s and this reads "muted"
            while the transcript keeps working. */}
        <span
          data-testid="tts-indicator"
          aria-live="polite"
          style={{
            alignSelf: 'center',
            fontFamily: 'var(--font-mono)',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            fontSize: '0.68rem',
            color: !ttsAvailable ? 'var(--paper-faint)' : isSpeaking ? 'var(--accent-bright)' : 'var(--paper-dim)'
          }}
        >
          {!ttsAvailable ? '○ Voice: muted' : isSpeaking ? '● Speaking…' : '○ Voice: ready'}
        </span>

        {turns.length > 0 && (
          <div
            data-testid="transcript"
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
          >
            {turns.map((turn) => (
              <div key={turn.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {/* Detective question */}
                <div
                  style={{
                    alignSelf: 'flex-end',
                    maxWidth: '80%',
                    background: 'var(--bg-panel)',
                    border: '1px solid var(--line)',
                    borderRight: '3px solid var(--amber)',
                    padding: '0.7rem 1rem',
                    fontSize: '0.9rem',
                    color: 'var(--paper-dim)'
                  }}
                >
                  <span className="uppercase-label" style={{ display: 'block', marginBottom: 4 }}>
                    You
                  </span>
                  {turn.question}
                </div>
                {/* Suspect answer */}
                <div
                  style={{
                    alignSelf: 'flex-start',
                    maxWidth: '85%',
                    background:
                      'radial-gradient(ellipse at 0% -30%, rgba(212,149,46,0.10), transparent 60%), var(--bg-elevated)',
                    border: '1px solid var(--line)',
                    borderLeft: '3px solid var(--accent)',
                    padding: '0.9rem 1.1rem'
                  }}
                >
                  <span className="uppercase-label" style={{ display: 'block', marginBottom: 6 }}>
                    {displayName(params.suspectId)}
                  </span>
                  <DialogueBox text={turn.answer} />
                </div>
              </div>
            ))}
          </div>
        )}

        <EvidenceActions
          suspectId={params.suspectId}
          onFact={(fact) => setEvidenceFacts((prev) => [...prev, fact])}
        />

        {evidenceFacts.length > 0 && (
          <div
            data-testid="evidence-log"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--line)',
              borderLeft: '3px solid var(--amber)',
              padding: '0.9rem 1.1rem'
            }}
          >
            <span className="uppercase-label" style={{ color: 'var(--amber)' }}>
              Evidence Log
            </span>
            {evidenceFacts.map((fact, index) => (
              <p key={index} style={{ margin: 0, fontSize: '0.9rem', color: 'var(--paper-dim)' }}>
                {fact}
              </p>
            ))}
          </div>
        )}

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
            {/* Push-to-talk mic — speak the question instead of typing it.
                Hidden when STT is unavailable (no whisper.cpp server / mic
                denied) so typing remains the fallback. */}
            {sttAvailable && (
              <button
                type="button"
                onClick={handleMicToggle}
                aria-label={isRecording ? 'Stop recording' : 'Record question'}
                aria-pressed={isRecording}
                data-testid="mic-button"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.9rem',
                  color: isRecording ? 'var(--accent-bright)' : 'var(--paper)',
                  background: isRecording ? 'rgba(158,27,27,0.18)' : 'transparent',
                  border: `1px solid ${isRecording ? 'var(--accent-bright)' : 'var(--line-strong)'}`,
                  padding: '0 1rem',
                  cursor: 'pointer'
                }}
              >
                {isRecording ? '● Rec' : '🎤'}
              </button>
            )}
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

        {latestTurn && (
          <MemoryTracePanel query={latestTurn.query} retrievedMemories={latestTurn.retrievedMemories} />
        )}

        <AccusePanel suspects={roster} movesUsed={movesUsed} />
      </div>
    </main>
  )
}
