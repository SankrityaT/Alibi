import { HttpSupermemoryClient } from '../../../lib/supermemory/client.js'
import { NullSupermemoryClient } from '../../../lib/supermemory/nullClient.js'
import { ClaudeClient } from '../../../lib/anthropic/client.js'
import { handleNotebookRequest } from '../../../lib/notebook/handleNotebookRequest.js'

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

  // Honour the same Memory ON/OFF toggle the interrogate/investigate routes use.
  // With memory off, every container search returns nothing, so the Notebook has
  // no cross-suspect facts to synthesize — the clearest proof that this feature
  // is powered entirely by Supermemory.
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

  const result = await handleNotebookRequest(body, { supermemory, anthropic })

  return Response.json(result.body, { status: result.status })
}
