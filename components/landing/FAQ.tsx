//created by kinjal
'use client'

import { useState } from 'react'
import { FAQS } from './data.js'

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <section className="section faq-section" id="faq" data-walk-stop>
      <div className="section-head">
        <span className="eyebrow">FAQ</span>
        <h2 className="section-title">Questions on file.</h2>
        <p className="section-lede">
          The questions judges and visitors actually ask, with honest answers.
        </p>
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        {FAQS.map((f, i) => {
          const isOpen = open === i
          return (
            <div className="faq-item" key={f.q}>
              <button
                className="faq-q"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? null : i)}
              >
                <span>{f.q}</span>
                <span className="caret" aria-hidden="true">+</span>
              </button>
              {isOpen && <p className="faq-a">{f.a}</p>}
            </div>
          )
        })}
      </div>
    </section>
  )
}
