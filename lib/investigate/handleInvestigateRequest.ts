import type { VerbDeps, VerbInput, VerbKind } from './verbs.js'
import { isVerbKind, runVerb } from './verbs.js'

export interface InvestigateDeps extends VerbDeps {}

export interface InvestigateResult {
  status: number
  body: Record<string, unknown>
}

function asRecord(body: unknown): Record<string, unknown> | null {
  if (typeof body !== 'object' || body === null) {
    return null
  }
  return body as Record<string, unknown>
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

/**
 * Validate an /api/investigate request body, run the requested verb, and shape
 * the HTTP result. Unknown/missing verb kinds 400; present-evidence requires a
 * suspectId and a fact. On success returns the produced fact plus (for pull
 * verbs) the raw evidence that was retrieved, so the client can surface both.
 */
export async function handleInvestigateRequest(
  body: unknown,
  deps: InvestigateDeps
): Promise<InvestigateResult> {
  const record = asRecord(body)
  if (!record) {
    return { status: 400, body: { error: 'Request body must be a JSON object' } }
  }

  const kind = record.kind
  if (typeof kind !== 'string' || !isVerbKind(kind)) {
    return {
      status: 400,
      body: { error: 'Missing or invalid "kind" (expected present-evidence|cctv|phone|forensics)' }
    }
  }

  const input: VerbInput = {
    kind: kind as VerbKind,
    query: optionalString(record.query) ?? '',
    suspectId: optionalString(record.suspectId),
    location: optionalString(record.location),
    timeWindow: optionalString(record.timeWindow),
    fact: optionalString(record.fact)
  }

  if (input.kind === 'present-evidence') {
    if (!input.suspectId) {
      return { status: 400, body: { error: 'present-evidence requires "suspectId"' } }
    }
    if (!input.fact || input.fact.trim().length === 0) {
      return { status: 400, body: { error: 'present-evidence requires a non-empty "fact"' } }
    }
  }

  const result = await runVerb(input, deps)

  return {
    status: 200,
    body: {
      kind: input.kind,
      fact: result.fact,
      evidenceId: result.evidenceId,
      retrieved: result.retrieved
    }
  }
}
