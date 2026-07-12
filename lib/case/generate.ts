import type { AnthropicClientLike } from '../anthropic/types.js'
import type { CaseFile, Difficulty } from './types.js'
import { validateCase, type ValidationResult } from './validate.js'

export interface GenerateCaseParams {
  difficulty: Difficulty
  seed?: string
}

export interface GenerateCaseDeps {
  anthropic: AnthropicClientLike
  validate?: (c: CaseFile) => ValidationResult
  maxAttempts?: number
}

// Thrown when the model never produced a valid CaseFile within maxAttempts.
// Callers (e.g. the case route) catch this and fall back to the hand-authored
// fallbackCase so the demo never hard-fails on a bad generation.
export class CaseGenerationError extends Error {
  readonly attempts: number
  readonly failures: string[]

  constructor(message: string, attempts: number, failures: string[]) {
    super(message)
    this.name = 'CaseGenerationError'
    this.attempts = attempts
    this.failures = failures
  }
}

const DEFAULT_MAX_ATTEMPTS = 3

// Extract the JSON object from a model reply and parse it into a CaseFile.
// Handles three shapes the model tends to emit:
//   1. bare JSON: `{ ... }`
//   2. fenced JSON: ```json\n{ ... }\n```
//   3. JSON embedded in surrounding prose.
// Throws on anything that does not contain a parseable JSON object. This is a
// pure helper (no model, no I/O) so it is unit-testable in isolation.
export function parseCaseJson(text: string): CaseFile {
  const candidate = extractJsonObject(text)
  if (candidate === null) {
    throw new Error(
      'parseCaseJson: no JSON object found in model reply.',
    )
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(candidate)
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    throw new Error(`parseCaseJson: malformed JSON in model reply: ${detail}`)
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('parseCaseJson: parsed value is not a JSON object.')
  }
  return parsed as CaseFile
}

// Returns the substring that looks like a single JSON object, or null. Prefers
// a fenced ```json block, then falls back to the first `{` ... last `}` span.
function extractJsonObject(text: string): string | null {
  const fenced = matchFencedJson(text)
  if (fenced !== null) return fenced

  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end === -1 || end < start) return null
  return text.slice(start, end + 1)
}

function matchFencedJson(text: string): string | null {
  // ```json ... ``` or a bare ``` ... ``` fence.
  const fence = /```(?:json)?\s*([\s\S]*?)```/i.exec(text)
  if (!fence) return null
  const inner = fence[1]
  const start = inner.indexOf('{')
  const end = inner.lastIndexOf('}')
  if (start === -1 || end === -1 || end < start) return null
  return inner.slice(start, end + 1)
}

// Build the (system, userMessage) pair that asks Claude to emit a CaseFile as
// strict JSON matching the schema. Kept separate so the prompt is inspectable
// and testable without a live model.
export function buildCaseGenerationPrompt(
  params: GenerateCaseParams,
): { system: string; userMessage: string } {
  const { difficulty, seed } = params

  const system = [
    'You are the case designer for "Alibi", a detective interrogation game.',
    'You invent a single, internally consistent, SOLVABLE mystery and return it',
    'as ONE JSON object that matches the CaseFile schema exactly.',
    '',
    'Output rules (critical):',
    '- Respond with ONLY the JSON object. No prose, no markdown fences, no commentary.',
    '- Use double-quoted keys and string values. Do not add trailing commas.',
    '- Every id you reference (culpritId, plantedMemory.suspectId, evidence',
    '  implicatesSuspectIds, timeline suspectIds, solution.culpritId) MUST match a',
    '  suspectId that exists in the suspects array.',
    '',
    'Design rules (must all hold or the case is rejected):',
    '- Exactly one suspect has isCulprit=true, and their suspectId equals culpritId',
    '  and solution.culpritId.',
    '- suspectId values are unique, lowercase, single-word.',
    '- The culprit has a plantedMemory (a fabricated alibi) AND at least one piece of',
    '  evidence whose contradictsClaim implicates the culprit, so the case is solvable',
    '  by cornering them on that contradiction.',
    '- Include at least one red herring: an innocent suspect who looks guilty.',
    '',
    'CaseFile schema (TypeScript):',
    CASE_FILE_SCHEMA,
  ].join('\n')

  const suspectGuidance: Record<Difficulty, string> = {
    easy: 'exactly 3 suspects',
    medium: 'exactly 4 suspects',
    hard: '4 or 5 suspects, with denser overlapping alibis',
  }

  const userMessage = [
    `Generate a NEW "${difficulty}" difficulty case with ${suspectGuidance[difficulty]}.`,
    seed
      ? `Use this creative seed for the setting/theme: "${seed}".`
      : 'Invent a fresh setting and crime (do not reuse a museum diamond heist).',
    `Set the top-level "difficulty" field to "${difficulty}".`,
    'Give each suspect a distinct voice, a ttsVoice id, a motive, a secret, an',
    'incriminatingFact, and a groundTruth array of first-person statements.',
    'Keep the case COMPACT so it generates fast: 3 groundTruth statements per',
    'suspect, 3-4 evidence items, 3-4 timeline events, 2-3 worldFacts, and keep',
    'every string to a single concise sentence.',
    'Return ONLY the JSON object.',
  ].join('\n')

  return { system, userMessage }
}

