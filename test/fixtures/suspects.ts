import type { CharacterSheet } from '../../lib/suspect/respond.js'

export const mara: CharacterSheet = {
  suspectId: 'mara',
  containerTag: 'suspect-mara',
  name: 'Mara Okafor',
  voice: 'clipped, professional, deflects with procedure',
  motive: "covering up the reroute she made at 21:45",
  hiddenFacts: "She edited the dispatch log to reroute Theo at 21:45."
}

export const jonas: CharacterSheet = {
  suspectId: 'jonas',
  containerTag: 'suspect-jonas',
  name: 'Jonas Marsh',
  voice: 'nervous, over-explains',
  motive: 'hiding that he was at the docks to meet Theo for money',
  hiddenFacts: 'He was at the docks at 22:00, not home.'
}
