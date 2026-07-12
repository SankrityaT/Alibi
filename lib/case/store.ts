import type { CharacterSheet } from '../suspect/respond.js'
import type { CaseFile } from './types.js'
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
