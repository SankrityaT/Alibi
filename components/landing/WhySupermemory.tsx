//created by kinjal
import { Reveal } from './Reveal.js'
import { MemoryToggle } from './MemoryToggle.js'

export function WhySupermemory() {
  return (
    <section className="section" id="why" data-walk-stop>
      <div className="section-head">
        <span className="eyebrow">Why it&rsquo;s local / why Supermemory</span>
        <h2 className="section-title">A game about memory that keeps memory private.</h2>
        <p className="section-lede">
          The memory layer is fully local &mdash; suspect memories, evidence,
          and your investigation never leave your machine. Then flip the engine
          off and watch the mystery fall apart. That&rsquo;s the proof.
        </p>
      </div>

      <div className="why-grid">
        <Reveal className="card why-paper">
          <p className="lead">
            A markdown file can&rsquo;t do this. It can&rsquo;t rank what&rsquo;s
            relevant, build a profile per suspect, or synthesize across sources.
          </p>
          <ul className="hook-list">
            <li>Suspects accumulate memory across the whole investigation.</li>
            <li>Your detective synthesizes across everything you&rsquo;ve dug up.</li>
            <li>Lies persist and spread. Mental state updates as you press them.</li>
          </ul>
          <p className="why-close">
            Supermemory Local is the engine &mdash; storage, search, and
            embeddings, all on your machine. Nothing leaves the laptop.
          </p>
        </Reveal>

        <Reveal delay={90}>
          <MemoryToggle />
          <p style={{ fontSize: '0.72rem', color: 'var(--muted)', margin: '0.7rem 0 0', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
            The ON/OFF toggle is a planned v2 feature<span className="tag-planned">planned</span>
          </p>
        </Reveal>
      </div>
    </section>
  )
}
