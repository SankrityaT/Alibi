//created by kinjal
'use client'

import { useEffect, useState } from 'react'
import { MOCK_BOARD, LB_STORAGE_KEY, type Run } from './data.js'

type StoredRun = Run & { id: string; time: string }

function badgeClass(d: Run['difficulty']) {
  return d === 'Easy' ? 'easy' : d === 'Medium' ? 'med' : 'hard'
}

export function Leaderboard() {
  const [runs, setRuns] = useState<StoredRun[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LB_STORAGE_KEY)
      if (raw) setRuns(JSON.parse(raw))
    } catch {
      /* ignore */
    }
    setHydrated(true)
  }, [])

  const seedDemo = () => {
    const sample: StoredRun[] = [
      { id: crypto.randomUUID(), caseName: 'The Missing Courier', difficulty: 'Medium', points: 20, time: '11:30', rating: 'Inspector' },
    ]
    const next = [...runs, ...sample]
    setRuns(next)
    localStorage.setItem(LB_STORAGE_KEY, JSON.stringify(next))
  }

  const clearRuns = () => {
    setRuns([])
    localStorage.removeItem(LB_STORAGE_KEY)
  }

  return (
    <section className="section" data-walk-stop>
      <div className="section-head">
        <span className="eyebrow">Leaderboard</span>
        <h2 className="section-title">The Daily Case.</h2>
        <p className="section-lede">
          The vision: one shared, generated mystery per day that{' '}
          <em>everyone</em> solves &mdash; the Wordle model &mdash; so times and
          scores are comparable. Scores are earned locally; the shared board is
          the social layer we&rsquo;re building next.
        </p>
      </div>

      <div className="lb-tabs">
        <button className="btn btn--primary btn--sm" onClick={seedDemo}>
          + Log a local run
        </button>
        {runs.length > 0 && (
          <button className="btn btn--secondary btn--sm" onClick={clearRuns}>
            Clear history
          </button>
        )}
      </div>

      <h3 style={{ fontFamily: 'var(--font-pixel)', fontSize: '1.3rem', letterSpacing: '0.03em', margin: '0.4rem 0', color: 'var(--ink)' }}>
        Your local run history
      </h3>
      <table className="lb-table">
        <thead>
          <tr>
            <th>Rank</th><th>Detective</th><th>Case</th><th>Difficulty</th><th>Points</th><th>Time</th><th>Rating</th>
          </tr>
        </thead>
        <tbody>
          {hydrated && runs.length === 0 ? (
            <tr><td colSpan={7} className="lb-empty">No local runs yet. Solve a case — your scores land here.</td></tr>
          ) : (
            runs
              .slice()
              .sort((a, b) => b.points - a.points)
              .map((r, i) => (
                <tr className="you" key={r.id}>
                  <td className="rank-cell">{i + 1}</td>
                  <td>You</td>
                  <td>{r.caseName}</td>
                  <td><span className={`tag-planned ${badgeClass(r.difficulty)}`}>{r.difficulty}</span></td>
                  <td>{r.points}</td>
                  <td>{r.time}</td>
                  <td>{r.rating}</td>
                </tr>
              ))
          )}
        </tbody>
      </table>

      <h3 style={{ fontFamily: 'var(--font-pixel)', fontSize: '1.3rem', letterSpacing: '0.03em', margin: '2.2rem 0 0', color: 'var(--ink)' }}>
        Global Daily Case board
      </h3>
      <div className="lb-soon">
        <span className="stamp">Coming soon</span>
        <p style={{ margin: '0.5rem 0 0' }}>
          A shared daily seed makes everyone solve the <em>same</em> generated
          mystery so scores are comparable. Ties broken by fewer moves, then
          faster time. Solve all three difficulties (Easy / Medium / Hard) for{' '}
          <strong style={{ color: 'var(--amber)' }}>60 points</strong>.
        </p>
        <p style={{ margin: '0.7rem 0 0' }}>
          It&rsquo;s inherently networked, so it sits outside the local-only
          thesis for now. Below is a preview of what the ranking will look like.
        </p>
      </div>

      <table className="lb-table" style={{ marginTop: '1rem', opacity: 0.75 }}>
        <thead>
          <tr>
            <th>Rank</th><th>Detective</th><th>Case</th><th>Difficulty</th><th>Points</th><th>Time</th><th>Rating</th>
          </tr>
        </thead>
        <tbody>
          {MOCK_BOARD.map((r, i) => (
            <tr key={r.id}>
              <td className="rank-cell">{i + 1}</td>
              <td>Detective {String.fromCharCode(65 + i)}&hellip;</td>
              <td>{r.caseName}</td>
              <td><span className={`tag-planned ${badgeClass(r.difficulty)}`}>{r.difficulty}</span></td>
              <td>{r.points}</td>
              <td>{r.time}</td>
              <td>{r.rating}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
