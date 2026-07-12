import type { AnthropicClientLike } from '../anthropic/types.js'
import type { SupermemoryClient } from '../supermemory/types.js'
import type { CaseFile, Difficulty } from './types.js'
import { generateCase } from './generate.js'
import { seedCase } from './seed.js'
import { validateCase } from './validate.js'
import { setActiveCase } from './store.js'
import { fallbackCase } from '../../content/cases/fallbackCase.js'

export interface NewGameDeps {
  anthropic: AnthropicClientLike
  supermemory: SupermemoryClient
  generate?: typeof generateCase
  seed?: typeof seedCase
  fallback?: CaseFile
}

export interface NewGameResult {
  status: number
  body: Record<string, unknown>
}

const VALID_DIFFICULTIES: readonly Difficulty[] = ['easy', 'medium', 'hard']

function isDifficulty(value: unknown): value is Difficulty {
  return typeof value === 'string' && VALID_DIFFICULTIES.includes(value as Difficulty)
}

/**
 * Start a new game: pick a CaseFile (generate one, or use the hand-validated
 * fallback on request or on any generation failure), validate it, seed it into
 * Supermemory, set it as the active case, and return the suspect roster for the
 * UI.
 *
 * Generation is best-effort by design — the demo must never hard-fail on a bad
 * model reply, so ANY error (or an invalid generated case) degrades to the
 * fallback rather than surfacing a 500. Only a malformed request (bad
 * difficulty) is a 400.
 */
export async function handleNewGame(
  body: unknown,
  deps: NewGameDeps
): Promise<NewGameResult> {
  const record =
    typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {}

  if (!isDifficulty(record.difficulty)) {
    return {
      status: 400,
      body: {
        error: `Invalid or missing "difficulty"; expected one of ${VALID_DIFFICULTIES.join(', ')}.`
      }
    }
  }
  const difficulty = record.difficulty
  const useFallback = record.useFallback === true

  const generate = deps.generate ?? generateCase
  const seed = deps.seed ?? seedCase
  const fallback = deps.fallback ?? fallbackCase

  let caseFile: CaseFile
  if (useFallback) {
    caseFile = fallback
  } else {
    try {
      const generated = await generate({ difficulty }, { anthropic: deps.anthropic })
      caseFile = validateCase(generated).ok ? generated : fallback
    } catch {
      caseFile = fallback
    }
  }

  await seed(caseFile, { supermemory: deps.supermemory })
  setActiveCase(caseFile)

  return {
    status: 200,
    body: {
      caseId: caseFile.id,
      difficulty: caseFile.difficulty,
      title: caseFile.title,
      synopsis: caseFile.synopsis,
      suspects: caseFile.suspects.map((s) => ({
        suspectId: s.suspectId,
        name: s.name,
        ttsVoice: s.ttsVoice
      }))
    }
  }
}
