//created by kinjal
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { pixelFont } from './pixelFont.js'
import { Nav } from './Nav.js'
import { Leaderboard } from './Leaderboard.js'
import { Footer } from './Footer.js'
import { WalkingDetective } from './WalkingDetective.js'
import { StartCaseOverlay } from './StartCaseOverlay.js'
import { useStartCase } from '../../lib/case/useStartCase.js'

export function LeaderboardPageClient() {
  const [overlayOpen, setOverlayOpen] = useState(false)
  const router = useRouter()
  const startCaseState = useStartCase((path) => router.push(path))

  return (
    <main className={`alibi-landing ${pixelFont.variable}`}>
      <Nav />
      <Leaderboard />
      <Footer onPlayTheCase={() => setOverlayOpen(true)} />
      <WalkingDetective />
      <StartCaseOverlay open={overlayOpen} onClose={() => setOverlayOpen(false)} {...startCaseState} />
    </main>
  )
}
