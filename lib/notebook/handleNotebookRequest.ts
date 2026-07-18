import type { NotebookDeps } from './notebook.js'
import { askNotebook } from './notebook.js'

function asRecord(body: unknown): Record<string, unknown> | null {
  if (typeof body !== 'object' || body === null) {
    return null
  }
  return body as Record<string, unknown>
}

/**
 * Validate an /api/notebook request body and run the cross-suspect synthesis.
 * Empty/missing query -> 400. An optional containerTags array lets a caller
 * scope the search; otherwise askNotebook uses the active case's default set.
 */
export async function handleNotebookRequest(
  body: unknown,
  deps: NotebookDeps
): Promise<{ status: number; body: Record<string, unknown> }> {
  const record = asRecord(body)
  if (!record) {
    return { status: 400, body: { error: 'Request body must be a JSON object' } }
  }

  const query = record.query
  if (typeof query !== 'string' || query.trim().length === 0) {
    return { status: 400, body: { error: 'Missing or invalid "query"' } }
  }

  const containerTags = Array.isArray(record.containerTags)
    ? record.containerTags.filter((tag): tag is string => typeof tag === 'string')
    : undefined

  const result = await askNotebook(
    query,
    deps,
    containerTags && containerTags.length > 0 ? { containerTags } : undefined
  )

  return {
    status: 200,
    body: {
      query: result.query,
      answer: result.answer,
      citations: result.citations
    }
  }
}
