//created by kinjal
import { Reveal } from './Reveal.js'

export function GetStarted() {
  return (
    <section className="section" id="get-started" data-walk-stop>
      <div className="section-head">
        <span className="eyebrow">Get started</span>
        <h2 className="section-title">Run it on your machine.</h2>
        <p className="section-lede">
          Everything runs local &mdash; memory, voices, and Claude through your
          subscription. No API key required.
        </p>
      </div>

      <Reveal>
        <div className="screen-panel" style={{ marginTop: '1.5rem' }}>
          <i className="screen-grain" aria-hidden="true" />
          <p className="screen-label">terminal &mdash; setup</p>
          <pre className="terminal" style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
<span className="comment"># 1. Memory — Supermemory Local (localhost:6767)</span>{'\n'}
<span className="prompt">$</span> npx supermemory local{'\n\n'}
<span className="comment"># 2. Voices — Kokoro TTS, via Docker (localhost:8880)</span>{'\n'}
<span className="prompt">$</span> docker run -d -p 8880:8880 ghcr.io/remsky/kokoro-fastapi-cpu{'\n\n'}
<span className="comment"># 3. Configure — copy .env.example, fill in the printed keys</span>{'\n'}
<span className="prompt">$</span> cp .env.example .env{'\n\n'}
<span className="comment"># 4. Install + run</span>{'\n'}
<span className="prompt">$</span> npm install{'\n'}
<span className="prompt">$</span> claude login{'  '}
<span className="comment"># once, if you haven’t</span>{'\n'}
<span className="prompt">$</span> npm run dev{'  '}
<span className="comment"># http://localhost:3000</span>
          </pre>
        </div>
      </Reveal>
    </section>
  )
}
