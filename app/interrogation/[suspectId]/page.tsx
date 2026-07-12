'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
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

// Per-suspect transcripts persist across switches for the session (a plain
// module Map, alive as long as the tab is). Switching to another suspect and
// back resumes exactly where you left off instead of wiping the conversation.
const transcriptStore = new Map<string, Turn[]>()

/** Test-only: clear persisted transcripts between test cases. */
export function __clearInterrogationTranscripts(): void {
  transcriptStore.clear()
}

type PanelId = 'evidence' | 'memory' | 'notebook' | 'accuse' | null

interface NotebookCitation {
  id: string
  content: string
  source: string
}
interface NotebookResult {
  query: string
  answer: string
  citations: NotebookCitation[]
}

export default function InterrogationPage({ params }: InterrogationPageProps) {
  const [question, setQuestion] = useState('')
  const [turns, setTurns] = useState<Turn[]>(() => transcriptStore.get(params.suspectId) ?? [])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [memoryEnabled, setMemoryEnabled] = useState(true)
  const [roster, setRoster] = useState<{ suspectId: string; name: string }[]>([])
  const [evidenceFacts, setEvidenceFacts] = useState<string[]>([])
  const [panel, setPanel] = useState<PanelId>(null)
  // Drives the suspect's "speaking" animation for a beat after each answer,
  // even when TTS is off, so the character visibly reacts.
  const [speakingViz, setSpeakingViz] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [suggestLoading, setSuggestLoading] = useState(false)
  const [notebookQuery, setNotebookQuery] = useState('')
  const [notebookResult, setNotebookResult] = useState<NotebookResult | null>(null)
  const [notebookLoading, setNotebookLoading] = useState(false)
  const router = useRouter()
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

  useEffect(() => {
    // On switching suspects, restore that suspect's saved conversation (or start
    // fresh) and reset the per-suspect UI, then fetch opening hints.
    const stored = transcriptStore.get(params.suspectId) ?? []
    setTurns(stored)
    setQuestion('')
    setSuggestions([])
    void fetchSuggestions(stored)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.suspectId])

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

  async function fetchSuggestions(contextTurns: Turn[]) {
    setSuggestLoading(true)
    try {
      const res = await fetch('/api/suggest-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          suspectId: params.suspectId,
          transcript: contextTurns.map((t) => ({ question: t.question, answer: t.answer }))
        })
      })
      const body = await res.json()
      if (Array.isArray(body.questions)) {
        setSuggestions(body.questions.filter((q: unknown): q is string => typeof q === 'string'))
      }
    } catch {
      // Hints are optional; silence failures.
    } finally {
      setSuggestLoading(false)
    }
  }

  async function askQuestion(text: string) {
    const q = text.trim()
    if (!q || isLoading) return
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/interrogate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suspectId: params.suspectId, question: q, memoryEnabled })
      })
      const body = await response.json()

      if (!response.ok) {
        setError(typeof body.error === 'string' ? body.error : 'Something went wrong')
        return
      }

      const result = body as InterrogateResponse
      const nextTurns: Turn[] = [
        ...turns,
        {
          id: turns.length,
          question: q,
          answer: result.answer,
          query: result.query,
          retrievedMemories: result.retrievedMemories
        }
      ]
      setTurns(nextTurns)
      transcriptStore.set(params.suspectId, nextTurns)
      setQuestion('')
      setSpeakingViz(true)
      setTimeout(() => setSpeakingViz(false), 2600)
      void speak(result.answer, { suspectId: params.suspectId }).catch(() => {})
      // Refresh hints against the updated conversation.
      void fetchSuggestions(nextTurns)
    } catch {
      setError('Could not reach the server. Is it running?')
    } finally {
      setIsLoading(false)
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void askQuestion(question)
  }

  async function handleNotebookSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!notebookQuery.trim() || notebookLoading) return
    setNotebookLoading(true)
    try {
      const res = await fetch('/api/notebook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: notebookQuery, memoryEnabled })
      })
      const body = await res.json()
      if (res.ok) setNotebookResult(body as NotebookResult)
    } catch {
      // Notebook is best-effort; leave the last result in place.
    } finally {
      setNotebookLoading(false)
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

      {/* --- Suspect switcher: jump between interrogations without leaving --- */}
      {roster.length > 1 && (
        <div className="suspect-switch" data-testid="suspect-switch">
          {roster.map((s) => {
            const active = s.suspectId === params.suspectId
            return (
              <button
                key={s.suspectId}
                type="button"
                className={`suspect-switch__btn${active ? ' suspect-switch__btn--active' : ''}`}
                aria-current={active ? 'true' : undefined}
                onClick={() => {
                  if (!active) router.push(`/interrogation/${s.suspectId}`)
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="suspect-switch__avatar" src={portraitForSuspect(s.suspectId)} alt="" aria-hidden="true" />
                {s.name}
              </button>
            )
          })}
        </div>
      )}

      {/* --- Conversation console: scrollable transcript + hints + ask bar,
          stacked so nothing overlaps and long answers scroll cleanly --- */}
      <div className="console">
        <div className="console__transcript" data-testid="transcript">
          {latestTurn ? (
            <>
              {turns.map((turn, i) => (
                <div key={turn.id} className="console__turn">
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
            </>
          ) : (
            <p className="console__empty">
              {name} sits across the table, waiting. Ask your first question.
            </p>
          )}
        </div>

        {(suggestions.length > 0 || suggestLoading) && (
          <div className="console__hints" data-testid="question-hints">
            <span className="hintbar__label">Suggested</span>
            {suggestLoading && suggestions.length === 0 ? (
              <span className="hintbar__loading">reading the room…</span>
            ) : (
              suggestions.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  className="hint-chip"
                  disabled={isLoading}
                  onClick={() => askQuestion(s)}
                >
                  {s}
                </button>
              ))
            )}
          </div>
        )}

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
      </div>

      {error && (
        <p
          role="alert"
          style={{
            position: 'absolute',
            top: '4.5rem',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 30,
            fontFamily: 'var(--font-mono)',
            color: 'var(--accent-bright)',
            background: 'rgba(6,6,10,0.95)',
            border: '1px solid var(--accent)',
            padding: '0.6rem 1rem',
            margin: 0,
            fontSize: '0.85rem'
          }}
        >
          {error}
        </p>
      )}

      {/* --- Right-side tool dock --- */}
      <div className="sidetabs">
        <span className="sidetabs__title">Case Tools</span>
        <button
          type="button"
          className={`sidetab${panel === 'evidence' ? ' sidetab--active' : ''}`}
          onClick={() => setPanel(panel === 'evidence' ? null : 'evidence')}
        >
          <span className="sidetab__icon" aria-hidden="true">🔎</span> Evidence
        </button>
        <button
          type="button"
          className={`sidetab${panel === 'memory' ? ' sidetab--active' : ''}`}
          onClick={() => setPanel(panel === 'memory' ? null : 'memory')}
        >
          <span className="sidetab__icon" aria-hidden="true">🧠</span> Memory
        </button>
        <button
          type="button"
          className={`sidetab${panel === 'notebook' ? ' sidetab--active' : ''}`}
          onClick={() => setPanel(panel === 'notebook' ? null : 'notebook')}
        >
          <span className="sidetab__icon" aria-hidden="true">📓</span> Notebook
        </button>
        <button
          type="button"
          className={`sidetab sidetab--danger${panel === 'accuse' ? ' sidetab--active' : ''}`}
          onClick={() => setPanel(panel === 'accuse' ? null : 'accuse')}
        >
          <span className="sidetab__icon" aria-hidden="true">⚖</span> Accusation
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

      <aside className={`slidepanel${panel === 'notebook' ? ' slidepanel--open' : ''}`}>
        <button type="button" className="slidepanel__close" onClick={() => setPanel(null)}>
          ✕
        </button>
        <h2 className="slidepanel__title">Notebook</h2>
        <p style={{ color: 'var(--paper-dim)', fontSize: '0.82rem', marginTop: 0 }}>
          Cross-reference everything you&rsquo;ve gathered &mdash; synthesized across every suspect and
          all the evidence.
        </p>
        <form onSubmit={handleNotebookSearch} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.9rem' }}>
          <input
            aria-label="Search your notebook"
            value={notebookQuery}
            onChange={(e) => setNotebookQuery(e.target.value)}
            placeholder="Who had a motive and no alibi?"
            style={{
              flex: 1,
              background: 'transparent',
              border: '1px solid var(--line-strong)',
              color: 'var(--paper)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.85rem',
              padding: '0.45rem 0.6rem',
              outline: 'none'
            }}
          />
          <button
            type="submit"
            disabled={notebookLoading}
            className="hud__btn"
            style={{ whiteSpace: 'nowrap' }}
          >
            {notebookLoading ? '…' : 'Search'}
          </button>
        </form>
        {notebookResult && (
          <div data-testid="notebook-result" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <p style={{ color: 'var(--paper)', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
              {notebookResult.answer}
            </p>
            {notebookResult.citations.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <span className="uppercase-label" style={{ color: 'var(--amber)' }}>
                  Sources &mdash; {notebookResult.citations.length}
                </span>
                {notebookResult.citations.map((c) => (
                  <p key={c.id} style={{ margin: 0, fontSize: '0.8rem', color: 'var(--paper-dim)', lineHeight: 1.5 }}>
                    <span style={{ color: 'var(--paper-faint)' }}>[{c.source}]</span> {c.content}
                  </p>
                ))}
              </div>
            )}
          </div>
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
