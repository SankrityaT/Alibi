'use client'

import { useEffect, useState } from 'react'
import { flushSync } from 'react-dom'

export interface DialogueBoxProps {
  text: string
  charactersPerTick?: number
  tickMs?: number
}

export function DialogueBox({ text, charactersPerTick = 1, tickMs = 20 }: DialogueBoxProps) {
  const [visibleCount, setVisibleCount] = useState(0)

  useEffect(() => {
    setVisibleCount(0)
    if (text.length === 0) {
      return
    }

    const interval = setInterval(() => {
      flushSync(() => {
        setVisibleCount((current) => {
          const next = Math.min(current + charactersPerTick, text.length)
          if (next >= text.length) {
            clearInterval(interval)
          }
          return next
        })
      })
    }, tickMs)

    return () => clearInterval(interval)
  }, [text, charactersPerTick, tickMs])

  return (
    <div data-testid="dialogue-box" data-full-text={text}>
      {text.slice(0, visibleCount)}
    </div>
  )
}
