//created by kinjal
import { Reveal } from './Reveal.js'

export function EvidenceBoard() {
  return (
    <Reveal className="evidence-board-wrap">
      <div className="scene">
        <span className="folder-tab scene-label">Evidence Board</span>

        <div className="corkboard">
          <svg className="corkboard-string" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <path d="M18 30 Q 50 70 82 30" fill="none" stroke="#b3271b" strokeWidth="0.8" />
            <path d="M82 30 Q 50 80 50 78" fill="none" stroke="#b3271b" strokeWidth="0.8" />
            <circle cx="18" cy="30" r="1.4" fill="#b3271b" />
            <circle cx="82" cy="30" r="1.4" fill="#b3271b" />
            <circle cx="50" cy="78" r="1.4" fill="#b3271b" />
          </svg>

          <div className="photo" style={{ top: '8%', left: '6%', transform: 'rotate(-7deg)' }}>
            <span className="pushpin" />
            <div className="photo-slot">SUSPECT 01</div>
            <div className="photo-cap">Mara</div>
          </div>
          <div className="photo" style={{ top: '4%', right: '8%', left: 'auto', transform: 'rotate(6deg)' }}>
            <span className="pushpin pushpin--amber" />
            <div className="photo-slot">SUSPECT 02</div>
            <div className="photo-cap">Elias</div>
          </div>
          <div className="photo" style={{ bottom: '6%', left: '38%', transform: 'rotate(-3deg)' }}>
            <span className="pushpin pushpin--amber" />
            <div className="photo-slot">CCTV 22:10</div>
            <div className="photo-cap">The docks</div>
          </div>
        </div>

        <div className="desk-strip">
          <div className="case-folder">
            <span className="folder-tab">Case File 004</span>
            <div className="folder-line">Missing Courier · 48h timeline</div>
          </div>
          <span className="blotter">Open investigation · 4 suspects</span>
        </div>
      </div>
    </Reveal>
  )
}
