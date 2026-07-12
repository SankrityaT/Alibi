// Consistent pixel-art portraits for suspects, shown in the interrogation
// header. Portraits are CC0 Kenney-derived placeholder tiles under
// /sprites/portraits (see public/sprites/CREDITS.txt). The mapping is a pure,
// deterministic hash so a given suspect always wears the same face across
// sessions without any per-suspect wiring — new suspects added to a case get a
// stable portrait for free.

export const PORTRAIT_SPRITES: readonly string[] = [
  '/sprites/portraits/suspect-1.png',
  '/sprites/portraits/suspect-2.png',
  '/sprites/portraits/suspect-3.png',
  '/sprites/portraits/suspect-4.png',
  '/sprites/portraits/suspect-5.png',
  '/sprites/portraits/suspect-6.png',
  '/sprites/portraits/suspect-7.png',
  '/sprites/portraits/suspect-8.png'
] as const

// djb2 string hash — cheap, well-spread, and stable across runs/platforms.
function hash(value: string): number {
  let h = 5381
  for (let i = 0; i < value.length; i += 1) {
    h = ((h << 5) + h + value.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

export function portraitForSuspect(suspectId: string): string {
  const index = hash(suspectId) % PORTRAIT_SPRITES.length
  return PORTRAIT_SPRITES[index]
}
