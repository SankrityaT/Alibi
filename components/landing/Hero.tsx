//created by kinjal
import { Reveal } from './Reveal.js'
import { Nav } from './Nav.js'

export function Hero() {
  return (
    <div className="hero-wrap">
      <Nav />
      {/* Captured frame from the GothicVania town demo (430x272), integer-scaled.
          The two townfolk are overlays pinned to the pixel coordinates they
          occupy in the demo's starting frame; the plate itself has them hidden. */}
      <div className="town-scene" aria-hidden="true">
        <span className="townfolk townfolk-hatman">
          <span className="townfolk-patrol">
            <span className="townfolk-flip">
              <span className="townfolk-sprite" />
            </span>
          </span>
        </span>
        <span className="townfolk townfolk-bearded" />
      </div>
    <header className="hero" id="top" data-walk-stop>
      <Reveal className="hero-headline">
        <h1>Alibi</h1>
      </Reveal>

      <Reveal delay={80} className="hero-sub-wrap">
        <p className="hero-sub">
          Four suspects. One rewrote the truth. <span className="red">They all remember.</span>
        </p>
      </Reveal>

      <Reveal delay={160} className="hero-ctas">
        <a href="/station" className="btn btn--primary">
          Play the case
        </a>
      </Reveal>
    </header>
    </div>
  )
}
