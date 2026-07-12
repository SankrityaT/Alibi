import type { CharacterSheet } from '../suspect/respond.js'
import type { CaseFile, Difficulty } from './types.js'
import { caseToRegistry } from './toRegistry.js'
import { fallbackCase } from '../../content/cases/fallbackCase.js'

// In-memory active-case store. A single game is "live" per server process: the
// new-game endpoint seeds a CaseFile and sets it active here, and the
// interrogate route reads the derived suspect registry from it. Deliberately
// module-level (not a DB) — the demo runs one case at a time and needs no
// persistence across restarts.
let activeCase: CaseFile | null = null

export function setActiveCase(caseFile: CaseFile): void {
  activeCase = caseFile
}

export function getActiveCase(): CaseFile | null {
  return activeCase
}

// Suspect registry the interrogate route consumes. Falls back to the
// hand-authored case when no game has been started yet, so a stray interrogate
// request before /api/new-game still resolves a known suspect instead of 404ing
// on an empty registry.
export function getActiveRegistry(): Record<string, CharacterSheet> {
  return caseToRegistry(activeCase ?? fallbackCase)
}

export interface PublicSuspect {
  suspectId: string
  name: string
  ttsVoice?: string
}

export interface PublicCase {
  started: boolean
  caseId: string
  title: string
  synopsis: string
  difficulty: Difficulty
  suspects: PublicSuspect[]
}

/**
 * The client-safe view of the active case: suspect roster + framing, and
 * crucially NO `solution` (culprit, planted claim, explanation). Client screens
 * (station nav, the accusation roster) read this instead of importing the case
 * object directly, so the answer never ships in the browser bundle. Falls back
 * to the hand-authored case's public fields when no game has been started, with
 * `started: false` so the UI can prompt the player to begin one.
 */
export function getActivePublicCase(): PublicCase {
  const source = activeCase ?? fallbackCase
  return {
    started: activeCase !== null,
    caseId: source.id,
    title: source.title,
    synopsis: source.synopsis,
    difficulty: source.difficulty,
    suspects: source.suspects.map((s) => ({
      suspectId: s.suspectId,
      name: s.name,
      ttsVoice: s.ttsVoice
    }))
  }
}
