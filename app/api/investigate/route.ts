import { HttpSupermemoryClient } from '../../../lib/supermemory/client.js'
import { NullSupermemoryClient } from '../../../lib/supermemory/nullClient.js'
import { ClaudeClient } from '../../../lib/anthropic/client.js'
import { handleInvestigateRequest } from '../../../lib/investigate/handleInvestigateRequest.js'

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

  // Honour the same Memory ON/OFF toggle the interrogate route uses. With memory
  // off, pulls retrieve nothing and pushes are no-ops, so the investigation
  // verbs visibly stop feeding the world — proof the game depends on Supermemory.
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

  const result = await handleInvestigateRequest(body, { supermemory, anthropic })

  return Response.json(result.body, { status: result.status })
}
