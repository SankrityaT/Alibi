//created by kinjal
'use client'

import { useState } from 'react'

// Interactive stand-in for the in-game "Memory: ON/OFF" kill-shot demo (a planned
// v2 feature). The real game swaps SupermemoryClient for a null client; this is
// a faithful simulation of what that shows. Lives inside a dark .screen-panel so
// it reads as a screen, distinct from the cream cards around it.
export function MemoryToggle() {
  const [on, setOn] = useState(true)
  return (
    <div className="screen-panel">
      <i className="screen-grain" aria-hidden="true" />
      <p className="screen-label">Memory: {on ? 'ON' : 'OFF'} · live proof</p>

      <div className="toggle-bar">
        <span>Memory</span>
        <button
          className={`switch ${on ? 'on' : ''}`}
          role="switch"
          aria-checked={on}
          aria-label="Toggle suspect memory engine"
          onClick={() => setOn((v) => !v)}
        />
        <span className="switch-label">{on ? 'ON' : 'OFF'}</span>
      </div>

      <div className="suspect-line">
        <span className="q">YOU:</span> Mara, where were you at 22:10?
      </div>

      {on ? (
        <>
          <div className="suspect-line" style={{ marginTop: '0.5rem' }}>
            <span>MARA:</span> At the docks. I told you already &mdash; Elias met
            me there around ten.
          </div>
          <ul className="memory-facts">
            <li>retained · &ldquo;was at the docks at ~22:00&rdquo;</li>
            <li>retained · &ldquo;Elias arrived ~22:10&rdquo; (from your earlier question)</li>
            <li className="planted">
              planted by culprit · &ldquo;the courier was never at the docks&rdquo; &mdash; contradicts CCTV
            </li>
          </ul>
        </>
      ) : (
        <p className="blank-state">
          MARA: I&hellip; don&rsquo;t know what you&rsquo;re talking about. You
          never told me anything. Who is Elias?
        </p>
      )}
    </div>
  )
}
