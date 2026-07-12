import type {
  ProfileParams,
  ProfileResult,
  SearchParams,
  SearchResult,
  SupermemoryClient,
  WriteMemoryParams,
  WriteMemoryResult
} from './types.js'

export interface HttpSupermemoryClientConfig {
  baseUrl: string
  apiKey: string
  fetchImpl?: typeof fetch
}

export class HttpSupermemoryClient implements SupermemoryClient {
  private baseUrl: string
  private apiKey: string
  private fetchImpl: typeof fetch

  constructor(config: HttpSupermemoryClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '')
    this.apiKey = config.apiKey
    this.fetchImpl = config.fetchImpl ?? fetch
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    // Bound every call so a dead/restarting Supermemory can't hang a request
    // forever (fetch has no default timeout). 25s comfortably covers a healthy
    // write/search; past that we treat the server as unresponsive.
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 25_000)
    let response: Response
    try {
      response = await this.fetchImpl(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(body),
        signal: controller.signal
      })
    } finally {
      clearTimeout(timer)
    }

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`Supermemory request to ${path} failed: ${response.status} ${text}`)
    }

    return (await response.json()) as T
  }

  async writeMemory(params: WriteMemoryParams): Promise<WriteMemoryResult> {
    return this.post<WriteMemoryResult>('/v3/documents', params)
  }

  async search(params: SearchParams): Promise<SearchResult> {
    const raw = await this.post<{
      results?: Array<{
        id: string
        memory?: string
        content?: string
        metadata?: Record<string, unknown>
      }>
    }>('/v4/search', params)
    // Supermemory's /v4/search returns each hit's text under `memory`, not
    // `content`. Casting the raw payload straight to SearchResult left every
    // item's `content` undefined, so suspects retrieved memories by count but
    // received blank text — ungrounded answers. Normalize to `content` here so
    // every caller (respond, verbs, notebook) reads real memory text.
    const results = (raw.results ?? []).map((item) => ({
      id: item.id,
      content: item.memory ?? item.content ?? '',
      metadata: item.metadata
    }))
    return { results }
  }

  async getProfile(params: ProfileParams): Promise<ProfileResult> {
    return this.post<ProfileResult>('/v4/profile', params)
  }
}
