//created by kinjal
import type { SVGProps } from 'react'
import type { IconKey } from './data.js'

// Inline pixel-feel icons (currentColor) — swap for Kenney CC0 sprites later by
// replacing the call sites. 24x24, square caps for a stamped look.
type P = SVGProps<SVGSVGElement>
const b = (p: P) => ({
  width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none',
  stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'square' as const, strokeLinejoin: 'miter' as const,
  ...p,
})

const MAP: Record<IconKey, (p: P) => JSX.Element> = {
  memory: (p) => (<svg {...b(p)}><path d="M12 4c-2 0-3 1-3 2.5C8 8 9 9 9 9c-2 .5-3 2-3 4 0 3 3 5 6 5s6-2 6-5c0-2-1-3.5-3-4 0 0 1-1 1-2.5C16 5 15 4 13 4"/><path d="M9 13c1 1 5 1 6 0"/></svg>),
  spread: (p) => (<svg {...b(p)}><circle cx="6" cy="6" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="12" cy="18" r="2"/><path d="M7 7l4 9M17 7l-4 9"/></svg>),
  dig: (p) => (<svg {...b(p)}><circle cx="11" cy="11" r="6"/><path d="M20 20l-4-4"/></svg>),
  notebook: (p) => (<svg {...b(p)}><path d="M5 3h12v18H5z"/><path d="M8 3v18"/><path d="M11 8h4M11 12h4M11 16h4"/></svg>),
  culprit: (p) => (<svg {...b(p)}><path d="M5 21c0-4 3-6 7-6s7 2 7 6"/><circle cx="12" cy="8" r="4"/><path d="M10 8h.01M14 8h.01"/></svg>),
  voice: (p) => (<svg {...b(p)}><rect x="9" y="3" width="6" height="11" rx="1"/><path d="M6 11a6 6 0 0 0 12 0"/><path d="M12 17v4M9 21h6"/></svg>),
  local: (p) => (<svg {...b(p)}><rect x="4" y="10" width="16" height="10"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/><path d="M12 14v2"/></svg>),
}

export function Icon({ name, ...rest }: { name: IconKey } & P) {
  const C = MAP[name]
  return <C {...rest} />
}
