// Powers the /setup "System Check" onboarding screen. A pure function over the
// configured env + an injected ping, so it is trivially testable without real
// network I/O. It reports, for each local dependency, whether it's configured
// and (when configured) whether it's actually reachable — plus the exact command
// to bring it up. This is the tangible face of the "everything runs on your
// machine" story: you can see each piece connect.

export interface ServiceStatus {
  id: string
  label: string
  required: boolean
  configured: boolean
  // true/false when we could probe it; null when there's nothing to probe
  // (service not configured, or a service like Claude auth we can't ping).
  reachable: boolean | null
  detail: string
  fixCommand?: string
}

export interface HealthConfig {
  supermemoryBaseUrl?: string
  supermemoryApiKey?: string
  kokoroBaseUrl?: string
  whisperBaseUrl?: string
}

export type Pinger = (url: string) => Promise<boolean>

export async function checkHealth(config: HealthConfig, ping: Pinger): Promise<ServiceStatus[]> {
  const statuses: ServiceStatus[] = []

  // 1. Supermemory Local — required. Needs both the URL and the API key, then
  //    must actually answer.
  const smConfigured = Boolean(config.supermemoryBaseUrl && config.supermemoryApiKey)
  statuses.push({
    id: 'supermemory',
    label: 'Supermemory Local',
    required: true,
    configured: smConfigured,
    reachable: smConfigured ? await ping(config.supermemoryBaseUrl as string) : null,
    detail: smConfigured
      ? 'The memory engine — suspect memories, planted lies, and cross-suspect synthesis all live here, on your machine.'
      : 'Set SUPERMEMORY_BASE_URL and SUPERMEMORY_API_KEY in .env after first boot.',
    fixCommand: 'npx supermemory local'
  })

  // 2. Claude via the Agent SDK — required, but there's nothing to ping: auth is
  //    the local `claude` login. Report it as informational.
  statuses.push({
    id: 'claude',
    label: 'Claude (Agent SDK login)',
    required: true,
    configured: true,
    reachable: null,
    detail: 'Dialogue + the case engine run through your Claude subscription (no API key). If interrogations fail, log in.',
    fixCommand: 'claude login'
  })

  // 3. Kokoro TTS — optional. Suspects speak when this is up; otherwise the
  //    transcript works silently.
  const ttsConfigured = Boolean(config.kokoroBaseUrl)
  statuses.push({
    id: 'tts',
    label: 'Kokoro TTS (suspect voices)',
    required: false,
    configured: ttsConfigured,
    reachable: ttsConfigured ? await ping(config.kokoroBaseUrl as string) : null,
    detail: ttsConfigured
      ? 'Local text-to-speech — each suspect speaks their lines in their own voice, all on-device.'
      : 'Optional. Without it, suspects stay silent and you read the transcript.',
    fixCommand: 'docker run -p 8880:8880 ghcr.io/remsky/kokoro-fastapi-cpu:latest'
  })

  // 4. whisper.cpp STT — optional. Lets the player speak questions.
  const sttConfigured = Boolean(config.whisperBaseUrl)
  statuses.push({
    id: 'stt',
    label: 'whisper.cpp STT (voice input)',
    required: false,
    configured: sttConfigured,
    reachable: sttConfigured ? await ping(config.whisperBaseUrl as string) : null,
    detail: sttConfigured
      ? 'Local speech-to-text — speak your questions instead of typing.'
      : 'Optional. Without it, the mic button is hidden and you type questions.',
    fixCommand: './build/bin/whisper-server -m models/ggml-base.en.bin --port 8081'
  })

  return statuses
}

// True when every REQUIRED service is either reachable or (for un-pingable ones
// like Claude) configured — i.e. the game can actually be played.
export function isPlayable(statuses: ServiceStatus[]): boolean {
  return statuses
    .filter((s) => s.required)
    .every((s) => (s.reachable === null ? s.configured : s.reachable))
}
