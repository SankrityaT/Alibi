import type { SupermemoryClient } from '../supermemory/types.js'
import type { CaseMoveTrail } from '../rating/rating.js'
import { computeRating } from '../rating/rating.js'
import { DETECTIVE_CONTAINER_TAG } from './types.js'
import { getActiveCase } from './store.js'
import { fallbackCase } from '../../content/cases/fallbackCase.js'

export interface AccuseDeps {
  supermemory: SupermemoryClient
}

export interface AccuseResult {
  status: number
  body: Record<string, unknown>
}

function asRecord(body: unknown): Record<string, unknown> {
  return typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {}
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function claimsMatch(a: string | undefined, b: string): boolean {
  if (!a) return false
  return a.trim().toLowerCase() === b.trim().toLowerCase()
}

/**
 * Close the case: score an accusation against the active CaseFile.
 *
 * The active case is the single source of truth for who did it, what the
 * planted memory claimed, and the difficulty (which sets base points). We derive
 * two craft signals the rating cares about beyond "right culprit?":
 *  - identifiedPlantedMemory: did the accusedPlantedClaim match the solution's
 *    plantedMemoryClaim (the fabricated alibi the culprit seeded into memory)?
 *  - fooledByRedHerring: did the player accuse a suspect flagged as a red herring
 *    (their designed-to-mislead innocent)?
 *
 * Falls back to the hand-authored case when no game is active so an accusation
 * before /api/new-game still resolves — matching getActiveRegistry's behaviour.
 * A best-effort verdict note is written to the detective's memory container for
 * the notebook; a memory failure never blocks the verdict.
 */
export async function handleAccuse(body: unknown, deps: AccuseDeps): Promise<AccuseResult> {
  const record = asRecord(body)
  const accusedCulpritId = optionalString(record.accusedCulpritId)

  if (!accusedCulpritId || accusedCulpritId.trim().length === 0) {
    return { status: 400, body: { error: 'Missing required "accusedCulpritId".' } }
  }

  const accusedPlantedClaim = optionalString(record.accusedPlantedClaim)
  const movesUsed = typeof record.movesUsed === 'number' ? record.movesUsed : 0
  const elapsedSeconds =
    typeof record.elapsedSeconds === 'number' ? record.elapsedSeconds : undefined

  const caseFile = getActiveCase() ?? fallbackCase
  const solution = caseFile.solution

  const identifiedPlantedMemory = claimsMatch(accusedPlantedClaim, solution.plantedMemoryClaim)
  const accusedSuspect = caseFile.suspects.find((s) => s.suspectId === accusedCulpritId)
  const fooledByRedHerring = accusedSuspect?.isRedHerring === true

  const trail: CaseMoveTrail = {
    difficulty: caseFile.difficulty,
    movesUsed,
    accusedCulpritId,
    correctCulpritId: solution.culpritId,
    identifiedPlantedMemory,
    fooledByRedHerring,
    elapsedSeconds
  }

  const rating = computeRating(trail)

  // Best-effort: record the verdict so the notebook can show how the case ended.
  // Swallow any failure — the score stands even if memory is down or disabled.
  try {
    await deps.supermemory.writeMemory({
      content: `Accused ${accusedCulpritId}. Verdict: ${
        rating.correct ? 'correct' : 'wrong'
      }. Rank ${rating.rank}, ${rating.basePoints} points.`,
      containerTag: DETECTIVE_CONTAINER_TAG,
      metadata: {
        kind: 'verdict',
        accusedCulpritId,
        correct: rating.correct,
        rank: rating.rank,
        basePoints: rating.basePoints
      }
    })
  } catch {
    // ignore — verdict is authoritative regardless of memory persistence
  }

  return {
    status: 200,
    body: {
      rating,
      culpritId: solution.culpritId,
      plantedMemoryClaim: solution.plantedMemoryClaim,
      explanation: solution.explanation,
      identifiedPlantedMemory,
      fooledByRedHerring
    }
  }
}
