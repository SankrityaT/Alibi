//created by kinjal
import { Reveal } from './Reveal.js'
import { Icon } from './icons.js'
import { STEPS } from './data.js'

export function HowToPlay() {
  return (
    <section className="section" id="how" data-walk-stop>
      <div className="section-head">
        <span className="eyebrow">The loop</span>
        <h2 className="section-title">How you play.</h2>
        <p className="section-lede">
          Dig facts from the world &rarr; confront a suspect &rarr; watch their
          memory and their story shift &rarr; connect everything &rarr; accuse.
          It&rsquo;s a real sequence, so the numbering earns its place.
        </p>
      </div>

      <div className="loop">
        {STEPS.map((s, i) => (
          <Reveal as="article" key={s.num} delay={i * 70} className="card card--pad-sm loop-step">
            <span className="num">{s.num}</span>
            <span className="mascot" style={{ position: 'static', width: 28, height: 28, marginBottom: 6 }}>
              <Icon name={s.icon} />
            </span>
            <h4>{s.title}</h4>
            <p>{s.body}</p>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
