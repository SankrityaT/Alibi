import type { SupermemoryClient } from '../supermemory/types.js'
import type { AnthropicClientLike } from '../anthropic/types.js'
import { DETECTIVE_CONTAINER_TAG, WORLD_CONTAINER_TAG } from '../case/types.js'
import { getActiveCase } from '../case/store.js'

// The Case Notebook is the load-bearing "why Supermemory" proof. A single
// free-form question is answered by searching the detective's own accumulated
// case memory AND every active suspect's private memory, then handing the merged
// evidence to Claude to synthesize one answer with inline [n] citation markers.
// Every returned fact carries the container it came from, so the player can see
// the answer is genuinely stitched together across suspects — something only a
// persistent, multi-container memory store makes possible.

export interface NotebookCitation {
  id: string
  content: string
  source: string
  containerTag: string
}

export interface NotebookAnswer {
  query: string
  answer: string
  citations: NotebookCitation[]
}

export interface NotebookDeps {
  supermemory: SupermemoryClient
  anthropic: AnthropicClientLike
}

/**
 * Default set of containers a Notebook question searches: the detective's own
 * case notebook plus every suspect container in the live active case. Falls back
 * to just the detective container when no game has been started yet.
 */
export function defaultNotebookContainers(): string[] {
  const activeCase = getActiveCase()
  const suspectTags = activeCase ? activeCase.suspects.map((suspect) => suspect.containerTag) : []
  // The world-evidence container is included so the Notebook can synthesize
  // across ALL dug-up evidence — including the kinds no pull verb surfaces
  // directly (financial/background/object). Without it the decisive motive clue
  // (e.g. a suspect's gambling debt) is seeded but unreachable, and the case
  // isn't solvable.
  return [DETECTIVE_CONTAINER_TAG, WORLD_CONTAINER_TAG, ...suspectTags]
}

function capitalize(value: string): string {
  if (value.length === 0) {
    return value
  }
  return value.charAt(0).toUpperCase() + value.slice(1)
}

/**
 * Human-readable "where did this fact come from" label for a citation, derived
 * from the container it was retrieved from plus any stored provenance metadata
 * (which verb produced a detective note, or that a fact was evidence shown to a
 * suspect).
 */
export function citationSource(
  containerTag: string,
  metadata: Record<string, unknown> | undefined
): string {
  if (containerTag === DETECTIVE_CONTAINER_TAG) {
    const kind = metadata?.kind
    if (typeof kind === 'string' && kind.length > 0) {
      return `Detective notebook (${kind})`
    }
    return 'Detective notebook'
  }

  if (containerTag === WORLD_CONTAINER_TAG) {
    const kind = metadata?.kind
    if (typeof kind === 'string' && kind.length > 0) {
      return `World evidence (${kind})`
    }
    return 'World evidence'
  }

  if (containerTag.startsWith('suspect-')) {
    const suspectId = containerTag.slice('suspect-'.length)
    const provenance = metadata?.source
    if (provenance === 'evidence-shown') {
      return `Suspect: ${capitalize(suspectId)} (evidence shown)`
    }
    return `Suspect: ${capitalize(suspectId)}`
  }

  return containerTag
}

function buildNotebookSystemPrompt(): string {
  return [
    'You are the detective\'s case notebook, synthesizing memories gathered across an investigation.',
    'You are given numbered memories retrieved from the detective\'s own notes and from individual suspects.',
    'Answer the detective\'s question in a few concise sentences, weaving together facts from different sources.',
    'Cite every claim with the matching [n] marker(s) from the memory list. Do not cite memories you did not use.',
    'Only state what the retrieved memories support. If they do not answer the question, say so plainly.',
    'Do not invent facts, speculate, or moralize.'
  ].join('\n')
}

function buildNotebookUserMessage(query: string, citations: NotebookCitation[]): string {
  const block =
    citations.length > 0
      ? citations
          .map((citation, index) => `[${index + 1}] (${citation.source}) ${citation.content}`)
          .join('\n')
      : '(no memories were retrieved from any container)'

  return [
    `Detective's notebook question: ${query}`,
    '',
    'Retrieved memories from across the case (cite these by their [n] marker):',
    block
  ].join('\n')
}

/**
 * Answer a free-form Notebook question. Searches each container in turn (default:
 * detective + every active suspect), merges the retrieved memories into an
 * ordered citation list, and asks Claude to synthesize a single cited answer.
 */
export async function askNotebook(
  query: string,
  deps: NotebookDeps,
  opts?: { containerTags?: string[] }
): Promise<NotebookAnswer> {
  const containerTags = opts?.containerTags ?? defaultNotebookContainers()

  const citations: NotebookCitation[] = []
  for (const containerTag of containerTags) {
    const searchResult = await deps.supermemory.search({
      q: query,
      containerTag,
      searchMode: 'hybrid'
    })
    for (const item of searchResult.results) {
      citations.push({
        id: item.id,
        content: item.content,
        source: citationSource(containerTag, item.metadata),
        containerTag
      })
    }
  }

  const answer = await deps.anthropic.createMessage({
    system: buildNotebookSystemPrompt(),
    userMessage: buildNotebookUserMessage(query, citations)
  })

  return { query, answer, citations }
}
