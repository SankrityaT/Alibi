import type { AnthropicClientLike } from '../anthropic/types.js'

export interface SuggestTurn {
  question: string
  answer: string
}

export interface SuggestInput {
  suspectName: string
  crime: string
  synopsis: string
  transcript: SuggestTurn[]
}

export interface SuggestDeps {
  anthropic: AnthropicClientLike
}

const SYSTEM_PROMPT = `You assist a detective interrogating a suspect in a noir murder mystery.
Propose the three sharpest questions to ask next. Return ONLY a JSON array of exactly 3
short question strings (max ~12 words each), nothing else. Vary them:
1) press an inconsistency or the suspect's alibi/whereabouts,
2) chase physical evidence — CCTV footage, phone records, forensics, an object, or a timing,
3) probe motive or a relationship.
Questions must fit the case and the conversation so far. No preamble, no numbering, no keys.`

export function buildSuggestUserMessage(input: SuggestInput): string {
  const recent = input.transcript
    .slice(-4)
    .map((t) => `Q: ${t.question}\nA: ${t.answer}`)
    .join('\n')
  return [
    `Crime: ${input.crime}`,
    `Context: ${input.synopsis}`,
    `Suspect: ${input.suspectName}`,
    '',
    'Conversation so far:',
    recent || '(none yet)',
    '',
    'Return 3 next questions as a JSON array of strings.'
  ].join('\n')
}

// Pull a JSON array of strings out of the model reply, tolerating stray prose
// or code fences around it. Returns at most 3 non-empty, trimmed questions.
export function parseSuggestedQuestions(raw: string): string[] {
  const match = raw.match(/\[[\s\S]*\]/)
  if (!match) return []
  try {
    const parsed: unknown = JSON.parse(match[0])
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((x): x is string => typeof x === 'string')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .slice(0, 3)
  } catch {
    return []
  }
}

export async function suggestQuestions(input: SuggestInput, deps: SuggestDeps): Promise<string[]> {
  const raw = await deps.anthropic.createMessage({
    system: SYSTEM_PROMPT,
    userMessage: buildSuggestUserMessage(input)
  })
  return parseSuggestedQuestions(raw)
}
