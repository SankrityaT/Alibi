//created by kinjal
import { Reveal } from './Reveal.js'

export function MemoryHook() {
  return (
    <section className="section" id="hook" data-walk-stop>
      <div className="section-head">
        <span className="eyebrow">The hook</span>
        <h2 className="section-title">Memory works two ways.</h2>
        <p className="section-lede">
          Memory isn&rsquo;t a feature in Alibi &mdash; it&rsquo;s two opposing
          forces, and the whole game is the duel between them. The killer
          weaponized it. You&rsquo;ll use it to catch them.
        </p>
      </div>

      <div className="hook-grid">
        <Reveal className="card hook-col hook-col--weapon">
          <span className="hook-tag">Force 01 &mdash; Manipulation</span>
          <h3>Memory as a weapon</h3>
          <ul className="hook-list">
            <li>The killer <strong>rewrites</strong> a memory to frame someone.</li>
            <li><em>You</em> can plant lies too &mdash; and watch them spread.</li>
            <li>A planted memory looks exactly like a real one. That&rsquo;s the suspense.</li>
          </ul>
        </Reveal>

        <Reveal delay={90} className="card hook-col hook-col--lens">
          <span className="hook-tag">Force 02 &mdash; Connection</span>
          <h3>Memory as a lens</h3>
          <ul className="hook-list">
            <li>Every clue you find writes to your detective&rsquo;s case memory.</li>
            <li>Ask the Notebook &ldquo;what do I know about the docks?&rdquo;</li>
            <li>It synthesizes everything &mdash; and points at the contradiction that cracks the case.</li>
          </ul>
        </Reveal>
      </div>

      <p className="tagline">
        They weaponized memory. <em>You&rsquo;ll out-remember them.</em>
      </p>
    </section>
  )
}
