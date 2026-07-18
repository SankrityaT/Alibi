import { HttpSupermemoryClient } from '../../../lib/supermemory/client.js'
import { getActiveCase } from '../../../lib/case/store.js'
import { suspectContainerTag } from '../../../lib/case/types.js'

// Readiness probe for the loading screen. Supermemory indexes seeded memories
// asynchronously (~10s/doc via its memory agent), so a case can be "active"
// while its suspects' memories are not yet searchable — interrogating in that
// window returns nothing and the suspect wrongly claims amnesia. The loading
// screen polls this until the first suspect's memories are retrievable, then
// lets the player in. Fail-open: any missing config / transport error reports
// ready:true so the UI can never hang on this probe.
export const dynamic = 'force-dynamic'

export async function GET(): Promise<Response> {
  const active = getActiveCase()
  if (!active || active.suspects.length === 0) {
    return Response.json(
      { ready: false, reason: 'no-active-case' },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  }

  const baseUrl = process.env.SUPERMEMORY_BASE_URL
  const apiKey = process.env.SUPERMEMORY_API_KEY
  if (!baseUrl || !apiKey) {
    // Memory disabled / no server configured — nothing to wait for.
    return Response.json(
      { ready: true, reason: 'no-supermemory' },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  }

  try {
    const supermemory = new HttpSupermemoryClient({ baseUrl, apiKey })
    const firstSuspect = active.suspects[0]
    const result = await supermemory.search({
      q: 'what do you remember',
      containerTag: suspectContainerTag(firstSuspect.suspectId),
      searchMode: 'hybrid',
      threshold: 0,
      limit: 1
    })
    return Response.json(
      { ready: result.results.length > 0 },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch {
    // Never block the player on a probe failure.
    return Response.json(
      { ready: true, reason: 'probe-error' },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  }
}
