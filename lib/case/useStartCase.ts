//created by kinjal
'use client'

import { useEffect, useRef, useState } from 'react'
import { clearTranscripts } from '../interrogate/transcriptStore.js'

export type Difficulty = 'easy' | 'medium' | 'hard'

export const DIFFICULTIES: { level: Difficulty; label: string; points: number; blurb: string }[] = [
  { level: 'easy', label: 'Easy', points: 10, blurb: '3 suspects · one planted memory' },
  { level: 'medium', label: 'Medium', points: 20, blurb: '4 suspects · a red herring in play' },
  { level: 'hard', label: 'Hard', points: 30, blurb: 'a decoy guiltier than the culprit' }
]

// Story-mode beats shown while the engine generates the case and Supermemory
// finishes indexing the seeded memories. They read like a case being assembled;
// the later beats explicitly cover the memory-indexing wait so the pause feels
// intentional rather than broken.
export const LOADING_BEATS: string[] = [
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

export function useStartCase(onNavigate: (path: string) => void) {
  const [phase, setPhase] = useState<'idle' | 'loading'>('idle')
  const [chosen, setChosen] = useState<Difficulty | null>(null)
  const [status, setStatus] = useState<'assembling' | 'indexing'>('assembling')
  const [elapsed, setElapsed] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [aiGenerate, setAiGenerate] = useState(false)
  const cancelledRef = useRef(false)

  // Reset on (re)mount, not just set-true on unmount. React 18 Strict Mode
  // mounts→unmounts→remounts in dev; without resetting here the cleanup left
  // cancelledRef.current = true forever, which silently blocked navigation
  // and short-circuited the readiness loop — the "stuck on loading" bug.
  useEffect(() => {
    cancelledRef.current = false
    return () => {
      cancelledRef.current = true
    }
  }, [])

  useEffect(() => {
    if (phase !== 'loading') return
    const id = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => clearInterval(id)
  }, [phase])

  async function waitForMemoriesReady(maxMs = 20000) {
    const deadline = Date.now() + maxMs
    // Poll the readiness probe, but bound EACH poll so a slow/hung request can
    // never stall the loop past the deadline — the case opens either way.
    while (Date.now() < deadline && !cancelledRef.current) {
      const ctl = new AbortController()
      const perPoll = setTimeout(() => ctl.abort(), 4000)
      try {
        const r = await fetch(`/api/case-ready?t=${Date.now()}`, {
          cache: 'no-store',
          signal: ctl.signal
        })
        const body = await r.json()
        if (body?.ready) return
      } catch {
        // This poll timed out or errored — keep looping until the deadline
        // rather than hanging; do not bail the whole load on one bad poll.
      } finally {
        clearTimeout(perPoll)
      }
      await sleep(1200)
    }
  }

  async function startCase(difficulty: Difficulty) {
    setChosen(difficulty)
    setPhase('loading')
    setStatus('assembling')
    setElapsed(0)
    setError(null)
    // A fresh case means fresh suspects — carrying over the last game's
    // interrogation transcripts would let old answers bleed into the new one.
    clearTranscripts()
    const t0 = Date.now()
    // eslint-disable-next-line no-console
    console.info(`[alibi] ▶ start ${difficulty} case ${aiGenerate ? '(AI-generated)' : '(curated)'}`)
    // Hard ceiling so a wedged generation can never leave the loading screen
    // spinning forever — the server bounds generation to 60s + falls back, so
    // 120s here is pure backstop before we bail to a retry.
    const controller = new AbortController()
    const bailTimer = setTimeout(() => controller.abort(), 120_000)
    try {
      const response = await fetch('/api/new-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ difficulty, generate: aiGenerate }),
        signal: controller.signal
      })
      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        // eslint-disable-next-line no-console
        console.error('[alibi] ✗ new-game failed', response.status, body)
        setError(typeof body.error === 'string' ? body.error : 'Could not start the case.')
        setPhase('idle')
        return
      }
      const started = await response.json().catch(() => ({}))
      // eslint-disable-next-line no-console
      console.info(
        `[alibi] ✓ case assembled in ${((Date.now() - t0) / 1000).toFixed(1)}s: "${started.title}" — ${(started.suspects || []).length} suspects`
      )
      try {
        sessionStorage.setItem('alibi:caseStartedAt', String(Date.now()))
      } catch {
        // sessionStorage unavailable — the solve-time bonus is optional.
      }
      // Hold on the loading screen until the suspects' memories are actually
      // searchable, so the first interrogation is never empty.
      setStatus('indexing')
      await waitForMemoriesReady()
      // eslint-disable-next-line no-console
      console.info(`[alibi] ✓ memories ready in ${((Date.now() - t0) / 1000).toFixed(1)}s — entering the case`)
      if (!cancelledRef.current) onNavigate('/brief')
    } catch (err) {
      const timedOut = err instanceof DOMException && err.name === 'AbortError'
      // eslint-disable-next-line no-console
      console.error('[alibi] ✗ start failed', err)
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

  return { phase, chosen, status, elapsed, error, aiGenerate, setAiGenerate, startCase }
}
