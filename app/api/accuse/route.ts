import { HttpSupermemoryClient } from '../../../lib/supermemory/client.js'
import { NullSupermemoryClient } from '../../../lib/supermemory/nullClient.js'
import { handleAccuse } from '../../../lib/case/handleAccuse.js'

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

  // Honour the same Memory ON/OFF toggle the rest of the game uses: with memory
  // off the verdict note lands in a no-op client, so accusing still works even
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

  const result = await handleAccuse(body, { supermemory })

  return Response.json(result.body, { status: result.status })
}
