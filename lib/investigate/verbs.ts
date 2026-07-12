import type { SupermemoryClient } from '../supermemory/types.js'
import type { AnthropicClientLike } from '../anthropic/types.js'
import type { RetrievedMemory } from '../suspect/respond.js'
import {
  DETECTIVE_CONTAINER_TAG,
  WORLD_CONTAINER_TAG,
  suspectContainerTag
} from '../case/types.js'

// The investigation verbs. Three of them (cctv/phone/forensics) are "pull"
// verbs: they search the shared world-evidence container for facts of that
// kind, ask Claude to summarize what they found, and file that summary into the
// detective's own case memory so it shows up in the Notebook and feeds the
// rating. The fourth (present-evidence) is a "push" verb: it writes a chosen
// fact into a suspect's private memory so the suspect's next spoken line has to
// reckon with it. This is what makes the memory store genuinely multi-source:
// the detective learns from the world, and the suspect is confronted with it.
export type VerbKind = 'present-evidence' | 'cctv' | 'phone' | 'forensics'

export interface VerbInput {
  kind: VerbKind
  query: string
  suspectId?: string
  location?: string
  timeWindow?: string
  fact?: string
}

export interface VerbResult {
  fact: string
  evidenceId?: string
  retrieved: RetrievedMemory[]
}

export interface VerbDeps {
  supermemory: SupermemoryClient
  anthropic: AnthropicClientLike
}

const PULL_KINDS: ReadonlyArray<VerbKind> = ['cctv', 'phone', 'forensics']

function labelFor(kind: VerbKind): string {
  switch (kind) {
    case 'cctv':
      return 'CCTV footage'
    case 'phone':
      return 'phone records'
    case 'forensics':
      return 'forensic evidence'
    default:
      return 'evidence'
  }
}

function buildSummarySystemPrompt(kind: VerbKind): string {
  return [
    'You are a forensic analyst briefing a detective during a live investigation.',
    `You are reviewing ${labelFor(kind)}.`,
    'Summarize the retrieved evidence into a single, concrete factual sentence the detective can act on.',
    'State only what the evidence supports. If there is no relevant evidence, say so plainly in one sentence.',
    'Do not speculate, moralize, or add commentary.'
  ].join('\n')
}

function buildSummaryUserMessage(input: VerbInput, memories: RetrievedMemory[]): string {
  const scope = [
    input.location ? `Location: ${input.location}` : null,
    input.timeWindow ? `Time window: ${input.timeWindow}` : null
  ]
    .filter(Boolean)
    .join('\n')

  const evidenceBlock =
    memories.length > 0
      ? memories.map((m) => `- ${m.content}`).join('\n')
      : '(no matching evidence was found in the record)'

  return [
    `Detective's request: ${input.query || '(general pull)'}`,
    scope,
    '',
    'Retrieved evidence:',
    evidenceBlock
  ]
    .filter((line) => line !== null)
    .join('\n')
}

/**
 * Run a single investigation verb.
 *
 * cctv/phone/forensics: search WORLD_CONTAINER_TAG for the query, keep only the
 * memories whose kind matches this verb, summarize them via Claude, then write
 * that summary into DETECTIVE_CONTAINER_TAG with metadata {source:'verb', kind}.
 * The summary is returned as the fact and the raw matches as `retrieved`.
 *
 * present-evidence: write input.fact into the target suspect's container with
 * metadata {source:'evidence-shown'} so their next answer must react to it.
 * Never touches the detective container and never calls the summarizer.
 */
export async function runVerb(input: VerbInput, deps: VerbDeps): Promise<VerbResult> {
  if (input.kind === 'present-evidence') {
    const fact = (input.fact ?? '').trim()
    if (!input.suspectId) {
      throw new Error('present-evidence requires a suspectId')
    }
    if (fact.length === 0) {
      throw new Error('present-evidence requires a fact to show the suspect')
    }

    const written = await deps.supermemory.writeMemory({
      content: fact,
      containerTag: suspectContainerTag(input.suspectId),
      metadata: { source: 'evidence-shown' }
    })

    return { fact, evidenceId: written.id, retrieved: [] }
  }

  // Pull verb: search the shared world evidence, scoped by kind. Supermemory
  // rejects an empty search query (400), so when the detective pulls a source
  // without typing a detail, fall back to a query describing that source — a
  // bare "CCTV" click should still surface the camera evidence.
  const defaultQueries: Record<string, string> = {
    cctv: 'camera footage location time',
    phone: 'phone call records number',
    forensics: 'forensic evidence findings',
    financial: 'financial records money motive',
    background: 'background history relationship',
    object: 'physical object found at the scene'
  }
  const q = input.query.trim() || defaultQueries[input.kind] || 'evidence'
  const searchResult = await deps.supermemory.search({
    q,
    containerTag: WORLD_CONTAINER_TAG,
    searchMode: 'hybrid',
    // Low threshold so broad investigative queries still surface evidence; the
    // higher limit leaves candidates to post-filter by kind below.
    threshold: 0.3,
    limit: 12
  })

  const retrieved: RetrievedMemory[] = searchResult.results
    .filter((item) => item.metadata?.kind === input.kind)
    .map((item) => ({ id: item.id, content: item.content }))

  const fact = await deps.anthropic.createMessage({
    system: buildSummarySystemPrompt(input.kind),
    userMessage: buildSummaryUserMessage(input, retrieved)
  })

  await deps.supermemory.writeMemory({
    content: fact,
    containerTag: DETECTIVE_CONTAINER_TAG,
    metadata: { source: 'verb', kind: input.kind }
  })

  return { fact, retrieved }
}

export function isVerbKind(value: unknown): value is VerbKind {
  return (
    value === 'present-evidence' ||
    PULL_KINDS.includes(value as VerbKind)
  )
}
