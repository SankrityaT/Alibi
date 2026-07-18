//created by kinjal
import { Reveal } from './Reveal.js'
import { Icon } from './icons.js'

const SHORT_STEPS: { num: string; title: string; icon: 'memory' | 'spread' | 'dig' | 'notebook' | 'culprit' }[] = [
  { num: '01', title: 'Interrogate the suspects', icon: 'spread' },
  { num: '02', title: 'Dig up evidence', icon: 'dig' },
  { num: '03', title: 'Connect it in the Notebook', icon: 'notebook' },
  { num: '04', title: 'Accuse the culprit', icon: 'culprit' }
]

export function HowToPlay() {
  return (
    <section className="section" id="how" data-walk-stop>
      <div className="section-head">
        <span className="eyebrow">The loop</span>
        <h2 className="section-title">How you play.</h2>
      </div>

      <div className="loop">
        {SHORT_STEPS.map((s, i) => (
          <Reveal as="article" key={s.num} delay={i * 70} className="card card--pad-sm loop-step">
            <span className="num">{s.num}</span>
            <span className="mascot" style={{ position: 'static', width: 28, height: 28, marginBottom: 6 }}>
              <Icon name={s.icon} />
            </span>
            <h4>{s.title}</h4>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
