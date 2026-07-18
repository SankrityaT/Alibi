import { KokoroTtsClient } from '../../../lib/tts/client.js'
import { OpenAiTtsClient } from '../../../lib/tts/openaiClient.js'
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

  // Voice backend, in preference order:
  //  1. OpenAI TTS — good voices, no local model (reuses the configured key);
  //  2. a local Kokoro server if KOKORO_BASE_URL is set;
  //  3. the null client — the route answers 503 and the client speaks with the
  //     browser's built-in voice, so the transcript always works.
  const openAiKey = process.env.TTS_OPENAI_API_KEY || process.env.OPENAI_API_KEY
  const kokoroUrl = process.env.KOKORO_BASE_URL
  const tts: TtsClient = openAiKey
    ? new OpenAiTtsClient({ apiKey: openAiKey })
    : kokoroUrl
      ? new KokoroTtsClient({ baseUrl: kokoroUrl })
      : new NullTtsClient()

  const result = await handleTtsRequest(body, { tts })

  if (result.status === 200 && result.audio) {
    return new Response(result.audio, {
      status: 200,
      headers: { 'Content-Type': result.contentType ?? 'audio/wav' }
    })
  }

  return Response.json(result.body ?? { error: 'TTS failed' }, { status: result.status })
}
