import { ClaudeClient } from '../../../lib/anthropic/client.js'
import { getActiveCase } from '../../../lib/case/store.js'
import { suggestQuestions, type SuggestTurn } from '../../../lib/interrogate/suggest.js'

// AI-generated interrogation hints. Given the active case and the conversation
// so far, Claude proposes three sharp next questions (an alibi press, an
// evidence lead, a motive probe) shown as tappable chips. Uses only the public
// framing (crime + synopsis + suspect name) — never motive/secret/solution — so
// the hints never spoil who did it.
export const dynamic = 'force-dynamic'

export async function POST(request: Request): Promise<Response> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    body = {}
  }
  const record = (typeof body === 'object' && body !== null ? body : {}) as Record<string, unknown>
  const suspectId = typeof record.suspectId === 'string' ? record.suspectId : ''
  const transcript: SuggestTurn[] = Array.isArray(record.transcript)
    ? (record.transcript as unknown[])
        .filter((t): t is SuggestTurn => {
          return (
            typeof t === 'object' &&
            t !== null &&
            typeof (t as SuggestTurn).question === 'string' &&
            typeof (t as SuggestTurn).answer === 'string'
          )
        })
        .slice(-6)
    : []

  const active = getActiveCase()
  const suspect = active?.suspects.find((s) => s.suspectId === suspectId)

  try {
    const questions = await suggestQuestions(
      {
        suspectName: suspect?.name ?? suspectId,
        crime: active?.crime ?? '',
        synopsis: active?.synopsis ?? '',
        transcript
      },
      { anthropic: new ClaudeClient() }
    )
    return Response.json({ questions }, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    // Hints are a convenience — never fail the interrogation over them.
    return Response.json({ questions: [] }, { headers: { 'Cache-Control': 'no-store' } })
  }
}
