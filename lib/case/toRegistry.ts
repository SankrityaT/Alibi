import type { CharacterSheet } from '../suspect/respond.js'
import type { CaseFile, CaseSuspect } from './types.js'

function suspectToCharacterSheet(suspect: CaseSuspect): CharacterSheet {
  return {
    suspectId: suspect.suspectId,
    containerTag: suspect.containerTag,
    name: suspect.name,
    voice: suspect.voice,
    motive: suspect.motive,
    hiddenFacts: `${suspect.secret} ${suspect.incriminatingFact}`.trim(),
    ttsVoice: suspect.ttsVoice
  }
}

export function caseToRegistry(caseFile: CaseFile): Record<string, CharacterSheet> {
  const registry: Record<string, CharacterSheet> = {}
  for (const suspect of caseFile.suspects) {
    registry[suspect.suspectId] = suspectToCharacterSheet(suspect)
  }
  return registry
}
