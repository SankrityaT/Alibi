//created by kinjal
'use client'

import { useEffect, useRef, useState } from 'react'

// The signature element: the pixel detective walks across the page with your
// scroll progress, hops when you cross into a new section, and flips to face
// its direction of travel. Pure CSS transforms driven through refs (no scroll-
// driven re-renders). Disabled entirely under prefers-reduced-motion.
export function WalkingDetective() {
  const layerRef = useRef<HTMLDivElement>(null)
  const flipRef = useRef<HTMLDivElement>(null)
  const hopRef = useRef<HTMLDivElement>(null)
  const lastXRef = useRef(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const reduce =
      typeof matchMedia !== 'undefined' &&
      matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return

    const layer = layerRef.current
    if (!layer) return

    const SPRITE = 48
    const margin = 24
    let ticking = false
    let hopTimer: ReturnType<typeof setTimeout> | undefined

    const place = () => {
      const denom = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight,
      )
      const progress = Math.min(1, Math.max(0, window.scrollY / denom))
      const x = margin + progress * (window.innerWidth - SPRITE - 2 * margin)
      layer.style.transform = `translate3d(${x}px,0,0)`
      const flip = flipRef.current
      if (flip) {
        flip.style.transform = x > lastXRef.current ? 'scaleX(1)' : 'scaleX(-1)'
      }
      lastXRef.current = x
      ticking = false
    }

    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(place)
    }

    const hop = () => {
      const el = hopRef.current
      if (!el) return
      el.classList.remove('hop')
      // force reflow so the animation restarts
      void el.offsetWidth
      el.classList.add('hop')
      if (hopTimer) clearTimeout(hopTimer)
      hopTimer = setTimeout(() => el.classList.remove('hop'), 420)
    }

    place()
    setMounted(true)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })

    // hop when a [data-walk-stop] section crosses the viewport's centre band
    let active: Element | null = null
    let io: IntersectionObserver | undefined
    if (typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting && e.target !== active) {
              active = e.target
              hop()
            }
          }
        },
        { rootMargin: '-45% 0px -45% 0px', threshold: 0 },
      )
      document.querySelectorAll('[data-walk-stop]').forEach((el) => io!.observe(el))
    }

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      io?.disconnect()
      if (hopTimer) clearTimeout(hopTimer)
    }
  }, [])

  return (
    <>
      <div className="detective-ground" aria-hidden="true" />
      <div
        className="detective-layer"
        ref={layerRef}
        style={{ visibility: mounted ? 'visible' : 'hidden' }}
        aria-hidden="true"
      >
        <div className="detective-hop" ref={hopRef}>
          <div className="detective-flip" ref={flipRef}>
            <div className="detective detective-sprite" />
          </div>
        </div>
        <div className="detective-shadow" />
      </div>
    </>
  )
}
