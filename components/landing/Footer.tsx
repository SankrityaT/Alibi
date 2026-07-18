//created by kinjal
export interface FooterProps {
  onPlayTheCase: () => void
}

export function Footer({ onPlayTheCase }: FooterProps) {
  return (
    <footer className="footer footer--props" id="footer">
      <div className="footer-props" aria-hidden="true">
        <img src="/assets/gothicvania/environment/props/street-lamp.png" alt="" className="footer-prop footer-prop--lamp" />
        <img src="/assets/gothicvania/environment/props/wagon.png" alt="" className="footer-prop footer-prop--wagon" />
        <img src="/assets/gothicvania/environment/props/crate-stack.png" alt="" className="footer-prop footer-prop--crates" />
      </div>
      <div className="footer-inner">
        <div>
          <h4>Alibi<span className="dot">.</span></h4>
          <p>
            A memory-driven noir detective game.<br />
            Built for the Supermemory Local Hackathon (localhost:6767).
          </p>
        </div>
        <div>
          <ul>
            <li><button type="button" className="footer-link-btn" onClick={onPlayTheCase}>Play the case</button></li>
            <li><a href="/leaderboard">Leaderboard</a></li>
            <li><a href="#get-started">Get started</a></li>
          </ul>
        </div>
        <div>
          <ul>
            {/* ASSET SLOT: set the real GitHub repo URL */}
            <li><a href="https://github.com/kinjal/alibi" target="_blank" rel="noreferrer">GitHub repo →</a></li>
            <li><a href="https://supermemory.ai" target="_blank" rel="noreferrer">Supermemory Local →</a></li>
          </ul>
        </div>
      </div>
      <div className="footer-credits">
        <span>Local-first AI noir mystery · 100% on your machine · Built for the Supermemory Local Hackathon.</span>
        <span>Pixel-art assets by Kenney &amp; Ansimuz (CC0).</span>
      </div>
    </footer>
  )
}
