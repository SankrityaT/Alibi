//created by kinjal
import '../app/landing.css'
import { pixelFont, pressStart } from '../components/landing/pixelFont.js'
import { Hero } from '../components/landing/Hero.js'
import { MemoryHook } from '../components/landing/MemoryHook.js'
import { HowToPlay } from '../components/landing/HowToPlay.js'
import { Features } from '../components/landing/Features.js'
import { WhySupermemory } from '../components/landing/WhySupermemory.js'
import { DifficultyScoring } from '../components/landing/DifficultyScoring.js'
import { GetStarted } from '../components/landing/GetStarted.js'
import { FAQ } from '../components/landing/FAQ.js'
import { Footer } from '../components/landing/Footer.js'
import { WalkingDetective } from '../components/landing/WalkingDetective.js'

export const metadata = {
  title: 'Alibi — a detective game where the suspects actually remember',
  description:
    'A local-first AI noir detective game. Interrogate four suspects with real private memory, dig evidence, and catch the one who rewrote someone\'s memory. 100% on your machine.',
}

export default function HomePage() {
  return (
    <main className={`alibi-landing ${pixelFont.variable} ${pressStart.variable}`}>
      <Hero />
      <MemoryHook />
      <HowToPlay />
      <Features />
      <WhySupermemory />
      <DifficultyScoring />
      <GetStarted />
      <FAQ />
      <Footer />
      <WalkingDetective />
    </main>
  )
}
