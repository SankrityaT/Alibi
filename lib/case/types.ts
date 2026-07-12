export type Difficulty = 'easy' | 'medium' | 'hard'

export interface CaseSuspect {
  suspectId: string
  name: string
  containerTag: string
  voice: string
  ttsVoice: string
  motive: string
  secret: string
  incriminatingFact: string
  groundTruth: string[]
  isCulprit: boolean
  isRedHerring?: boolean
}

export interface TimelineEvent {
  time: string
  location: string
  description: string
  suspectIds: string[]
}

export type EvidenceKind =
  | 'cctv'
  | 'phone'
  | 'forensics'
  | 'financial'
  | 'background'
  | 'object'

export interface Evidence {
  id: string
  kind: EvidenceKind
  location?: string
  timeWindow?: string
  summary: string
  implicatesSuspectIds: string[]
  contradictsClaim?: string
}

export interface PlantedMemory {
  suspectId: string
  content: string
  fabricatedClaim: string
}

export interface CaseFile {
  id: string
  difficulty: Difficulty
  title: string
  synopsis: string
  crime: string
  suspects: CaseSuspect[]
  timeline: TimelineEvent[]
  evidence: Evidence[]
  culpritId: string
  plantedMemory: PlantedMemory
  worldFacts: string[]
  solution: {
    culpritId: string
    plantedMemoryClaim: string
    explanation: string
  }
}

export const DETECTIVE_CONTAINER_TAG = 'detective-case'
export const WORLD_CONTAINER_TAG = 'world-evidence'
export const PLANTED_BY_CULPRIT_TAG = 'planted-by-culprit'

export function suspectContainerTag(suspectId: string): string {
  return `suspect-${suspectId}`
}
