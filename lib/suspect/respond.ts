import type { SupermemoryClient } from '../supermemory/types.js'
import type { AnthropicClientLike } from '../anthropic/types.js'

export interface CharacterSheet {
  suspectId: string
  containerTag: string
  name: string
  voice: string
  motive: string
  hiddenFacts: string
  ttsVoice?: string
}

export interface RetrievedMemory {
  id: string
  content: string
}

export interface RespondResult {
  answer: string
  query: string
  retrievedMemories: RetrievedMemory[]
}

function buildSystemPrompt(sheet: CharacterSheet): string {
  return [
    `You are ${sheet.name}, a suspect being interrogated by a detective.`,
    `Voice: ${sheet.voice}`,
    `Motive: ${sheet.motive}`,
    `What you're hiding: ${sheet.hiddenFacts}`,
    'Only answer using the memories provided below. If nothing relevant is provided, say you genuinely do not know or remember - do not invent facts.'
  ].join('\n')
}

function buildUserMessage(question: string, memories: RetrievedMemory[]): string {
  const memoryBlock =
    memories.length > 0
      ? memories.map((memory) => `- ${memory.content}`).join('\n')
      : '(no relevant memories found)'
  return `Your memories relevant to this question:\n${memoryBlock}\n\nThe detective asks: "${question}"`
}

export async function respondAsSuspect(
  characterSheet: CharacterSheet,
  question: string,
  deps: { supermemory: SupermemoryClient; anthropic: AnthropicClientLike }
): Promise<RespondResult> {
  const searchResult = await deps.supermemory.search({
    q: question,
    containerTag: characterSheet.containerTag,
    searchMode: 'hybrid',
    // Low threshold + capped limit: always surface the suspect's most relevant
    // memories even for broad questions, without flooding the prompt. Above the
    // default cutoff (~0.55) a generic question returns nothing and the suspect
    // wrongly claims amnesia.
    threshold: 0.3,
    limit: 6
  })

  const retrievedMemories: RetrievedMemory[] = searchResult.results.map((item) => ({
    id: item.id,
    content: item.content
  }))

  const answer = await deps.anthropic.createMessage({
    system: buildSystemPrompt(characterSheet),
    userMessage: buildUserMessage(question, retrievedMemories)
  })

  return { answer, query: question, retrievedMemories }
}
