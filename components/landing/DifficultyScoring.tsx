//created by kinjal
import { Reveal } from './Reveal.js'
import { DIFFS, RANKS } from './data.js'

export function DifficultyScoring() {
  return (
    <section className="section" id="scoring" data-walk-stop>
      <div className="section-head">
        <span className="eyebrow">Difficulty &amp; scoring</span>
        <h2 className="section-title">Earn your rank.</h2>
        <p className="section-lede">
          Cases are generated at three levels. Harder cases have more planted
          and spreading false memories to see through, and need deeper digging
          and synthesis to solve.
        </p>
      </div>

      <div className="diff-grid">
        {DIFFS.map((d, i) => (
          <Reveal as="article" key={d.lvl} delay={i * 70} className="card diff-card">
            <span className="lvl">{d.lvl}</span>
            <div className="pts">{d.pts}<span style={{ fontSize: '0.9rem', color: 'var(--muted)' }}> pts</span></div>
            <p>{d.body}</p>
          </Reveal>
        ))}
      </div>

      <div className="milestone">
        Solve all three difficulties = <b>60 points</b>. Points stack across
        cases &mdash; fodder for the leaderboard.{' '}
        <span className="tag-planned">planned</span>
      </div>

      <h3 style={{ fontFamily: 'var(--font-pixel)', fontSize: '1.1rem', letterSpacing: '0.06em', margin: '2rem 0 0', color: 'var(--ink)' }}>
        Detective Rating
      </h3>
      <p className="section-lede" style={{ marginTop: '0.5rem' }}>
        Not just <em>did</em> you solve it &mdash; <em>how</em>. Moves used, whether
        you caught the planted memory, whether a red herring fooled you.
      </p>
      <div className="ranks">
        {RANKS.map((r, i) => (
          <span key={r}>
            <span className={`rank${i === RANKS.length - 1 ? ' last' : ''}`}>{r}</span>
            {i < RANKS.length - 1 && <span className="rank-sep">→</span>}
          </span>
        ))}
      </div>
    </section>
  )
}
