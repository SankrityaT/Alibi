import { HttpSupermemoryClient } from '../../../lib/supermemory/client.js'
import { NullSupermemoryClient } from '../../../lib/supermemory/nullClient.js'
import { ClaudeClient } from '../../../lib/anthropic/client.js'
import { getActiveRegistry } from '../../../lib/case/store.js'
import { handleInterrogateRequest } from '../../../lib/interrogate/handleInterrogateRequest.js'

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required env var: ${name}`)
  }
  return value
}

export async function POST(request: Request): Promise<Response> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // Memory ON/OFF toggle: when the client sends memoryEnabled: false, swap in a
  // client that remembers nothing, so the suspect has no recall at all. This is
  // the demo's proof that the game depends on Supermemory. (The null client also
  // needs no running server, so "memory off" works even without Supermemory up.)
  const memoryEnabled = !(
    typeof body === 'object' &&
    body !== null &&
    (body as Record<string, unknown>).memoryEnabled === false
  )

  const supermemory = memoryEnabled
    ? new HttpSupermemoryClient({
        baseUrl: requireEnv('SUPERMEMORY_BASE_URL'),
        apiKey: requireEnv('SUPERMEMORY_API_KEY')
      })
    : new NullSupermemoryClient()
  const anthropic = new ClaudeClient()

  // Suspect registry comes from the live active case (seeded by /api/new-game),
  // falling back to the hand-authored case when no game has been started yet.
  const suspects = getActiveRegistry()

  const result = await handleInterrogateRequest(body, { supermemory, anthropic, suspects })

  // Monitor line: how many memories grounded this answer (0 with memory OFF).
  const rb = result.body as { retrievedMemories?: unknown[] }
  const retrieved = Array.isArray(rb?.retrievedMemories) ? rb.retrievedMemories.length : 0
  const sid =
    typeof (body as { suspectId?: unknown })?.suspectId === 'string'
      ? (body as { suspectId: string }).suspectId
      : '?'
  console.log(
    `[interrogate] suspect=${sid} memory=${memoryEnabled ? 'ON' : 'OFF'} retrieved=${retrieved} memories -> ${result.status}`
  )

  return Response.json(result.body, { status: result.status })
}
