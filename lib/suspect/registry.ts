import type { CharacterSheet } from './respond.js'

// Placeholder content for Plan 3 (interrogation UI plumbing) only. A later
// plan replaces this with the full Case 1 cast and ground-truth data.
export const suspects: Record<string, CharacterSheet> = {
  mara: {
    suspectId: 'mara',
    containerTag: 'suspect-mara',
    name: 'Mara Okafor',
    voice: 'clipped, professional, deflects with procedure',
    motive: 'covering up the reroute she made at 21:45',
    hiddenFacts: 'She edited the dispatch log to reroute Theo at 21:45.'
  }
}
