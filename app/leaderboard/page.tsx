//created by kinjal
import '../../app/landing.css'
import { pixelFont } from '../../components/landing/pixelFont.js'
import { Nav } from '../../components/landing/Nav.js'
import { Leaderboard } from '../../components/landing/Leaderboard.js'
import { Footer } from '../../components/landing/Footer.js'
import { WalkingDetective } from '../../components/landing/WalkingDetective.js'

export const metadata = {
  title: 'Alibi — Leaderboard',
  description: 'Detective ratings, difficulty points, and the Daily Case board.',
}

export default function LeaderboardPage() {
  return (
    <main className={`alibi-landing ${pixelFont.variable}`}>
      <Nav />
      <Leaderboard />
      <Footer />
      <WalkingDetective />
    </main>
  )
}
