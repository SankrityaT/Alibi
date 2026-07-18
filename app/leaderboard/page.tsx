//created by kinjal
import '../../app/landing.css'
import { LeaderboardPageClient } from '../../components/landing/LeaderboardPageClient.js'

export const metadata = {
  title: 'Alibi — Leaderboard',
  description: 'Detective ratings, difficulty points, and the Daily Case board.',
}

export default function LeaderboardPage() {
  return <LeaderboardPageClient />
}
