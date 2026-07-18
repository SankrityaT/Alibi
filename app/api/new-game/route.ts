import { HttpSupermemoryClient } from '../../../lib/supermemory/client.js'
import { NullSupermemoryClient } from '../../../lib/supermemory/nullClient.js'
import { ClaudeClient } from '../../../lib/anthropic/client.js'
import { handleNewGame } from '../../../lib/case/handleNewGame.js'

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

  // Honor the Memory ON/OFF toggle here too: with memory off we seed into a
  // no-op client (nothing is remembered) so the same "prove it needs
  // Supermemory" demo holds from the very first case, and new-game works even
  // when no Supermemory server is running.
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

  const result = await handleNewGame(body, { supermemory, anthropic })

  return Response.json(result.body, { status: result.status })
}
