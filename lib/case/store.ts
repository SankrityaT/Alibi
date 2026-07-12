import type { CharacterSheet } from '../suspect/respond.js'
import type { CaseFile, Difficulty } from './types.js'
import { caseToRegistry } from './toRegistry.js'
import { fallbackCase } from '../../content/cases/fallbackCase.js'

// Active-case store. A single game is "live" per server process: the new-game
// endpoint seeds a CaseFile and sets it active here, and the interrogate /
// notebook / accuse / case routes read from it.
//
// The state lives on globalThis, NOT a module-level `let`. In Next.js each API
// route is bundled into its own module graph, so a plain module-level variable
// set by /api/new-game is invisible to /api/interrogate — they'd each see their
// own copy (and fall back to the authored case). globalThis is the single shared
// object across every route in the one server process, so the active case set by
// one route is seen by all of them. (Same reason Prisma/DB singletons use it.)
interface AlibiGlobal {
  __alibiActiveCase?: CaseFile | null
}
const alibiGlobal = globalThis as unknown as AlibiGlobal

export function setActiveCase(caseFile: CaseFile): void {
  alibiGlobal.__alibiActiveCase = caseFile
}

export function getActiveCase(): CaseFile | null {
  return alibiGlobal.__alibiActiveCase ?? null
}

// Suspect registry the interrogate route consumes. Falls back to the
// hand-authored case when no game has been started yet, so a stray interrogate
// request before /api/new-game still resolves a known suspect instead of 404ing
// on an empty registry.
export function getActiveRegistry(): Record<string, CharacterSheet> {
  return caseToRegistry(getActiveCase() ?? fallbackCase)
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
  const active = getActiveCase()
  const source = active ?? fallbackCase
  return {
    started: active !== null,
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
