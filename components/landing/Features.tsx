//created by kinjal
import { Reveal } from './Reveal.js'
import { Icon } from './icons.js'
import { FEATURES } from './data.js'
import { EvidenceBoard } from './EvidenceBoard.js'

export function Features() {
  return (
    <section className="section" id="features" data-walk-stop>
      <div className="section-head">
        <span className="eyebrow">Evidence</span>
        <h2 className="section-title">What makes it different.</h2>
        <p className="section-lede">
          Seven pieces of evidence, tagged and filed. The mascot-anchored card
          pins a pixel-art suspect or evidence icon in the corner of each one.
        </p>
      </div>

      <EvidenceBoard />

      <div className="feature-grid">
        {FEATURES.map((f, i) => (
          <Reveal as="article" key={f.tag} delay={(i % 3) * 70} className={`card card--mascot${f.planned ? '' : ''}`}>
            <span className="mascot">
              <Icon name={f.icon} />
            </span>
            <span className="card-tag">{f.tag}</span>
            <h3 className="card-title">
              {f.title}
              {f.planned && <span className="tag-planned">planned</span>}
            </h3>
            <p className="card-body">{f.body}</p>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
