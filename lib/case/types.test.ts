import { describe, expect, it } from 'vitest'
import {
  DETECTIVE_CONTAINER_TAG,
  PLANTED_BY_CULPRIT_TAG,
  WORLD_CONTAINER_TAG,
  suspectContainerTag
} from './types.js'

describe('container tag constants', () => {
  it('exposes the shared container-tag conventions', () => {
    expect(DETECTIVE_CONTAINER_TAG).toBe('detective-case')
    expect(WORLD_CONTAINER_TAG).toBe('world-evidence')
    expect(PLANTED_BY_CULPRIT_TAG).toBe('planted-by-culprit')
  })

  it('derives a per-suspect container tag', () => {
    expect(suspectContainerTag('mara')).toBe('suspect-mara')
    expect(suspectContainerTag('jonas')).toBe('suspect-jonas')
  })
})
