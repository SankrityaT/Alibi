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
    const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(body)
    })

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
    return this.post<SearchResult>('/v4/search', params)
  }

  async getProfile(params: ProfileParams): Promise<ProfileResult> {
    return this.post<ProfileResult>('/v4/profile', params)
  }
}
