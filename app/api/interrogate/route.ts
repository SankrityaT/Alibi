import { HttpSupermemoryClient } from '../../../lib/supermemory/client.js'
import { ClaudeClient } from '../../../lib/anthropic/client.js'
import { suspects } from '../../../lib/suspect/registry.js'
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

  const supermemory = new HttpSupermemoryClient({
    baseUrl: requireEnv('SUPERMEMORY_BASE_URL'),
    apiKey: requireEnv('SUPERMEMORY_API_KEY')
  })
  const anthropic = new ClaudeClient()

  const result = await handleInterrogateRequest(body, { supermemory, anthropic, suspects })

  return Response.json(result.body, { status: result.status })
}
