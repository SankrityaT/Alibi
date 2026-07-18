import type { CaseFile, Difficulty } from './types.js'

export interface ValidationIssue {
  code: string
  message: string
}

export interface ValidationResult {
  ok: boolean
  issues: ValidationIssue[]
}

// Inclusive suspect-count target per difficulty tier.
// easy ~3, medium exactly 4, hard 4-5.
const SUSPECT_COUNT_TARGETS: Record<Difficulty, { min: number; max: number }> = {
  easy: { min: 3, max: 3 },
  medium: { min: 4, max: 4 },
  hard: { min: 4, max: 5 },
}

// Pure validator: a generated or fallback CaseFile is internally consistent and
// solvable. This is the gate the generator retries against, so every check is
// deterministic and side-effect free. Returns all issues found (not just the
// first) so the generator/author can see the full picture.
export function validateCase(caseFile: CaseFile): ValidationResult {
  const issues: ValidationIssue[] = []
  const add = (code: string, message: string) => issues.push({ code, message })

  const suspects = caseFile.suspects ?? []
  const suspectIds = suspects.map((s) => s.suspectId)
  const knownIds = new Set(suspectIds)

  // Unique suspect ids.
  const seen = new Set<string>()
  const duplicates = new Set<string>()
  for (const id of suspectIds) {
    if (seen.has(id)) duplicates.add(id)
    seen.add(id)
  }
  if (duplicates.size > 0) {
    add(
      'duplicate-suspect-id',
      `Suspect ids must be unique; duplicated: ${[...duplicates].join(', ')}.`,
    )
  }

  // Exactly one culprit whose id matches culpritId.
  const culprits = suspects.filter((s) => s.isCulprit)
  if (culprits.length === 0) {
    add('no-culprit', 'No suspect is marked isCulprit; a case needs exactly one.')
  } else if (culprits.length > 1) {
    add(
      'multiple-culprits',
      `Exactly one culprit expected, found ${culprits.length}: ${culprits
        .map((s) => s.suspectId)
        .join(', ')}.`,
    )
  } else if (culprits[0].suspectId !== caseFile.culpritId) {
    add(
      'culprit-id-mismatch',
      `The suspect flagged isCulprit (${culprits[0].suspectId}) does not match culpritId (${caseFile.culpritId}).`,
    )
  }

  // culpritId must reference a real suspect.
  if (!knownIds.has(caseFile.culpritId)) {
    add(
      'culprit-unknown-suspect',
      `culpritId "${caseFile.culpritId}" does not match any suspect.`,
    )
  }

  // Planted memory must reference a real suspect.
  if (caseFile.plantedMemory && !knownIds.has(caseFile.plantedMemory.suspectId)) {
    add(
      'planted-memory-unknown-suspect',
      `plantedMemory.suspectId "${caseFile.plantedMemory.suspectId}" does not match any suspect.`,
    )
  }

  // Evidence must reference real suspects.
  for (const evidence of caseFile.evidence ?? []) {
    for (const id of evidence.implicatesSuspectIds ?? []) {
      if (!knownIds.has(id)) {
        add(
          'evidence-unknown-suspect',
          `Evidence "${evidence.id}" implicates unknown suspect "${id}".`,
        )
      }
    }
  }

  // Timeline events must reference real suspects.
  for (const event of caseFile.timeline ?? []) {
    for (const id of event.suspectIds ?? []) {
      if (!knownIds.has(id)) {
        add(
          'timeline-unknown-suspect',
          `Timeline event at "${event.time}" references unknown suspect "${id}".`,
        )
      }
    }
  }

  // At least one evidence contradiction must implicate the culprit, otherwise
  // the case is not solvable by cornering the culprit on a contradiction.
  const hasCulpritContradiction = (caseFile.evidence ?? []).some(
    (evidence) =>
      typeof evidence.contradictsClaim === 'string' &&
      evidence.contradictsClaim.length > 0 &&
      (evidence.implicatesSuspectIds ?? []).includes(caseFile.culpritId),
  )
  if (!hasCulpritContradiction) {
    add(
      'no-contradiction',
      'No evidence with a contradictsClaim implicates the culprit; the case is unsolvable.',
    )
  }

  // Solution must point at the same culprit.
  if (caseFile.solution?.culpritId !== caseFile.culpritId) {
    add(
      'solution-mismatch',
      `solution.culpritId "${caseFile.solution?.culpritId}" does not match culpritId "${caseFile.culpritId}".`,
    )
  }

  // Suspect count must be within the difficulty target.
  const target = SUSPECT_COUNT_TARGETS[caseFile.difficulty]
  if (target) {
    if (suspects.length < target.min || suspects.length > target.max) {
      const range =
        target.min === target.max
          ? `${target.min}`
          : `${target.min}-${target.max}`
      add(
        'suspect-count',
        `Difficulty "${caseFile.difficulty}" expects ${range} suspects, found ${suspects.length}.`,
      )
    }
  } else {
    add(
      'unknown-difficulty',
      `Unknown difficulty "${caseFile.difficulty}".`,
    )
  }

  return { ok: issues.length === 0, issues }
}
