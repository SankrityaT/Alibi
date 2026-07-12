import type { Difficulty } from '../case/types.js'

// The raw record of how a single case was solved, assembled by handleAccuse from
// the accusation body + the active CaseFile. A pure value: computeRating turns it
// into a DetectiveRating with no I/O so it is trivially testable and reusable
// (leaderboards, replays) outside the HTTP layer.
export interface CaseMoveTrail {
  difficulty: Difficulty
  movesUsed: number
  accusedCulpritId: string
  correctCulpritId: string
  identifiedPlantedMemory: boolean
  fooledByRedHerring: boolean
  elapsedSeconds?: number
}

export interface DetectiveRating {
  correct: boolean
  basePoints: number
  rank: string
  summary: string
}

// Difficulty base points, awarded only when the right culprit is named.
const BASE_POINTS: Record<Difficulty, number> = { easy: 10, medium: 20, hard: 30 }

// Ordered low -> high so callers can compare two ranks by index.
export const DETECTIVE_RANKS = ['Rookie', 'Detective', 'Inspector', 'Chief'] as const

// A solve is "efficient" at or under this many investigation moves. Kept
// generous so a thorough-but-focused player still earns the efficiency point.
const EFFICIENT_MOVE_LIMIT = 6

/**
 * Convert a case's move trail into a Detective Rating. Pure and deterministic.
 *
 * Base points come purely from difficulty (10/20/30) and are only awarded on a
 * correct accusation. The *rank* layers craft on top of correctness: naming the
 * culprit is table stakes (Detective), correctly fingering the planted memory
 * and solving efficiently each raise you a tier, and being fooled by a red
 * herring (or your own planted lie) knocks you back down. Any wrong accusation
 * is a Rookie result regardless of the other signals.
 */
export function computeRating(trail: CaseMoveTrail): DetectiveRating {
  const correct = trail.accusedCulpritId === trail.correctCulpritId
  const basePoints = correct ? BASE_POINTS[trail.difficulty] : 0

  if (!correct) {
    return {
      correct: false,
      basePoints: 0,
      rank: 'Rookie',
      summary:
        'Wrong call, detective. The real culprit walked free — no points on the board. Back to the beat.'
    }
  }

  // Correct culprit: start at Detective (index 1), then adjust by craft.
  let score = 1
  if (trail.identifiedPlantedMemory) score += 1
  if (trail.movesUsed <= EFFICIENT_MOVE_LIMIT) score += 1
  if (trail.fooledByRedHerring) score -= 1

  const index = Math.max(0, Math.min(score, DETECTIVE_RANKS.length - 1))
  const rank = DETECTIVE_RANKS[index]

  const notes: string[] = []
  notes.push(
    trail.identifiedPlantedMemory
      ? 'You exposed the planted memory for the fabrication it was.'
      : 'You got your suspect, but the planted memory slipped past you.'
  )
  if (trail.movesUsed <= EFFICIENT_MOVE_LIMIT) {
    notes.push(`Tight work — only ${trail.movesUsed} moves.`)
  }
  if (trail.fooledByRedHerring) {
    notes.push('A red herring nearly had you, though.')
  }

  const summary = `Case closed. Rank: ${rank} — ${basePoints} points. ${notes.join(' ')}`

  return { correct: true, basePoints, rank, summary }
}
