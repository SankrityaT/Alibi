import { describe, expect, it } from 'vitest'
import { fallbackCase } from '../../content/cases/fallbackCase.js'
import type { CaseFile } from './types.js'
import { validateCase } from './validate.js'

// Deep clone so each test mutates an isolated copy of the fallback case.
function clone(caseFile: CaseFile): CaseFile {
  return structuredClone(caseFile)
}

function codes(caseFile: CaseFile): string[] {
  return validateCase(caseFile).issues.map((issue) => issue.code)
}

describe('validateCase', () => {
  it('accepts the hand-authored fallback case with no issues', () => {
    const result = validateCase(fallbackCase)
    expect(result.ok).toBe(true)
    expect(result.issues).toEqual([])
  })

  it('flags multiple culprits', () => {
    const c = clone(fallbackCase)
    // Mark a second suspect as a culprit.
    const other = c.suspects.find((s) => s.suspectId !== c.culpritId)!
    other.isCulprit = true
    const result = validateCase(c)
    expect(result.ok).toBe(false)
    expect(result.issues.map((i) => i.code)).toContain('multiple-culprits')
  })

  it('flags no culprit at all', () => {
    const c = clone(fallbackCase)
    for (const s of c.suspects) s.isCulprit = false
    expect(codes(c)).toContain('no-culprit')
  })

  it('flags a culprit whose id does not match culpritId', () => {
    const c = clone(fallbackCase)
    // Move the culprit flag to a different suspect than culpritId points at.
    for (const s of c.suspects) s.isCulprit = false
    const other = c.suspects.find((s) => s.suspectId !== c.culpritId)!
    other.isCulprit = true
    expect(codes(c)).toContain('culprit-id-mismatch')
  })

  it('flags duplicate suspect ids', () => {
    const c = clone(fallbackCase)
    c.suspects[1].suspectId = c.suspects[0].suspectId
    expect(codes(c)).toContain('duplicate-suspect-id')
  })

  it('flags a planted memory that references an unknown suspect', () => {
    const c = clone(fallbackCase)
    c.plantedMemory.suspectId = 'ghost'
    expect(codes(c)).toContain('planted-memory-unknown-suspect')
  })

  it('flags evidence that implicates an unknown suspect', () => {
    const c = clone(fallbackCase)
    c.evidence[0].implicatesSuspectIds = ['ghost']
    expect(codes(c)).toContain('evidence-unknown-suspect')
  })

  it('flags a timeline event that references an unknown suspect', () => {
    const c = clone(fallbackCase)
    c.timeline[0].suspectIds = ['ghost']
    expect(codes(c)).toContain('timeline-unknown-suspect')
  })

  it('flags the absence of any evidence contradiction implicating the culprit', () => {
    const c = clone(fallbackCase)
    // Strip every contradicting claim so nothing implicates the culprit.
    for (const e of c.evidence) delete e.contradictsClaim
    expect(codes(c)).toContain('no-contradiction')
  })

  it('flags a contradiction that only implicates non-culprits', () => {
    const c = clone(fallbackCase)
    for (const e of c.evidence) {
      if (e.contradictsClaim) {
        e.implicatesSuspectIds = e.implicatesSuspectIds.filter(
          (id) => id !== c.culpritId,
        )
      }
    }
    expect(codes(c)).toContain('no-contradiction')
  })

  it('flags a solution culpritId that mismatches the case culpritId', () => {
    const c = clone(fallbackCase)
    c.solution.culpritId = 'jonas'
    expect(codes(c)).toContain('solution-mismatch')
  })

  it('flags a suspect count outside the difficulty target', () => {
    const easy = clone(fallbackCase)
    easy.difficulty = 'easy'
    // Fallback has four suspects; easy targets ~3.
    expect(codes(easy)).toContain('suspect-count')

    const medium = clone(fallbackCase)
    medium.difficulty = 'medium'
    medium.suspects.pop()
    // Medium targets exactly 4; three suspects is out of range.
    expect(codes(medium)).toContain('suspect-count')
  })

  it('accepts a valid easy case with three suspects', () => {
    const c = clone(fallbackCase)
    c.difficulty = 'easy'
    // Drop a non-culprit, non-referenced suspect down to three.
    const removed = c.suspects.find(
      (s) => !s.isCulprit && s.suspectId === 'victor',
    )!
    c.suspects = c.suspects.filter((s) => s.suspectId !== removed.suspectId)
    c.timeline = c.timeline.filter(
      (t) => !t.suspectIds.includes(removed.suspectId),
    )
    c.evidence = c.evidence.filter(
      (e) => !e.implicatesSuspectIds.includes(removed.suspectId),
    )
    const result = validateCase(c)
    expect(result.ok).toBe(true)
    expect(result.issues).toEqual([])
  })

  it('accepts a valid hard case with five suspects', () => {
    const c = clone(fallbackCase)
    c.difficulty = 'hard'
    const extra = structuredClone(c.suspects[3])
    extra.suspectId = 'nadia'
    extra.name = 'Nadia Voss'
    extra.isCulprit = false
    c.suspects.push(extra)
    const result = validateCase(c)
    expect(result.ok).toBe(true)
    expect(result.issues).toEqual([])
  })
})
