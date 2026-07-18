'use client'

import { useEffect, useState } from 'react'

export interface DialogueBoxProps {
  text: string
  charactersPerTick?: number
  tickMs?: number
  /** Divides the effective tick interval — 2 reveals twice as fast, etc. */
  speedMultiplier?: number
  /** Bumping this (e.g. a counter) instantly reveals the full text. */
  skipSignal?: number
}

export function DialogueBox({
  text,
  charactersPerTick = 1,
  tickMs = 20,
  speedMultiplier = 1,
  skipSignal = 0
}: DialogueBoxProps) {
  const [visibleCount, setVisibleCount] = useState(0)

  useEffect(() => {
    setVisibleCount(0)
    if (text.length === 0) {
      return
    }

    const effectiveTickMs = Math.max(1, tickMs / speedMultiplier)
    const interval = setInterval(() => {
      setVisibleCount((current) => {
        const next = Math.min(current + charactersPerTick, text.length)
        if (next >= text.length) {
          clearInterval(interval)
        }
        return next
      })
    }, effectiveTickMs)

    return () => clearInterval(interval)
  }, [text, charactersPerTick, tickMs, speedMultiplier])

  // skipSignal changing (e.g. a "Skip" button click) jumps straight to the
  // full line, independent of the reveal interval above.
  useEffect(() => {
    if (skipSignal > 0) {
      setVisibleCount(text.length)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skipSignal])

  return (
    <div className="dialogue-box" data-testid="dialogue-box" data-full-text={text}>
      {text.slice(0, visibleCount)}
    </div>
  )
}
