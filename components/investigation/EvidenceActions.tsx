'use client'

import { useState } from 'react'
import type { VerbKind } from '../../lib/investigate/verbs.js'

export interface EvidenceActionsProps {
  suspectId: string
  onFact: (fact: string) => void
  // Honors the Memory ON/OFF toggle: when false, the investigate route swaps in
  // a no-op memory client so pulls/presents don't touch Supermemory either —
  // keeping the "prove it needs Supermemory" demo consistent across every verb.
  memoryEnabled?: boolean
}

// The UI button id. 'present' is a friendlier label for the 'present-evidence'
// verb; verbKindFor() maps it back to the real VerbKind sent to the API.
type ButtonId = 'cctv' | 'phone' | 'forensics' | 'present'

interface VerbButton {
  kind: ButtonId
  label: string
  hint: string
}

// The four investigation verbs, in the order a detective typically reaches for
// them: pull the world's evidence first, then confront the suspect with it.
const VERB_BUTTONS: VerbButton[] = [
  { kind: 'cctv', label: 'CCTV', hint: 'Pull camera footage into your notebook' },
  { kind: 'phone', label: 'Phone', hint: 'Pull phone records into your notebook' },
  { kind: 'forensics', label: 'Forensics', hint: 'Pull forensic findings into your notebook' },
  { kind: 'present', label: 'Present', hint: 'Confront the suspect with this fact' }
]

// The Present button carries the label "Present" but drives the
// 'present-evidence' verb kind.
function verbKindFor(button: VerbButton): VerbKind {
  return button.kind === 'present' ? 'present-evidence' : button.kind
}

interface InvestigateResponse {
  fact?: string
  error?: string
}

/**
 * The non-dialogue investigation panel. Pull verbs (CCTV/phone/forensics) send
 * the typed detail as a search query; the API summarizes matching world
 * evidence into a fact and files it in the detective's memory. Present-evidence
 * sends the detail as the fact to plant in the suspect's memory so their next
 * line reacts. In every case the returned fact is handed back via onFact so the
 * page can surface it (e.g. in the transcript or notebook).
 */
export function EvidenceActions({ suspectId, onFact, memoryEnabled = true }: EvidenceActionsProps) {
  const [detail, setDetail] = useState('')
  const [pending, setPending] = useState<VerbKind | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function runVerbRequest(button: VerbButton) {
    const kind = verbKindFor(button)
    setPending(kind)
    setError(null)

    try {
      const response = await fetch('/api/investigate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind,
          suspectId,
          memoryEnabled,
          // Pull verbs read this as a search query; present-evidence reads it as
          // the fact to plant. Sending both keeps the client dumb and the API
          // authoritative about which field it needs.
          query: detail,
          location: detail,
          fact: detail
        })
      })
      const body = (await response.json()) as InvestigateResponse

      if (!response.ok || typeof body.fact !== 'string') {
        setError(typeof body.error === 'string' ? body.error : 'Investigation failed')
        return
      }

      onFact(body.fact)
      if (kind === 'present-evidence') {
        setDetail('')
      }
    } catch {
      setError('Could not reach the evidence room. Is the server running?')
    } finally {
      setPending(null)
    }
  }

  return (
    <section
      data-testid="evidence-actions"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        background: 'var(--bg-panel)',
        border: '1px solid var(--line)',
        padding: '1.1rem 1.3rem'
      }}
    >
      <p className="uppercase-label" style={{ margin: 0, color: 'var(--amber)' }}>
        Investigate
      </p>

      <label htmlFor="evidence-detail" className="uppercase-label" style={{ fontSize: '0.62rem' }}>
        Detail (search terms, or the fact to present)
      </label>
      <input
        id="evidence-detail"
        value={detail}
        onChange={(event) => setDetail(event.target.value)}
        placeholder="e.g. atrium 21:30, or 'you badged in at 21:52'"
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

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
        {VERB_BUTTONS.map((button) => {
          const kind = verbKindFor(button)
          const isPending = pending === kind
          const isPresent = button.kind === 'present'
          return (
            <button
              key={button.kind}
              type="button"
              title={button.hint}
              disabled={pending !== null}
              onClick={() => void runVerbRequest(button)}
              style={{
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                fontSize: '0.72rem',
                padding: '0.5rem 1rem',
                cursor: pending !== null ? 'default' : 'pointer',
                color: isPresent ? 'var(--accent-bright)' : 'var(--paper)',
                background: isPresent ? 'rgba(158,27,27,0.12)' : 'transparent',
                border: `1px solid ${isPresent ? 'var(--accent-bright)' : 'var(--accent)'}`,
                opacity: pending !== null && !isPending ? 0.5 : 1
              }}
            >
              {isPending ? '…' : button.label}
            </button>
          )
        })}
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
    </section>
  )
}