// Generate a CaseFile from Claude: prompt for strict JSON, parse it defensively,
// validate it, and retry up to maxAttempts. Returns the first valid CaseFile.
// Throws CaseGenerationError if none is valid within maxAttempts so callers can
// fall back to the hand-authored case.
export async function generateCase(
  params: GenerateCaseParams,
  deps: GenerateCaseDeps,
): Promise<CaseFile> {
  const validate = deps.validate ?? validateCase
  const maxAttempts =
    deps.maxAttempts && deps.maxAttempts > 0
      ? deps.maxAttempts
      : DEFAULT_MAX_ATTEMPTS

  const { system, userMessage } = buildCaseGenerationPrompt(params)
  const failures: string[] = []

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    let caseFile: CaseFile
    try {
      const reply = await deps.anthropic.createMessage({
        system,
        userMessage,
        model: 'haiku',
        // Bound generation so a wedged subprocess can't hang the loading screen;
        // on timeout this rejects and handleNewGame drops to the authored case.
        timeoutMs: 60_000
      })
      caseFile = parseCaseJson(reply)
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err)
      failures.push(`attempt ${attempt}: parse failed: ${detail}`)
      continue
    }

    const result = validate(caseFile)
    if (result.ok) {
      return caseFile
    }
    const codes = result.issues.map((i) => i.code).join(', ')
    failures.push(`attempt ${attempt}: validation failed: ${codes}`)
  }

  throw new CaseGenerationError(
    `generateCase: no valid CaseFile after ${maxAttempts} attempt(s).`,
    maxAttempts,
    failures,
  )
}

// Inlined so the prompt is self-contained and stays in sync with lib/case/types.
const CASE_FILE_SCHEMA = `interface CaseSuspect {
  suspectId: string; name: string; containerTag: string; voice: string;
  ttsVoice: string; motive: string; secret: string; incriminatingFact: string;
  groundTruth: string[]; isCulprit: boolean; isRedHerring?: boolean
}
interface TimelineEvent { time: string; location: string; description: string; suspectIds: string[] }
type EvidenceKind = 'cctv' | 'phone' | 'forensics' | 'financial' | 'background' | 'object'
interface Evidence {
  id: string; kind: EvidenceKind; location?: string; timeWindow?: string;
  summary: string; implicatesSuspectIds: string[]; contradictsClaim?: string
}
interface PlantedMemory { suspectId: string; content: string; fabricatedClaim: string }
interface CaseFile {
  id: string; difficulty: 'easy' | 'medium' | 'hard'; title: string; synopsis: string;
  crime: string; suspects: CaseSuspect[]; timeline: TimelineEvent[]; evidence: Evidence[];
  culpritId: string; plantedMemory: PlantedMemory; worldFacts: string[];
  solution: { culpritId: string; plantedMemoryClaim: string; explanation: string }
}`
