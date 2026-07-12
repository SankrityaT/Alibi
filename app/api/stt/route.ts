import { WhisperCppClient } from '../../../lib/stt/client.js'
import { NullSttClient } from '../../../lib/stt/nullClient.js'
import type { SttClient } from '../../../lib/stt/types.js'
import { handleSttRequest } from '../../../lib/stt/handleSttRequest.js'

export async function POST(request: Request): Promise<Response> {
  const audio = await request.arrayBuffer()
  const contentType = request.headers.get('content-type') ?? 'audio/wav'

  // Build a whisper.cpp client when WHISPER_BASE_URL is configured; otherwise
  // fall back to the null client so the route always answers with a graceful
  // 503 (never a 500) and the player can keep typing questions with no voice.
  const baseUrl = process.env.WHISPER_BASE_URL
  const stt: SttClient = baseUrl ? new WhisperCppClient({ baseUrl }) : new NullSttClient()

  const result = await handleSttRequest(audio, contentType, { stt })

  return Response.json(result.body, { status: result.status })
}
