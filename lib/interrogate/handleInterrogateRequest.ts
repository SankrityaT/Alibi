import type { SupermemoryClient } from '../supermemory/types.js'
import type { AnthropicClientLike } from '../anthropic/types.js'
import type { CharacterSheet } from '../suspect/respond.js'
import { respondAsSuspect } from '../suspect/respond.js'

export interface InterrogateDeps {
  supermemory: SupermemoryClient
  anthropic: AnthropicClientLike
  suspects: Record<string, CharacterSheet>
}

export interface InterrogateResult {
  status: number
  body: Record<string, unknown>
}

function isValidBody(body: unknown): body is { suspectId: string; question: string } {
  if (typeof body !== 'object' || body === null) {
    return false
  }
  const candidate = body as Record<string, unknown>
  return typeof candidate.suspectId === 'string'
}

export async function handleInterrogateRequest(
  body: unknown,
  deps: InterrogateDeps
): Promise<InterrogateResult> {
  if (!isValidBody(body)) {
    return { status: 400, body: { error: 'Missing or invalid "suspectId"' } }
  }

  const { suspectId, question } = body as { suspectId: string; question: unknown }

  if (typeof question !== 'string' || question.trim().length === 0) {
    return { status: 400, body: { error: 'Missing or invalid "question"' } }
  }

  const characterSheet = deps.suspects[suspectId]
  if (!characterSheet) {
    return { status: 404, body: { error: `Unknown suspect: ${suspectId}` } }
  }

  const result = await respondAsSuspect(characterSheet, question, {
    supermemory: deps.supermemory,
    anthropic: deps.anthropic
  })

  return {
    status: 200,
    body: {
      answer: result.answer,
      query: result.query,
      retrievedMemories: result.retrievedMemories
    }
  }
}
