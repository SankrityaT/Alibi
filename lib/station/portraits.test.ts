import { describe, expect, it } from 'vitest'
import { PORTRAIT_SPRITES, portraitForSuspect } from './portraits.js'

describe('portraitForSuspect', () => {
  it('returns a path that lives inside PORTRAIT_SPRITES', () => {
    for (const id of ['mara', 'jonas', 'priya', 'victor']) {
      expect(PORTRAIT_SPRITES).toContain(portraitForSuspect(id))
    }
  })

  it('is deterministic for a given id', () => {
    expect(portraitForSuspect('mara')).toBe(portraitForSuspect('mara'))
    expect(portraitForSuspect('victor')).toBe(portraitForSuspect('victor'))
  })

  it('maps distinct suspect ids to distinct portraits', () => {
    const ids = ['mara', 'jonas', 'priya', 'victor']
    const paths = ids.map(portraitForSuspect)
    expect(new Set(paths).size).toBe(ids.length)
  })

  it('exposes only paths under /sprites/portraits', () => {
    for (const path of PORTRAIT_SPRITES) {
      expect(path.startsWith('/sprites/portraits/')).toBe(true)
    }
  })
})
