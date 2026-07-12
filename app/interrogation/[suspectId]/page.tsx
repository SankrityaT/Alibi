'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { DialogueBox } from '../../../components/interrogation/DialogueBox.js'
import { MemoryTracePanel } from '../../../components/interrogation/MemoryTracePanel.js'
import { EvidenceActions } from '../../../components/investigation/EvidenceActions.js'
import { AccusePanel } from '../../../components/case/AccusePanel.js'
import { portraitForSuspect, INVESTIGATOR_SPRITE } from '../../../lib/station/portraits.js'
import { useSpokenLine } from '../../../lib/tts/useSpokenLine.js'
import { useMicTranscription } from '../../../lib/stt/useMicTranscription.js'

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

type PanelId = 'evidence' | 'memory' | 'accuse' | null

export default function InterrogationPage({ params }: InterrogationPageProps) {
  const [question, setQuestion] = useState('')
  const [turns, setTurns] = useState<Turn[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [memoryEnabled, setMemoryEnabled] = useState(true)
  const [roster, setRoster] = useState<{ suspectId: string; name: string }[]>([])
  const [evidenceFacts, setEvidenceFacts] = useState<string[]>([])
  const [panel, setPanel] = useState<PanelId>(null)
  // Drives the suspect's "speaking" animation for a beat after each answer,
  // even when TTS is off, so the character visibly reacts.
  const [speakingViz, setSpeakingViz] = useState(false)
  const transcriptEndRef = useRef<HTMLDivElement>(null)

  const { speak, isSpeaking, ttsAvailable } = useSpokenLine()
  const { isRecording, sttAvailable, start: startMic, stop: stopMic } = useMicTranscription()

  useEffect(() => {
    let cancelled = false
    fetch(`/api/case?t=${Date.now()}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data && Array.isArray(data.suspects)) {
          setRoster(
            data.suspects.map((s: { suspectId: string; name: string }) => ({
              suspectId: s.suspectId,
              name: s.name
            }))
          )
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    // Optional-call: jsdom (tests) doesn't implement scrollIntoView.
    transcriptEndRef.current?.scrollIntoView?.({ behavior: 'smooth' })
  }, [turns])

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
      setSpeakingViz(true)
      setTimeout(() => setSpeakingViz(false), 2600)
      void speak(result.answer, { suspectId: params.suspectId }).catch(() => {})
    } catch {
      setError('Could not reach the server. Is it running?')
    } finally {
      setIsLoading(false)
    }
  }

  const latestTurn = turns.length > 0 ? turns[turns.length - 1] : null
  const movesUsed = turns.length + evidenceFacts.length
  const name = displayName(params.suspectId)
  const speaking = speakingViz || isSpeaking

  return (
    <main className="scene">
      {/* --- Room --- */}
      <div className="scene__wall">
        <div className="scene__mirror" />
      </div>
      <div className="scene__lamp" />
      <div className="scene__cone" />
      <div className="scene__table" />
      <div className="scene__tablespot" />

      <div className={`suspect${speaking ? ' suspect--speaking' : ''}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="suspect__portrait"
          src={portraitForSuspect(params.suspectId)}
          alt={`Portrait of ${name}`}
        />
        <span className="suspect__plate">{name}</span>
      </div>

      <div className="investigator" aria-hidden="true" />
      <div className="scene__grain-scan" aria-hidden="true" />
      <div className="scene__vignette" aria-hidden="true" />

      {/* --- Top HUD --- */}
      <div className="hud">
        <a className="hud__btn" href="/station">
          &larr; Station
        </a>
        <span className="uppercase-label">Interrogation Room &mdash; {name}</span>
        <span style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span
            data-testid="tts-indicator"
            aria-live="polite"
            className="uppercase-label"
            style={{ color: !ttsAvailable ? 'var(--paper-faint)' : isSpeaking ? 'var(--accent-bright)' : 'var(--paper-dim)' }}
          >
            {!ttsAvailable ? '○ Voice muted' : isSpeaking ? '● Speaking' : '○ Voice ready'}
          </span>
          <button
            type="button"
            aria-pressed={memoryEnabled}
            onClick={() => setMemoryEnabled((v) => !v)}
            className={`hud__btn ${memoryEnabled ? 'hud__btn--mem-on' : 'hud__btn--mem-off'}`}
          >
            {memoryEnabled ? '● Memory: ON' : '○ Memory: OFF'}
          </button>
        </span>
      </div>

      {/* --- Dialogue transcript (the scrolling exchange) --- */}
      <div className="dialogue-scene">
        {latestTurn ? (
          <div
            data-testid="transcript"
            style={{ maxHeight: '30vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}
          >
            {turns.map((turn, i) => (
              <div key={turn.id}>
                <p className="dialogue-scene__you">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="dlg-avatar" src={INVESTIGATOR_SPRITE} alt="" aria-hidden="true" />
                  You: {turn.question}
                </p>
                <div className="dialogue-scene__who">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="dlg-avatar" src={portraitForSuspect(params.suspectId)} alt="" aria-hidden="true" />
                  {name}
                </div>
                {i === turns.length - 1 ? (
                  <DialogueBox text={turn.answer} />
                ) : (
                  <div data-testid="dialogue-box" data-full-text={turn.answer} className="dialogue-box-static">
                    {turn.answer}
                  </div>
                )}
              </div>
            ))}
            <div ref={transcriptEndRef} />
          </div>
        ) : (
          <p style={{ margin: 0, color: 'var(--paper-dim)', fontSize: '0.9rem' }}>
            {name} sits across the table, waiting. Ask your first question.
          </p>
        )}
      </div>

      {/* --- Ask bar --- */}
      <form className="askbar" onSubmit={handleSubmit}>
        <input
          id="question"
          aria-label="Ask a question"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Where were you at 22:10?"
        />
        {sttAvailable && (
          <button
            type="button"
            onClick={handleMicToggle}
            aria-label={isRecording ? 'Stop recording' : 'Record question'}
            aria-pressed={isRecording}
            data-testid="mic-button"
            style={{
              fontFamily: 'var(--font-mono)',
              color: isRecording ? 'var(--accent-bright)' : 'var(--paper)',
              background: isRecording ? 'rgba(158,27,27,0.18)' : 'transparent',
              border: `1px solid ${isRecording ? 'var(--accent-bright)' : 'var(--line-strong)'}`,
              padding: '0 0.9rem',
              cursor: 'pointer'
            }}
          >
            {isRecording ? '● Rec' : '🎤'}
          </button>
        )}
        <button type="submit" disabled={isLoading}>
          {isLoading ? '…' : 'Ask'}
        </button>
      </form>

      {error && (
        <p
          role="alert"
          style={{
            position: 'absolute',
            bottom: '11.5rem',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 25,
            fontFamily: 'var(--font-mono)',
            color: 'var(--accent-bright)',
            background: 'rgba(6,6,10,0.9)',
            border: '1px solid var(--accent)',
            padding: '0.6rem 1rem',
            margin: 0,
            fontSize: '0.85rem'
          }}
        >
          {error}
        </p>
      )}

      {/* --- Right-edge tabs --- */}
      <div className="sidetabs">
        <button type="button" className="sidetab" onClick={() => setPanel(panel === 'evidence' ? null : 'evidence')}>
          Evidence
        </button>
        <button type="button" className="sidetab sidetab--accent" onClick={() => setPanel(panel === 'memory' ? null : 'memory')}>
          Memory
        </button>
        <a className="sidetab" href="/notebook">
          Notebook
        </a>
        <button type="button" className="sidetab sidetab--danger" onClick={() => setPanel(panel === 'accuse' ? null : 'accuse')}>
          Accusation
        </button>
      </div>

      {/* --- Slide-in panels (always mounted so evidence/accuse stay wired) --- */}
      <aside className={`slidepanel${panel === 'evidence' ? ' slidepanel--open' : ''}`}>
        <button type="button" className="slidepanel__close" onClick={() => setPanel(null)}>
          ✕
        </button>
        <h2 className="slidepanel__title">Evidence</h2>
        <EvidenceActions
          suspectId={params.suspectId}
          memoryEnabled={memoryEnabled}
          onFact={(fact) => setEvidenceFacts((prev) => [...prev, fact])}
        />
        {evidenceFacts.length > 0 && (
          <div
            data-testid="evidence-log"
            style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
          >
            <span className="uppercase-label" style={{ color: 'var(--amber)' }}>
              Evidence Log
            </span>
            {evidenceFacts.map((fact, index) => (
              <p key={index} style={{ margin: 0, fontSize: '0.88rem', color: 'var(--paper-dim)' }}>
                {fact}
              </p>
            ))}
          </div>
        )}
      </aside>

      <aside className={`slidepanel${panel === 'memory' ? ' slidepanel--open' : ''}`}>
        <button type="button" className="slidepanel__close" onClick={() => setPanel(null)}>
          ✕
        </button>
        <h2 className="slidepanel__title">Memory Trace</h2>
        <p style={{ color: 'var(--paper-dim)', fontSize: '0.82rem', marginTop: 0 }}>
          What {name} actually recalled behind that last answer &mdash; pulled live from Supermemory.
        </p>
        {latestTurn ? (
          <MemoryTracePanel query={latestTurn.query} retrievedMemories={latestTurn.retrievedMemories} />
        ) : (
          <p style={{ color: 'var(--paper-faint)', fontSize: '0.85rem' }}>Ask something first.</p>
        )}
      </aside>

      <aside className={`slidepanel${panel === 'accuse' ? ' slidepanel--open' : ''}`}>
        <button type="button" className="slidepanel__close" onClick={() => setPanel(null)}>
          ✕
        </button>
        <h2 className="slidepanel__title">Accuse</h2>
        <AccusePanel suspects={roster} movesUsed={movesUsed} />
      </aside>
    </main>
  )
}
