//created by kinjal
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import '../app/landing.css'
import { pixelFont, pressStart } from '../components/landing/pixelFont.js'
import { Hero } from '../components/landing/Hero.js'
import { HowToPlay } from '../components/landing/HowToPlay.js'
import { GetStarted } from '../components/landing/GetStarted.js'
import { Footer } from '../components/landing/Footer.js'
import { WalkingDetective } from '../components/landing/WalkingDetective.js'
import { StartCaseOverlay } from '../components/landing/StartCaseOverlay.js'
import { useStartCase } from '../lib/case/useStartCase.js'

export default function HomePage() {
  const [overlayOpen, setOverlayOpen] = useState(false)
  const router = useRouter()
  const startCaseState = useStartCase((path) => router.push(path))

  return (
    <main className={`alibi-landing ${pixelFont.variable} ${pressStart.variable}`}>
      <Hero onPlayTheCase={() => setOverlayOpen(true)} />
      <HowToPlay />
      <GetStarted />
      <Footer onPlayTheCase={() => setOverlayOpen(true)} />
      <WalkingDetective />
      <StartCaseOverlay open={overlayOpen} onClose={() => setOverlayOpen(false)} {...startCaseState} />
    </main>
  )
}
