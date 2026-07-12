//created by kinjal
import { Reveal } from './Reveal.js'

export function GetStarted() {
  return (
    <section className="section" id="get-started" data-walk-stop>
      <div className="section-head">
        <span className="eyebrow">Get started</span>
        <h2 className="section-title">Run it on your machine.</h2>
        <p className="section-lede">
          A Next.js app that talks to a local Supermemory server and reaches
          Claude through your Claude subscription &mdash; no API key needed.
        </p>
      </div>

      <Reveal>
        <div className="screen-panel" style={{ marginTop: '1.5rem' }}>
          <i className="screen-grain" aria-hidden="true" />
          <p className="screen-label">terminal &mdash; setup</p>
          <pre className="terminal" style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
<span className="comment"># 1. Start Supermemory Local (localhost:6767)</span>{'\n'}
<span className="prompt">$</span> npx supermemory local{'\n\n'}
<span className="comment"># 2. Copy .env.example to .env, fill the two keys</span>{'\n'}
<span className="comment">#    (no ANTHROPIC_API_KEY — Claude uses claude login)</span>{'\n'}
<span className="prompt">$</span> cp .env.example .env{'\n\n'}
<span className="comment"># 3. Install + run the game</span>{'\n'}
<span className="prompt">$</span> npm install{'\n'}
<span className="prompt">$</span> claude login{'  '}
<span className="comment"># once, if you haven’t</span>{'\n'}
<span className="prompt">$</span> npm run dev{'  '}
<span className="comment"># http://localhost:3000</span>
          </pre>
        </div>
      </Reveal>

      <p style={{ fontSize: '0.78rem', color: 'var(--muted)', margin: '1rem 0 0' }}>
        Full steps live in the repo README &mdash; linked here so they only
        need maintaining in one place.
      </p>
    </section>
  )
}
