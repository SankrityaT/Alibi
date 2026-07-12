import { KokoroTtsClient } from '../../../lib/tts/client.js'
import { NullTtsClient } from '../../../lib/tts/nullClient.js'
import type { TtsClient } from '../../../lib/tts/types.js'
import { handleTtsRequest } from '../../../lib/tts/handleTtsRequest.js'

export async function POST(request: Request): Promise<Response> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // Build a Kokoro client when KOKORO_BASE_URL is configured; otherwise fall
  // back to the null client so the route always answers with a graceful 503
  // (never a 500) and the transcript keeps working with no audio.
  const baseUrl = process.env.KOKORO_BASE_URL
  const tts: TtsClient = baseUrl ? new KokoroTtsClient({ baseUrl }) : new NullTtsClient()

  const result = await handleTtsRequest(body, { tts })

  if (result.status === 200 && result.audio) {
    return new Response(result.audio, {
      status: 200,
      headers: { 'Content-Type': result.contentType ?? 'audio/wav' }
    })
  }

  return Response.json(result.body ?? { error: 'TTS failed' }, { status: result.status })
}
