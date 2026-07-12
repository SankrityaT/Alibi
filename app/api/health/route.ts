import { checkHealth, isPlayable, type Pinger } from '../../../lib/health/checkHealth.js'

// A service counts as "reachable" if it answers at all within the timeout — even
// a 404 means something is listening on that port. Only a network error / timeout
// means it's down.
const pingService: Pinger = async (url: string) => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 1500)
  try {
    await fetch(url, { method: 'GET', signal: controller.signal })
    return true
  } catch {
    return false
  } finally {
    clearTimeout(timer)
  }
}

export async function GET(): Promise<Response> {
  const services = await checkHealth(
    {
      supermemoryBaseUrl: process.env.SUPERMEMORY_BASE_URL,
      supermemoryApiKey: process.env.SUPERMEMORY_API_KEY,
      kokoroBaseUrl: process.env.KOKORO_BASE_URL,
      whisperBaseUrl: process.env.WHISPER_BASE_URL
    },
    pingService
  )

  return Response.json({ services, playable: isPlayable(services) })
}
